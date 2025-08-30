#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Teste de Build e Configuração do Frontend
Engenheiro de Integração Full-Stack Sênior especializado em Sistemas Médicos
"""

import os
import subprocess
import json
import time
from pathlib import Path
from datetime import datetime

def log(message: str, level: str = "INFO"):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] [{level}] {message}")

def test_frontend_structure():
    """Testa se a estrutura do frontend está correta"""
    log("Verificando estrutura do frontend...")
    
    frontend_dir = Path("src/frontend")
    required_files = [
        "package.json",
        "tsconfig.json", 
        "vite.config.ts",
        "tailwind.config.js",
        "src/main.tsx",
        "src/App.tsx",
        "src/types/index.ts",
        "src/services/api.ts"
    ]
    
    missing_files = []
    
    for file_path in required_files:
        full_path = frontend_dir / file_path
        if not full_path.exists():
            missing_files.append(str(full_path))
            log(f"   FAIL - Arquivo faltando: {full_path}", "ERROR")
        else:
            log(f"   SUCCESS - Arquivo encontrado: {file_path}")
    
    if missing_files:
        log(f"FAIL - Arquivos faltando: {len(missing_files)}", "ERROR")
        return False
    
    log("SUCCESS - Estrutura do frontend está completa")
    return True

def test_package_json():
    """Verifica se o package.json está correto"""
    log("Verificando package.json...")
    
    try:
        with open("src/frontend/package.json", 'r', encoding='utf-8') as f:
            package_data = json.load(f)
        
        required_deps = [
            "react",
            "react-dom", 
            "typescript",
            "vite",
            "@vitejs/plugin-react",
            "tailwindcss",
            "framer-motion",
            "react-query",
            "react-router-dom",
            "axios"
        ]
        
        all_deps = {**package_data.get('dependencies', {}), **package_data.get('devDependencies', {})}
        
        missing_deps = []
        for dep in required_deps:
            if dep not in all_deps:
                missing_deps.append(dep)
                log(f"   FAIL - Dependência faltando: {dep}", "ERROR")
            else:
                log(f"   SUCCESS - Dependência encontrada: {dep}")
        
        if missing_deps:
            log(f"FAIL - Dependências faltando: {len(missing_deps)}", "ERROR")
            return False
        
        # Verificar scripts
        scripts = package_data.get('scripts', {})
        if 'dev' in scripts and 'build' in scripts:
            log("SUCCESS - Scripts dev e build encontrados")
        else:
            log("WARN - Scripts dev ou build podem estar faltando", "WARN")
        
        log("SUCCESS - package.json está correto")
        return True
        
    except Exception as e:
        log(f"ERROR - Erro ao verificar package.json: {e}", "ERROR")
        return False

def test_typescript_config():
    """Verifica configuração do TypeScript"""
    log("Verificando configuração TypeScript...")
    
    try:
        with open("src/frontend/tsconfig.json", 'r', encoding='utf-8') as f:
            ts_config = json.load(f)
        
        compiler_options = ts_config.get('compilerOptions', {})
        
        # Verificar configurações importantes
        important_configs = {
            'target': ['es2015', 'es2020', 'esnext'],
            'module': ['esnext'],
            'moduleResolution': ['node'],
            'jsx': ['react-jsx', 'react']
        }
        
        all_good = True
        for config, valid_values in important_configs.items():
            if config in compiler_options:
                value = compiler_options[config]
                if value in valid_values:
                    log(f"   SUCCESS - {config}: {value}")
                else:
                    log(f"   WARN - {config}: {value} (esperado: {valid_values})", "WARN")
            else:
                log(f"   WARN - Configuração {config} faltando", "WARN")
                all_good = False
        
        # Verificar paths/baseUrl para imports absolutos
        if 'baseUrl' in compiler_options or 'paths' in compiler_options:
            log("   SUCCESS - Configuração de paths para imports absolutos encontrada")
        else:
            log("   WARN - Configuração de paths pode estar faltando", "WARN")
        
        log("SUCCESS - Configuração TypeScript verificada")
        return all_good
        
    except Exception as e:
        log(f"ERROR - Erro ao verificar tsconfig.json: {e}", "ERROR")
        return False

def test_api_types_compatibility():
    """Verifica se os types estão compatíveis com a API"""
    log("Verificando compatibilidade dos types com API...")
    
    try:
        # Ler arquivo de types
        with open("src/frontend/src/types/index.ts", 'r', encoding='utf-8') as f:
            types_content = f.read()
        
        # Verificar types importantes
        required_types = [
            'interface Message',
            'interface Persona', 
            'interface ApiResponse',
            'interface ScopeAnalysis',
            'interface FeedbackData',
            'interface SystemStats'
        ]
        
        missing_types = []
        for type_def in required_types:
            if type_def in types_content:
                log(f"   SUCCESS - Type encontrado: {type_def}")
            else:
                missing_types.append(type_def)
                log(f"   FAIL - Type faltando: {type_def}", "ERROR")
        
        # Verificar campos específicos importantes
        important_fields = [
            'personality_id',  # Para compatibilidade com backend
            'request_id',      # Para tracking
            'processing_time_ms',  # Para métricas
            'confidence'       # Para indicadores de qualidade
        ]
        
        missing_fields = []
        for field in important_fields:
            if field in types_content:
                log(f"   SUCCESS - Campo encontrado: {field}")
            else:
                missing_fields.append(field)
                log(f"   WARN - Campo pode estar faltando: {field}", "WARN")
        
        if missing_types:
            log(f"FAIL - Types críticos faltando: {len(missing_types)}", "ERROR")
            return False
        
        log("SUCCESS - Types estão compatíveis com API")
        return True
        
    except Exception as e:
        log(f"ERROR - Erro ao verificar types: {e}", "ERROR")
        return False

def test_api_service_config():
    """Verifica se o serviço de API está configurado corretamente"""
    log("Verificando configuração do serviço de API...")
    
    try:
        with open("src/frontend/src/services/api.ts", 'r', encoding='utf-8') as f:
            api_content = f.read()
        
        # Verificar configurações importantes
        required_configs = [
            'baseURL',
            'timeout',
            'Content-Type',
            'chatApi',
            'personasApi',
            'scopeApi',
            'feedbackApi',
            'statsApi'
        ]
        
        missing_configs = []
        for config in required_configs:
            if config in api_content:
                log(f"   SUCCESS - Configuração encontrada: {config}")
            else:
                missing_configs.append(config)
                log(f"   FAIL - Configuração faltando: {config}", "ERROR")
        
        # Verificar se usa variáveis de ambiente
        if 'VITE_API_URL' in api_content:
            log("   SUCCESS - Configuração com variável de ambiente encontrada")
        else:
            log("   WARN - Configuração de variável de ambiente pode estar faltando", "WARN")
        
        # Verificar interceptors
        if 'interceptors' in api_content:
            log("   SUCCESS - Interceptors de request/response encontrados")
        else:
            log("   WARN - Interceptors podem estar faltando", "WARN")
        
        if missing_configs:
            log(f"FAIL - Configurações críticas faltando: {len(missing_configs)}", "ERROR")
            return False
        
        log("SUCCESS - Serviço de API está configurado")
        return True
        
    except Exception as e:
        log(f"ERROR - Erro ao verificar API service: {e}", "ERROR")
        return False

def test_environment_config():
    """Verifica configuração de ambiente"""
    log("Verificando configuração de ambiente...")
    
    env_files = [".env", ".env.example"]
    found_env = False
    
    for env_file in env_files:
        env_path = Path(f"src/frontend/{env_file}")
        if env_path.exists():
            log(f"   SUCCESS - Arquivo de ambiente encontrado: {env_file}")
            found_env = True
            
            # Verificar conteúdo
            try:
                with open(env_path, 'r', encoding='utf-8') as f:
                    env_content = f.read()
                
                if 'VITE_API_URL' in env_content:
                    log(f"   SUCCESS - VITE_API_URL configurado em {env_file}")
                else:
                    log(f"   WARN - VITE_API_URL pode estar faltando em {env_file}", "WARN")
                    
            except Exception as e:
                log(f"   ERROR - Erro ao ler {env_file}: {e}", "ERROR")
        else:
            log(f"   INFO - Arquivo {env_file} não encontrado")
    
    if found_env:
        log("SUCCESS - Configuração de ambiente está presente")
        return True
    else:
        log("WARN - Nenhum arquivo de ambiente encontrado", "WARN")
        return False

def main():
    """Executa todos os testes de frontend"""
    log("Iniciando Verificação da Configuração do Frontend")
    log("=" * 60)
    
    # Mudar para diretório raiz do projeto
    project_root = Path(__file__).parent.parent.parent
    os.chdir(project_root)
    
    start_time = time.time()
    
    tests = [
        ("Estrutura do Frontend", test_frontend_structure),
        ("Package.json", test_package_json),
        ("TypeScript Config", test_typescript_config),
        ("API Types Compatibility", test_api_types_compatibility),
        ("API Service Config", test_api_service_config),
        ("Environment Config", test_environment_config)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            log(f"CRITICAL ERROR em {test_name}: {e}", "ERROR")
            results.append((test_name, False))
        
        log("-" * 40)
    
    end_time = time.time()
    total_time = end_time - start_time
    
    total_tests = len(results)
    passed_tests = sum(1 for _, result in results if result)
    success_rate = (passed_tests / total_tests) * 100 if total_tests > 0 else 0
    
    log("RESUMO DA VERIFICAÇÃO DO FRONTEND")
    log("=" * 60)
    log(f"Total de verificações: {total_tests}")
    log(f"Sucessos: {passed_tests}")
    log(f"Taxa de sucesso: {success_rate:.1f}%")
    log(f"Tempo total: {total_time:.2f}s")
    
    for test_name, result in results:
        status = "PASS" if result else "FAIL"
        log(f"   {test_name}: {status}")
    
    if success_rate >= 90:
        log("CONFIGURAÇÃO DO FRONTEND: EXCELENTE!")
        return True
    elif success_rate >= 70:
        log("CONFIGURAÇÃO DO FRONTEND: BOA - Algumas melhorias recomendadas")
        return True
    else:
        log("CONFIGURAÇÃO DO FRONTEND: NECESSITA CORREÇÕES")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)