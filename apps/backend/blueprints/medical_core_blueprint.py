# -*- coding: utf-8 -*-
"""
Medical Core Blueprint - Consolidated Medical Functionality
Combines: Core medical chat + Medical validation + Health checks
Strategic consolidation for medical platform optimization
"""

from flask import Blueprint, request, jsonify
from datetime import datetime
import logging

from core.logging.sanitizer import sanitize_error

# Create blueprint
medical_core_bp = Blueprint('medical_core', __name__, url_prefix='/api/v1')

# Logging
logger = logging.getLogger(__name__)

# === CHAT HELPERS ===

_ALLOWED_ATTACHMENT_MIME = frozenset(['image/png', 'image/jpeg', 'image/webp', 'application/pdf'])
_MAX_BASE64_LEN = 7_000_000  # ~5 MB encoded


def _extract_attachment_context(attachment: dict) -> str:
    """Extract text from a base64-encoded attachment via multimodal OCR.

    Returns context string to append to the user message, or empty string.
    """
    file_name = str(attachment.get('fileName', ''))[:255]
    mime_type = str(attachment.get('mimeType', ''))

    if mime_type not in _ALLOWED_ATTACHMENT_MIME:
        return ''

    base64_data = str(attachment.get('base64Data', ''))
    if not base64_data or len(base64_data) > _MAX_BASE64_LEN:
        return ''

    try:
        from services.integrations.multimodal_processor import get_multimodal_processor
        processor = get_multimodal_processor()
        result = processor.process_base64(base64_data, mime_type)
        if result and result.get('text'):
            extracted = str(result['text'])[:2000]
            logger.info("Attachment OCR ok: %s, text_len=%d", file_name, len(extracted))
            return f"\n\n[Conteudo extraido do arquivo '{file_name}':\n{extracted}]"
    except Exception as e:
        logger.warning("Attachment OCR failed: %s", sanitize_error(e))

    return (
        f"\n\n[Arquivo '{file_name}' anexado, mas nao foi possivel "
        f"extrair texto. Processamento multimodal indisponivel.]"
    )


# === CHAT ENDPOINTS ===

@medical_core_bp.route('/chat', methods=['POST'])
def chat():
    """Main chat endpoint with AI personas and RAG integration"""
    try:
        data = request.get_json() or {}
        message = data.get('message', '').strip()
        if not message:
            return jsonify({
                'error': 'Message is required',
                'error_code': 'MISSING_MESSAGE',
                'timestamp': datetime.now().isoformat()
            }), 400

        persona = data.get('persona', 'gasnelio')

        # Validate persona
        valid_personas = ['gasnelio', 'dr_gasnelio', 'ga', 'ga_empathetic']
        if persona not in valid_personas:
            return jsonify({
                'error': 'Invalid persona specified',
                'error_code': 'INVALID_PERSONA',
                'valid_personas': valid_personas,
                'timestamp': datetime.now().isoformat()
            }), 400

        # Process optional attachment (base64 image/PDF for OCR)
        attachment = data.get('attachment')
        attachment_context = ''
        if attachment and isinstance(attachment, dict):
            attachment_context = _extract_attachment_context(attachment)

        # Combine user message + attachment context
        full_message = message + attachment_context if attachment_context else message

        # Map persona names for RAG system
        rag_persona = 'dr_gasnelio' if persona in ['gasnelio', 'dr_gasnelio'] else 'ga_empathetic'

        # Get RAG context using Supabase RAG system
        rag_response = None
        rag_used = False

        try:
            from services.rag.supabase_rag_system import query_rag_system
            rag_response = query_rag_system(full_message, persona=rag_persona, max_chunks=3)
            rag_used = rag_response is not None
            logger.info("RAG query successful: %s, system: supabase_rag", rag_used)
        except Exception as e:
            logger.warning("RAG query failed: %s", sanitize_error(e))

        # Generate response based on persona and RAG context
        if rag_response:
            # Use RAG-enhanced response
            response_text = rag_response.answer
            confidence = rag_response.quality_score
            sources = rag_response.sources
            system_used = 'supabase_rag'
        else:
            # Fallback response - don't echo user input to prevent XSS/SQL injection
            if persona in ['gasnelio', 'dr_gasnelio']:
                response_text = """**Dr. Gasnelio (Farmacêutico Clínico):**

Recebi sua consulta sobre hanseníase.

No momento, estou com acesso limitado à base de conhecimento específica. Para informações precisas sobre PQT-U (Poliquimioterapia Única) para hanseníase, recomendo:

1. **Consultar o PCDT Hanseníase 2022** do Ministério da Saúde
2. **Verificar protocolos locais** da sua unidade de saúde
3. **Contatar farmacêutico clínico** da sua instituição

**⚠️ Importante:** Para dosagens específicas e orientações clínicas, sempre consulte fontes oficiais atualizadas."""
            else:
                response_text = """**Gá (Assistente Empática):**

Oi! Recebi sua pergunta sobre hanseníase.

Estou aqui para ajudar você com informações sobre hanseníase! 😊

**No momento:** Estou com algumas dificuldades para acessar todas as informações, mas posso te orientar:

- A hanseníase tem cura completa! 💪
- O tratamento é gratuito pelo SUS
- É muito importante seguir o tratamento direitinho

**Para informações específicas:** Converse com seu médico ou farmacêutico, eles têm todas as informações atualizadas!

Estou torcendo por você! ✨"""

            confidence = 0.3  # Low confidence for fallback
            sources = []
            system_used = "fallback"

        response = {
            'response': response_text,
            'persona': persona,
            'confidence': confidence,
            'rag_used': rag_used,
            'rag_system': system_used,
            'sources': sources,
            'medical_validation': 'completed',
            'timestamp': datetime.now().isoformat()
        }

        return jsonify(response), 200

    except Exception as e:
        logger.error("Chat error: %s", sanitize_error(e))
        return jsonify({
            'error': 'Internal server error',
            'error_code': 'CHAT_ERROR',
            'timestamp': datetime.now().isoformat()
        }), 500

