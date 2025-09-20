# Chat Unificado - Guia de Migração

## Visão Geral

O sistema de chat foi unificado para suportar tanto funcionalidades básicas quanto multimodais em um único componente: `ModernChatInput`.

## Migração do MultimodalChatInput

### Antes (DEPRECADO)
```tsx
import MultimodalChatInput from '@/components/chat/MultimodalChatInput';

<MultimodalChatInput
  onSendMessage={handleSendMessage}
  onImageAnalysis={handleImageAnalysis}
  disabled={false}
  placeholder="Digite sua mensagem..."
/>
```

### Depois (RECOMENDADO)
```tsx
import ModernChatInput from '@/components/chat/modern/ModernChatInput';

<ModernChatInput
  value={inputValue}
  onChange={setInputValue}
  onSubmit={handleSubmit}
  persona={selectedPersona}
  personaId={personaId}
  isLoading={isLoading}
  isMobile={isMobile}
  // NOVA FUNCIONALIDADE MULTIMODAL
  multimodal={true}
  onSendMessage={handleSendMessage}
  onImageAnalysis={handleImageAnalysis}
/>
```

## Funcionalidades Unificadas

### Chat Básico
- ✅ Input de texto com suporte a personas
- ✅ Sugestões contextuais
- ✅ Histórico de conversas
- ✅ Indicadores de carregamento
- ✅ Responsividade mobile

### Chat Multimodal (Novo)
- 🆕 Upload e análise de imagens médicas
- 🆕 Anexos com preview
- 🆕 Análise automática de texto em imagens
- 🆕 Indicadores médicos extraídos
- 🆕 Sugestões baseadas em análise de imagem

## Tipos Centralizados

### ChatAttachment (Unificado)
```typescript
import type { ChatAttachment } from '@/types/chat';

interface ChatAttachment {
  id: string;
  type: 'image' | 'file' | 'image_analysis';
  name: string;
  url?: string;
  // Propriedades específicas para análise de imagem
  confidence?: number;
  extracted_text?: string;
  result?: AnalysisResult;
}
```

## Componentes Auxiliares

### Exibição de Anexos
```tsx
import { ChatMessageAttachment } from '@/types/chat';

// Dentro do seu componente de mensagem
{message.attachments?.map(attachment => (
  <ChatMessageAttachment 
    key={attachment.id} 
    attachment={attachment} 
  />
))}
```

## Arquivos Obsoletos (Planejados para Remoção)

- ❌ `MultimodalChatInput.tsx` - Use `ModernChatInput` com `multimodal={true}`
- ❌ Interfaces duplicadas de `ChatAttachment` - Use `@/types/chat`

## Benefícios da Unificação

1. **Menos Duplicação**: Uma única interface para todos os tipos de chat
2. **Manutenção Simplificada**: Correções e melhorias em um só lugar  
3. **UX Consistente**: Comportamento uniforme em toda aplicação
4. **Funcionalidades Expandidas**: Recursos multimodais disponíveis em qualquer chat
5. **Melhor Performance**: Componentes otimizados e código compartilhado

## Próximos Passos

1. Migrar todos os usos de `MultimodalChatInput` para `ModernChatInput`
2. Atualizar imports de tipos para usar `@/types/chat`
3. Testar funcionalidades multimodais no chat principal
4. Remover arquivos obsoletos após validação completa