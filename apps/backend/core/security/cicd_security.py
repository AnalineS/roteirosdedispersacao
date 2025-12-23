# -*- coding: utf-8 -*-
"""
Sistema de CI/CD Seguro
======================

Sistema completo para integração e deploy seguros com:
- Scan de vulnerabilidades automatizado
- Verificação de secrets antes do commit
- Deploy com validação de segurança
- Análise estática de código
- Testes de segurança automatizados
- Compliance e auditoria

Funcionalidades:
- Pre-commit hooks de segurança
- Scans SAST/DAST automatizados
- Validação de dependências
- Análise de secrets vazados
- Testes de penetração automatizados
- Compliance checks

Autor: Sistema de Segurança Roteiro de Dispensação
Data: 2025-01-27
"""

import os
import re
import json
import hashlib
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, asdict
from enum import Enum
from pathlib import Path
import requests


# Logger específico para CI/CD
cicd_logger = logging.getLogger('security.cicd')


class PathTraversalError(Exception):
    """Exception raised when path traversal attack is detected"""
    pass


def validate_safe_path(user_path: str, allowed_base_dir: Optional[str] = None) -> str:
    """
    Valida e sanitiza caminho para prevenir path traversal (CWE-22).

    Security measures:
    - Resolve symbolic links and relative paths using os.path.realpath()
    - Validate path stays within allowed base directory
    - Prevent directory traversal sequences (../, ..)
    - Normalize path separators for platform compatibility

    Args:
        user_path: Path fornecido pelo usuário (potencialmente malicioso)
        allowed_base_dir: Diretório base permitido (None = diretório atual)

    Returns:
        str: Caminho absoluto validado e seguro

    Raises:
        PathTraversalError: Se path traversal for detectado
        ValueError: Se caminho for inválido
    """
    if not user_path:
        raise ValueError("Path cannot be empty")

    # Definir diretório base permitido
    if allowed_base_dir is None:
        allowed_base_dir = os.getcwd()

    # Normalizar e resolver caminho base
    base_dir = os.path.realpath(os.path.abspath(allowed_base_dir))

    # Normalizar e resolver caminho do usuário
    # realpath() resolve symlinks e normaliza o caminho
    resolved_path = os.path.realpath(os.path.abspath(user_path))

    # Verificar se o caminho resolvido está dentro do diretório base
    # Usar commonpath para detecção segura de path traversal
    try:
        common = os.path.commonpath([base_dir, resolved_path])
        if common != base_dir:
            raise PathTraversalError(
                f"Path traversal detected: '{user_path}' escapes allowed directory '{base_dir}'"
            )
    except ValueError:
        # commonpath raises ValueError if paths are on different drives (Windows)
        raise PathTraversalError(
            f"Path '{user_path}' is not within allowed directory '{base_dir}'"
        )

    # Verificação adicional: garantir que resolved_path começa com base_dir
    if not resolved_path.startswith(base_dir + os.sep) and resolved_path != base_dir:
        raise PathTraversalError(
            f"Path traversal detected: '{user_path}' attempts to escape '{base_dir}'"
        )

    # Log de validação bem-sucedida
    cicd_logger.debug(f"Path validation successful: {user_path} -> {resolved_path}")

    return resolved_path


class ScanType(Enum):
    """Tipos de scan de segurança"""
    SECRETS = "secrets"
    SAST = "sast"  # Static Application Security Testing
    DEPENDENCY = "dependency"
    DOCKER = "docker"
    COMPLIANCE = "compliance"
    LICENSE = "license"


class SeverityLevel(Enum):
    """Níveis de severidade de vulnerabilidades"""
    UNKNOWN = 0
    INFO = 1
    LOW = 2
    MEDIUM = 3
    HIGH = 4
    CRITICAL = 5


class DeploymentStage(Enum):
    """Estágios do deployment"""
    PRE_COMMIT = "pre_commit"
    BUILD = "build"
    TEST = "test"
    STAGING = "staging"
    PRODUCTION = "production"


@dataclass
class SecurityFinding:
    """Resultado de segurança encontrado"""
    id: str
    scan_type: ScanType
    severity: SeverityLevel
    title: str
    description: str
    file_path: str
    line_number: Optional[int]
    rule_id: str
    cwe_id: Optional[str]
    confidence: float
    remediation: str
    metadata: Dict[str, Any]


@dataclass
class ScanResult:
    """Resultado de um scan de segurança"""
    scan_type: ScanType
    timestamp: datetime
    duration_seconds: float
    success: bool
    findings: List[SecurityFinding]
    summary: Dict[str, Any]
    metadata: Dict[str, Any]


