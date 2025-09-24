#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
RAG Dependencies Installation Script
Installs and validates all required dependencies for the complete RAG system
"""

import subprocess
import sys
import os
import logging
from pathlib import Path

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class RAGDependencyInstaller:
    """Install and validate RAG system dependencies"""

    def __init__(self):
        self.dependencies = {
            'core': [
                'chromadb>=0.4.0',
                'openai>=1.0.0',
                'numpy>=1.21.0',
                'sentence-transformers>=2.2.0',
                'psycopg2-binary>=2.9.0'
            ],
            'optional': [
                'torch>=2.0.0',
                'transformers>=4.30.0',
                'datasets>=2.10.0'
            ],
            'system': [
                # System packages that might be needed
            ]
        }

        self.validation_tests = [
            self._test_chromadb,
            self._test_openai,
            self._test_numpy,
            self._test_sentence_transformers,
            self._test_psycopg2
        ]

    def install_dependencies(self) -> bool:
        """Install all required dependencies"""
        logger.info("🚀 Starting RAG dependencies installation...")

        success = True

        # Install core dependencies
        logger.info("📦 Installing core dependencies...")
        for dep in self.dependencies['core']:
            if not self._install_package(dep):
                logger.error(f"❌ Failed to install core dependency: {dep}")
                success = False
            else:
                logger.info(f"✅ Installed: {dep}")

        # Install optional dependencies (non-fatal)
        logger.info("📦 Installing optional dependencies...")
        for dep in self.dependencies['optional']:
            if not self._install_package(dep):
                logger.warning(f"⚠️ Failed to install optional dependency: {dep}")
            else:
                logger.info(f"✅ Installed: {dep}")

        return success

    def _install_package(self, package: str) -> bool:
        """Install a single package using pip"""
        try:
            cmd = [sys.executable, '-m', 'pip', 'install', package, '--upgrade']
            result = subprocess.run(cmd, capture_output=True, text=True)

            if result.returncode == 0:
                return True
            else:
                logger.error(f"pip install failed for {package}: {result.stderr}")
                return False

        except Exception as e:
            logger.error(f"Exception installing {package}: {e}")
            return False

    def validate_installation(self) -> bool:
        """Validate that all dependencies are properly installed"""
        logger.info("🔍 Validating RAG dependencies...")

        all_passed = True

        for test in self.validation_tests:
            try:
                test_name = test.__name__.replace('_test_', '')
                logger.info(f"Testing {test_name}...")

                if test():
                    logger.info(f"✅ {test_name} validation passed")
                else:
                    logger.error(f"❌ {test_name} validation failed")
                    all_passed = False

            except Exception as e:
                logger.error(f"❌ {test.__name__} validation error: {e}")
                all_passed = False

        return all_passed

    def _test_chromadb(self) -> bool:
        """Test ChromaDB installation"""
        try:
            import chromadb
            from chromadb.config import Settings

            # Test basic functionality
            client = chromadb.Client(Settings(anonymized_telemetry=False))
            collection = client.get_or_create_collection("test")
            collection.add(
                documents=["Test document"],
                ids=["test_id"],
                embeddings=[[0.1, 0.2, 0.3]]
            )

            # Cleanup
            client.delete_collection("test")
            return True

        except ImportError:
            return False
        except Exception as e:
            logger.warning(f"ChromaDB test failed: {e}")
            return False

    def _test_openai(self) -> bool:
        """Test OpenAI installation"""
        try:
            import openai
            # Test basic import and API structure
            return hasattr(openai, 'embeddings')
        except ImportError:
            return False

    def _test_numpy(self) -> bool:
        """Test NumPy installation"""
        try:
            import numpy as np
            # Test basic operations
            arr = np.array([1, 2, 3])
            return arr.sum() == 6
        except ImportError:
            return False

    def _test_sentence_transformers(self) -> bool:
        """Test sentence-transformers installation"""
        try:
            from sentence_transformers import SentenceTransformer
            # Test that we can import the class (don't load a model)
            return True
        except ImportError:
            return False

    def _test_psycopg2(self) -> bool:
        """Test psycopg2 installation"""
        try:
            import psycopg2
            return True
        except ImportError:
            return False

    def setup_directories(self) -> bool:
        """Setup required directories for RAG system"""
        logger.info("📁 Setting up RAG directories...")

        directories = [
            "data/knowledge-base",
            "data/structured",
            "data/chromadb",
            "cache/embeddings",
            "data/vector_store"
        ]

        success = True

        for directory in directories:
            try:
                Path(directory).mkdir(parents=True, exist_ok=True)
                logger.info(f"✅ Created directory: {directory}")
            except Exception as e:
                logger.error(f"❌ Failed to create directory {directory}: {e}")
                success = False

        return success

    def create_sample_knowledge(self) -> bool:
        """Create sample medical knowledge files"""
        logger.info("📄 Creating sample knowledge base...")

        sample_content = """# Roteiro de Dispensação - Hanseníase (PQT-U)

## APRESENTAÇÕES DISPONÍVEIS

- **Poliquimioterapia Única Adulto - PQT-U Adulto**:
Dose mensal supervisionada:
    - Rifampicina 300 mg + 300 mg
    - Dapsona 100 mg
    - Clofazimina 100 mg + 100 mg + 100 mg
    - Clofazimina 50 mg (autoadministrada diária)
    - Dapsona 100 mg (autoadministrada diária)

