# -*- coding: utf-8 -*-
"""
Sistema de Chunking Médico Inteligente
Implementa divisão semântica de conteúdo médico com prioridades baseadas em criticidade
"""

import re
from typing import List, Dict, Any, Tuple, Optional
from dataclasses import dataclass
from enum import Enum
import logging

# Import configurações
from app_config import config

logger = logging.getLogger(__name__)

class ChunkPriority(Enum):
    """Níveis de prioridade para chunking médico"""
    MAXIMUM = 1.0    # Dosagens, contraindicações, interações
    HIGH = 0.8       # Protocolos, diretrizes  
    MEDIUM = 0.5     # Mecanismos, farmacocinética
    LOW = 0.2        # Texto geral

@dataclass
class MedicalChunk:
    """Representa um chunk de conteúdo médico"""
    content: str
    priority: float
    category: str
    source_section: str
    word_count: int
    contains_dosage: bool = False
    contains_contraindication: bool = False
    contains_interaction: bool = False
    contains_protocol: bool = False

class MedicalChunker:
    """Sistema de chunking médico com análise semântica"""
    
    def __init__(self):
        """Inicializa o chunker com padrões médicos"""
        self.chunk_size_default = config.CHUNK_SIZE_DEFAULT
        self.chunk_size_dosage = config.CHUNK_SIZE_DOSAGE
        self.overlap_ratio = config.CHUNK_OVERLAP_RATIO
        self.content_weights = config.CONTENT_WEIGHTS
        
        # Padrões para detecção de conteúdo crítico
        self.critical_patterns = {
            'dosage': [
                r'\b\d+\s*(mg|g|ml|comprimido|caps|cap|capsula)',
                r'\bdose?\b',
                r'\bdosage[mn]?\b',
                r'\bposolog[iy]a\b',
                r'\bmg/kg\b',
                r'\bdiariament[ae]\b',
                r'\bdia/mg\b',
                r'\bdose\s+diaria\b'
            ],
            'contraindication': [
                r'\bcontraindic',
                r'\bnao\s+deve\b',
                r'\bevitar\b',
                r'\bproibido\b',
                r'\brestricao\b',
                r'\bimpedimento\b',
                r'\bgravi[dz]ez\b',
                r'\blactacao\b'
            ],
            'interaction': [
                r'\binterac[ao]o\b',
                r'\bcom\s+outros\s+medicamentos\b',
                r'\bassociacao\b',
                r'\bcombinacao\b',
                r'\bpotencializ',
                r'\binibe\b',
                r'\baltera\s+efeit'
            ],
            'protocol': [
                r'\bprotocolo\b',
                r'\bpcdt\b',
                r'\bdiretriz',
                r'\bnorma\s+tecnica\b',
                r'\bprocedimento\b',
                r'\brecomendacao\b',
                r'\bministeri[aop]\s+da\s+saude\b'
            ],
            'mechanism': [
                r'\bmecanismo\b',
                r'\bacao\s+farmacologic',
                r'\bfarmacocinetic',
                r'\bfarmacodynami',
                r'\bmetabolismo\b',
                r'\babsorcao\b',
                r'\bdistribuicao\b'
            ]
        }
    
    def detect_content_type(self, text: str) -> Tuple[str, float]:
        """
        Detecta o tipo de conteúdo e sua prioridade
        Retorna (categoria, prioridade)
        """
        text_lower = text.lower()
        scores = {}
        
        # Calcular score para cada categoria
        for category, patterns in self.critical_patterns.items():
            score = 0
            for pattern in patterns:
                matches = len(re.findall(pattern, text_lower, re.IGNORECASE))
                score += matches
            scores[category] = score
        
        # Determinar categoria dominante
        if not scores or max(scores.values()) == 0:
            return 'general', self.content_weights['general']
        
        dominant_category = max(scores, key=scores.get)
        priority = self.content_weights.get(dominant_category, self.content_weights['general'])
        
        return dominant_category, priority
    
    def chunk_by_medical_semantics(self, text: str, section_name: str = "") -> List[MedicalChunk]:
        """
        Divide texto baseado em semântica médica
        Prioriza manter contexto crítico intacto
        """
        # Detectar tipo de conteúdo principal
        primary_category, primary_priority = self.detect_content_type(text)
        
        # Escolher tamanho de chunk baseado na criticidade
        if primary_category in ['dosage', 'contraindication', 'interaction']:
            target_size = self.chunk_size_dosage  # 800 chars para conteúdo crítico
        else:
            target_size = self.chunk_size_default  # 500 chars para geral
        
        # Se texto é menor que target, manter como chunk único
        if len(text) <= target_size:
            return [self._create_chunk(text, primary_category, primary_priority, section_name)]
        
        # Divisão semântica inteligente
        chunks = []
        
        # Primeiro, tentar dividir por parágrafos
        paragraphs = text.split('\n\n')
        if len(paragraphs) > 1:
            chunks.extend(self._chunk_by_paragraphs(paragraphs, target_size, section_name))
        else:
            # Se não há parágrafos, dividir por sentenças
            chunks.extend(self._chunk_by_sentences(text, target_size, section_name))
        
        return chunks
    
    def _chunk_by_paragraphs(self, paragraphs: List[str], target_size: int, section_name: str) -> List[MedicalChunk]:
        """Agrupa parágrafos em chunks mantendo semântica"""
        chunks = []
        current_chunk = ""
        
        for paragraph in paragraphs:
            # Se parágrafo sozinho é muito grande, dividir por sentenças
            if len(paragraph) > target_size * 1.2:
                if current_chunk:
                    chunks.extend(self._finalize_chunk(current_chunk, section_name))
                    current_chunk = ""
                chunks.extend(self._chunk_by_sentences(paragraph, target_size, section_name))
            else:
                # Verificar se cabe no chunk atual
                test_chunk = current_chunk + "\n\n" + paragraph if current_chunk else paragraph
                
                if len(test_chunk) <= target_size:
                    current_chunk = test_chunk
                else:
                    # Finalizar chunk atual e iniciar novo
                    if current_chunk:
                        chunks.extend(self._finalize_chunk(current_chunk, section_name))
                    current_chunk = paragraph
        
        # Finalizar último chunk
        if current_chunk:
            chunks.extend(self._finalize_chunk(current_chunk, section_name))
        
        return chunks
    
    def _chunk_by_sentences(self, text: str, target_size: int, section_name: str) -> List[MedicalChunk]:
        """Divide por sentenças mantendo contexto médico"""
        # Padrão para divisão de sentenças médicas (considera abreviações)
        sentence_pattern = r'(?<![A-Z][a-z]\.)(?<![A-Z]\.)(?<=\.|\!|\?)\s+'
        sentences = re.split(sentence_pattern, text)
        
        chunks = []
        current_chunk = ""
        
        for sentence in sentences:
            sentence = sentence.strip()
            if not sentence:
                continue
            
            test_chunk = current_chunk + " " + sentence if current_chunk else sentence
            
            if len(test_chunk) <= target_size:
                current_chunk = test_chunk
            else:
                # Finalizar chunk atual
                if current_chunk:
                    chunks.extend(self._finalize_chunk(current_chunk, section_name))
                
                # Se sentença é muito grande, dividir forçadamente
                if len(sentence) > target_size * 1.2:
                    chunks.extend(self._force_split(sentence, target_size, section_name))
                    current_chunk = ""
                else:
                    current_chunk = sentence
        
        # Finalizar último chunk
        if current_chunk:
            chunks.extend(self._finalize_chunk(current_chunk, section_name))
        
        return chunks
    
    def _finalize_chunk(self, chunk_text: str, section_name: str) -> List[MedicalChunk]:
        """Finaliza um chunk aplicando análise semântica"""
        category, priority = self.detect_content_type(chunk_text)
        return [self._create_chunk(chunk_text, category, priority, section_name)]
    
    def _force_split(self, text: str, target_size: int, section_name: str) -> List[MedicalChunk]:
        """Divisão forçada para textos muito longos"""
        chunks = []
        overlap_size = int(target_size * self.overlap_ratio)
        
        start = 0
        while start < len(text):
            end = start + target_size
            
            # Tentar encontrar ponto de quebra natural
            if end < len(text):
                # Procurar espaço mais próximo
                while end > start and text[end] != ' ':
                    end -= 1
                
                # Se não encontrou espaço, usar break forçado
                if end == start:
                    end = start + target_size
            
            chunk_text = text[start:end].strip()
            if chunk_text:
                category, priority = self.detect_content_type(chunk_text)
                chunks.append(self._create_chunk(chunk_text, category, priority, section_name))
            
            # Overlap para manter contexto
            start = end - overlap_size if end < len(text) else end
        
        return chunks
    
    def _create_chunk(self, content: str, category: str, priority: float, section_name: str) -> MedicalChunk:
        """Cria um MedicalChunk com análise completa"""
        word_count = len(content.split())
        
        # Detectar características específicas
        contains_dosage = bool(re.search(r'\b\d+\s*(mg|g|ml|comp)', content.lower()))
        contains_contraindication = 'contraindic' in content.lower()
        contains_interaction = 'interac' in content.lower()
        contains_protocol = any(word in content.lower() for word in ['protocolo', 'pcdt', 'diretriz'])
        
        return MedicalChunk(
            content=content.strip(),
            priority=priority,
            category=category,
            source_section=section_name,
            word_count=word_count,
            contains_dosage=contains_dosage,
            contains_contraindication=contains_contraindication,
            contains_interaction=contains_interaction,
            contains_protocol=contains_protocol
        )
    
    def chunk_document(self, document: str, document_name: str = "") -> List[MedicalChunk]:
        """
        Processa documento completo dividindo em chunks otimizados
        """
        logger.info(f"Iniciando chunking médico do documento: {document_name}")
        
        # Detectar seções do documento
        sections = self._detect_sections(document)
        
        all_chunks = []
        for section_name, section_content in sections.items():
            section_chunks = self.chunk_by_medical_semantics(section_content, section_name)
            all_chunks.extend(section_chunks)
            
            logger.debug(f"Seção '{section_name}': {len(section_chunks)} chunks gerados")
        
        # Ordenar por prioridade (maior prioridade primeiro)
        all_chunks.sort(key=lambda x: x.priority, reverse=True)
        
        logger.info(f"Chunking concluído: {len(all_chunks)} chunks gerados")
        self._log_chunk_statistics(all_chunks)
        
        return all_chunks
    
    def _detect_sections(self, document: str) -> Dict[str, str]:
        """Detecta seções do documento médico"""
        # Padrões para títulos de seções
        section_patterns = [
            (r'^#+\s+(.+)$', r'markdown_header'),  # Headers markdown
            (r'^([A-Z][A-Z\s]{3,}):?\s*$', r'uppercase_header'),  # Headers maiúsculos
            (r'^(\d+\.?\s+[A-Za-z].+)$', r'numbered_section'),  # Seções numeradas
        ]
        
        sections = {}
        current_section = "introduction"
        current_content = []
        
        lines = document.split('\n')
        
        for line in lines:
            line_stripped = line.strip()
            
            # Verificar se é um cabeçalho
            is_header = False
            for pattern, _ in section_patterns:
                if re.match(pattern, line_stripped, re.MULTILINE):
                    # Salvar seção anterior
                    if current_content:
                        sections[current_section] = '\n'.join(current_content).strip()
                    
                    # Iniciar nova seção
                    current_section = self._normalize_section_name(line_stripped)
                    current_content = []
                    is_header = True
                    break
            
            if not is_header:
                current_content.append(line)
        
        # Salvar última seção
        if current_content:
            sections[current_section] = '\n'.join(current_content).strip()
        
        # Se não detectou seções, usar documento completo
        if len(sections) <= 1 and not sections:
            sections["document"] = document
        
        return sections
    
    def _normalize_section_name(self, header: str) -> str:
        """Normaliza nome da seção"""
        # Remove caracteres especiais e normaliza
        normalized = re.sub(r'^#+\s*', '', header)  # Remove markdown
        normalized = re.sub(r'^\d+\.?\s*', '', normalized)  # Remove numeração
        normalized = re.sub(r'[^a-zA-Z0-9\s]', '', normalized)  # Remove pontuação
        normalized = '_'.join(normalized.lower().split())  # Converte para snake_case
        
        return normalized or "unnamed_section"
    
    def _log_chunk_statistics(self, chunks: List[MedicalChunk]) -> None:
        """Log estatísticas do chunking"""
        if not chunks:
            return
        
        stats = {
            'total_chunks': len(chunks),
            'categories': {},
            'avg_words': sum(c.word_count for c in chunks) / len(chunks),
            'critical_chunks': sum(1 for c in chunks if c.priority >= ChunkPriority.HIGH.value)
        }
        
        for chunk in chunks:
            category = chunk.category
            stats['categories'][category] = stats['categories'].get(category, 0) + 1
        
        logger.info(f"📊 Estatísticas do Chunking:")
        logger.info(f"   Total: {stats['total_chunks']} chunks")
        logger.info(f"   Críticos (≥0.8): {stats['critical_chunks']} chunks")
        logger.info(f"   Palavras/chunk: {stats['avg_words']:.1f}")
        logger.info(f"   Categorias: {dict(stats['categories'])}")

    def process_table_content(self, table_text: str, table_name: str = "") -> List[MedicalChunk]:
        """
        Processamento especial para tabelas médicas
        Implementa abordagem híbrida: <800 chars como chunk único, >800 chars com divisão semântica
        """
        table_text = table_text.strip()
        
        if len(table_text) <= 800:
            # Tabela pequena - manter como chunk único
            category, priority = self.detect_content_type(table_text)
            return [self._create_chunk(table_text, category, priority, f"table_{table_name}")]
        
        # Tabela grande - divisão semântica
        logger.info(f"Tabela '{table_name}' >800 chars - aplicando divisão semântica")
        
        # Tentar dividir por linhas da tabela
        if '|' in table_text or '\t' in table_text:
            return self._chunk_table_rows(table_text, table_name)
        else:
            # Fallback para divisão normal
            return self.chunk_by_medical_semantics(table_text, f"table_{table_name}")
    
    def _chunk_table_rows(self, table_text: str, table_name: str) -> List[MedicalChunk]:
        """Divide tabela por linhas mantendo cabeçalho"""
        lines = table_text.split('\n')
        header = lines[0] if lines else ""
        
        chunks = []
        current_chunk_lines = [header] if header else []
        current_size = len(header)
        
        for line in lines[1:]:
            line = line.strip()
            if not line:
                continue
            
            test_size = current_size + len(line) + 1  # +1 para \n
            
            if test_size <= 800 or len(current_chunk_lines) <= 1:
                current_chunk_lines.append(line)
                current_size = test_size
            else:
                # Finalizar chunk atual
                if current_chunk_lines:
                    chunk_content = '\n'.join(current_chunk_lines)
                    category, priority = self.detect_content_type(chunk_content)
                    chunks.append(self._create_chunk(chunk_content, category, priority, f"table_{table_name}"))
                
                # Iniciar novo chunk com cabeçalho
                current_chunk_lines = [header, line] if header else [line]
                current_size = len(header) + len(line) + 1
        
        # Finalizar último chunk
        if current_chunk_lines:
            chunk_content = '\n'.join(current_chunk_lines)
            category, priority = self.detect_content_type(chunk_content)
            chunks.append(self._create_chunk(chunk_content, category, priority, f"table_{table_name}"))
        
        return chunks

# Instância global
medical_chunker = MedicalChunker()

# Funções de conveniência
def chunk_medical_text(text: str, section_name: str = "") -> List[MedicalChunk]:
    """Função de conveniência para chunking de texto médico"""
    return medical_chunker.chunk_by_medical_semantics(text, section_name)

def chunk_medical_document(document: str, document_name: str = "") -> List[MedicalChunk]:
    """Função de conveniência para chunking de documento médico completo"""
    return medical_chunker.chunk_document(document, document_name)

def process_medical_table(table_text: str, table_name: str = "") -> List[MedicalChunk]:
    """Função de conveniência para processamento de tabelas médicas"""
    return medical_chunker.process_table_content(table_text, table_name)

__all__ = [
    'MedicalChunk',
    'MedicalChunker', 
    'ChunkPriority',
    'medical_chunker',
    'chunk_medical_text',
    'chunk_medical_document',
    'process_medical_table'
]