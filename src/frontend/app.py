import streamlit as st
import sys
from pathlib import Path
import os
from datetime import datetime
import json

# Adicionar o diretório raiz ao path
root_dir = Path(__file__).parent.parent.parent
sys.path.append(str(root_dir))

# Imports dos serviços backend
from src.backend.services.personas import get_personas, get_persona_prompt
from src.backend.services.chatbot import ChatbotService

# Configuração da página
st.set_page_config(
    page_title="Roteiro de Dispensação - Chatbot",
    page_icon="💊",
    layout="wide",
    initial_sidebar_state="expanded"
)

# CSS customizado para design moderno
st.markdown("""
<style>
    /* Estilo geral */
    .stApp {
        background-color: #f0f2f6;
    }
    
    /* Cards de personas */
    .persona-card {
        background: white;
        border-radius: 15px;
        padding: 20px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        transition: all 0.3s ease;
        cursor: pointer;
        margin: 10px 0;
    }
    
    .persona-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 5px 20px rgba(0,0,0,0.15);
    }
    
    .persona-avatar {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        margin-bottom: 10px;
    }
    
    /* Chat container */
    .chat-container {
        background: white;
        border-radius: 15px;
        padding: 20px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    
    /* Mensagens */
    .stChatMessage {
        background: #f8f9fa;
        border-radius: 10px;
        margin: 10px 0;
    }
    
    /* Sidebar */
    .sidebar-info {
        background: white;
        border-radius: 10px;
        padding: 15px;
        margin: 10px 0;
    }
    
    /* Título principal */
    .main-title {
        text-align: center;
        color: #1e3d59;
        margin-bottom: 30px;
    }
</style>
""", unsafe_allow_html=True)

# Inicializar serviço de chatbot
@st.cache_resource
def init_chatbot():
    knowledge_base_path = root_dir / "data" / "knowledge_base"
    return ChatbotService(str(knowledge_base_path))

chatbot_service = init_chatbot()

# Inicializar estado da sessão
if "messages" not in st.session_state:
    st.session_state.messages = []
if "selected_persona" not in st.session_state:
    st.session_state.selected_persona = None
if "persona_greeted" not in st.session_state:
    st.session_state.persona_greeted = False

# Sidebar
with st.sidebar:
    st.markdown("## 💊 Roteiro de Dispensação")
    
    st.markdown("""
    <div class="sidebar-info">
        <h4>📚 Sobre o Projeto</h4>
        <p>Sistema de chatbot inteligente para auxiliar farmacêuticos no processo de dispensação de medicamentos.</p>
    </div>
    """, unsafe_allow_html=True)
    
    st.markdown("""
    <div class="sidebar-info">
        <h4>⚙️ Funcionalidades</h4>
        <ul>
            <li>✅ Assistentes virtuais especializados</li>
            <li>✅ Base de conhecimento integrada</li>
            <li>✅ Respostas contextualizadas</li>
            <li>✅ Interface amigável</li>
        </ul>
    </div>
    """, unsafe_allow_html=True)
    
    st.markdown("""
    <div class="sidebar-info">
        <h4>🔗 Links Úteis</h4>
        <ul>
            <li><a href="#">📖 Documentação</a></li>
            <li><a href="#">💬 Suporte</a></li>
            <li><a href="#">🌐 Website</a></li>
        </ul>
    </div>
    """, unsafe_allow_html=True)
    
    # Botão para resetar conversa
    if st.button("🔄 Nova Conversa", use_container_width=True):
        st.session_state.messages = []
        st.session_state.selected_persona = None
        st.session_state.persona_greeted = False
        st.rerun()
    
    # Informações da sessão
    if st.session_state.selected_persona:
        personas = get_personas()
        persona = personas[st.session_state.selected_persona]
        st.markdown(f"""
        <div class="sidebar-info">
            <h4>👤 Assistente Atual</h4>
            <p><strong>{persona['name']}</strong></p>
            <p style="font-size: 0.9em; color: #666;">{persona['description']}</p>
        </div>
        """, unsafe_allow_html=True)