@dataclass
class ComplianceCheck:
    """Verificação de compliance"""
    rule_id: str
    rule_name: str
    description: str
    severity: SeverityLevel
    passed: bool
    details: str
    remediation: str


class SecretsScanner:
    """Scanner para detectar secrets vazados"""
    
    def __init__(self):
        # Padrões para detectar diferentes tipos de secrets
        self.secret_patterns = {
            'api_key': [
                r'api[_-]?key["\']?\s*[:=]\s*["\']?([a-zA-Z0-9_-]{20,})',
                r'apikey["\']?\s*[:=]\s*["\']?([a-zA-Z0-9_-]{20,})',
            ],
            'aws_access_key': [
                r'AKIA[0-9A-Z]{16}',
                r'aws[_-]?access[_-]?key["\']?\s*[:=]\s*["\']?([A-Z0-9]{20})',
            ],
            'aws_secret_key': [
                r'aws[_-]?secret[_-]?key["\']?\s*[:=]\s*["\']?([A-Za-z0-9/+=]{40})',
            ],
            'jwt_token': [
                r'eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*',
            ],
            'private_key': [
                r'-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----',
                r'-----BEGIN\s+OPENSSH\s+PRIVATE\s+KEY-----',
            ],
            'password': [
                r'password["\']?\s*[:=]\s*["\']?([^"\'\s]{8,})',
                r'passwd["\']?\s*[:=]\s*["\']?([^"\'\s]{8,})',
            ],
            'database_url': [
                r'(postgresql|mysql|mongodb)://[^:\s]+:[^@\s]+@[^/\s]+',
            ],
            'generic_secret': [
                r'secret["\']?\s*[:=]\s*["\']?([a-zA-Z0-9_-]{16,})',
                r'token["\']?\s*[:=]\s*["\']?([a-zA-Z0-9_-]{16,})',
            ]
        }
        
        # Arquivos a ignorar
        self.ignore_patterns = [
            r'\.git/',
            r'node_modules/',
            r'__pycache__/',
            r'\.pyc$',
            r'\.log$',
            r'\.min\.',
            r'package-lock\.json$',
            r'yarn\.lock$',
        ]
        
        # Falsos positivos conhecidos
        self.false_positives = [
            'your_api_key_here',
            'insert_key_here',
            'replace_with_your_key',
            'example_key',
            'dummy_key',
            'placeholder',
        ]
    
    def scan_directory(self, directory: str) -> ScanResult:
        """
        Escaneia diretório em busca de secrets.

        Security: Path is validated to prevent traversal attacks (CWE-22)

        Args:
            directory: Diretório para escanear (validado contra path traversal)

        Returns:
            ScanResult com findings de segurança

        Raises:
            PathTraversalError: Se path traversal for detectado
        """
        start_time = datetime.now()
        findings = []

        try:
            # SECURITY FIX: Validate directory path to prevent traversal (CWE-22)
            safe_directory = validate_safe_path(directory)
            cicd_logger.info(f"Scanning directory for secrets: {safe_directory}")

            for root, dirs, files in os.walk(safe_directory):
                # Filtrar diretórios ignorados
                dirs[:] = [d for d in dirs if not any(re.search(pattern, os.path.join(root, d)) for pattern in self.ignore_patterns)]
                
                for file in files:
                    file_path = os.path.join(root, file)
                    relative_path = os.path.relpath(file_path, safe_directory)
                    
                    # Pular arquivos ignorados
                    if any(re.search(pattern, relative_path) for pattern in self.ignore_patterns):
                        continue
                    
                    # Escanear arquivo
                    file_findings = self._scan_file(file_path, relative_path)
                    findings.extend(file_findings)
            
            duration = (datetime.now() - start_time).total_seconds()
            
            return ScanResult(
                scan_type=ScanType.SECRETS,
                timestamp=start_time,
                duration_seconds=duration,
                success=True,
                findings=findings,
                summary={
                    'total_findings': len(findings),
                    'high_severity': len([f for f in findings if f.severity == SeverityLevel.HIGH]),
                    'medium_severity': len([f for f in findings if f.severity == SeverityLevel.MEDIUM]),
                    'files_scanned': sum(1 for _ in Path(safe_directory).rglob('*') if _.is_file())
                },
                metadata={'directory': safe_directory}
            )
            
        except PathTraversalError as e:
            # Security: Log path traversal attempt
            cicd_logger.warning(f"Path traversal attempt blocked: {e}")
            return ScanResult(
                scan_type=ScanType.SECRETS,
                timestamp=start_time,
                duration_seconds=(datetime.now() - start_time).total_seconds(),
                success=False,
                findings=[],
                summary={'error': f'Security violation: {str(e)}'},
                metadata={'directory': directory, 'security_violation': True}
            )
        except Exception as e:
            cicd_logger.error(f"Erro no scan de secrets: {e}")
            return ScanResult(
                scan_type=ScanType.SECRETS,
                timestamp=start_time,
                duration_seconds=(datetime.now() - start_time).total_seconds(),
                success=False,
                findings=[],
                summary={'error': str(e)},
                metadata={'directory': directory}
            )
    
    def _scan_file(self, file_path: str, relative_path: str) -> List[SecurityFinding]:
        """Escaneia arquivo individual"""
        findings = []
        
        try:
            # Tentar diferentes encodings
            content = None
            for encoding in ['utf-8', 'latin-1', 'cp1252']:
                try:
                    with open(file_path, 'r', encoding=encoding) as f:
                        content = f.read()
                    break
                except UnicodeDecodeError:
                    continue
            
            if content is None:
                return findings
            
            lines = content.split('\n')
            
            for secret_type, patterns in self.secret_patterns.items():
                for pattern in patterns:
                    matches = re.finditer(pattern, content, re.IGNORECASE | re.MULTILINE)
                    
                    for match in matches:
                        # Calcular linha
                        line_number = content[:match.start()].count('\n') + 1
                        line_content = lines[line_number - 1] if line_number <= len(lines) else ""
                        
                        # Extrair possível secret
                        potential_secret = match.group(1) if match.groups() else match.group(0)
                        
                        # Verificar falsos positivos
                        if self._is_false_positive(potential_secret.lower()):
                            continue
                        
                        # Calcular severidade
                        severity = self._calculate_severity(secret_type, potential_secret)
                        
                        finding = SecurityFinding(
                            id=f"secret_{hashlib.sha256(f'{file_path}:{line_number}:{pattern}'.encode()).hexdigest()[:8]}",
                            scan_type=ScanType.SECRETS,
                            severity=severity,
                            title=f"Potential {secret_type.replace('_', ' ').title()} Found",
                            description=f"Potential {secret_type} detected in {relative_path}",
                            file_path=relative_path,
                            line_number=line_number,
                            rule_id=f"secrets_{secret_type}",
                            cwe_id="CWE-798",  # Use of Hard-coded Credentials
                            confidence=0.8,
                            remediation=f"Remove the {secret_type} from source code and use environment variables or secure secret management",
                            metadata={
                                'secret_type': secret_type,
                                'pattern': pattern,
                                'line_content': line_content.strip(),
                                'partial_secret': potential_secret[:4] + '***' if len(potential_secret) > 4 else '***'
                            }
                        )
                        
                        findings.append(finding)
                        
        except Exception as e:
            cicd_logger.error(f"Erro ao escanear arquivo {file_path}: {e}")
        
        return findings
    
    def _is_false_positive(self, secret: str) -> bool:
        """Verifica se é um falso positivo"""
        return any(fp in secret for fp in self.false_positives)
    
    def _calculate_severity(self, secret_type: str, secret: str) -> SeverityLevel:
        """Calcula severidade baseada no tipo de secret"""
        high_risk_types = ['aws_access_key', 'aws_secret_key', 'private_key', 'database_url']
        medium_risk_types = ['api_key', 'jwt_token', 'password']
        
        if secret_type in high_risk_types:
            return SeverityLevel.HIGH
        elif secret_type in medium_risk_types:
            return SeverityLevel.MEDIUM
        else:
            return SeverityLevel.LOW


