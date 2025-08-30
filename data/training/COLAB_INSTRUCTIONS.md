# [START] Instruções para Fine-tuning no Google Colab

## [LIST] Pré-requisitos

1. **Conta Google** com Google Drive
2. **Google Colab** (gratuito ou Pro)
3. **GPU ativada** no Colab (Runtime > Change runtime type > GPU)

## 📦 1. Upload dos Dados

### Opção A: Upload Manual
1. Abra o Google Drive
2. Crie uma pasta: `Site roteiro de dispensação`
3. Faça upload de toda a pasta `colab_training_data`
4. Estrutura final no Drive:
```
Site roteiro de dispensação/
├── colab_training_data/
│   ├── structured_data/         # JSONs originais
│   ├── training_splits/         # Train/validation/test
│   ├── config/                  # Configurações
│   ├── training_data.json       # Dataset unificado
│   └── COLAB_INSTRUCTIONS.md    # Este arquivo
├── hanseniase_fine_tuning.ipynb # Notebook principal
└── ... (outros arquivos)
```

### Opção B: Compressão e Upload
```bash
# Comprimir dados (execute localmente)
cd "C:\Users\Ana\Meu Drive\Site roteiro de dispensação"
zip -r hanseniase_training_data.zip colab_training_data/
```

## [FIX] 2. Configuração do Colab

