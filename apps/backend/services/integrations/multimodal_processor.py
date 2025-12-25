#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Sistema de Processamento Multimodal
Suporte para imagens, OCR e análise básica com disclaimers médicos
FASE 4.2 - Chatbot Multimodal
"""

import os
import uuid
import hashlib
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
import json
import logging
from dataclasses import dataclass
from enum import Enum

# Bibliotecas de processamento de imagem
try:
    import cv2
    from PIL import Image
    import pytesseract
    import easyocr
    HAS_VISION_LIBS = True
except ImportError:
    HAS_VISION_LIBS = False

# Configuração de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ImageType(Enum):
    """Tipos de imagem suportados"""
    DOCUMENT = "document"
    PRESCRIPTION = "prescription"
    IDENTIFICATION = "identification"
    SYMPTOM_PHOTO = "symptom_photo"
    GENERAL = "general"

class ProcessingStatus(Enum):
    """Status de processamento"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    EXPIRED = "expired"

@dataclass
class ImageMetadata:
    """Metadados da imagem"""
    file_id: str
    original_filename: str
    file_size: int
    image_type: ImageType
    upload_timestamp: datetime
    expiry_timestamp: datetime
    processing_status: ProcessingStatus
    content_hash: str
    width: int = 0
    height: int = 0
    format: str = ""

@dataclass
class OCRResult:
    """Resultado do OCR"""
    text: str
    confidence: float
    bounding_boxes: List[Dict]
    detected_language: str
    processing_time: float

@dataclass
class ImageAnalysis:
    """Análise completa da imagem"""
    file_id: str
    metadata: ImageMetadata
    ocr_result: Optional[OCRResult]
    medical_indicators: List[str]
    safety_warnings: List[str]
    extracted_info: Dict[str, Any]
    disclaimers: List[str]
    confidence_score: float

