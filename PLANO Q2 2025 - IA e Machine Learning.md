Informações do Ambiente:
•	Caminho Base: C:\Users\Ana\Meu Drive\Site roteiro de dispensação\
•	Infraestrutura Atual: Google Cloud Run + Firebase
•	Astra DB: Já configurado no GitHub Secrets
•	Estrutura de Pastas: 
o	/data - Contém JSONs estruturados e documentos MD/PDF
o	/apps/backend/services - Serviços do backend incluindo RAG
o	/apps/backend/core/personas - Definições das personas
o	/apps/backend/core/rag - Sistema RAG atual
o	/apps/backend/config - Configurações e prompts
📊 FASE 1: SYSTEM AUDIT COMPLETO
Tarefa 1.1: Análise do Estado Atual
Crie e execute um script de auditoria completo que:
python
"""
Requirements:
1. Analise TODOS os arquivos nas pastas mencionadas
2. Crie um relatório detalhado do que existe
3. Identifique gaps e oportunidades
4. Verifique a qualidade dos dados
5. Teste a performance atual do RAG
"""

# system_audit.py
import os
import json
import time
import hashlib
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Tuple
import pandas as pd

BASE_PATH = r"C:\Users\Ana\Meu Drive\Site roteiro de dispensação"

def execute_complete_audit():
    """
    Execute as seguintes verificações:
    
    1. DATA AUDIT:
       - Listar todos os JSONs em /data/structured/
       - Para cada JSON:
         * Contar número de entradas
         * Verificar completude dos campos
         * Identificar campos únicos
         * Calcular tamanho em tokens
       - Arquivos específicos para verificar:
         * clinical_taxonomy.json
         * dispensing_workflow.json
         * dosing_protocols.json
         * frequently_asked_questions.json
         * hanseniase_catalog.json
         * knowledge_scope_limitations.json
         * medications_mechanisms.json
         * pharmacovigilance_guidelines.json
         * quick_reference_protocols.json
    
    2. DOCUMENTS AUDIT:
       - Verificar existência e tamanho de:
         * Roteiro de Dsipensação - Hanseníase.md
         * Roteiro de Dsipensação - Hanseníase.pdf
         * roteiro_hanseniase_basico.md
       - Contar páginas/linhas
       - Extrair estrutura de tópicos
    
    3. BACKEND SERVICES AUDIT:
       - Analisar cada arquivo .py em /apps/backend/services/
       - Identificar:
         * Classes e métodos principais
         * Dependências importadas
         * Integrações com APIs externas
         * Uso de cache
       - Arquivos críticos:
         * enhanced_rag_system.py
         * medical_rag_integration.py
         * vector_store.py
         * embedding_service.py
         * semantic_search.py
    
    4. PERSONAS AUDIT:
       - Verificar /apps/backend/core/personas/:
         * dr_gasnelio.py
         * ga_empathetic.py
         * persona_manager.py
       - Extrair prompts e características
    
    5. CONFIG AUDIT:
       - Analisar /apps/backend/config/:
         * dr_gasnelio_technical_prompt.py
         * ga_empathetic_prompt.py
         * thesis_reference_system.py
       - Verificar variáveis de ambiente necessárias
    
    6. PERFORMANCE BASELINE:
       - Simular 10 queries comuns
       - Medir latência média
       - Verificar taxa de erro
       - Testar ambas as personas
    
    Gere um relatório em formato JSON e Markdown com:
    - Resumo executivo
    - Inventário completo de arquivos
    - Métricas de qualidade dos dados
    - Gaps identificados
    - Recomendações prioritárias
    """
    
    # Implemente o código completo aqui
    pass

# Execute e salve o relatório
if __name__ == "__main__":
    audit_report = execute_complete_audit()
    
    # Salvar relatórios
    with open('audit_report.json', 'w', encoding='utf-8') as f:
        json.dump(audit_report, f, indent=2, ensure_ascii=False)
    
    with open('audit_report.md', 'w', encoding='utf-8') as f:
        f.write(generate_markdown_report(audit_report))
Tarefa 1.2: Análise de Qualidade dos Dados
python
"""
Analise a qualidade dos dados para fine-tuning:

1. Para cada arquivo JSON em /data/structured/:
   - Valide schema
   - Identifique dados faltantes
   - Calcule estatísticas (min, max, média de campos)
   - Verifique duplicatas
   - Identifique inconsistências

2. Crie um dataset unificado:
   - Combine todos os JSONs relevantes
   - Normalize formato
   - Adicione metadados (source, category, persona_target)
   - Exporte como training_data.json

3. Gere métricas:
   - Total de exemplos únicos
   - Distribuição por categoria
   - Cobertura de tópicos
   - Qualidade para fine-tuning (score 0-100)
"""
📚 FASE 2: PREPARAÇÃO AMBIENTE COLAB
Tarefa 2.1: Criar Notebook Colab Completo
python
"""
Crie um notebook Colab (hanseniase_fine_tuning.ipynb) com:

1. SETUP INICIAL:
   - Montagem do Google Drive
   - Instalação de dependências
   - Verificação de GPU disponível
   - Clone do repositório

2. CÉLULAS DO NOTEBOOK:
"""

