import { useChat } from './useChat'
import { usePersona } from './usePersona'

/**
 * Hook que combina useChat com usePersona de forma segura
 * Serve como wrapper para facilitar o uso nos componentes
 */
export const usePersonaWithChat = () => {
  const { selectedPersona, setSelectedPersona, personas } = useChat()
  
  const personaHook = usePersona({
    selectedPersona,
    personas,
    onPersonaChange: setSelectedPersona
  })
  
  return {
    ...personaHook,
    // Re-exportar dados do chat para conveniência
    personas,
    selectedPersona
  }
}

export default usePersonaWithChat