### 2.1 Abrir Notebook
1. Vá para [Google Colab](https://colab.research.google.com/)
2. File > Upload notebook
3. Selecione `hanseniase_fine_tuning.ipynb`
4. Ou use o link direto no notebook

### 2.2 Verificar GPU
```python
import torch
print(f"GPU disponível: {torch.cuda.is_available()}")
print(f"GPU nome: {torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'N/A'}")
```

### 2.3 Montar Google Drive
```python
from google.colab import drive
drive.mount('/content/drive')
```

## [REPORT] 3. Estrutura dos Dados

### 3.1 Dataset Principal (`training_data.json`)
```json
{
  "training_examples": [
    {
      "instruction": "Como Dr. Gasnelio, responda tecnicamente:",
      "input": "O que é PQT-U?",
      "output": "PQT-U (Poliquimioterapia Única)...",
      "source": "frequently_asked_questions.json",
      "category": "qa",
      "persona_target": "dr_gasnelio",
      "subcategory": "medicamentos"
    }
  ],
  "statistics": {...},
  "splits": {...}
}
```

### 3.2 Training Splits
- `train.json`: 57 exemplos para treinamento
- `validation.json`: 7 exemplos para validação  
- `test.json`: 8 exemplos para teste

### 3.3 Structured Data (JSONs originais)
- `clinical_taxonomy.json`: Taxonomia médica
- `dosing_protocols.json`: Protocolos de dosagem
- `frequently_asked_questions.json`: FAQ com personas
- `medications_mechanisms.json`: Mecanismos farmacológicos
- E outros...

## ⚙️ 4. Configurações de Treinamento

### 4.1 Modelo Base
```python
MODEL_NAME = "microsoft/BiomedNLP-PubMedBERT-base-uncased-abstract-fulltext"
```

**Alternativas disponíveis:**
- `microsoft/DialoGPT-medium` (conversacional)
- `neuralmind/bert-base-portuguese-cased` (português)
- `google/flan-t5-base` (instruction-following)

### 4.2 Configuração LoRA
```python
lora_config = LoraConfig(
    r=16,                    # Rank (ajustar conforme GPU)
    lora_alpha=32,          # Scaling factor
    lora_dropout=0.1,       # Regularização
    target_modules=[...]    # Camadas a treinar
)
```

### 4.3 Training Arguments
```python
training_args = TrainingArguments(
    num_train_epochs=3,
    per_device_train_batch_size=2,  # Ajustar conforme GPU
    learning_rate=2e-4,
    gradient_accumulation_steps=4,  # Simular batch maior
    # ... outras configurações
)
```

## [TARGET] 5. Personas e Formatação

### 5.1 Dr. Gasnelio (Técnico)
```
### Instrução:
Como Dr. Gasnelio, responda tecnicamente:

### Pergunta:
Qual o mecanismo de ação da rifampicina?

### Resposta:
[Resposta técnica com terminologia médica]
```

### 5.2 Gá (Empático)
```
### Instrução:
Como Gá, responda de forma simples e empática:

### Pergunta:
Por que minha urina ficou laranja?

### Resposta:
[Resposta simples e tranquilizadora]
```

## 📈 6. Monitoramento

### 6.1 Métricas Principais
- **Loss de Treinamento**: Deve diminuir consistentemente
- **Loss de Validação**: Não deve aumentar (overfitting)
- **Perplexity**: < 3.0 é desejável
- **GPU Memory**: Monitorar para evitar OOM

### 6.2 Logs Esperados
```
Epoch 1/3:
[10/20] Loss: 2.45, LR: 1.8e-4
[20/20] Loss: 1.95, LR: 2.0e-4
Validation Loss: 1.87
```

## [FIX] 7. Troubleshooting

### 7.1 Out of Memory (OOM)
**Sintomas:** `CUDA out of memory`
**Soluções:**
```python
# Reduzir batch size
per_device_train_batch_size=1

# Reduzir max_length
max_length=256

# Ativar gradient checkpointing
gradient_checkpointing=True

# Usar quantização mais agressiva
load_in_8bit=True
```

### 7.2 Treinamento Lento
**Sintomas:** >5 min por época
**Soluções:**
- Verificar se GPU está ativada
- Reduzir número de exemplos de treino
- Aumentar batch size se possível
- Usar modelo menor

### 7.3 Loss não Diminui
**Sintomas:** Loss constante após várias épocas
**Soluções:**
```python
# Aumentar learning rate
learning_rate=5e-4

# Reduzir weight decay
weight_decay=0.0001

# Verificar formatação dos dados
# Adicionar mais exemplos de treino
```

### 7.4 Respostas Incoerentes
**Sintomas:** Modelo gera texto irrelevante
**Soluções:**
- Verificar formatação do prompt
- Ajustar temperature (0.3-0.8)
- Treinar por mais épocas
- Validar qualidade dos dados

## [SAVE] 8. Export e Deploy

### 8.1 Salvar Modelo
```python
# Merge LoRA weights
merged_model = model.merge_and_unload()

# Salvar no Drive
merged_model.save_pretrained("/content/drive/MyDrive/hanseniase_model")
tokenizer.save_pretrained("/content/drive/MyDrive/hanseniase_model")
```

### 8.2 Download Local
1. Compacte o modelo treinado
2. Download via Google Drive
3. Integre no backend Python

## [REPORT] 9. Avaliação de Qualidade

### 9.1 Testes Manuais
```python
# Teste Dr. Gasnelio
prompt = "Como Dr. Gasnelio, responda tecnicamente: O que é rifampicina?"
response = generate_text(prompt)

# Teste Gá  
prompt = "Como Gá, responda de forma simples: Por que tomo 3 remédios?"
response = generate_text(prompt)
```

### 9.2 Métricas Automáticas
- **BLEU Score**: Similaridade com respostas de referência
- **ROUGE**: Overlap de n-gramas
- **BERTScore**: Similaridade semântica

### 9.3 Critérios de Sucesso
[OK] **Aceitável:**
- Loss de validação < 2.0
- Respostas coerentes em 80% dos testes
- Mantém persona característica

[STAR] **Excelente:**
- Loss de validação < 1.5
- Respostas coerentes em 95% dos testes
- Informações médicas precisas

## [TARGET] 10. Próximos Passos

1. **Executar notebook completo** (2-4 horas)
2. **Avaliar qualidade** das respostas
3. **Ajustar hiperparâmetros** se necessário
4. **Retreinar** com mais dados se disponível
5. **Integrar** no backend de produção
6. **Coletar feedback** dos usuários
7. **Iterar** e melhorar continuamente

## 📞 Suporte

- **Documentação Colab:** https://colab.research.google.com/
- **Transformers:** https://huggingface.co/docs/transformers/
- **PEFT:** https://huggingface.co/docs/peft/
- **Troubleshooting:** Verificar logs no notebook

---

**🏥 Boa sorte com o fine-tuning especializado em hanseníase! 🏥**

*Gerado em: 2025-08-17*  
*Versão: Q2-2025-ML-MODERNIZATION*