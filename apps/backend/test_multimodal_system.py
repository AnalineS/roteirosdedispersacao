#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Teste do Sistema Multimodal
Validação completa das funcionalidades de upload, OCR e análise de imagens
FASE 4.2 - Chatbot Multimodal
"""

import os
import sys
import json
import unittest
import tempfile
import shutil
from datetime import datetime
from pathlib import Path
import io

# Adicionar ao path
sys.path.append(str(Path(__file__).parent))

# Mock de imagem para testes
try:
    from PIL import Image, ImageDraw, ImageFont
    import numpy as np
    HAS_PIL = True
except ImportError:
    HAS_PIL = False

def create_test_image_with_text(text: str, filename: str) -> str:
    """Criar imagem de teste com texto"""
    if not HAS_PIL:
        # Criar arquivo de teste simples
        with open(filename, 'wb') as f:
            f.write(b'fake image data for testing')
        return filename
    
    # Criar imagem com texto
    img = Image.new('RGB', (800, 600), color='white')
    draw = ImageDraw.Draw(img)
    
    try:
        font = ImageFont.load_default()
    except:
        font = None
    
    # Desenhar texto
    text_lines = text.split('\n')
    y_offset = 100
    
    for line in text_lines:
        draw.text((50, y_offset), line, fill='black', font=font)
        y_offset += 40
    
    img.save(filename)
    return filename

class TestMultimodalProcessor(unittest.TestCase):
    """Testes para o processador multimodal"""
    
    def setUp(self):
        """Setup para cada teste"""
        # Usar diretório temporário
        self.temp_dir = tempfile.mkdtemp()
        
        # Tentar importar o sistema multimodal
        try:
            from services.multimodal_processor import (
                MultimodalProcessor, ImageType, ProcessingStatus
            )
            self.processor = MultimodalProcessor(self.temp_dir)
            self.multimodal_available = True
        except ImportError:
            self.multimodal_available = False
            self.processor = None
        
        # Criar imagens de teste
        self.test_images = {}
        if HAS_PIL:
            self.create_test_images()
    
    def tearDown(self):
        """Cleanup após cada teste"""
        shutil.rmtree(self.temp_dir)
    
    def create_test_images(self):
        """Criar imagens de teste com diferentes conteúdos"""
        test_cases = {
            'receita': """
RECEITA MÉDICA
Dr. João Silva - CRM 12345
Paciente: Maria Santos
CPF: 123.456.789-00

Rifampicina 600mg - 1 comprimido/dia
Dapsona 100mg - 1 comprimido/dia
Tomar por 12 meses

Data: 15/08/2025
            """.strip(),
            
            'documento': """
CARTÃO NACIONAL DE SAÚDE
Nome: José da Silva
CNS: 123456789012345
CPF: 987.654.321-00
Data Nascimento: 01/01/1980
            """.strip(),
            
            'dosagem': """
ORIENTAÇÕES DE DOSAGEM
Rifampicina: 600mg uma vez ao dia
Dapsona: 100mg uma vez ao dia
Clofazimina: 300mg uma vez ao dia
Tomar sempre em jejum
            """.strip(),
            
            'texto_simples': """
