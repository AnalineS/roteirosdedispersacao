#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Teste de configuração GitHub
"""

import os
import sys
import asyncio

# Configurar variáveis de ambiente
# GitHub token deve ser definido via variáveis de ambiente ou GitHub Secrets
# os.environ['GITHUB_TOKEN'] = 'SET_VIA_ENVIRONMENT_VARIABLES'
os.environ['GITHUB_REPOSITORY_OWNER'] = 'AnalineS'
os.environ['GITHUB_REPOSITORY_NAME'] = 'roteirosdedispersacao'

# Configurar encoding UTF-8 para Windows
if sys.platform == "win32":
    import codecs
    sys.stdout = codecs.getwriter("utf-8")(sys.stdout.detach())
    sys.stderr = codecs.getwriter("utf-8")(sys.stderr.detach())

from utils.github_issues import GitHubIssueCreator

async def test_github_config():
    """Testa configuração do GitHub"""
    creator = GitHubIssueCreator()
    
    print(f"🔧 Token: {creator.github_token[:10]}...")
    print(f"👤 Owner: {creator.repo_owner}")
    print(f"📁 Repo: {creator.repo_name}")
    
    # Criar issue de teste
    test_failures = [
        {
            "test_name": "test_github_integration",
            "error": "Teste de integração GitHub",
            "details": "Validando criação automática de issues",
            "passed": False,
            "duration": 1.0,
            "severity": "low"
        }
    ]
    
    print("🐛 Testando criação de issue...")
    issue = await creator.create_issue_for_test_failures(
        "github_integration_test",
        test_failures,
        "local"
    )
    
    if issue:
        print(f"✅ Issue criada com sucesso: #{issue.get('number')}")
        print(f"🔗 URL: {issue.get('html_url')}")
        return True
    else:
        print("❌ Falha ao criar issue")
        return False

if __name__ == "__main__":
    result = asyncio.run(test_github_config())
    sys.exit(0 if result else 1)