# Célula 1: Setup Environment
!pip install transformers==4.36.0
!pip install peft==0.7.0
!pip install bitsandbytes==0.41.0
!pip install datasets accelerate
!pip install sentencepiece protobuf

# Verificar GPU
import torch
print(f"GPU disponível: {torch.cuda.is_available()}")
print(f"GPU Nome: {torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'N/A'}")

# Célula 2: Mount Drive e Load Data
from google.colab import drive
drive.mount('/content/drive')

import sys
sys.path.append('/content/drive/MyDrive/Site roteiro de dispensação')

# Célula 3: Data Preparation
"""
Implemente:
1. Carregamento dos JSONs estruturados
2. Conversão para formato de training (instruction, input, output)
3. Criação de exemplos para cada persona
4. Data augmentation com paráfrase
5. Split train/val/test (80/10/10)
"""

# Célula 4: Model Configuration
"""
Configure:
1. Modelo base: 'microsoft/BiomedNLP-PubMedBERT-base-uncased-abstract-fulltext'
2. LoRA configuration (r=16, alpha=32)
3. Training arguments otimizados para Colab free
4. Implementação de checkpointing
"""

# Célula 5: Training Loop
"""
Implemente:
1. Training com progress bar
2. Validation a cada época
3. Early stopping
4. Salvamento de checkpoints
5. Logging de métricas
"""

# Célula 6: Evaluation
"""
Crie testes específicos:
1. Perguntas técnicas para Dr. Gasnelio
2. Perguntas simples para Gá
3. Cálculo de métricas (accuracy, perplexity, BLEU)
4. Comparação com baseline
"""

# Célula 7: Export and Deploy
"""
1. Merge LoRA weights
2. Quantização para int8
3. Export para ONNX (opcional)
4. Upload para Google Drive
5. Instruções de integração
"""
Tarefa 2.2: Preparar Dados para Upload
python
"""
Crie um script que prepare todos os dados necessários para o Colab:

1. Crie pasta organizada:
   /colab_training_data/
   ├── structured_data/
   │   └── [todos os JSONs]
   ├── documents/
   │   └── [MD e PDF files]
   ├── personas/
   │   └── [prompts de cada persona]
   └── config/
       └── training_config.json

2. Comprima em training_data.zip

3. Gere instruções de upload para Colab
"""
🚀 FASE 3: MIGRAÇÃO ASTRA DB
Tarefa 3.1: Setup Astra DB Connection
python
"""
Usando as credenciais já configuradas no GitHub Secrets:

1. Crie o script de conexão:
   - Teste conexão com Astra DB
   - Crie keyspace 'hanseniase_rag' se não existir
   - Crie tabela 'embeddings' com schema otimizado
   - Configure índices para busca vetorial

2. Valide a conexão:
   - Execute query de teste
   - Verifique latência
   - Teste inserção e busca

IMPORTANTE: verifique as secrets do GitHub e faça a equivalência com essas abaixo:
- ASTRA_DB_ID
- ASTRA_DB_REGION  
- ASTRA_DB_TOKEN
- ASTRA_DB_KEYSPACE
"""

# astra_setup.py
import os
from cassandra.cluster import Cluster
from cassandra.auth import PlainTextAuthProvider

def setup_astra_connection():
    # Implementar conexão segura
    pass

def create_vector_table():
    """
    CREATE TABLE IF NOT EXISTS embeddings (
        id UUID PRIMARY KEY,
        content TEXT,
        embedding vector<float, 768>,
        metadata MAP<TEXT, TEXT>,
        persona TEXT,
        category TEXT,
        source TEXT,
        chunk_index INT,
        created_at TIMESTAMP,
        updated_at TIMESTAMP
    )
    """
    pass
Tarefa 3.2: Migração de Dados
python
"""
Migre os dados existentes do vector_store.py atual:

1. Extraia todos os embeddings do sistema atual
2. Converta para formato Astra DB
3. Faça upload em batches de 100
4. Valide integridade após migração
5. Crie backup antes de migrar
"""

# migrate_to_astra.py
def migrate_embeddings():
    """
    1. Backup current data
    2. Load from vector_store.py
    3. Transform to Astra format
    4. Batch upload
    5. Verify migration
    """
    pass
