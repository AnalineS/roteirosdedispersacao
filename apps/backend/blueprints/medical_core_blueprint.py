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
from core.security.production_rate_limiter import medical_chat_limit
from core.security.input_validator import get_input_validator
from utils.api_errors import api_error

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
@medical_chat_limit
def chat():
    """Main chat endpoint with AI personas and RAG integration"""
    try:
        data = request.get_json() or {}

        # Hard length limit before any processing
        raw_message = (data.get('message') or data.get('question', ''))
        if len(raw_message) > 5000:
            return api_error('Message too long', 'MESSAGE_TOO_LONG', 400)

        message = raw_message.strip()
        if not message:
            return api_error('Message is required', 'MISSING_MESSAGE', 400)

        # Sanitize input against HTML injection and control characters
        validator = get_input_validator()
        message = validator.sanitize_string(message, max_length=2000)
        if not message:
            return api_error('Invalid message content', 'INVALID_MESSAGE', 400)

        persona = data.get('persona') or data.get('personality_id', 'gasnelio')

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

        # Scope detection - filter out-of-scope questions before RAG
        try:
            from core.validation.scope_detector import detect_question_scope
            scope_result = detect_question_scope(message)
            if scope_result and not scope_result.get('is_in_scope', True):
                redirect = scope_result.get('redirect_suggestion', '')
                return jsonify({
                    'answer': f"Essa pergunta esta fora do meu escopo de conhecimento sobre hanseniase. {redirect}".strip(),
                    'persona': persona,
                    'confidence': 0.1,
                    'rag_used': False,
                    'rag_system': 'scope_filtered',
                    'sources': [],
                    'medical_validation': 'not_performed',
                    'timestamp': datetime.now().isoformat()
                }), 200
        except Exception as e:
            logger.warning("Scope detection failed (non-blocking): %s", sanitize_error(e))

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
            'answer': response_text,
            'persona': persona,
            'confidence': confidence,
            'rag_used': rag_used,
            'rag_system': system_used,
            'sources': sources,
            'medical_validation': 'not_performed',
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

# === SCOPE DETECTION ENDPOINTS ===

@medical_core_bp.route('/scope', methods=['POST'])
def detect_scope():
    """Detect question scope - whether it falls within the system's knowledge domain"""
    try:
        data = request.get_json() or {}
        question = (data.get('question') or data.get('message', '')).strip()
        if not question:
            return jsonify({
                'error': 'question is required',
                'error_code': 'MISSING_QUESTION',
                'timestamp': datetime.now().isoformat()
            }), 400

        from core.validation.scope_detector import detect_question_scope
        analysis = detect_question_scope(question)

        confidence_map = {'high': 1.0, 'medium': 0.7, 'low': 0.4}

        return jsonify({
            'scope': analysis.get('category', 'general_hanseniase'),
            'confidence': confidence_map.get(analysis.get('confidence_level', 'low'), 0.4),
            'details': analysis.get('reasoning', ''),
            'category': analysis.get('category', 'hanseniase'),
            'is_medical': analysis.get('is_in_scope', True),
            'is_in_scope': analysis.get('is_in_scope', True),
            'redirect_suggestion': analysis.get('redirect_suggestion'),
            'timestamp': datetime.now().isoformat()
        }), 200

    except Exception as e:
        logger.error("Scope detection error: %s", sanitize_error(e))
        return jsonify({
            'error': 'Scope detection failed',
            'error_code': 'SCOPE_ERROR',
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

# === EMAIL ENDPOINTS ===

@medical_core_bp.route('/email/send-document', methods=['POST'])
def send_document_email():
    """Send a document (PDF certificate, calculation, etc.) via email"""
    try:
        data = request.get_json() or {}
        to_email = (data.get('to') or '').strip()
        subject = (data.get('subject') or '').strip()
        body = (data.get('body') or '').strip()
        attachment_base64 = data.get('attachment_base64', '')
        attachment_filename = data.get('attachment_filename', 'document.pdf')

        if not to_email or '@' not in to_email:
            return jsonify({
                'error': 'Valid email address is required',
                'error_code': 'INVALID_EMAIL',
                'timestamp': datetime.now().isoformat()
            }), 400

        if not subject:
            return jsonify({
                'error': 'Subject is required',
                'error_code': 'MISSING_SUBJECT',
                'timestamp': datetime.now().isoformat()
            }), 400

        try:
            import asyncio
            import base64
            from services.email.email_service import (
                EmailService, EmailMessage, EmailAddress, EmailAttachment
            )

            service = EmailService()
            message = EmailMessage(
                to=[EmailAddress(email=to_email)],
                subject=subject,
                text_content=body,
            )

            # Attach PDF if provided
            if attachment_base64:
                pdf_bytes = base64.b64decode(attachment_base64)
                message.attachments = [EmailAttachment(
                    filename=attachment_filename,
                    content=pdf_bytes,
                    content_type='application/pdf'
                )]

            # Run async send in sync context
            loop = asyncio.new_event_loop()
            try:
                result = loop.run_until_complete(service.send_email(message))
            finally:
                loop.close()

            if result.get('success'):
                logger.info("Document email sent to: %s", to_email[:3] + '***')
                return jsonify({
                    'success': True,
                    'message': 'Email sent successfully',
                    'timestamp': datetime.now().isoformat()
                }), 200
            else:
                return jsonify({
                    'error': result.get('error', 'Email sending failed'),
                    'error_code': 'EMAIL_SEND_FAILED',
                    'timestamp': datetime.now().isoformat()
                }), 502

        except ImportError:
            logger.warning("Email service not available")
            return jsonify({
                'error': 'Email service not configured',
                'error_code': 'EMAIL_SERVICE_UNAVAILABLE',
                'timestamp': datetime.now().isoformat()
            }), 503

    except Exception as e:
        logger.error("Email send error: %s", sanitize_error(e))
        return jsonify({
            'error': 'Email sending failed',
            'error_code': 'EMAIL_ERROR',
            'timestamp': datetime.now().isoformat()
        }), 500

# Export blueprint
__all__ = ['medical_core_bp']
