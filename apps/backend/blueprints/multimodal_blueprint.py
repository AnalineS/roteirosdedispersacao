#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
API Blueprint para Sistema Multimodal
Endpoints para upload, processamento e consulta de imagens
FASE 4.2 - Chatbot Multimodal
"""

from flask import Blueprint, request, jsonify, session
from werkzeug.utils import secure_filename
import os
import logging
from datetime import datetime
from typing import Dict, Any

# Importações internas
from services.integrations.multimodal_processor import (
    get_multimodal_processor,
    is_multimodal_available,
    ImageType,
    ProcessingStatus
)
from core.security.enhanced_security import SecurityOptimizer
from core.auth.jwt_validator import require_admin

# Configuração do blueprint
multimodal_bp = Blueprint('multimodal', __name__, url_prefix='/api/multimodal')
logger = logging.getLogger(__name__)

@multimodal_bp.route('/health', methods=['GET'])
def health_check():
    """Verificar saúde do sistema multimodal"""
    try:
        processor = get_multimodal_processor()
        status = processor.get_system_status()
        
        return jsonify({
            'status': 'healthy' if status['system_health'] == 'healthy' else 'limited',
            'capabilities': status['capabilities'],
            'ocr_engines': status['ocr_engines'],
            'storage_info': status['storage'],
            'files_info': status['files'],
            'disclaimers': [
                "🏥 Sistema para fins educativos",
                "🔒 Processamento seguro com auto-exclusão",
                "⚕️ Não substitui orientação médica"
            ]
        })
        
    except Exception as e:
        logger.error(f"Erro no health check: {e}")
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500

@multimodal_bp.route('/upload', methods=['POST'])
# Rate limiting removed - using SecurityOptimizer without decorators
def upload_image():
    """Upload de imagem para processamento"""
    
    # Verificar disponibilidade
    if not is_multimodal_available():
        return jsonify({
            'success': False,
            'error': 'Sistema multimodal indisponível - bibliotecas não instaladas',
            'recommendation': 'Instale as dependências: pip install opencv-python pillow pytesseract easyocr',
            'disclaimers': [
                "[FIX] Sistema em modo limitado",
                "[NOTE] Funcionalidades de OCR não disponíveis"
            ]
        }), 503
    
    # Verificar arquivo
    if 'file' not in request.files:
        return jsonify({
            'success': False,
            'error': 'Nenhum arquivo enviado',
            'expected_format': 'multipart/form-data com campo "file"'
        }), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({
            'success': False,
            'error': 'Arquivo vazio'
        }), 400
    
    # Parâmetros opcionais
    image_type_str = request.form.get('image_type', 'general')
    session_id = session.get('session_id', 'anonymous')
    
    try:
        # Validar tipo de imagem
        try:
            image_type = ImageType(image_type_str)
        except ValueError:
            image_type = ImageType.GENERAL
        
        # Obter dados do arquivo
        filename = secure_filename(file.filename)
        file_data = file.read()
        
        # Processar upload
        processor = get_multimodal_processor()
        result = processor.upload_image(file_data, filename, image_type)
        
        # Log para auditoria
        logger.info(f"Upload de {filename} por sessão {session_id}: {'sucesso' if result['success'] else 'falha'}")
        
        if result['success']:
            return jsonify({
                **result,
                'processing_info': {
                    'expected_time': '30-60 segundos',
                    'check_endpoint': f"/api/multimodal/status/{result['file_id']}",
                    'result_endpoint': f"/api/multimodal/result/{result['file_id']}"
                }
            })
        else:
            return jsonify(result), 400
            
    except Exception as e:
        logger.error(f"Erro no upload: {e}")
        return jsonify({
            'success': False,
            'error': f'Erro interno: {str(e)}',
            'disclaimers': [
                "[FIX] Erro temporário do sistema",
                "🔄 Tente novamente em alguns minutos"
            ]
        }), 500

@multimodal_bp.route('/process/<file_id>', methods=['POST'])
# Rate limiting removed - using SecurityOptimizer
def process_image(file_id: str):
    """Processar imagem com OCR e análise"""
    
    if not is_multimodal_available():
        return jsonify({
            'success': False,
            'error': 'Sistema multimodal indisponível'
        }), 503
    
    session_id = session.get('session_id', 'anonymous')
    
    try:
        processor = get_multimodal_processor()
        analysis = processor.process_image(file_id, session_id)
        
        # Preparar resposta com informações essenciais
        response = {
            'success': True,
            'file_id': file_id,
            'processing_completed': True,
            'confidence_score': analysis.confidence_score,
            'extracted_text': analysis.ocr_result.text if analysis.ocr_result else "",
            'medical_indicators': analysis.medical_indicators,
            'safety_warnings': analysis.safety_warnings,
            'extracted_info': analysis.extracted_info,
            'disclaimers': analysis.disclaimers,
            'ocr_info': {
                'confidence': analysis.ocr_result.confidence if analysis.ocr_result else 0,
                'detected_language': analysis.ocr_result.detected_language if analysis.ocr_result else 'unknown',
                'processing_time': analysis.ocr_result.processing_time if analysis.ocr_result else 0
            },
            'metadata': {
                'original_filename': analysis.metadata.original_filename,
                'file_size_mb': analysis.metadata.file_size / (1024 * 1024),
                'image_type': analysis.metadata.image_type.value,
                'expires_at': analysis.metadata.expiry_timestamp.isoformat()
            }
        }
        
        logger.info(f"Processamento concluído para {file_id}")
        return jsonify(response)
        
    except ValueError as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 404
    except Exception as e:
        logger.error(f"Erro no processamento: {e}")
        return jsonify({
            'success': False,
            'error': f'Erro interno: {str(e)}'
        }), 500

@multimodal_bp.route('/status/<file_id>', methods=['GET'])
def get_processing_status(file_id: str):
    """Verificar status do processamento"""
    
    try:
        processor = get_multimodal_processor()
        metadata = processor._load_metadata(file_id)
        
        if not metadata:
            return jsonify({
                'found': False,
                'error': 'Arquivo não encontrado'
            }), 404
        
        # Verificar expiração
        if datetime.now() > metadata.expiry_timestamp:
            return jsonify({
                'found': True,
                'status': 'expired',
                'message': 'Arquivo expirado e removido'
            })
        
        return jsonify({
            'found': True,
            'file_id': file_id,
            'status': metadata.processing_status.value,
            'upload_time': metadata.upload_timestamp.isoformat(),
            'expires_at': metadata.expiry_timestamp.isoformat(),
            'file_info': {
                'filename': metadata.original_filename,
                'size_mb': metadata.file_size / (1024 * 1024),
                'type': metadata.image_type.value
            },
            'actions': {
                'can_process': metadata.processing_status == ProcessingStatus.PENDING,
                'can_view_result': metadata.processing_status == ProcessingStatus.COMPLETED,
                'process_endpoint': f"/api/multimodal/process/{file_id}",
                'result_endpoint': f"/api/multimodal/result/{file_id}"
            }
        })
        
    except Exception as e:
        logger.error(f"Erro ao verificar status: {e}")
        return jsonify({
            'found': False,
            'error': str(e)
        }), 500

@multimodal_bp.route('/result/<file_id>', methods=['GET'])
def get_analysis_result(file_id: str):
    """Obter resultado da análise"""
    
    try:
        processor = get_multimodal_processor()
        result = processor.get_analysis_result(file_id)
        
        if not result:
            return jsonify({
                'found': False,
                'error': 'Resultado não encontrado - arquivo pode não ter sido processado ainda'
            }), 404
        
        # Adicionar informações de contexto
        result['context_help'] = {
            'medical_indicators_info': {
                'dosage_info': 'Informações de dosagem detectadas',
                'personal_document': 'Documento pessoal identificado',
                'cns_document': 'Cartão Nacional de Saúde detectado'
            },
            'confidence_levels': {
                'high': 'Confiança > 80% - resultado muito confiável',
                'medium': 'Confiança 60-80% - resultado moderadamente confiável',
                'low': 'Confiança < 60% - revisar resultado manualmente'
            }
        }
        
        # Adicionar nível de confiança em texto
        confidence = result.get('confidence_score', 0)
        if confidence > 0.8:
            result['confidence_level'] = 'high'
        elif confidence > 0.6:
            result['confidence_level'] = 'medium'
        else:
            result['confidence_level'] = 'low'
        
        return jsonify({
            'found': True,
            'result': result
        })
        
    except Exception as e:
        logger.error(f"Erro ao obter resultado: {e}")
        return jsonify({
            'found': False,
            'error': str(e)
        }), 500

@multimodal_bp.route('/cleanup', methods=['POST'])
# Rate limiting removed - using SecurityOptimizer
@require_admin
def manual_cleanup():
    """Limpeza manual de arquivos expirados (requer privilégios de admin)"""
    
    try:
        processor = get_multimodal_processor()
        cleanup_result = processor.cleanup_expired_files()
        
        logger.info(f"Limpeza manual executada: {cleanup_result}")
        
        return jsonify({
            'success': True,
            'cleaned_files': cleanup_result['files'],
            'freed_space_mb': round(cleanup_result['size_mb'], 2),
            'message': f"Limpeza concluída: {cleanup_result['files']} arquivos removidos"
        })
        
    except Exception as e:
        logger.error(f"Erro na limpeza: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@multimodal_bp.route('/types', methods=['GET'])
def get_image_types():
    """Listar tipos de imagem suportados"""
    
    types_info = {
        'document': {
            'name': 'Documento Geral',
            'description': 'Documentos gerais, formulários, textos',
            'examples': ['Formulários', 'Documentos de texto', 'Relatórios']
        },
        'prescription': {
            'name': 'Receita Médica',
            'description': 'Receitas e prescrições médicas',
            'examples': ['Receitas', 'Prescrições', 'Orientações médicas']
        },
        'identification': {
            'name': 'Documento de Identidade',
            'description': 'Documentos pessoais de identificação',
            'examples': ['RG', 'CPF', 'CNS', 'Certidões']
        },
        'symptom_photo': {
            'name': 'Foto de Sintoma',
            'description': 'Fotos de sintomas ou condições médicas',
            'examples': ['Lesões cutâneas', 'Sintomas visuais']
        },
        'general': {
            'name': 'Geral',
            'description': 'Imagem geral sem categoria específica',
            'examples': ['Imagens diversas', 'Conteúdo misto']
        }
    }
    
    return jsonify({
        'supported_types': types_info,
        'default_type': 'general',
        'upload_help': {
            'max_size_mb': 10,
            'supported_formats': ['.jpg', '.jpeg', '.png', '.pdf', '.tiff', '.bmp'],
            'retention_days': 7
        },
        'disclaimers': [
            "[LIST] Escolha o tipo correto para melhor processamento",
            "🔒 Todos os tipos têm a mesma política de privacidade",
            "⚕️ Fotos de sintomas são apenas para fins educativos"
        ]
    })

@multimodal_bp.route('/capabilities', methods=['GET'])
def get_system_capabilities():
    """Obter capacidades do sistema"""
    
    try:
        processor = get_multimodal_processor()
        status = processor.get_system_status()
        
        capabilities = {
            'ocr_available': status['capabilities']['ocr'],
            'image_analysis': status['capabilities']['image_analysis'],
            'auto_cleanup': status['capabilities']['auto_cleanup'],
            'ocr_engines': status['ocr_engines'],
            'supported_languages': ['pt', 'en'] if status['capabilities']['ocr'] else [],
            'max_file_size_mb': 10,
            'retention_days': status['storage']['retention_days'],
            'processing_features': [
                'OCR (Reconhecimento de texto)',
                'Detecção de conteúdo médico',
                'Extração de informações estruturadas',
                'Geração de avisos de segurança',
                'Disclaimers automáticos',
                'Auto-exclusão após expiração'
            ] if status['capabilities']['ocr'] else [
                'Upload de arquivos',
                'Metadados básicos',
                'Auto-exclusão após expiração'
            ]
        }
        
        return jsonify({
            'system_status': status['system_health'],
            'capabilities': capabilities,
            'limitations': [
                "[FIX] Requer bibliotecas de visão computacional",
                "💻 Processamento local apenas",
                "🕐 Arquivos expiram automaticamente"
            ] if not status['capabilities']['ocr'] else [
                "💻 Processamento local apenas",
                "🕐 Arquivos expiram automaticamente"
            ]
        })
        
    except Exception as e:
        logger.error(f"Erro ao obter capacidades: {e}")
        return jsonify({
            'system_status': 'error',
            'error': str(e)
        }), 500

# Handlers de erro específicos
@multimodal_bp.errorhandler(413)
def file_too_large(error):
    """Handler para arquivo muito grande"""
    return jsonify({
        'success': False,
        'error': 'Arquivo muito grande',
        'max_size_mb': 10,
        'tip': 'Comprima a imagem ou use um arquivo menor'
    }), 413

@multimodal_bp.errorhandler(415)
def unsupported_media_type(error):
    """Handler para tipo de arquivo não suportado"""
    return jsonify({
        'success': False,
        'error': 'Tipo de arquivo não suportado',
        'supported_formats': ['.jpg', '.jpeg', '.png', '.pdf', '.tiff', '.bmp'],
        'tip': 'Converta o arquivo para um formato suportado'
    }), 415

# Middleware para logging de auditoria
@multimodal_bp.before_request
def log_multimodal_request():
    """Log de auditoria para requisições multimodais"""
    session_id = session.get('session_id', 'anonymous')
    logger.info(f"Multimodal request: {request.method} {request.endpoint} from session {session_id}")

# Registrar blueprint com rate limiting global
# Global rate limiting removed - using SecurityOptimizer

# Exportar blueprint
__all__ = ['multimodal_bp']