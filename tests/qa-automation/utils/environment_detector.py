# -*- coding: utf-8 -*-
"""
Environment Detector - Detecção Automática de Ambiente
=====================================================

Detecta automaticamente se os testes estão rodando local vs HML vs produção
baseado em variáveis de ambiente, conectividade e configurações.

Autor: Sistema QA Roteiro de Dispensação
Data: 30/08/2025
"""

import os
import sys
import logging
import requests
from typing import Dict, Any, Optional
from urllib.parse import urlparse

logger = logging.getLogger('environment_detector')

class EnvironmentDetector:
    """Detecta ambiente de execução automaticamente"""
    
    def __init__(self):
        self.timeout = 5  # Timeout para conectividade
    
    def detect_environment(self) -> str:
        """
        Detecta ambiente baseado em múltiplos fatores
        
        Returns:
            str: 'local', 'hml', 'development', ou 'production'
        """
        # 1. Verificar variáveis de ambiente explícitas
        explicit_env = self._check_explicit_environment()
        if explicit_env:
            logger.info(f"🎯 Ambiente detectado via variável: {explicit_env}")
            return explicit_env
        
        # 2. Verificar GitHub Actions / CI
        ci_env = self._check_ci_environment()
        if ci_env:
            logger.info(f"🤖 Ambiente CI detectado: {ci_env}")
            return ci_env
        
        # 3. Verificar conectividade com serviços
        connectivity_env = self._check_connectivity_based_environment()
        if connectivity_env:
            logger.info(f"🌐 Ambiente detectado via conectividade: {connectivity_env}")
            return connectivity_env
        
        # 4. Fallback para local
        logger.info("🏠 Fallback para ambiente local")
        return "local"
    
    def _check_explicit_environment(self) -> Optional[str]:
        """Verifica variáveis de ambiente explícitas"""
        # Ordem de prioridade
        env_vars = [
            ('TEST_ENVIRONMENT', None),
            ('ENVIRONMENT', None),
            ('NODE_ENV', {'development': 'development', 'production': 'hml'}),
            ('FLASK_ENV', {'development': 'local', 'production': 'hml'})
        ]
        
        for var_name, mapping in env_vars:
            value = os.getenv(var_name)
            if value:
                if mapping:
                    return mapping.get(value.lower())
                else:
                    return value.lower()
        
        return None
    
    def _check_ci_environment(self) -> Optional[str]:
        """Detecta ambiente CI/CD"""
        ci_indicators = [
            'GITHUB_ACTIONS',
            'CI',
            'CONTINUOUS_INTEGRATION',
            'BUILD_NUMBER',
            'JENKINS_URL'
        ]
        
        for indicator in ci_indicators:
            if os.getenv(indicator):
                # Em CI, verificar se é HML ou desenvolvimento
                if os.getenv('GITHUB_REF') == 'refs/heads/hml':
                    return 'hml'
                elif os.getenv('GITHUB_REF') == 'refs/heads/main':
                    return 'hml'  # Main vai para HML primeiro
                else:
                    return 'development'
        
        return None
    
    def _check_connectivity_based_environment(self) -> Optional[str]:
        """Detecta ambiente baseado na conectividade com APIs"""
        # URLs para testar
        test_urls = {
            'local': 'http://localhost:8080/api/v1/health',
            'hml': self._get_hml_url() + '/api/v1/health' if self._get_hml_url() else None
        }
        
        for env_name, url in test_urls.items():
            if url and self._test_url_connectivity(url):
                return env_name
        
        return None
    
    def _get_hml_url(self) -> Optional[str]:
        """Obtém URL do ambiente HML"""
        # Tentar variáveis de ambiente
        hml_urls = [
            os.getenv('HML_API_URL'),
            os.getenv('HML_BASE_URL'),
            os.getenv('HOMOLOG_URL')
        ]
        
        for url in hml_urls:
            if url:
                return url.rstrip('/')
        
        return None
    
    def _test_url_connectivity(self, url: str) -> bool:
        """Testa conectividade com uma URL"""
        try:
            response = requests.get(url, timeout=self.timeout)
            return response.status_code == 200
        except Exception:
            return False
    
    def get_environment_info(self) -> Dict[str, Any]:
        """Retorna informações detalhadas do ambiente"""
        current_env = self.detect_environment()
        
        info = {
            "detected_environment": current_env,
            "python_version": sys.version,
            "platform": sys.platform,
            "working_directory": os.getcwd(),
            "environment_variables": {},
            "connectivity": {}
        }
        
        # Variáveis relevantes (sem secrets)
        relevant_vars = [
            'NODE_ENV', 'FLASK_ENV', 'ENVIRONMENT', 'TEST_ENVIRONMENT',
            'GITHUB_ACTIONS', 'CI', 'GITHUB_REF',
            'PORT', 'HOST'
        ]
        
        for var in relevant_vars:
            value = os.getenv(var)
            if value:
                info["environment_variables"][var] = value
        
        # Testes de conectividade
        test_urls = {
            'localhost': 'http://localhost:8080/api/v1/health',
            'hml_api': self._get_hml_url() + '/api/v1/health' if self._get_hml_url() else None
        }
        
        for name, url in test_urls.items():
            if url:
                info["connectivity"][name] = {
                    "url": url,
                    "accessible": self._test_url_connectivity(url)
                }
        
        return info
    
    def validate_environment_requirements(self, target_env: str) -> Dict[str, Any]:
        """
        Valida se o ambiente atual atende os requisitos para os testes
        
        Args:
            target_env: Ambiente alvo ('local', 'hml', etc.)
            
        Returns:
            Dict com resultado da validação
        """
        validation = {
            "environment": target_env,
            "valid": True,
            "warnings": [],
            "errors": [],
            "requirements_met": {}
        }
        
        if target_env == "local":
            # Requisitos para testes locais
            requirements = {
                "localhost_api": "http://localhost:8080/api/v1/health",
                "python_version": sys.version_info >= (3, 8)
            }
            
        elif target_env == "hml":
            # Requisitos para testes HML
            hml_url = self._get_hml_url()
            requirements = {
                "hml_api_url": hml_url is not None,
                "hml_connectivity": hml_url and self._test_url_connectivity(hml_url + '/api/v1/health'),
                "github_secrets": os.getenv('GITHUB_TOKEN') is not None  # Para criar issues
            }
            
        else:  # development
            requirements = {
                "api_available": True,  # Assumir disponível
                "python_version": sys.version_info >= (3, 8)
            }
        
        # Validar cada requisito
        for req_name, req_result in requirements.items():
            validation["requirements_met"][req_name] = req_result
            
            if not req_result:
                error_msg = f"Requisito não atendido: {req_name}"
                validation["errors"].append(error_msg)
                validation["valid"] = False
        
        # Avisos específicos por ambiente
        if target_env == "local" and self._get_hml_url():
            validation["warnings"].append("URL HML detectada, considere usar --env=hml para testes completos")
        
        if target_env == "hml" and not os.getenv('GITHUB_TOKEN'):
            validation["warnings"].append("GitHub Token não encontrado, issues não serão criados automaticamente")
        
        return validation