class MultimodalProcessor:
    """Processador principal para conteúdo multimodal"""
    
    def __init__(self, storage_path: str = "uploads", retention_days: int = 7):
        self.storage_path = Path(storage_path)
        self.retention_days = retention_days
        self.storage_path.mkdir(exist_ok=True)
        
        # Diretórios organizados
        self.active_dir = self.storage_path / "active"
        self.processed_dir = self.storage_path / "processed"
        self.expired_dir = self.storage_path / "expired"
        
        for directory in [self.active_dir, self.processed_dir, self.expired_dir]:
            directory.mkdir(exist_ok=True)
        
        # Configurações de segurança
        self.max_file_size = 10 * 1024 * 1024  # 10MB
        self.allowed_formats = {'.jpg', '.jpeg', '.png', '.pdf', '.tiff', '.bmp'}
        self.medical_keywords = self._load_medical_keywords()
        
        # Verificar dependências
        if not HAS_VISION_LIBS:
            logger.warning("Bibliotecas de visão não instaladas. Funcionalidade limitada.")
            
        # Configurar OCR
        self._setup_ocr_engines()
        
    def _setup_ocr_engines(self):
        """Configurar engines de OCR"""
        self.ocr_engines = {}
        
        # Tesseract (se disponível)
        try:
            pytesseract.get_tesseract_version()
            self.ocr_engines['tesseract'] = True
            logger.info("Tesseract OCR disponível")
        except:
            logger.warning("Tesseract OCR não disponível")
            
        # EasyOCR (se disponível)
        try:
            if HAS_VISION_LIBS:
                self.easy_reader = easyocr.Reader(['pt', 'en'])
                self.ocr_engines['easyocr'] = True
                logger.info("EasyOCR disponível")
        except Exception as e:
            logger.warning(f"EasyOCR não disponível: {e}")
    
    def _load_medical_keywords(self) -> List[str]:
        """Carregar palavras-chave médicas para detecção"""
        return [
            # Medicamentos hanseníase
            'rifampicina', 'dapsona', 'clofazimina', 'ofloxacina', 'minociclina',
            # Termos médicos gerais
            'receita', 'prescrição', 'medicamento', 'dose', 'posologia',
            'paciente', 'diagnóstico', 'tratamento', 'sintoma',
            # Documentos
            'cpf', 'rg', 'cns', 'cartão nacional de saúde',
            'certidão', 'comprovante', 'atestado',
            # Indicadores médicos
            'hanseníase', 'lepra', 'bacilo', 'hansen', 'morfo',
            'dermatologia', 'neurologia', 'infectologia'
        ]
    
    def validate_file(self, file_data: bytes, filename: str) -> Tuple[bool, str]:
        """Validar arquivo antes do processamento"""
        
        # Verificar tamanho
        if len(file_data) > self.max_file_size:
            return False, f"Arquivo muito grande. Máximo: {self.max_file_size//1024//1024}MB"
        
        # Verificar formato
        file_ext = Path(filename).suffix.lower()
        if file_ext not in self.allowed_formats:
            return False, f"Formato não suportado. Aceitos: {', '.join(self.allowed_formats)}"
        
        # Verificar se é uma imagem válida
        try:
            if HAS_VISION_LIBS and file_ext in {'.jpg', '.jpeg', '.png', '.bmp', '.tiff'}:
                image = Image.open(io.BytesIO(file_data))
                image.verify()
        except Exception as e:
            return False, f"Arquivo de imagem inválido: {str(e)}"
        
        return True, "Arquivo válido"
    
    def upload_image(self, file_data: bytes, filename: str, 
                    image_type: ImageType = ImageType.GENERAL) -> Dict[str, Any]:
        """Upload e processamento inicial da imagem"""
        
        # Validar arquivo
        is_valid, error_msg = self.validate_file(file_data, filename)
        if not is_valid:
            return {
                'success': False,
                'error': error_msg,
                'disclaimers': self._get_upload_disclaimers()
            }
        
        # Gerar ID único
        file_id = str(uuid.uuid4())
        # SHA-256 for file content verification (deduplication)
        content_hash = hashlib.sha256(file_data).hexdigest()
        
        # Verificar duplicatas
        if self._check_duplicate(content_hash):
            return {
                'success': False,
                'error': 'Arquivo já foi processado anteriormente',
                'disclaimers': self._get_upload_disclaimers()
            }
        
        # Criar metadados
        now = datetime.now()
        metadata = ImageMetadata(
            file_id=file_id,
            original_filename=filename,
            file_size=len(file_data),
            image_type=image_type,
            upload_timestamp=now,
            expiry_timestamp=now + timedelta(days=self.retention_days),
            processing_status=ProcessingStatus.PENDING,
            content_hash=content_hash
        )
        
        # Salvar arquivo
        file_path = self.active_dir / f"{file_id}_{filename}"
        try:
            with open(file_path, 'wb') as f:
                f.write(file_data)
            
            # Salvar metadados
            metadata_path = self.active_dir / f"{file_id}_metadata.json"
            with open(metadata_path, 'w', encoding='utf-8') as f:
                json.dump(self._metadata_to_dict(metadata), f, indent=2, ensure_ascii=False)
            
            logger.info(f"Arquivo {filename} salvo com ID: {file_id}")
            
            return {
                'success': True,
                'file_id': file_id,
                'expires_at': metadata.expiry_timestamp.isoformat(),
                'disclaimers': self._get_upload_disclaimers(),
                'next_steps': [
                    'Aguarde o processamento da imagem',
                    'O arquivo será automaticamente removido após 7 dias',
                    'Use o ID do arquivo para consultar o resultado'
                ]
            }
            
        except Exception as e:
            logger.error(f"Erro ao salvar arquivo: {e}")
            return {
                'success': False,
                'error': f'Erro interno ao salvar arquivo: {str(e)}',
                'disclaimers': self._get_upload_disclaimers()
            }
    
    def process_image(self, file_id: str, session_id: str = "anonymous") -> ImageAnalysis:
        """Processar imagem com OCR e análise"""
        
        # Carregar metadados
        metadata = self._load_metadata(file_id)
        if not metadata:
            raise ValueError(f"Arquivo {file_id} não encontrado")
        
        # Verificar expiração
        if datetime.now() > metadata.expiry_timestamp:
            self._move_to_expired(file_id)
            raise ValueError("Arquivo expirado")
        
        # Atualizar status
        metadata.processing_status = ProcessingStatus.PROCESSING
        self._save_metadata(metadata)
        
        try:
            file_path = self.active_dir / f"{file_id}_{metadata.original_filename}"
            
            # Extrair metadados da imagem
            if HAS_VISION_LIBS:
                metadata = self._extract_image_metadata(file_path, metadata)
            
            # Executar OCR
            ocr_result = self._perform_ocr(file_path)
            
            # Análise de conteúdo médico
            medical_indicators = self._detect_medical_content(ocr_result.text if ocr_result else "")
            
            # Gerar avisos de segurança
            safety_warnings = self._generate_safety_warnings(medical_indicators, metadata.image_type)
            
            # Extrair informações estruturadas
            extracted_info = self._extract_structured_info(ocr_result.text if ocr_result else "")
            
            # Gerar disclaimers
            disclaimers = self._generate_disclaimers(metadata.image_type, medical_indicators)
            
            # Calcular score de confiança
            confidence_score = self._calculate_confidence_score(ocr_result, medical_indicators)
            
            # Criar análise completa
            analysis = ImageAnalysis(
                file_id=file_id,
                metadata=metadata,
                ocr_result=ocr_result,
                medical_indicators=medical_indicators,
                safety_warnings=safety_warnings,
                extracted_info=extracted_info,
                disclaimers=disclaimers,
                confidence_score=confidence_score
            )
            
            # Atualizar status e salvar
            metadata.processing_status = ProcessingStatus.COMPLETED
            self._save_metadata(metadata)
            self._save_analysis_result(analysis)
            
            # Log para auditoria
            logger.info(f"Processamento concluído para {file_id} (sessão: {session_id})")
            
            return analysis
            
        except Exception as e:
            metadata.processing_status = ProcessingStatus.FAILED
            self._save_metadata(metadata)
            logger.error(f"Erro no processamento de {file_id}: {e}")
            raise
    
    def _perform_ocr(self, file_path: Path) -> Optional[OCRResult]:
        """Executar OCR na imagem"""
        if not HAS_VISION_LIBS:
            return None
        
        start_time = datetime.now()
        
        try:
            # Carregar imagem
            image = cv2.imread(str(file_path))
            if image is None:
                return None
            
            # Pré-processamento
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            
            # Tentar EasyOCR primeiro (melhor para português)
            if 'easyocr' in self.ocr_engines:
                try:
                    results = self.easy_reader.readtext(gray)
                    
                    text_lines = []
                    bounding_boxes = []
                    total_confidence = 0
                    
                    for (bbox, text, confidence) in results:
                        if confidence > 0.5:  # Filtrar baixa confiança
                            text_lines.append(text)
                            bounding_boxes.append({
                                'text': text,
                                'bbox': bbox,
                                'confidence': confidence
                            })
                            total_confidence += confidence
                    
                    avg_confidence = total_confidence / len(results) if results else 0
                    full_text = ' '.join(text_lines)
                    
                    processing_time = (datetime.now() - start_time).total_seconds()
                    
                    return OCRResult(
                        text=full_text,
                        confidence=avg_confidence,
                        bounding_boxes=bounding_boxes,
                        detected_language='pt',
                        processing_time=processing_time
                    )
                    
                except Exception as e:
                    logger.warning(f"EasyOCR falhou: {e}")
            
            # Fallback para Tesseract
            if 'tesseract' in self.ocr_engines:
                try:
                    # Configurar Tesseract para português
                    custom_config = r'--oem 3 --psm 6 -l por'
                    text = pytesseract.image_to_string(gray, config=custom_config)
                    
                    # Obter dados detalhados
                    data = pytesseract.image_to_data(gray, output_type=pytesseract.Output.DICT)
                    
                    bounding_boxes = []
                    confidences = []
                    
                    for i in range(len(data['text'])):
                        if int(data['conf'][i]) > 0:
                            bounding_boxes.append({
                                'text': data['text'][i],
                                'bbox': [data['left'][i], data['top'][i], 
                                        data['width'][i], data['height'][i]],
                                'confidence': int(data['conf'][i]) / 100
                            })
                            confidences.append(int(data['conf'][i]))
                    
                    avg_confidence = sum(confidences) / len(confidences) / 100 if confidences else 0
                    processing_time = (datetime.now() - start_time).total_seconds()
                    
                    return OCRResult(
                        text=text.strip(),
                        confidence=avg_confidence,
                        bounding_boxes=bounding_boxes,
                        detected_language='pt',
                        processing_time=processing_time
                    )
                    
                except Exception as e:
                    logger.warning(f"Tesseract falhou: {e}")
            
            return None
            
        except Exception as e:
            logger.error(f"Erro no OCR: {e}")
            return None
    
    def _detect_medical_content(self, text: str) -> List[str]:
        """Detectar conteúdo médico no texto"""
        indicators = []
        text_lower = text.lower()
        
        for keyword in self.medical_keywords:
            if keyword.lower() in text_lower:
                indicators.append(keyword)
        
        # Detectar padrões específicos
        import re
        
        # Padrões de dosagem
        dosage_patterns = [
            r'\d+\s*mg',
            r'\d+\s*ml',
            r'\d+\s*comp',
            r'\d+\s*vez\w*\s+ao\s+dia',
            r'\d+x\s*ao\s*dia'
        ]
        
        for pattern in dosage_patterns:
            if re.search(pattern, text_lower):
                indicators.append('dosage_info')
                break
        
        # CPF/RG/CNS
        if re.search(r'\d{3}\.\d{3}\.\d{3}-\d{2}', text):
            indicators.append('personal_document')
        
        if re.search(r'\d{15}', text):  # CNS
            indicators.append('cns_document')
        
        return list(set(indicators))
    
    def _generate_safety_warnings(self, medical_indicators: List[str], 
                                 image_type: ImageType) -> List[str]:
        """Gerar avisos de segurança baseados no conteúdo"""
        warnings = []
        
        if 'personal_document' in medical_indicators:
            warnings.append("[WARNING] Documento pessoal detectado - dados sensíveis identificados")
        
        if 'dosage_info' in medical_indicators:
            warnings.append("💊 Informações de dosagem detectadas - consulte sempre um profissional de saúde")
        
        if image_type == ImageType.PRESCRIPTION:
            warnings.append("[LIST] Receita médica detectada - não substitui consulta médica")
        
        if any(indicator in medical_indicators for indicator in self.medical_keywords[:10]):
            warnings.append("🏥 Conteúdo médico detectado - informações apenas educativas")
        
        return warnings
    
    def _extract_structured_info(self, text: str) -> Dict[str, Any]:
        """Extrair informações estruturadas do texto"""
        info = {}
        
        # Extrair medicamentos mencionados
        mentioned_meds = []
        for keyword in ['rifampicina', 'dapsona', 'clofazimina', 'ofloxacina', 'minociclina']:
            if keyword.lower() in text.lower():
                mentioned_meds.append(keyword)
        
        if mentioned_meds:
            info['medications'] = mentioned_meds
        
        # Extrair padrões de dosagem
        import re
        dosage_matches = re.findall(r'(\d+)\s*mg', text.lower())
        if dosage_matches:
            info['dosages_mg'] = [int(dose) for dose in dosage_matches]
        
        # Extrair datas
        date_matches = re.findall(r'\d{1,2}/\d{1,2}/\d{2,4}', text)
        if date_matches:
            info['dates_found'] = date_matches
        
        return info
    
    def _generate_disclaimers(self, image_type: ImageType, 
                            medical_indicators: List[str]) -> List[str]:
        """Gerar disclaimers apropriados"""
        disclaimers = [
            "📢 IMPORTANTE: Esta é uma ferramenta educativa",
            "[ALERT] NÃO substitui consulta médica profissional",
            "🔒 Dados processados localmente e removidos automaticamente em 7 dias"
        ]
        
        if image_type == ImageType.PRESCRIPTION:
            disclaimers.extend([
                "💊 Receitas médicas devem ser validadas por farmacêutico",
                "⚕️ Siga sempre orientações do médico prescritor"
            ])
        
        if 'personal_document' in medical_indicators:
            disclaimers.append("[SECURITY] Dados pessoais identificados - processamento em ambiente seguro")
        
        if any(med in medical_indicators for med in ['rifampicina', 'dapsona', 'clofazimina']):
            disclaimers.extend([
                "🏥 Medicamentos para hanseníase requerem acompanhamento médico",
                "[REPORT] Informações baseadas no PCDT Hanseníase 2022"
            ])
        
        return disclaimers
    
    def _calculate_confidence_score(self, ocr_result: Optional[OCRResult], 
                                  medical_indicators: List[str]) -> float:
        """Calcular score de confiança geral"""
        score = 0.5  # Base
        
        if ocr_result:
            score += min(ocr_result.confidence * 0.3, 0.3)
            
            # Bonus por texto detectado
            if len(ocr_result.text) > 10:
                score += 0.1
        
        # Bonus por indicadores médicos
        if medical_indicators:
            score += min(len(medical_indicators) * 0.05, 0.2)
        
        return min(score, 1.0)
    
    def get_analysis_result(self, file_id: str) -> Optional[Dict[str, Any]]:
        """Obter resultado da análise"""
        try:
            result_path = self.processed_dir / f"{file_id}_analysis.json"
            if result_path.exists():
                with open(result_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
        except Exception as e:
            logger.error(f"Erro ao carregar resultado: {e}")
        
        return None
    
    def cleanup_expired_files(self) -> Dict[str, int]:
        """Limpeza automática de arquivos expirados"""
        cleaned = {'files': 0, 'size_mb': 0}
        now = datetime.now()
        
        for metadata_file in self.active_dir.glob("*_metadata.json"):
            try:
                with open(metadata_file, 'r', encoding='utf-8') as f:
                    metadata_dict = json.load(f)
                
                expiry = datetime.fromisoformat(metadata_dict['expiry_timestamp'])
                if now > expiry:
                    file_id = metadata_dict['file_id']
                    self._move_to_expired(file_id)
                    cleaned['files'] += 1
                    cleaned['size_mb'] += metadata_dict['file_size'] / (1024 * 1024)
                    
            except Exception as e:
                logger.error(f"Erro na limpeza: {e}")
        
        logger.info(f"Limpeza: {cleaned['files']} arquivos, {cleaned['size_mb']:.2f}MB")
        return cleaned
    
    def get_system_status(self) -> Dict[str, Any]:
        """Status do sistema multimodal"""
        active_files = len(list(self.active_dir.glob("*_metadata.json")))
        processed_files = len(list(self.processed_dir.glob("*_analysis.json")))
        expired_files = len(list(self.expired_dir.glob("*_metadata.json")))
        
        # Calcular espaço usado
        total_size = sum(f.stat().st_size for f in self.storage_path.rglob("*") if f.is_file())
        
        return {
            'system_health': 'healthy' if HAS_VISION_LIBS else 'limited',
            'ocr_engines': list(self.ocr_engines.keys()) if hasattr(self, 'ocr_engines') else [],
            'files': {
                'active': active_files,
                'processed': processed_files,
                'expired': expired_files
            },
            'storage': {
                'total_size_mb': total_size / (1024 * 1024),
                'retention_days': self.retention_days
            },
            'capabilities': {
                'ocr': HAS_VISION_LIBS,
                'image_analysis': HAS_VISION_LIBS,
                'auto_cleanup': True
            }
        }
    
    # Métodos auxiliares
    def _metadata_to_dict(self, metadata: ImageMetadata) -> Dict:
        """Converter metadata para dict"""
        return {
            'file_id': metadata.file_id,
            'original_filename': metadata.original_filename,
            'file_size': metadata.file_size,
            'image_type': metadata.image_type.value,
            'upload_timestamp': metadata.upload_timestamp.isoformat(),
            'expiry_timestamp': metadata.expiry_timestamp.isoformat(),
            'processing_status': metadata.processing_status.value,
            'content_hash': metadata.content_hash,
            'width': metadata.width,
            'height': metadata.height,
            'format': metadata.format
        }
    
    def _load_metadata(self, file_id: str) -> Optional[ImageMetadata]:
        """Carregar metadados do arquivo"""
        try:
            metadata_path = self.active_dir / f"{file_id}_metadata.json"
            if not metadata_path.exists():
                return None
            
            with open(metadata_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
            
            return ImageMetadata(
                file_id=data['file_id'],
                original_filename=data['original_filename'],
                file_size=data['file_size'],
                image_type=ImageType(data['image_type']),
                upload_timestamp=datetime.fromisoformat(data['upload_timestamp']),
                expiry_timestamp=datetime.fromisoformat(data['expiry_timestamp']),
                processing_status=ProcessingStatus(data['processing_status']),
                content_hash=data['content_hash'],
                width=data.get('width', 0),
                height=data.get('height', 0),
                format=data.get('format', '')
            )
        except Exception as e:
            logger.error(f"Erro ao carregar metadados: {e}")
            return None
    
    def _save_metadata(self, metadata: ImageMetadata):
        """Salvar metadados"""
        metadata_path = self.active_dir / f"{metadata.file_id}_metadata.json"
        with open(metadata_path, 'w', encoding='utf-8') as f:
            json.dump(self._metadata_to_dict(metadata), f, indent=2, ensure_ascii=False)
    
    def _save_analysis_result(self, analysis: ImageAnalysis):
        """Salvar resultado da análise"""
        result_path = self.processed_dir / f"{analysis.file_id}_analysis.json"
        
        result_dict = {
            'file_id': analysis.file_id,
            'metadata': self._metadata_to_dict(analysis.metadata),
            'ocr_result': {
                'text': analysis.ocr_result.text,
                'confidence': analysis.ocr_result.confidence,
                'bounding_boxes': analysis.ocr_result.bounding_boxes,
                'detected_language': analysis.ocr_result.detected_language,
                'processing_time': analysis.ocr_result.processing_time
            } if analysis.ocr_result else None,
            'medical_indicators': analysis.medical_indicators,
            'safety_warnings': analysis.safety_warnings,
            'extracted_info': analysis.extracted_info,
            'disclaimers': analysis.disclaimers,
            'confidence_score': analysis.confidence_score,
            'processed_at': datetime.now().isoformat()
        }
        
        with open(result_path, 'w', encoding='utf-8') as f:
            json.dump(result_dict, f, indent=2, ensure_ascii=False)
    
    def _check_duplicate(self, content_hash: str) -> bool:
        """Verificar se arquivo é duplicata"""
        for metadata_file in self.active_dir.glob("*_metadata.json"):
            try:
                with open(metadata_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    if data.get('content_hash') == content_hash:
                        return True
            except:
                continue
        return False
    
    def _move_to_expired(self, file_id: str):
        """Mover arquivo para diretório expirado"""
        try:
            # Mover arquivo principal
            for file_path in self.active_dir.glob(f"{file_id}_*"):
                expired_path = self.expired_dir / file_path.name
                file_path.rename(expired_path)
            
            logger.info(f"Arquivo {file_id} movido para expirados")
        except Exception as e:
            logger.error(f"Erro ao mover arquivo expirado: {e}")
    
    def _extract_image_metadata(self, file_path: Path, metadata: ImageMetadata) -> ImageMetadata:
        """Extrair metadados da imagem"""
        try:
            with Image.open(file_path) as img:
                metadata.width = img.width
                metadata.height = img.height
                metadata.format = img.format
        except Exception as e:
            logger.warning(f"Erro ao extrair metadados da imagem: {e}")
        
        return metadata
    
    def _get_upload_disclaimers(self) -> List[str]:
        """Disclaimers para upload"""
        return [
            "📢 Este sistema é apenas educativo",
            "🔒 Arquivos são automaticamente removidos após 7 dias",
            "⚕️ Não substitui consulta médica profissional",
            "[SECURITY] Dados processados em ambiente seguro"
        ]

# Instância global (singleton)
multimodal_processor = None

def get_multimodal_processor() -> MultimodalProcessor:
    """Obter instância do processador multimodal OTIMIZADO"""
    global multimodal_processor
    if multimodal_processor is None:
        # Configurações otimizadas para sistema médico
        storage_path = os.getenv('MULTIMODAL_STORAGE_PATH', './uploads/medical_docs')
        retention_days = int(os.getenv('MULTIMODAL_RETENTION_DAYS', '3'))  # Retenção mais curta para dados médicos
        multimodal_processor = MultimodalProcessor(storage_path, retention_days)
        logger.info(f"[OK] MultimodalProcessor inicializado: {storage_path}, retenção {retention_days} dias")
    return multimodal_processor

def is_multimodal_available() -> bool:
    """Verificar se sistema multimodal está disponível"""
    return HAS_VISION_LIBS

# Configuração para importação
__all__ = [
    'MultimodalProcessor',
    'ImageType',
    'ProcessingStatus',
    'ImageMetadata',
    'OCRResult',
    'ImageAnalysis',
    'get_multimodal_processor',
    'is_multimodal_available'
]