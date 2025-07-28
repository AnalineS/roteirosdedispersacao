#!/usr/bin/env python3
"""
🧹 SCRIPT DE LIMPEZA DE REPOSITÓRIOS GITHUB
DevOps Engineer: Automação de limpeza de repositórios
Mantém apenas: siteroteirodedispersacao + trabalhografosfaa
"""

import os
import sys
import requests
from datetime import datetime

class GitHubCleanupAutomation:
    """Automação de limpeza de repositórios GitHub"""
    
    def __init__(self):
        self.github_token = None
        self.github_username = "AnalineS"
        self.base_url = "https://api.github.com"
        self.repos_to_keep = [
            "siteroteirodedispersacao",
            "trabalhografosfaa"
        ]
        
    def print_status(self, message, status="INFO"):
        """Print formatado com timestamp"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        symbols = {
            "INFO": "ℹ️",
            "SUCCESS": "✅",
            "ERROR": "❌",
            "WARNING": "⚠️",
            "WORKING": "🔧"
        }
        print(f"[{timestamp}] {symbols.get(status, '•')} {message}")
        
    def load_credentials(self):
        """Carrega token do GitHub"""
        self.print_status("Configurando credenciais GitHub...", "WORKING")
        
        self.github_token = os.environ.get('GITHUB_TOKEN')
        if not self.github_token:
            print("\n📌 Para obter seu GitHub Personal Access Token:")
            print("1. Acesse https://github.com/settings/tokens")
            print("2. Clique em 'Generate new token (classic)'")
            print("3. Selecione o escopo 'delete_repo'")
            print("4. Gere e copie o token\n")
            self.github_token = input("Cole seu GitHub Token: ").strip()
            
        return bool(self.github_token)
        
    def get_headers(self):
        """Retorna headers para requisições"""
        return {
            "Authorization": f"token {self.github_token}",
            "Accept": "application/vnd.github.v3+json",
            "X-GitHub-Api-Version": "2022-11-28"
        }
        
    def list_repositories(self):
        """Lista todos os repositórios do usuário"""
        self.print_status(f"Listando repositórios de {self.github_username}...", "WORKING")
        
        all_repos = []
        page = 1
        
        while True:
            response = requests.get(
                f"{self.base_url}/user/repos",
                headers=self.get_headers(),
                params={
                    "page": page,
                    "per_page": 100,
                    "type": "owner"
                }
            )
            
            if response.status_code != 200:
                self.print_status(f"Erro ao listar repositórios: {response.status_code}", "ERROR")
                return None
                
            repos = response.json()
            if not repos:
                break
                
            all_repos.extend(repos)
            page += 1
            
        # Filtrar apenas repositórios próprios
        user_repos = [r for r in all_repos if r['owner']['login'] == self.github_username]
        
        self.print_status(f"Total de repositórios encontrados: {len(user_repos)}", "SUCCESS")
        return user_repos
        
    def identify_repos_to_delete(self, repos):
        """Identifica repositórios para deletar"""
        self.print_status("Analisando repositórios...", "WORKING")
        
        repos_to_delete = []
        repos_to_keep_found = []
        
        for repo in repos:
            repo_name = repo['name']
            if repo_name in self.repos_to_keep:
                repos_to_keep_found.append(repo_name)
                self.print_status(f"✅ Manter: {repo_name}", "SUCCESS")
            else:
                created_at = repo['created_at']
                # Verificar se foi criado em 2025
                if created_at.startswith("2025"):
                    repos_to_delete.append(repo)
                    self.print_status(f"❌ Marcar para exclusão: {repo_name} (criado em {created_at[:10]})", "WARNING")
                else:
                    self.print_status(f"ℹ️ Ignorar: {repo_name} (criado antes de 2025)", "INFO")
                    
        # Verificar se encontrou os repos essenciais
        for essential_repo in self.repos_to_keep:
            if essential_repo not in repos_to_keep_found:
                self.print_status(f"⚠️ Repositório essencial não encontrado: {essential_repo}", "WARNING")
                
        return repos_to_delete
        
    def delete_repository(self, repo):
        """Deleta um repositório"""
        repo_name = repo['name']
        repo_full_name = repo['full_name']
        
        # Confirmação dupla para segurança
        print(f"\n⚠️ ATENÇÃO: Você está prestes a DELETAR permanentemente:")
        print(f"   Repositório: {repo_name}")
        print(f"   URL: {repo['html_url']}")
        print(f"   Criado em: {repo['created_at'][:10]}")
        print(f"   Descrição: {repo.get('description', 'Sem descrição')}")
        
        confirm1 = input(f"\nTem certeza que deseja deletar '{repo_name}'? (digite o nome do repo): ")
        if confirm1 != repo_name:
            self.print_status(f"Exclusão de '{repo_name}' cancelada", "INFO")
            return False
            
        confirm2 = input("Digite 'DELETAR' para confirmar: ")
        if confirm2 != "DELETAR":
            self.print_status(f"Exclusão de '{repo_name}' cancelada", "INFO")
            return False
            
        # Executar exclusão
        response = requests.delete(
            f"{self.base_url}/repos/{repo_full_name}",
            headers=self.get_headers()
        )
        
        if response.status_code == 204:
            self.print_status(f"Repositório '{repo_name}' deletado com sucesso!", "SUCCESS")
            return True
        else:
            self.print_status(f"Erro ao deletar '{repo_name}': {response.status_code}", "ERROR")
            return False
            
    def create_backup_list(self, repos_to_delete):
        """Cria lista de backup dos repositórios a serem deletados"""
        self.print_status("Criando lista de backup...", "WORKING")
        
        backup_file = f"github_repos_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
        
        with open(backup_file, 'w', encoding='utf-8') as f:
            f.write("LISTA DE REPOSITÓRIOS MARCADOS PARA EXCLUSÃO\n")
            f.write("=" * 60 + "\n")
            f.write(f"Data: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"Usuário: {self.github_username}\n")
            f.write("=" * 60 + "\n\n")
            
            for repo in repos_to_delete:
                f.write(f"Nome: {repo['name']}\n")
                f.write(f"URL: {repo['html_url']}\n")
                f.write(f"Clone URL: {repo['clone_url']}\n")
                f.write(f"Criado em: {repo['created_at']}\n")
                f.write(f"Descrição: {repo.get('description', 'Sem descrição')}\n")
                f.write("-" * 40 + "\n\n")
                
        self.print_status(f"Lista de backup salva em: {backup_file}", "SUCCESS")
        return backup_file
        
    def run(self):
        """Executa o processo de limpeza"""
        print("=" * 60)
        print("🧹 LIMPEZA DE REPOSITÓRIOS GITHUB")
        print("=" * 60)
        print(f"\n👤 Usuário: {self.github_username}")
        print(f"✅ Repositórios a manter: {', '.join(self.repos_to_keep)}")
        print("❌ Deletar: Repositórios criados em 2025 (exceto os listados acima)\n")
        
        # Carregar credenciais
        if not self.load_credentials():
            self.print_status("Token GitHub não configurado", "ERROR")
            return False
            
        # Listar repositórios
        repos = self.list_repositories()
        if repos is None:
            return False
            
        # Identificar repos para deletar
        repos_to_delete = self.identify_repos_to_delete(repos)
        
        if not repos_to_delete:
            self.print_status("Nenhum repositório para deletar!", "SUCCESS")
            return True
            
        # Criar backup
        print("\n" + "=" * 60)
        self.print_status(f"Encontrados {len(repos_to_delete)} repositórios para deletar", "WARNING")
        backup_file = self.create_backup_list(repos_to_delete)
        
        # Confirmar ação
        print("\n" + "=" * 60)
        print("⚠️ ATENÇÃO: Esta ação é IRREVERSÍVEL!")
        print(f"📋 {len(repos_to_delete)} repositórios serão DELETADOS permanentemente")
        confirm = input("\nDeseja continuar com a limpeza? (s/N): ")
        
        if confirm.lower() != 's':
            self.print_status("Limpeza cancelada pelo usuário", "INFO")
            return False
            
        # Executar limpeza
        print("\n" + "=" * 60)
        deleted_count = 0
        
        for repo in repos_to_delete:
            if self.delete_repository(repo):
                deleted_count += 1
                
        # Resumo final
        print("\n" + "=" * 60)
        self.print_status(f"LIMPEZA CONCLUÍDA!", "SUCCESS")
        self.print_status(f"Repositórios deletados: {deleted_count}/{len(repos_to_delete)}", "INFO")
        self.print_status(f"Backup salvo em: {backup_file}", "INFO")
        print("=" * 60)
        
        return True


if __name__ == "__main__":
    cleanup = GitHubCleanupAutomation()
    success = cleanup.run()
    sys.exit(0 if success else 1)