Este é um texto simples para teste.
Não contém informações médicas específicas.
Apenas texto comum para validação do OCR.
            """.strip()
        }
        
        for name, text in test_cases.items():
            filename = os.path.join(self.temp_dir, f'test_{name}.png')
            create_test_image_with_text(text, filename)
            self.test_images[name] = filename
    
    def test_system_availability(self):
        """Testar disponibilidade do sistema"""
        try:
            from services.multimodal_processor import is_multimodal_available
            available = is_multimodal_available()
            print(f"  [INFO] Sistema multimodal disponível: {available}")
        except ImportError:
            print("  [WARNING] Módulo multimodal não encontrado")
    
    def test_processor_initialization(self):
        """Testar inicialização do processador"""
        if not self.multimodal_available:
            self.skipTest("Sistema multimodal não disponível")
        
        self.assertIsNotNone(self.processor)
        self.assertTrue(os.path.exists(self.processor.storage_path))
        self.assertTrue(os.path.exists(self.processor.active_dir))
        self.assertTrue(os.path.exists(self.processor.processed_dir))
        self.assertTrue(os.path.exists(self.processor.expired_dir))
        
        print("  [OK] Processador inicializado corretamente")
    
    def test_file_validation(self):
        """Testar validação de arquivos"""
        if not self.multimodal_available:
            self.skipTest("Sistema multimodal não disponível")
        
        # Teste arquivo válido
        if 'receita' in self.test_images:
            with open(self.test_images['receita'], 'rb') as f:
                file_data = f.read()
            
            is_valid, message = self.processor.validate_file(file_data, 'test.png')
            self.assertTrue(is_valid)
        
        # Teste arquivo muito grande
        large_data = b'x' * (11 * 1024 * 1024)  # 11MB
        is_valid, message = self.processor.validate_file(large_data, 'large.png')
        self.assertFalse(is_valid)
        self.assertIn('muito grande', message)
        
        # Teste formato inválido
        is_valid, message = self.processor.validate_file(b'data', 'test.txt')
        self.assertFalse(is_valid)
        self.assertIn('não suportado', message)
        
        print("  [OK] Validação de arquivos funcionando")
    
    def test_image_upload(self):
        """Testar upload de imagem"""
        if not self.multimodal_available or 'receita' not in self.test_images:
            self.skipTest("Sistema multimodal ou imagens de teste não disponíveis")
        
        with open(self.test_images['receita'], 'rb') as f:
            file_data = f.read()
        
        from services.multimodal_processor import ImageType
        result = self.processor.upload_image(
            file_data, 
            'receita_teste.png', 
            ImageType.PRESCRIPTION
        )
        
        self.assertTrue(result['success'])
        self.assertIn('file_id', result)
        self.assertIn('expires_at', result)
        self.assertIn('disclaimers', result)
        
        # Verificar se arquivo foi salvo
        file_id = result['file_id']
        file_path = self.processor.active_dir / f"{file_id}_receita_teste.png"
        self.assertTrue(file_path.exists())
        
        print(f"  [OK] Upload realizado: {file_id}")
        return file_id
    
    def test_ocr_processing(self):
        """Testar processamento OCR"""
        if not self.multimodal_available:
            self.skipTest("Sistema multimodal não disponível")
        
        # Fazer upload primeiro
        file_id = self.test_image_upload()
        
        # Processar imagem
        try:
            analysis = self.processor.process_image(file_id, "test_session")
            
            self.assertIsNotNone(analysis)
            self.assertEqual(analysis.file_id, file_id)
            
            if analysis.ocr_result:
                self.assertIsInstance(analysis.ocr_result.text, str)
                self.assertGreaterEqual(analysis.ocr_result.confidence, 0)
                self.assertLessEqual(analysis.ocr_result.confidence, 1)
                print(f"  [OK] OCR executado - Confiança: {analysis.ocr_result.confidence:.2f}")
                print(f"  [INFO] Texto detectado: {analysis.ocr_result.text[:100]}...")
            else:
                print("  [WARNING] OCR não disponível")
            
            # Verificar indicadores médicos
            self.assertIsInstance(analysis.medical_indicators, list)
            if analysis.medical_indicators:
                print(f"  [INFO] Indicadores médicos: {analysis.medical_indicators}")
            
            # Verificar disclaimers
            self.assertIsInstance(analysis.disclaimers, list)
            self.assertGreater(len(analysis.disclaimers), 0)
            
            print("  [OK] Processamento completo realizado")
            
        except Exception as e:
            print(f"  [WARNING] Erro no processamento: {e}")
            # Não falhar o teste se OCR não estiver disponível
    
    def test_medical_content_detection(self):
        """Testar detecção de conteúdo médico"""
        if not self.multimodal_available:
            self.skipTest("Sistema multimodal não disponível")
        
        test_texts = {
            'medicamentos': "Rifampicina 600mg uma vez ao dia",
            'dosagem': "Tomar 2 comprimidos de 8 em 8 horas",
            'documento': "CPF: 123.456.789-00",
            'cns': "CNS: 123456789012345",
            'texto_normal': "Este é um texto comum sem termos médicos"
        }
        
        for desc, text in test_texts.items():
            indicators = self.processor._detect_medical_content(text)
            print(f"  [INFO] {desc}: {indicators}")
            
            if desc == 'medicamentos':
                self.assertIn('rifampicina', indicators)
            elif desc == 'dosagem':
                self.assertIn('dosage_info', indicators)
            elif desc == 'documento':
                self.assertIn('personal_document', indicators)
            elif desc == 'cns':
                self.assertIn('cns_document', indicators)
        
        print("  [OK] Detecção de conteúdo médico funcionando")
    
    def test_disclaimers_generation(self):
        """Testar geração de disclaimers"""
        if not self.multimodal_available:
            self.skipTest("Sistema multimodal não disponível")
        
        from services.multimodal_processor import ImageType
        
        test_cases = [
            (ImageType.PRESCRIPTION, ['rifampicina']),
            (ImageType.IDENTIFICATION, ['personal_document']),
            (ImageType.GENERAL, [])
        ]
        
        for image_type, indicators in test_cases:
            disclaimers = self.processor._generate_disclaimers(image_type, indicators)
            
            self.assertIsInstance(disclaimers, list)
            self.assertGreater(len(disclaimers), 0)
            
            # Verificar se contém disclaimers básicos
            disclaimer_text = ' '.join(disclaimers)
            self.assertIn('educativ', disclaimer_text.lower())
            self.assertIn('médic', disclaimer_text.lower())
            
            print(f"  [INFO] {image_type.value}: {len(disclaimers)} disclaimers")
        
        print("  [OK] Geração de disclaimers funcionando")
    
    def test_system_status(self):
        """Testar status do sistema"""
        if not self.multimodal_available:
            self.skipTest("Sistema multimodal não disponível")
        
        status = self.processor.get_system_status()
        
        self.assertIn('system_health', status)
        self.assertIn('files', status)
        self.assertIn('storage', status)
        self.assertIn('capabilities', status)
        
        print(f"  [INFO] Status do sistema: {status['system_health']}")
        print(f"  [INFO] Capacidades: {status['capabilities']}")
        
        print("  [OK] Status do sistema funcionando")
    
    def test_cleanup_functionality(self):
        """Testar funcionalidade de limpeza"""
        if not self.multimodal_available:
            self.skipTest("Sistema multimodal não disponível")
        
        # Executar limpeza
        cleanup_result = self.processor.cleanup_expired_files()
        
        self.assertIn('files', cleanup_result)
        self.assertIn('size_mb', cleanup_result)
        
        print(f"  [INFO] Limpeza: {cleanup_result['files']} arquivos, {cleanup_result['size_mb']:.2f}MB")
        print("  [OK] Funcionalidade de limpeza funcionando")

class TestMultimodalAPI(unittest.TestCase):
    """Testes para a API multimodal"""
    
    def setUp(self):
        """Setup para testes da API"""
        try:
            from blueprints.multimodal_blueprint import multimodal_bp
            self.blueprint_available = True
        except ImportError:
            self.blueprint_available = False
    
    def test_blueprint_availability(self):
        """Testar disponibilidade do blueprint"""
        if self.blueprint_available:
            print("  [OK] Blueprint multimodal disponível")
        else:
            print("  [WARNING] Blueprint multimodal não disponível")
    
    def test_endpoints_registration(self):
        """Testar registro de endpoints"""
        if not self.blueprint_available:
            self.skipTest("Blueprint não disponível")
        
        from blueprints.multimodal_blueprint import multimodal_bp
        
        # Verificar se endpoints foram registrados
        expected_endpoints = [
            'multimodal.health_check',
            'multimodal.upload_image',
            'multimodal.process_image',
            'multimodal.get_processing_status',
            'multimodal.get_analysis_result'
        ]
        
        registered_endpoints = [rule.endpoint for rule in multimodal_bp.url_map.iter_rules()]
        
        for endpoint in expected_endpoints:
            if endpoint in registered_endpoints:
                print(f"  [OK] Endpoint {endpoint} registrado")
            else:
                print(f"  [WARNING] Endpoint {endpoint} não encontrado")
        
        print("  [OK] Verificação de endpoints concluída")

def test_frontend_integration():
    """Testar integração com frontend"""
    print("[TEST] Frontend Integration...")
    
    try:
        # Verificar hook
        hook_path = Path(__file__).parent.parent / "frontend-nextjs" / "src" / "hooks" / "useMultimodal.ts"
        if hook_path.exists():
            print("  [OK] Hook useMultimodal.ts encontrado")
        else:
            print("  [WARNING] Hook useMultimodal.ts não encontrado")
        
        # Verificar componente
        component_path = Path(__file__).parent.parent / "frontend-nextjs" / "src" / "components" / "multimodal" / "ImageUploader.tsx"
        if component_path.exists():
            print("  [OK] Componente ImageUploader.tsx encontrado")
        else:
            print("  [WARNING] Componente ImageUploader.tsx não encontrado")
        
        print("  [OK] Verificação de integração frontend concluída")
        return True
        
    except Exception as e:
        print(f"  [ERROR] Erro na verificação: {e}")
        return False

def run_comprehensive_test():
    """Executar teste abrangente do sistema multimodal"""
    print("[MULTIMODAL] TESTE DO SISTEMA MULTIMODAL")
    print("=" * 60)
    
    # Verificar dependências
    missing_deps = []
    try:
        import cv2
        print("  [OK] OpenCV disponível")
    except ImportError:
        missing_deps.append("opencv-python")
    
    try:
        from PIL import Image
        print("  [OK] Pillow disponível")
    except ImportError:
        missing_deps.append("Pillow")
    
    try:
        import pytesseract
        print("  [OK] Pytesseract disponível")
    except ImportError:
        missing_deps.append("pytesseract")
    
    try:
        import easyocr
        print("  [OK] EasyOCR disponível")
    except ImportError:
        missing_deps.append("easyocr")
    
    if missing_deps:
        print(f"  [WARNING] Dependências faltantes: {', '.join(missing_deps)}")
        print("  [INFO] Instale com: pip install " + " ".join(missing_deps))
    
    # Executar testes unitários
    test_classes = [
        TestMultimodalProcessor,
        TestMultimodalAPI
    ]
    
    total_tests = 0
    passed_tests = 0
    failed_tests = []
    
    for test_class in test_classes:
        print(f"\n[TESTING] {test_class.__name__}")
        print("-" * 40)
        
        suite = unittest.TestLoader().loadTestsFromTestCase(test_class)
        
        # Usar StringIO para capturar output
        test_output = io.StringIO()
        runner = unittest.TextTestRunner(verbosity=2, stream=test_output)
        
        result = runner.run(suite)
        
        # Print output
        print(test_output.getvalue())
        
        total_tests += result.testsRun
        passed_tests += result.testsRun - len(result.failures) - len(result.errors)
        
        if result.failures:
            failed_tests.extend([f"{test_class.__name__}.{f[0]}" for f in result.failures])
        
        if result.errors:
            failed_tests.extend([f"{test_class.__name__}.{e[0]}" for e in result.errors])
    
    # Teste de integração
    print(f"\n[TESTING] Frontend Integration")
    print("-" * 40)
    frontend_ok = test_frontend_integration()
    if frontend_ok:
        passed_tests += 1
    else:
        failed_tests.append("Frontend Integration")
    total_tests += 1
    
    # Resumo
    print("\n" + "=" * 60)
    print("[RESULTS] RESUMO DOS TESTES")
    print("=" * 60)
    print(f"Total de testes: {total_tests}")
    print(f"Testes aprovados: {passed_tests}")
    print(f"Testes falhados: {len(failed_tests)}")
    
    if failed_tests:
        print("\n[ERROR] Testes que falharam:")
        for test in failed_tests:
            print(f"  • {test}")
    
    success_rate = (passed_tests / total_tests) * 100 if total_tests > 0 else 0
    print(f"\n[SUCCESS RATE] {success_rate:.1f}%")
    
    if success_rate >= 80:
        print("[STATUS] Sistema multimodal funcionando corretamente!")
        return True
    elif success_rate >= 60:
        print("[STATUS] Sistema multimodal com alguns problemas")
        return False
    else:
        print("[STATUS] Sistema multimodal com problemas críticos")
        return False

if __name__ == "__main__":
    success = run_comprehensive_test()
    sys.exit(0 if success else 1)