#!/usr/bin/env python3
"""
🚀 DEPLOY COMPLETO E LIMPEZA - ROTEIRO DE DISPENSAÇÃO
DevOps Engineer: Script unificado de automação
"""

import os
import sys
import subprocess
from datetime import datetime

def print_header(title):
    """Imprime cabeçalho formatado"""
    print("\n" + "=" * 70)
    print(f"🚀 {title}")
    print("=" * 70 + "\n")

def install_requirements():
    """Instala dependências necessárias"""
    print("📦 Verificando dependências...")
    
    try:
        import requests
        print("✅ requests já instalado")
    except ImportError:
        print("📥 Instalando requests...")
        subprocess.run([sys.executable, "-m", "pip", "install", "requests"], check=True)
        
    try:
        import yaml
        print("✅ pyyaml já instalado")
    except ImportError:
        print("📥 Instalando pyyaml...")
        subprocess.run([sys.executable, "-m", "pip", "install", "pyyaml"], check=True)
        
def run_github_cleanup():
    """Executa limpeza do GitHub"""
    print_header("ETAPA 1: LIMPEZA DE REPOSITÓRIOS GITHUB")
    
    cleanup_script = os.path.join(os.path.dirname(__file__), "github_cleanup_automation.py")
    
    if not os.path.exists(cleanup_script):
        print("❌ Script de limpeza GitHub não encontrado!")
        return False
        
    result = subprocess.run([sys.executable, cleanup_script])
    return result.returncode == 0

def run_render_deploy():
    """Executa deploy no Render"""
    print_header("ETAPA 2: DEPLOY NO RENDER.COM")
    
    deploy_script = os.path.join(os.path.dirname(__file__), "render_deploy_automation.py")
    
    if not os.path.exists(deploy_script):
        print("❌ Script de deploy Render não encontrado!")
        return False
        
    result = subprocess.run([sys.executable, deploy_script])
    return result.returncode == 0

def create_deployment_report():
    """Cria relatório de deployment"""
    print_header("CRIANDO RELATÓRIO DE DEPLOYMENT")
    
    report_file = f"deployment_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"
    
    with open(report_file, 'w', encoding='utf-8') as f:
        f.write("# 📊 RELATÓRIO DE DEPLOYMENT - ROTEIRO DE DISPENSAÇÃO\n\n")
        f.write(f"**Data:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"**Branch:** render-deploy\n")
        f.write(f"**Ambiente:** Produção\n\n")
        
        f.write("## ✅ Ações Executadas\n\n")
        f.write("### 1. Limpeza GitHub\n")
        f.write("- [ ] Repositórios extras removidos\n")
        f.write("- [ ] Mantidos: siteroteirodedispersacao + trabalhografosfaa\n\n")
        
        f.write("### 2. Deploy Render\n")
        f.write("- [ ] Serviço criado/atualizado\n")
        f.write("- [ ] Variáveis de ambiente configuradas\n")
        f.write("- [ ] Deploy executado com sucesso\n")
        f.write("- [ ] Serviços extras removidos\n\n")
        
        f.write("## 🔗 URLs de Produção\n\n")
        f.write("- **Aplicação:** https://roteiro-dispensacao.onrender.com\n")
        f.write("- **Health Check:** https://roteiro-dispensacao.onrender.com/api/health\n")
        f.write("- **Dashboard Render:** https://dashboard.render.com/web/srv-[ID]\n\n")
        
        f.write("## 📋 Próximos Passos\n\n")
        f.write("1. Verificar funcionamento da aplicação\n")
        f.write("2. Testar endpoints principais\n")
        f.write("3. Validar logs no dashboard\n")
        f.write("4. Confirmar métricas de performance\n\n")
        
        f.write("---\n")
        f.write("*Relatório gerado automaticamente pelo script de deployment*\n")
        
    print(f"✅ Relatório salvo em: {report_file}")
    return report_file

def main():
    """Função principal"""
    print("=" * 70)
    print("🚀 DEPLOYMENT COMPLETO - ROTEIRO DE DISPENSAÇÃO")
    print("=" * 70)
    print("\nEste script irá:")
    print("1. Limpar repositórios extras do GitHub")
    print("2. Fazer deploy completo no Render.com")
    print("3. Limpar serviços extras no Render")
    print("4. Gerar relatório de deployment\n")
    
    confirm = input("Deseja continuar? (s/N): ")
    if confirm.lower() != 's':
        print("\n❌ Operação cancelada pelo usuário")
        return
        
    # Instalar dependências
    install_requirements()
    
    # Executar limpeza GitHub
    github_success = False
    github_choice = input("\n🧹 Executar limpeza do GitHub? (s/N): ")
    if github_choice.lower() == 's':
        github_success = run_github_cleanup()
    else:
        print("⏭️ Pulando limpeza do GitHub")
        
    # Executar deploy Render
    render_success = False
    render_choice = input("\n🚀 Executar deploy no Render? (s/N): ")
    if render_choice.lower() == 's':
        render_success = run_render_deploy()
    else:
        print("⏭️ Pulando deploy no Render")
        
    # Criar relatório
    report = create_deployment_report()
    
    # Resumo final
    print_header("RESUMO FINAL")
    
    if github_choice.lower() == 's':
        status = "✅ Sucesso" if github_success else "❌ Falhou"
        print(f"Limpeza GitHub: {status}")
        
    if render_choice.lower() == 's':
        status = "✅ Sucesso" if render_success else "❌ Falhou"
        print(f"Deploy Render: {status}")
        
    print(f"\n📄 Relatório: {report}")
    print("\n✅ Processo concluído!")
    
    # Instruções finais
    print("\n" + "=" * 70)
    print("📋 PRÓXIMOS PASSOS:")
    print("1. Verifique o relatório de deployment")
    print("2. Acesse https://roteiro-dispensacao.onrender.com")
    print("3. Teste os endpoints principais")
    print("4. Monitore os logs no dashboard do Render")
    print("=" * 70)

if __name__ == "__main__":
    main()