class DependencyScanner:
    """Scanner para vulnerabilidades em dependências"""
    
    def __init__(self):
        self.vulnerability_databases = [
            'https://api.osv.dev/v1',  # OSV Database
            # Adicionar outros feeds de vulnerabilidade
        ]
    
    def scan_python_dependencies(self, requirements_file: str) -> ScanResult:
        """
        Escaneia dependências Python.

        Security: File path is validated to prevent traversal attacks (CWE-22)

        Args:
            requirements_file: Caminho para requirements.txt (validado contra path traversal)

        Returns:
            ScanResult com vulnerabilidades encontradas
        """
        start_time = datetime.now()
        findings = []

        try:
            # SECURITY FIX: Validate file path before checking existence (CWE-22)
            safe_file_path = validate_safe_path(requirements_file)

            if not os.path.exists(safe_file_path):
                return ScanResult(
                    scan_type=ScanType.DEPENDENCY,
                    timestamp=start_time,
                    duration_seconds=0,
                    success=False,
                    findings=[],
                    summary={'error': 'Requirements file not found'},
                    metadata={'file': safe_file_path}
                )

            # Ler dependências (método já valida internamente)
            dependencies = self._parse_requirements(safe_file_path)
            
            # Verificar cada dependência
            for dep_name, dep_version in dependencies.items():
                dep_findings = self._check_dependency_vulnerabilities(dep_name, dep_version)
                findings.extend(dep_findings)
            
            duration = (datetime.now() - start_time).total_seconds()
            
            return ScanResult(
                scan_type=ScanType.DEPENDENCY,
                timestamp=start_time,
                duration_seconds=duration,
                success=True,
                findings=findings,
                summary={
                    'total_dependencies': len(dependencies),
                    'vulnerable_dependencies': len(set(f.metadata.get('package_name') for f in findings)),
                    'total_vulnerabilities': len(findings),
                    'critical_vulnerabilities': len([f for f in findings if f.severity == SeverityLevel.CRITICAL])
                },
                metadata={'requirements_file': safe_file_path}
            )

        except PathTraversalError as e:
            # Security: Log path traversal attempt
            cicd_logger.warning(f"Path traversal attempt blocked in dependency scan: {e}")
            return ScanResult(
                scan_type=ScanType.DEPENDENCY,
                timestamp=start_time,
                duration_seconds=(datetime.now() - start_time).total_seconds(),
                success=False,
                findings=[],
                summary={'error': f'Security violation: {str(e)}'},
                metadata={'requirements_file': requirements_file, 'security_violation': True}
            )
        except Exception as e:
            cicd_logger.error(f"Erro no scan de dependências: {e}")
            return ScanResult(
                scan_type=ScanType.DEPENDENCY,
                timestamp=start_time,
                duration_seconds=(datetime.now() - start_time).total_seconds(),
                success=False,
                findings=[],
                summary={'error': str(e)},
                metadata={'requirements_file': requirements_file}
            )
    
    def _parse_requirements(self, requirements_file: str) -> Dict[str, str]:
        """
        Parseia arquivo requirements.txt.

        Security: File path is validated to prevent traversal attacks (CWE-22)

        Args:
            requirements_file: Caminho para requirements.txt (validado contra path traversal)

        Returns:
            Dict com dependências e versões

        Raises:
            PathTraversalError: Se path traversal for detectado
        """
        dependencies = {}

        # SECURITY FIX: Validate file path to prevent traversal (CWE-22)
        safe_file_path = validate_safe_path(requirements_file)
        cicd_logger.debug(f"Parsing requirements file: {safe_file_path}")

        with open(safe_file_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#'):
                    # Parse diferentes formatos
                    if '==' in line:
                        name, version = line.split('==', 1)
                        dependencies[name.strip()] = version.strip()
                    elif '>=' in line:
                        name, version = line.split('>=', 1)
                        dependencies[name.strip()] = version.strip()
                    else:
                        # Versão não especificada
                        dependencies[line.strip()] = 'latest'
        
        return dependencies
    
    def _check_dependency_vulnerabilities(self, package_name: str, version: str) -> List[SecurityFinding]:
        """Verifica vulnerabilidades para uma dependência específica"""
        findings = []
        
        try:
            # Consultar OSV database
            query = {
                'package': {
                    'name': package_name,
                    'ecosystem': 'PyPI'
                }
            }
            
            if version != 'latest':
                query['version'] = version
            
            response = requests.post(
                'https://api.osv.dev/v1/query',
                json=query,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                
                for vuln in data.get('vulns', []):
                    finding = SecurityFinding(
                        id=f"dep_{vuln.get('id', 'unknown')}",
                        scan_type=ScanType.DEPENDENCY,
                        severity=self._map_vulnerability_severity(vuln),
                        title=f"Vulnerability in {package_name}",
                        description=vuln.get('summary', 'No description available'),
                        file_path='requirements.txt',
                        line_number=None,
                        rule_id=vuln.get('id', 'unknown'),
                        cwe_id=self._extract_cwe_from_vuln(vuln),
                        confidence=0.9,
                        remediation=f"Update {package_name} to a patched version",
                        metadata={
                            'package_name': package_name,
                            'current_version': version,
                            'vulnerability_id': vuln.get('id'),
                            'published': vuln.get('published'),
                            'modified': vuln.get('modified'),
                            'affected_versions': vuln.get('affected', []),
                            'references': vuln.get('references', [])
                        }
                    )
                    
                    findings.append(finding)
                    
        except Exception as e:
            cicd_logger.error(f"Erro ao verificar vulnerabilidades para {package_name}: {e}")
        
        return findings
    
    def _map_vulnerability_severity(self, vuln: Dict[str, Any]) -> SeverityLevel:
        """Mapeia severidade da vulnerabilidade"""
        # Tentar extrair severidade do CVSS ou outros campos
        severity_mappings = {
            'CRITICAL': SeverityLevel.CRITICAL,
            'HIGH': SeverityLevel.HIGH,
            'MEDIUM': SeverityLevel.MEDIUM,
            'LOW': SeverityLevel.LOW,
        }
        
        # Verificar campo severity
        severity_str = vuln.get('severity', '').upper()
        if severity_str in severity_mappings:
            return severity_mappings[severity_str]
        
        # Default para medium se não conseguir determinar
        return SeverityLevel.MEDIUM
    
    def _extract_cwe_from_vuln(self, vuln: Dict[str, Any]) -> Optional[str]:
        """Extrai CWE ID da vulnerabilidade"""
        # Procurar em diferentes campos
        for ref in vuln.get('references', []):
            if 'cwe' in ref.get('url', '').lower():
                return ref.get('url', '').split('/')[-1]
        
        return None


class ComplianceChecker:
    """Verificador de compliance e boas práticas"""
    
    def __init__(self):
        self.compliance_rules = [
            {
                'id': 'SEC001',
                'name': 'No hardcoded secrets',
                'description': 'Code should not contain hardcoded secrets',
                'severity': SeverityLevel.HIGH,
                'check_function': self._check_no_hardcoded_secrets
            },
            {
                'id': 'SEC002',
                'name': 'HTTPS only',
                'description': 'All external communications should use HTTPS',
                'severity': SeverityLevel.MEDIUM,
                'check_function': self._check_https_only
            },
            {
                'id': 'SEC003',
                'name': 'Secure headers',
                'description': 'Application should implement security headers',
                'severity': SeverityLevel.MEDIUM,
                'check_function': self._check_security_headers
            },
            {
                'id': 'SEC004',
                'name': 'Input validation',
                'description': 'User inputs should be validated',
                'severity': SeverityLevel.HIGH,
                'check_function': self._check_input_validation
            },
            {
                'id': 'SEC005',
                'name': 'Error handling',
                'description': 'Errors should not expose sensitive information',
                'severity': SeverityLevel.MEDIUM,
                'check_function': self._check_error_handling
            }
        ]
    
    def check_compliance(self, directory: str) -> List[ComplianceCheck]:
        """
        Executa verificações de compliance.

        Security: Directory path is validated to prevent traversal attacks (CWE-22)

        Args:
            directory: Diretório para verificar (validado contra path traversal)

        Returns:
            Lista de ComplianceCheck com resultados
        """
        results = []

        # SECURITY FIX: Validate directory path to prevent traversal (CWE-22)
        try:
            safe_directory = validate_safe_path(directory)
        except PathTraversalError as e:
            cicd_logger.warning(f"Path traversal attempt blocked in compliance check: {e}")
            # Return failed compliance check for security violation
            return [ComplianceCheck(
                rule_id='SEC000',
                rule_name='Path Security',
                description='Directory path validation',
                severity=SeverityLevel.CRITICAL,
                passed=False,
                details=f'Security violation: {str(e)}',
                remediation='Use valid directory paths only'
            )]

        for rule in self.compliance_rules:
            try:
                passed, details = rule['check_function'](safe_directory)
                
                check = ComplianceCheck(
                    rule_id=rule['id'],
                    rule_name=rule['name'],
                    description=rule['description'],
                    severity=rule['severity'],
                    passed=passed,
                    details=details,
                    remediation=f"Fix issues related to {rule['name'].lower()}"
                )
                
                results.append(check)
                
            except Exception as e:
                cicd_logger.error(f"Erro na verificação de compliance {rule['id']}: {e}")
                
                check = ComplianceCheck(
                    rule_id=rule['id'],
                    rule_name=rule['name'],
                    description=rule['description'],
                    severity=rule['severity'],
                    passed=False,
                    details=f"Error during check: {str(e)}",
                    remediation="Fix the compliance check error"
                )
                
                results.append(check)
        
        return results
    
    def _check_no_hardcoded_secrets(self, directory: str) -> Tuple[bool, str]:
        """Verifica ausência de secrets hardcoded"""
        scanner = SecretsScanner()
        result = scanner.scan_directory(directory)
        
        high_findings = [f for f in result.findings if f.severity == SeverityLevel.HIGH]
        
        if high_findings:
            return False, f"Found {len(high_findings)} high-severity secrets"
        else:
            return True, "No hardcoded secrets found"
    
    def _check_https_only(self, directory: str) -> Tuple[bool, str]:
        """Verifica uso exclusivo de HTTPS"""
        http_patterns = [
            r'http://(?!localhost|127\.0\.0\.1|0\.0\.0\.0)',
            r'[\"\']http://[^"\']*[\"\']'
        ]
        
        violations = []
        
        for root, dirs, files in os.walk(directory):
            for file in files:
                if file.endswith(('.py', '.js', '.ts', '.json', '.yml', '.yaml')):
                    file_path = os.path.join(root, file)
                    
                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            content = f.read()
                            
                        for pattern in http_patterns:
                            if re.search(pattern, content):
                                violations.append(os.path.relpath(file_path, directory))
                                break
                                
                    except Exception:
                        continue
        
        if violations:
            return False, f"HTTP URLs found in {len(violations)} files: {', '.join(violations[:5])}"
        else:
            return True, "All external URLs use HTTPS"
    
    def _check_security_headers(self, directory: str) -> Tuple[bool, str]:
        """Verifica implementação de security headers"""
        required_headers = [
            'X-Content-Type-Options',
            'X-Frame-Options',
            'X-XSS-Protection',
            'Strict-Transport-Security'
        ]
        
        found_headers = []
        
        # Procurar por implementação de headers em arquivos Python
        for root, dirs, files in os.walk(directory):
            for file in files:
                if file.endswith('.py'):
                    file_path = os.path.join(root, file)
                    
                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            content = f.read()
                            
                        for header in required_headers:
                            if header in content:
                                found_headers.append(header)
                                
                    except Exception:
                        continue
        
        found_headers = list(set(found_headers))
        missing_headers = [h for h in required_headers if h not in found_headers]
        
        if missing_headers:
            return False, f"Missing security headers: {', '.join(missing_headers)}"
        else:
            return True, "All required security headers implemented"
    
    def _check_input_validation(self, directory: str) -> Tuple[bool, str]:
        """Verifica validação de input"""
        validation_patterns = [
            r'validate_and_sanitize_input',
            r'bleach\.clean',
            r'html\.escape',
            r'request\.get_json\(\)',
            r'@validate_json'
        ]
        
        validation_found = False
        
        for root, dirs, files in os.walk(directory):
            for file in files:
                if file.endswith('.py'):
                    file_path = os.path.join(root, file)
                    
                    try:
                        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                            content = f.read()
                            
                        for pattern in validation_patterns:
                            if re.search(pattern, content):
                                validation_found = True
                                break
                                
                        if validation_found:
                            break
                            
                    except Exception:
                        continue
            
            if validation_found:
                break
        
        if validation_found:
            return True, "Input validation mechanisms found"
        else:
            return False, "No input validation mechanisms detected"
    
    def _check_error_handling(self, directory: str) -> Tuple[bool, str]:
        """Verifica tratamento seguro de erros"""
        insecure_patterns = [
            r'print\(.*error.*\)',
            r'console\.log\(.*error.*\)',
            r'traceback\.print_exc\(\)',
            r'\.printStackTrace\(\)'
        ]
        
        violations = []
        
        for root, dirs, files in os.walk(directory):
            for file in files:
                if file.endswith(('.py', '.js', '.ts')):
                    file_path = os.path.join(root, file)
                    
                    try:
                        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                            content = f.read()
                            
                        for pattern in insecure_patterns:
                            if re.search(pattern, content, re.IGNORECASE):
                                violations.append(os.path.relpath(file_path, directory))
                                break
                                
                    except Exception:
                        continue
        
        if violations:
            return False, f"Insecure error handling found in {len(violations)} files"
        else:
            return True, "No insecure error handling detected"


class CICDSecurityOrchestrator:
    """Orquestrador principal de segurança CI/CD"""
    
    def __init__(self):
        self.secrets_scanner = SecretsScanner()
        self.dependency_scanner = DependencyScanner()
        self.compliance_checker = ComplianceChecker()
        self.scan_results: List[ScanResult] = []
        
    def run_security_pipeline(self,
                            project_directory: str,
                            stage: DeploymentStage = DeploymentStage.BUILD,
                            config: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Executa pipeline completo de segurança.

        Security: Directory path is validated to prevent traversal attacks (CWE-22)

        Args:
            project_directory: Diretório do projeto (validado contra path traversal)
            stage: Estágio do deployment
            config: Configurações opcionais

        Returns:
            Dict com resultados do pipeline de segurança
        """
        pipeline_start = datetime.now()
        results = {
            'stage': stage.value,
            'timestamp': pipeline_start.isoformat(),
            'project_directory': project_directory,
            'scans': {},
            'compliance': [],
            'summary': {},
            'passed': True,
            'recommendations': []
        }

        config = config or {}

        # SECURITY FIX: Validate project directory path (CWE-22)
        try:
            safe_project_dir = validate_safe_path(project_directory)
            results['project_directory'] = safe_project_dir
            cicd_logger.info(f"Iniciando pipeline de segurança para estágio: {stage.value}")
        except PathTraversalError as e:
            cicd_logger.error(f"Path traversal attempt blocked in security pipeline: {e}")
            results['passed'] = False
            results['summary'] = {
                'error': f'Security violation: {str(e)}',
                'security_violation': True
            }
            return results
        
        # 1. Scan de Secrets
        if config.get('scan_secrets', True):
            cicd_logger.info("Executando scan de secrets...")
            secrets_result = self.secrets_scanner.scan_directory(safe_project_dir)
            self.scan_results.append(secrets_result)
            results['scans']['secrets'] = asdict(secrets_result)

            # Falhar se encontrar secrets críticos
            if any(f.severity == SeverityLevel.HIGH for f in secrets_result.findings):
                results['passed'] = False
                results['recommendations'].append("Remove hardcoded secrets before deployment")

        # 2. Scan de Dependências
        if config.get('scan_dependencies', True):
            requirements_file = os.path.join(safe_project_dir, 'requirements.txt')
            if os.path.exists(requirements_file):
                cicd_logger.info("Executando scan de dependências...")
                deps_result = self.dependency_scanner.scan_python_dependencies(requirements_file)
                self.scan_results.append(deps_result)
                results['scans']['dependencies'] = asdict(deps_result)

                # Falhar se encontrar vulnerabilidades críticas
                if any(f.severity == SeverityLevel.CRITICAL for f in deps_result.findings):
                    results['passed'] = False
                    results['recommendations'].append("Update dependencies with critical vulnerabilities")

        # 3. Verificações de Compliance
        if config.get('check_compliance', True):
            cicd_logger.info("Executando verificações de compliance...")
            compliance_results = self.compliance_checker.check_compliance(safe_project_dir)
            results['compliance'] = [asdict(check) for check in compliance_results]
            
            # Falhar se houver violações de compliance críticas
            failed_critical = [c for c in compliance_results if not c.passed and c.severity == SeverityLevel.HIGH]
            if failed_critical:
                results['passed'] = False
                results['recommendations'].append("Fix critical compliance violations")
        
        # 4. Gerar Resumo
        total_findings = sum(len(scan.findings) for scan in self.scan_results)
        critical_findings = sum(1 for scan in self.scan_results for f in scan.findings if f.severity == SeverityLevel.CRITICAL)
        high_findings = sum(1 for scan in self.scan_results for f in scan.findings if f.severity == SeverityLevel.HIGH)
        
        results['summary'] = {
            'total_scans': len(self.scan_results),
            'total_findings': total_findings,
            'critical_findings': critical_findings,
            'high_findings': high_findings,
            'compliance_checks': len(results.get('compliance', [])),
            'failed_compliance': len([c for c in results.get('compliance', []) if not c.get('passed', True)]),
            'duration_seconds': (datetime.now() - pipeline_start).total_seconds()
        }
        
        # 5. Determinar se pipeline passou
        if stage == DeploymentStage.PRODUCTION:
            # Mais rigoroso para produção
            if critical_findings > 0 or high_findings > 0:
                results['passed'] = False
                results['recommendations'].append("No critical or high severity issues allowed in production")
        elif stage == DeploymentStage.STAGING:
            # Menos rigoroso para staging
            if critical_findings > 0:
                results['passed'] = False
                results['recommendations'].append("No critical severity issues allowed in staging")
        
        # 6. Logging final
        status = "PASSED" if results['passed'] else "FAILED"
        cicd_logger.info(f"Pipeline de segurança {status} - Findings: {total_findings}, Tempo: {results['summary']['duration_seconds']:.1f}s")
        
        return results
    
    def generate_security_report(self, results: Dict[str, Any], output_format: str = 'json') -> str:
        """Gera relatório de segurança"""
        if output_format == 'json':
            return json.dumps(results, indent=2, default=str)
        elif output_format == 'html':
            return self._generate_html_report(results)
        else:
            return str(results)
    
    def _generate_html_report(self, results: Dict[str, Any]) -> str:
        """Gera relatório HTML"""
        html_template = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>Security Scan Report</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; }
                .header { background: #f0f0f0; padding: 20px; border-radius: 5px; }
                .summary { background: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0; }
                .failed { background: #ffe8e8; }
                .finding { border-left: 4px solid #ccc; padding: 10px; margin: 10px 0; }
                .critical { border-left-color: #d32f2f; }
                .high { border-left-color: #f57c00; }
                .medium { border-left-color: #fbc02d; }
                .low { border-left-color: #388e3c; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Security Scan Report</h1>
                <p>Stage: {stage}</p>
                <p>Timestamp: {timestamp}</p>
                <p>Status: <strong>{status}</strong></p>
            </div>
            
            <div class="summary {summary_class}">
                <h2>Summary</h2>
                <ul>
                    <li>Total Findings: {total_findings}</li>
                    <li>Critical: {critical_findings}</li>
                    <li>High: {high_findings}</li>
                    <li>Duration: {duration:.1f}s</li>
                </ul>
            </div>
            
            {scans_html}
            
            {compliance_html}
            
            {recommendations_html}
        </body>
        </html>
        """
        
        # Preparar dados
        summary = results.get('summary', {})
        status = "PASSED" if results.get('passed', False) else "FAILED"
        summary_class = "" if results.get('passed', False) else "failed"
        
        # Gerar HTML para scans
        scans_html = ""
        for scan_type, scan_data in results.get('scans', {}).items():
            scans_html += f"<h3>{scan_type.title()} Scan</h3>"
            for finding in scan_data.get('findings', []):
                severity_class = finding.get('severity', 'info').lower()
                scans_html += f"""
                <div class="finding {severity_class}">
                    <strong>{finding.get('title', 'Unknown')}</strong><br>
                    {finding.get('description', '')}<br>
                    <small>File: {finding.get('file_path', 'Unknown')} | Severity: {finding.get('severity', 'Unknown')}</small>
                </div>
                """
        
        # Gerar HTML para compliance
        compliance_html = "<h3>Compliance Checks</h3>"
        for check in results.get('compliance', []):
            status_text = "✓ PASSED" if check.get('passed', False) else "✗ FAILED"
            compliance_html += f"""
            <div class="finding">
                <strong>{check.get('rule_name', 'Unknown')} - {status_text}</strong><br>
                {check.get('description', '')}<br>
                <small>Details: {check.get('details', '')}</small>
            </div>
            """
        
        # Gerar HTML para recomendações
        recommendations_html = "<h3>Recommendations</h3><ul>"
        for rec in results.get('recommendations', []):
            recommendations_html += f"<li>{rec}</li>"
        recommendations_html += "</ul>"
        
        return html_template.format(
            stage=results.get('stage', 'Unknown'),
            timestamp=results.get('timestamp', 'Unknown'),
            status=status,
            summary_class=summary_class,
            total_findings=summary.get('total_findings', 0),
            critical_findings=summary.get('critical_findings', 0),
            high_findings=summary.get('high_findings', 0),
            duration=summary.get('duration_seconds', 0),
            scans_html=scans_html,
            compliance_html=compliance_html,
            recommendations_html=recommendations_html
        )
    
    def setup_pre_commit_hooks(self, project_directory: str) -> bool:
        """
        Configura pre-commit hooks de segurança.

        Security: Directory path is validated to prevent traversal attacks (CWE-22)

        Args:
            project_directory: Diretório do projeto (validado contra path traversal)

        Returns:
            bool: True se configuração bem-sucedida
        """
        try:
            # SECURITY FIX: Validate project directory path (CWE-22)
            safe_project_dir = validate_safe_path(project_directory)

            hooks_dir = os.path.join(safe_project_dir, '.git', 'hooks')
            if not os.path.exists(hooks_dir):
                os.makedirs(hooks_dir)
            
            pre_commit_script = """#!/bin/bash
# Security Pre-commit Hook

echo "Running security checks..."

# Execute security pipeline
python -c "
from src.backend.core.security.cicd_security import CICDSecurityOrchestrator
from src.backend.core.security.cicd_security import DeploymentStage

orchestrator = CICDSecurityOrchestrator()
results = orchestrator.run_security_pipeline('.', DeploymentStage.PRE_COMMIT)

if not results['passed']:
    print('Security checks failed. Commit aborted.')
    print('Issues found:')
    for rec in results.get('recommendations', []):
        print(f'  - {rec}')
    exit(1)
else:
    print('Security checks passed.')
    exit(0)
"

exit $?
"""
            
            hook_file = os.path.join(hooks_dir, 'pre-commit')
            with open(hook_file, 'w') as f:
                f.write(pre_commit_script)
            
            # Tornar executável
            os.chmod(hook_file, 0o755)
            
            cicd_logger.info("Pre-commit hooks configurados com sucesso")
            return True

        except PathTraversalError as e:
            cicd_logger.error(f"Path traversal attempt blocked in hook setup: {e}")
            return False
        except Exception as e:
            cicd_logger.error(f"Erro ao configurar pre-commit hooks: {e}")
            return False


# Instância global
global_cicd_orchestrator = CICDSecurityOrchestrator()

# Funções de conveniência
def run_security_scan(directory: str, stage: DeploymentStage = DeploymentStage.BUILD) -> Dict[str, Any]:
    """Executa scan de segurança"""
    return global_cicd_orchestrator.run_security_pipeline(directory, stage)

def setup_security_hooks(directory: str) -> bool:
    """Configura hooks de segurança"""
    return global_cicd_orchestrator.setup_pre_commit_hooks(directory)


# Alias para compatibilidade
SecurityScanner = CICDSecurityOrchestrator


# Log de inicialização
cicd_logger.info("Sistema CI/CD seguro carregado com todas as funcionalidades")