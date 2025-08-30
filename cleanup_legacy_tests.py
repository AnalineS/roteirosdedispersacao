#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Cleanup Legacy Tests - Remove arquivos de teste obsoletos
========================================================

Script para remover arquivos de teste dispersos que foram
consolidados na nova QA Automation Suite.

Execução: python cleanup_legacy_tests.py
"""

import os
import shutil
import logging
from pathlib import Path

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger('cleanup')

def cleanup_legacy_tests():
    """Remove arquivos de teste obsoletos"""
    
    # Diretórios de teste a remover (mantém apenas qa_automation_suite)
    directories_to_remove = [
        "tests/backend",
        "tests/integration", 
        "tests/security",
        "tests/frontend",
        "tests/e2e"
    ]
    
    # Arquivos específicos a remover
    files_to_remove = [
        # Já foram removidos ou não existem mais
    ]
    
    removed_count = 0
    
    # Remover diretórios obsoletos
    for directory in directories_to_remove:
        if os.path.exists(directory):
            try:
                # Listar arquivos que serão removidos
                file_count = sum(len(files) for _, _, files in os.walk(directory))
                logger.info(f"📁 Removendo diretório: {directory} ({file_count} arquivos)")
                
                # Criar backup antes de remover (opcional)
                backup_dir = f"backup/{directory.replace('/', '_')}"
                if not os.path.exists('backup'):
                    os.makedirs('backup')
                
                if os.path.exists(backup_dir):
                    shutil.rmtree(backup_dir)
                
                shutil.copytree(directory, backup_dir)
                logger.info(f"✅ Backup criado: {backup_dir}")
                
                # Remover diretório original
                shutil.rmtree(directory)
                removed_count += file_count
                logger.info(f"🗑️  Removido: {directory}")
                
            except Exception as e:
                logger.error(f"❌ Erro ao remover {directory}: {e}")
    
    # Remover arquivos específicos
    for file_path in files_to_remove:
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
                removed_count += 1
                logger.info(f"🗑️  Removido arquivo: {file_path}")
            except Exception as e:
                logger.error(f"❌ Erro ao remover {file_path}: {e}")
    
    logger.info("=" * 60)
    logger.info("📋 RESUMO DA LIMPEZA")
    logger.info("=" * 60)
    logger.info(f"Arquivos/diretórios removidos: {removed_count}")
    logger.info(f"Nova estrutura de testes: tests/qa_automation_suite/")
    logger.info(f"Backup dos arquivos: backup/ (segurança)")
    logger.info("✅ Limpeza concluída com sucesso!")
    
    # Verificar estrutura final
    logger.info("\n📁 Estrutura final de testes:")
    try:
        for root, dirs, files in os.walk("tests"):
            level = root.replace("tests", "").count(os.sep)
            indent = " " * 2 * level
            logger.info(f"{indent}{os.path.basename(root)}/")
            sub_indent = " " * 2 * (level + 1)
            for file in files:
                if file.endswith('.py'):
                    logger.info(f"{sub_indent}{file}")
    except Exception as e:
        logger.error(f"Erro ao listar estrutura final: {e}")

if __name__ == "__main__":
    logger.info("🧹 Iniciando limpeza de arquivos de teste obsoletos...")
    
    # Confirmar se qa_automation_suite existe
    if not os.path.exists("tests/qa_automation_suite"):
        logger.error("❌ QA Automation Suite não encontrada! Abortando limpeza.")
        exit(1)
    
    # Verificar se há arquivos importantes na nova suite
    required_files = [
        "tests/qa_automation_suite/main_test_runner.py",
        "tests/qa_automation_suite/test_scenarios/integration_e2e.py",
        "tests/qa_automation_suite/test_scenarios/medical_accuracy.py",
        "tests/qa_automation_suite/test_scenarios/performance_load.py",
        "tests/qa_automation_suite/test_scenarios/security_validation.py"
    ]
    
    missing_files = [f for f in required_files if not os.path.exists(f)]
    if missing_files:
        logger.error(f"❌ Arquivos essenciais ausentes: {missing_files}")
        logger.error("Abortando limpeza por segurança.")
        exit(1)
    
    logger.info("✅ QA Automation Suite completa encontrada. Prosseguindo com limpeza...")
    cleanup_legacy_tests()