# Test Deploy

Teste para verificar se os workflows estão funcionando após correção das configurações GitHub Variables.

Timestamp: 2025-09-15 14:40:00 UTC
Updated: 2025-09-15 14:56:00 UTC

## Correções Aplicadas

1. ✅ Configuradas GitHub Variables para NEXT_PUBLIC_*
2. ✅ Validada sintaxe YAML dos workflows
3. ✅ Removidos workflows obsoletos do repositório remoto
4. ✅ Corrigidos triggers para evitar execução múltipla
5. ✅ Testando deploy automático via push

## Expected Behavior

Apenas o workflow staging-deploy.yml deve ser disparado ao fazer push na branch hml.
O workflow production-deploy.yml deve rodar apenas na branch main.