## INDICAÇÕES

- **Esquema de primeira linha para Hanseníase** em adultos e crianças.
- Associação de:
    - Rifampicina: inibe RNA polimerase (bloqueia síntese de RNA bacteriano; sempre usada em associação).
    - Clofazimina: inibe crescimento bacteriano ao ligar-se ao DNA.
    - Dapsona: antagonista do ácido para-aminobenzóico, interferindo na síntese do folato.

## CONTRAINDICAÇÕES

- Alergia conhecida a qualquer componente da fórmula
- Gravidez (para alguns componentes - verificar protocolo específico)
- Insuficiência hepática grave

## DOSAGEM

### Adultos
- Dose supervisionada mensal conforme protocolo PCDT
- Dose diária autoadministrada conforme orientação médica

### Crianças
- Dose ajustada por peso corporal
- Apenas médicos podem prescrever para pacientes < 30 kg
"""

        try:
            # Create sample markdown file
            kb_path = Path("data/knowledge-base")
            kb_path.mkdir(parents=True, exist_ok=True)

            sample_file = kb_path / "hanseniase_sample.md"
            with open(sample_file, 'w', encoding='utf-8') as f:
                f.write(sample_content)

            logger.info(f"✅ Created sample knowledge file: {sample_file}")

            # Create sample JSON structured data
            structured_path = Path("data/structured")
            structured_path.mkdir(parents=True, exist_ok=True)

            sample_json = {
                "medication": "PQT-U",
                "dosage_forms": [
                    {
                        "type": "adult",
                        "rifampicina": "600mg monthly",
                        "dapsona": "100mg daily",
                        "clofazimina": "300mg monthly + 50mg daily"
                    },
                    {
                        "type": "pediatric",
                        "rifampicina": "450mg monthly",
                        "dapsona": "50mg daily",
                        "clofazimina": "150mg monthly + 50mg alternate days"
                    }
                ],
                "contraindications": [
                    "Hypersensitivity to any component",
                    "Severe hepatic insufficiency"
                ],
                "monitoring": [
                    "Liver function tests",
                    "Complete blood count",
                    "Skin color changes (clofazimina)"
                ]
            }

            import json
            json_file = structured_path / "dosage_protocols.json"
            with open(json_file, 'w', encoding='utf-8') as f:
                json.dump(sample_json, f, ensure_ascii=False, indent=2)

            logger.info(f"✅ Created sample JSON file: {json_file}")
            return True

        except Exception as e:
            logger.error(f"❌ Failed to create sample knowledge: {e}")
            return False

    def test_rag_pipeline(self) -> bool:
        """Test the complete RAG pipeline"""
        logger.info("🧪 Testing complete RAG pipeline...")

        try:
            # Test complete medical RAG system
            from services.rag.complete_medical_rag import get_medical_rag

            rag_system = get_medical_rag()
            if not rag_system:
                logger.error("❌ Failed to initialize medical RAG system")
                return False

            if not rag_system.is_available():
                logger.warning("⚠️ RAG system not available - may need API keys")
                return False

            # Test indexing
            logger.info("Testing knowledge base indexing...")
            indexed, failed = rag_system.index_knowledge_base()
            logger.info(f"Indexed: {indexed} documents, Failed: {failed}")

            if indexed == 0:
                logger.warning("⚠️ No documents indexed - may need API keys or knowledge base")

            # Test query
            logger.info("Testing RAG query...")
            context = rag_system.get_context_for_persona("O que é PQT-U?", "dr_gasnelio")

            if context and "não disponível" not in context.lower():
                logger.info("✅ RAG query successful")
                return True
            else:
                logger.warning("⚠️ RAG query returned limited results")
                return False

        except Exception as e:
            logger.error(f"❌ RAG pipeline test failed: {e}")
            return False

    def run_complete_installation(self) -> bool:
        """Run complete installation and validation process"""
        logger.info("🎯 Starting complete RAG system installation...")

        steps = [
            ("Installing dependencies", self.install_dependencies),
            ("Validating installation", self.validate_installation),
            ("Setting up directories", self.setup_directories),
            ("Creating sample knowledge", self.create_sample_knowledge),
            ("Testing RAG pipeline", self.test_rag_pipeline)
        ]

        overall_success = True

        for step_name, step_func in steps:
            logger.info(f"📋 {step_name}...")
            try:
                if not step_func():
                    logger.error(f"❌ {step_name} failed")
                    overall_success = False
                else:
                    logger.info(f"✅ {step_name} completed")
            except Exception as e:
                logger.error(f"❌ {step_name} error: {e}")
                overall_success = False

        # Final summary
        if overall_success:
            logger.info("🎉 RAG system installation completed successfully!")
            logger.info("Next steps:")
            logger.info("1. Set OPENAI_API_KEY environment variable for embeddings")
            logger.info("2. Add medical documents to data/knowledge-base/")
            logger.info("3. Run the application and check /api/v1/health for RAG status")
        else:
            logger.error("❌ RAG system installation completed with errors")
            logger.error("Check the logs above for specific issues")

        return overall_success

def main():
    """Main installation script"""
    installer = RAGDependencyInstaller()
    success = installer.run_complete_installation()
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()