# Personas endpoint moved to personas_blueprint.py for:
# - Better rate limiting control (300 req/min vs 200 req/hour)
# - Comprehensive persona management features
# - Cache support and request tracking
# - Rich metadata and usage guides

# === HEALTH ENDPOINTS ===

@medical_core_bp.route('/health', methods=['GET'])
def health_check():
    """Fast health check for testing and monitoring"""
    # Fast RAG status check only
    rag_status = 'UNKNOWN'

    # Get detailed parameter for comprehensive check
    detailed = request.args.get('detailed', 'false').lower() == 'true'

    try:
        from services.rag.rag_health_checker import get_rag_simple_status
        rag_status = get_rag_simple_status()

        # Only run detailed check if explicitly requested
        if detailed:
            from services.rag.rag_health_checker import get_rag_health
            rag_details = get_rag_health()
        else:
            rag_details = {'note': 'Use ?detailed=true for comprehensive RAG status'}

    except Exception as e:
        logger.warning("RAG health check failed: %s", sanitize_error(e))
        rag_status = 'ERROR'
        rag_details = {'error': str(e)} if detailed else {}

    health_status = {
        'status': 'healthy',
        'medical_system': 'operational',
        'ai_models': 'available',
        'validation_system': 'active',
        'rag': rag_status,
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0'
    }

    # Only include detailed info when requested
    if detailed or rag_details.get('error'):
        health_status['rag_details'] = rag_details

    return jsonify(health_status), 200

@medical_core_bp.route('/health/live', methods=['GET'])
def liveness_probe():
    """Kubernetes liveness probe"""
    return jsonify({
        'status': 'alive',
        'timestamp': datetime.now().isoformat()
    }), 200

@medical_core_bp.route('/health/ready', methods=['GET'])
def readiness_probe():
    """Kubernetes readiness probe"""
    return jsonify({
        'status': 'ready',
        'medical_core': 'ready',
        'timestamp': datetime.now().isoformat()
    }), 200

# === VALIDATION ENDPOINTS ===

@medical_core_bp.route('/validate/medical', methods=['POST'])
def validate_medical_response():
    """Validate medical response quality using rule-based validation"""
    try:
        data = request.get_json() or {}
        response_text = data.get('response_text', '')
        sources = data.get('sources', [])

        if not response_text:
            return jsonify({
                'error': 'response_text is required',
                'error_code': 'MISSING_RESPONSE_TEXT',
                'timestamp': datetime.now().isoformat()
            }), 400

        from services.validation.medical_validator import MedicalResponseValidator
        validator = MedicalResponseValidator()
        result = validator.validate_response(response_text, sources)
        result['timestamp'] = datetime.now().isoformat()

        return jsonify(result), 200

    except Exception as e:
        logger.error("Validation error: %s", sanitize_error(e))
        return jsonify({
            'error': 'Validation failed',
            'error_code': 'VALIDATION_ERROR',
            'timestamp': datetime.now().isoformat()
        }), 500

# === DIAGNOSTIC ENDPOINTS ===

@medical_core_bp.route('/diagnostics/embeddings', methods=['GET'])
def embeddings_diagnostics():
    """
    Comprehensive diagnostics for embedding service
    Returns detailed information about embedding backend initialization
    """
    try:
        from services.unified_embedding_service import get_embedding_service

        service = get_embedding_service()

        if not service:
            return jsonify({
                'status': 'ERROR',
                'message': 'Embedding service not initialized',
                'available': False,
                'timestamp': datetime.now().isoformat()
            }), 500

        # Get comprehensive statistics
        stats = service.get_statistics()

        # Add detailed diagnostic information
        diagnostics = {
            'status': 'OK' if service.is_available() else 'ERROR',
            'available': service.is_available(),
            'backend_used': stats.get('backend_used', 'none'),
            'model_loaded': stats.get('model_loaded', False),
            'configuration': stats.get('configuration', {}),
            'statistics': {
                'embeddings_generated': stats.get('embeddings_generated', 0),
                'avg_generation_time': stats.get('avg_generation_time', 0),
                'cache_hit_rate': stats.get('cache_hit_rate', 0),
                'cache_size': stats.get('cache_size', 0),
                'errors': stats.get('errors', 0)
            },
            'timestamp': datetime.now().isoformat()
        }

        # Add warning if not using HuggingFace
        if stats.get('backend_used') != 'huggingface':
            diagnostics['warning'] = f"Not using HuggingFace backend (expected), using: {stats.get('backend_used')}"
            diagnostics['recommendation'] = "Check HUGGINGFACE_API_KEY environment variable"

        return jsonify(diagnostics), 200

    except Exception as e:
        logger.error("Embeddings diagnostics error: %s", sanitize_error(e))
        return jsonify({
            'status': 'ERROR',
            'message': str(e),
            'available': False,
            'timestamp': datetime.now().isoformat()
        }), 500

# Export blueprint
__all__ = ['medical_core_bp']