# Conteúdo principal
st.markdown('<h1 class="main-title">🤖 Assistente Virtual de Dispensação</h1>', unsafe_allow_html=True)

# Se nenhuma persona foi selecionada, mostrar seleção
if st.session_state.selected_persona is None:
    st.markdown("### 👥 Escolha seu assistente:")
    
    personas = get_personas()
    cols = st.columns(len(personas))
    
    for idx, (persona_id, persona) in enumerate(personas.items()):
        with cols[idx]:
            # Card da persona
            st.markdown(f"""
            <div class="persona-card">
                <center>
                    <img src="{persona['avatar']}" class="persona-avatar">
                    <h3>{persona['name']}</h3>
                    <p style="color: #666; font-size: 0.9em;">{persona['description']}</p>
                </center>
            </div>
            """, unsafe_allow_html=True)
            
            if st.button(f"Conversar com {persona['name']}", key=f"select_{persona_id}", use_container_width=True):
                st.session_state.selected_persona = persona_id
                st.session_state.persona_greeted = False
                st.rerun()

# Se uma persona foi selecionada, mostrar chat
else:
    personas = get_personas()
    current_persona = personas[st.session_state.selected_persona]
    
    # Header com informações da persona
    col1, col2, col3 = st.columns([1, 3, 1])
    with col2:
        st.markdown(f"""
        <center>
            <img src="{current_persona['avatar']}" style="width: 60px; height: 60px; border-radius: 50%;">
            <h3>{current_persona['name']}</h3>
        </center>
        """, unsafe_allow_html=True)
    
    # Container do chat
    st.markdown('<div class="chat-container">', unsafe_allow_html=True)
    
    # Adicionar saudação inicial se ainda não foi feita
    if not st.session_state.persona_greeted:
        st.session_state.messages.append({
            "role": "assistant",
            "content": current_persona['greeting'],
            "avatar": current_persona['avatar']
        })
        st.session_state.persona_greeted = True
    
    # Exibir histórico de mensagens
    for message in st.session_state.messages:
        if message["role"] == "user":
            with st.chat_message("user"):
                st.markdown(message["content"])
        else:
            with st.chat_message("assistant", avatar=message.get("avatar")):
                st.markdown(message["content"])
    
    # Input do usuário
    if prompt := st.chat_input("Digite sua mensagem..."):
        # Adicionar mensagem do usuário
        st.session_state.messages.append({
            "role": "user",
            "content": prompt
        })
        
        # Exibir mensagem do usuário
        with st.chat_message("user"):
            st.markdown(prompt)
        
        # Processar resposta do chatbot
        with st.chat_message("assistant", avatar=current_persona['avatar']):
            with st.spinner("Pensando..."):
                response = chatbot_service.process_message(
                    message=prompt,
                    persona_id=st.session_state.selected_persona
                )
                
                # Exibir resposta
                st.markdown(response["response"])
                
                # Adicionar resposta ao histórico
                st.session_state.messages.append({
                    "role": "assistant",
                    "content": response["response"],
                    "avatar": current_persona['avatar']
                })
                
                # Mostrar contexto usado (se houver)
                if response.get("context_used"):
                    with st.expander("📚 Fontes consultadas"):
                        for ctx in response["context_used"]:
                            st.markdown(f"- **{ctx['file']}** (similaridade: {ctx['similarity']:.2f})")
                
                # Indicador se API foi usada
                if not response.get("api_used", True):
                    st.caption("⚠️ Resposta gerada localmente (API indisponível)")
    
    st.markdown('</div>', unsafe_allow_html=True)

# Footer
st.markdown("---")
st.markdown(
    """
    <center>
        <p style="color: #666; font-size: 0.9em;">
            💊 Roteiro de Dispensação © 2025 | Desenvolvido com ❤️ para farmacêuticos
        </p>
    </center>
    """,
    unsafe_allow_html=True
)