🤖 FASE 4: IMPLEMENTAÇÃO DE FEATURES
Tarefa 4.1: Sistema de Análise Preditiva
python
"""
Implemente o sistema de sugestões preditivas:

1. Crie regras baseadas em contexto
2. Implemente cache de sugestões
3. Adicione tracking de cliques
4. Integre com o frontend existente
"""

# predictive_system.py
class PredictiveEngine:
    def __init__(self):
        self.rules = self.load_context_rules()
        self.cache = {}
    
    def get_suggestions(self, context):
        # Implementar lógica
        pass
Tarefa 4.2: Chatbot Multimodal
python
"""
Adicione suporte para imagens:

1. OCR para documentos médicos
2. Análise básica de imagens
3. Sistema de auto-deletion após 7 dias
4. Disclaimers apropriados
"""

# multimodal_handler.py
class MultimodalProcessor:
    def process_image(self, image_path):
        # OCR + Analysis + Safety
        pass
📊 FASE 5: TESTES E VALIDAÇÃO
Tarefa 5.1: Suite de Testes Automatizados
python
"""
Crie testes para todas as funcionalidades. Importante, já existe uma suíte de teste robusta no código:

1. Testes de unidade para cada componente
2. Testes de integração
3. Testes de performance
4. Testes de segurança
5. Testes de usabilidade

Use pytest e gere relatório de cobertura.
"""

# test_suite.py
import pytest

class TestCompleteSystem:
    def test_astra_connection(self):
        pass
    
    def test_rag_performance(self):
        pass
    
    def test_fine_tuned_model(self):
        pass
    
    def test_multimodal_processing(self):
        pass
📈 FASE 6: DOCUMENTAÇÃO E DEPLOY
Tarefa 6.1: Documentação Completa
python
"""
Gere documentação:

1. README.md atualizado
2. API documentation
3. Guia de troubleshooting
4. Métricas de performance
5. Changelog
"""
Tarefa 6.2: Deploy para Produção
python
"""
Execute o commit e git push para o deploy automatizado:

1. Update Google Cloud Run
2. Configure monitoring
3. Setup alertas
4. Validação em produção
"""
🎯 INSTRUÇÕES DE EXECUÇÃO
IMPORTANTE: Execute as tarefas NA ORDEM apresentada. Cada fase depende da anterior.
Ordem de Execução:
1.	HOJE (Dia 1): 
o	Execute System Audit completo (Tarefa 1.1 e 1.2)
o	Prepare ambiente Colab (Tarefa 2.1 e 2.2)
o	Teste conexão Astra DB (Tarefa 3.1)
2.	Dia 2-3: 
o	Complete migração Astra DB (Tarefa 3.2)
o	Inicie fine-tuning no Colab
3.	Dia 4-5: 
o	Implemente análise preditiva (Tarefa 4.1)
o	Adicione suporte multimodal (Tarefa 4.2)
4.	Dia 6-7: 
o	Execute todos os testes (Tarefa 5.1)
o	Prepare documentação (Tarefa 6.1)
o	Deploy para produção (Tarefa 6.2)
Critérios de Sucesso:
•	Audit report completo gerado
•	Dados migrados para Astra DB
•	Modelo fine-tuned com accuracy >90%
•	Sugestões preditivas funcionando
•	OCR de documentos operacional
•	Todos os testes passando
•	Documentação completa
•	Sistema em produção
Outputs Esperados:
1.	audit_report.json e audit_report.md
2.	hanseniase_fine_tuning.ipynb (Colab notebook)
3.	training_data.zip (para Colab)
4.	migration_log.json (Astra DB)
5.	test_report.html (pytest coverage)
6.	deployment_checklist.md
Handling de Erros:
Para CADA operação:
1.	Implemente try-catch apropriado
2.	Faça log detalhado de erros
3.	Crie fallback quando possível
4.	Sempre faça backup antes de mudanças destrutivas
# Astra DB (já no GitHub Secrets)
# Google Cloud (já no GitHub Secrets)
# FIREBASE (já no GitHub Secrets)
# OpenAI/API Keys (já no GitHub Secrets)
🚨 NOTAS CRÍTICAS
1.	SEMPRE faça backup antes de qualquer migração
2.	TESTE localmente antes de aplicar em produção
3.	DOCUMENTE todas as mudanças realizadas
4.	VALIDE com dados médicos reais
5.	MANTENHA os disclaimers médicos em TODAS as features
✅ CHECKLIST FINAL
Antes de considerar completo, verifique:
•	Todos os arquivos de auditoria foram gerados
•	Colab notebook está funcional e testado
•	Astra DB está recebendo e retornando queries
•	Fine-tuned model tem performance superior ao baseline
•	Features novas estão integradas ao sistema existente
•	Testes cobrem >95% do código
•	Documentação está completa e atualizada
•	Sistema está rodando em produção sem erros