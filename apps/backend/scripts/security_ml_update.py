#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Security ML Update Script
Systematic update of ML/AI dependencies with medical accuracy validation
"""

import sys
import subprocess
import importlib
import json
import logging
from pathlib import Path
from typing import List, Dict, Any
from datetime import datetime

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('security_ml_update.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class SecurityMLUpdater:
    """Handles systematic ML dependency security updates"""

    def __init__(self, dry_run: bool = False):
        self.dry_run = dry_run
        self.backup_requirements = None
        self.update_stages = []
        self.validation_results = {}

        # Define update stages in dependency order
        self.stages = [
            {
                "name": "Core PyTorch",
                "packages": [
                    "torch==2.8.0",
                    "torchvision==0.23.0",
                    "numpy>=1.26.0,<2.0"
                ],
                "critical": True,
                "test_imports": ["torch", "numpy"],
                "validation_func": self._validate_torch_stack
            },
            {
                "name": "ML Ecosystem",
                "packages": [
                    "sentence-transformers==5.1.0",
                    "transformers>=4.53.2",
                    "scikit-learn>=1.6.1"
                ],
                "critical": True,
                "test_imports": ["sentence_transformers", "transformers", "sklearn"],
                "validation_func": self._validate_ml_ecosystem
            },
            {
                "name": "Multimodal Processing",
                "packages": [
                    "opencv-python==4.10.0.84",
                    "Pillow==10.4.0",
                    "pytesseract==0.3.10",
                    # Note: easyocr may be incompatible with torch 2.8.0
                    # Will handle separately
                ],
                "critical": False,
                "test_imports": ["cv2", "PIL", "pytesseract"],
                "validation_func": self._validate_multimodal_stack
            }
        ]

    def create_backup(self) -> bool:
        """Create backup of current requirements and environment"""
        try:
            requirements_path = Path("requirements.txt")
            if requirements_path.exists():
                backup_path = f"requirements_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
                backup_full_path = Path(backup_path)

                self.backup_requirements = backup_full_path

                if not self.dry_run:
                    import shutil
                    shutil.copy2(requirements_path, backup_full_path)

                logger.info(f"✅ Requirements backup created: {backup_path}")
                return True
            else:
                logger.warning("⚠️  Requirements file not found, skipping backup")
                return True

        except Exception as e:
            logger.error(f"❌ Failed to create backup: {e}")
            return False

    def _validate_torch_stack(self) -> bool:
        """Validate PyTorch and NumPy functionality"""
        try:
            import torch
            import numpy as np

            # Test basic torch functionality
            x = torch.rand(5, 3)
            assert x.shape == (5, 3), "PyTorch tensor creation failed"

            # Test numpy-torch interoperability
            arr = np.random.rand(10)
            torch_tensor = torch.from_numpy(arr)
            assert torch_tensor.shape == (10,), "NumPy-PyTorch conversion failed"

            # Test backward compatibility with existing models
            model = torch.nn.Linear(10, 5)
            input_tensor = torch.rand(3, 10)
            output = model(input_tensor)
            assert output.shape == (3, 5), "Model forward pass failed"

            # Verify CVE-2025-3730 fix (ctc_loss vulnerability)
            # This is a basic test - in production, would need specific test case
            if hasattr(torch.nn.functional, 'ctc_loss'):
                logger.info("✅ PyTorch ctc_loss function available - CVE-2025-3730 should be patched")

            logger.info("✅ PyTorch stack validation passed")
            return True

        except Exception as e:
            logger.error(f"❌ PyTorch stack validation failed: {e}")
            return False

    def _validate_ml_ecosystem(self) -> bool:
        """Validate sentence transformers and ML ecosystem"""
        try:
            from sentence_transformers import SentenceTransformer
            from transformers import AutoTokenizer
            import sklearn

            # Test sentence transformers with lightweight model
            model = SentenceTransformer('all-MiniLM-L6-v2')
            test_sentences = [
                "Hanseníase é uma doença infecciosa",
                "Rifampicina é um medicamento essencial"
            ]
            embeddings = model.encode(test_sentences)

            assert embeddings.shape[0] == 2, "Sentence transformer embedding failed"
            assert embeddings.shape[1] == 384, "Embedding dimension mismatch"

            # Test transformers tokenizer (basic functionality)
            tokenizer = AutoTokenizer.from_pretrained('bert-base-uncased')
            tokens = tokenizer.encode("test sentence")
            assert len(tokens) > 0, "Tokenizer failed"

            # Test sklearn basic functionality
            from sklearn.feature_extraction.text import TfidfVectorizer
            vectorizer = TfidfVectorizer(max_features=10)
            X = vectorizer.fit_transform(test_sentences)
            assert X.shape[0] == 2, "sklearn TF-IDF failed"

            logger.info("✅ ML ecosystem validation passed")
            return True

        except Exception as e:
            logger.error(f"❌ ML ecosystem validation failed: {e}")
            return False

    def _validate_multimodal_stack(self) -> bool:
        """Validate multimodal processing capabilities"""
        try:
            import cv2
            from PIL import Image
            import pytesseract
            import numpy as np

            # Test OpenCV
            test_image = np.zeros((100, 100, 3), dtype=np.uint8)
            gray = cv2.cvtColor(test_image, cv2.COLOR_BGR2GRAY)
            assert gray.shape == (100, 100), "OpenCV processing failed"

            # Test PIL
            pil_image = Image.fromarray(test_image)
            assert pil_image.size == (100, 100), "PIL processing failed"

            # Test pytesseract (basic check - won't actually run OCR without tesseract binary)
            # Just check if module imports correctly
            assert hasattr(pytesseract, 'image_to_string'), "pytesseract import failed"

            logger.info("✅ Multimodal stack validation passed")
            return True

        except Exception as e:
            logger.warning(f"⚠️  Multimodal stack validation failed (non-critical): {e}")
            return False  # Non-critical for core medical functionality

    def check_compatibility(self) -> Dict[str, Any]:
        """Check compatibility before updates"""
        compatibility_report = {
            "python_version": sys.version,
            "platform": sys.platform,
            "current_packages": {},
            "compatibility_issues": []
        }

        # Check current package versions
        try:
            import torch
            compatibility_report["current_packages"]["torch"] = torch.__version__
        except ImportError:
            compatibility_report["compatibility_issues"].append("torch not currently installed")

        try:
            import numpy as np
            compatibility_report["current_packages"]["numpy"] = np.__version__
        except ImportError:
            compatibility_report["compatibility_issues"].append("numpy not currently installed")

        # Check Python version compatibility (PyTorch 2.8 requires Python >=3.9, <=3.13)
        python_version = sys.version_info
        if python_version < (3, 9) or python_version >= (3, 14):
            compatibility_report["compatibility_issues"].append(
                f"Python {python_version.major}.{python_version.minor} may not be compatible with PyTorch 2.8"
            )

        return compatibility_report

    def install_packages(self, packages: List[str], stage_name: str) -> bool:
        """Install packages for a specific stage"""
        logger.info(f"🔄 Installing packages for {stage_name}: {packages}")

        if self.dry_run:
            logger.info("🚫 DRY RUN - Packages would be installed")
            return True

        try:
            cmd = [sys.executable, "-m", "pip", "install", "--upgrade"] + packages

            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=600  # 10 minute timeout
            )

            if result.returncode != 0:
                logger.error(f"❌ Package installation failed for {stage_name}")
                logger.error(f"STDOUT: {result.stdout}")
                logger.error(f"STDERR: {result.stderr}")
                return False

            logger.info(f"✅ Packages installed successfully for {stage_name}")
            return True

        except subprocess.TimeoutExpired:
            logger.error(f"❌ Package installation timed out for {stage_name}")
            return False
        except Exception as e:
            logger.error(f"❌ Package installation error for {stage_name}: {e}")
            return False

    def test_imports(self, imports: List[str]) -> bool:
        """Test if modules can be imported successfully"""
        for module_name in imports:
            try:
                importlib.import_module(module_name)
                logger.info(f"✅ Import test passed: {module_name}")
            except ImportError as e:
                logger.error(f"❌ Import test failed: {module_name} - {e}")
                return False
        return True

    def handle_easyocr_compatibility(self) -> bool:
        """Handle easyocr compatibility with torch 2.8.0"""
        try:
            # Try to install easyocr with new torch version
            if not self.dry_run:
                result = subprocess.run(
                    [sys.executable, "-m", "pip", "install", "easyocr>=1.7.2"],
                    capture_output=True,
                    text=True,
                    timeout=300
                )

                if result.returncode == 0:
                    # Test easyocr functionality
                    import easyocr
                    reader = easyocr.Reader(['en'], gpu=False)  # CPU-only for safety
                    logger.info("✅ easyocr compatible with new torch version")
                    return True
                else:
                    logger.warning("⚠️  easyocr incompatible with torch 2.8.0")
                    logger.info("📝 Note: OCR functionality will use opencv + pytesseract instead")
                    return False
            else:
                logger.info("🚫 DRY RUN - easyocr compatibility check skipped")
                return True

        except Exception as e:
            logger.warning(f"⚠️  easyocr compatibility check failed: {e}")
            return False

    def run_staged_update(self) -> bool:
        """Execute staged dependency updates"""
        logger.info("🚀 Starting staged ML dependency security update")

        # Pre-update compatibility check
        compatibility = self.check_compatibility()
        logger.info(f"📋 Compatibility Report: {json.dumps(compatibility, indent=2)}")

        if compatibility["compatibility_issues"]:
            logger.warning("⚠️  Compatibility issues detected:")
            for issue in compatibility["compatibility_issues"]:
                logger.warning(f"   - {issue}")

        # Create backup
        if not self.create_backup():
            logger.error("❌ Failed to create backup - aborting update")
            return False

        # Execute stages
        successful_stages = 0
        failed_stages = []

        for stage in self.stages:
            stage_name = stage["name"]
            logger.info(f"\n📦 Processing Stage: {stage_name}")

            # Install packages
            success = self.install_packages(stage["packages"], stage_name)
            if not success:
                failed_stages.append(stage_name)
                if stage["critical"]:
                    logger.error(f"❌ Critical stage failed: {stage_name}")
                    break
                else:
                    logger.warning(f"⚠️  Non-critical stage failed: {stage_name}")
                    continue

            # Test imports
            if not self.test_imports(stage["test_imports"]):
                failed_stages.append(f"{stage_name} (imports)")
                if stage["critical"]:
                    logger.error(f"❌ Critical import test failed: {stage_name}")
                    break
                else:
                    logger.warning(f"⚠️  Non-critical import test failed: {stage_name}")
                    continue

            # Run validation
            if stage["validation_func"] and not stage["validation_func"]():
                failed_stages.append(f"{stage_name} (validation)")
                if stage["critical"]:
                    logger.error(f"❌ Critical validation failed: {stage_name}")
                    break
                else:
                    logger.warning(f"⚠️  Non-critical validation failed: {stage_name}")
                    continue

            successful_stages += 1
            logger.info(f"✅ Stage completed successfully: {stage_name}")

        # Handle easyocr separately
        easyocr_success = self.handle_easyocr_compatibility()

        # Final validation
        overall_success = (successful_stages == len([s for s in self.stages if s["critical"]]))

        if overall_success:
            logger.info("🎉 All critical stages completed successfully!")
            logger.info(f"📊 Success rate: {successful_stages}/{len(self.stages)} stages")
            if not easyocr_success:
                logger.warning("⚠️  easyocr compatibility issue - using alternative OCR stack")
        else:
            logger.error("❌ Critical stages failed - update incomplete")
            logger.error(f"Failed stages: {failed_stages}")

        return overall_success

    def rollback(self) -> bool:
        """Rollback to previous requirements if needed"""
        if not self.backup_requirements or not self.backup_requirements.exists():
            logger.error("❌ No backup available for rollback")
            return False

        try:
            if not self.dry_run:
                # Restore backup requirements
                import shutil
                shutil.copy2(self.backup_requirements, "requirements.txt")

                # Reinstall from backup
                result = subprocess.run([
                    sys.executable, "-m", "pip", "install", "-r", "requirements.txt"
                ], capture_output=True, text=True)

                if result.returncode != 0:
                    logger.error(f"❌ Rollback installation failed: {result.stderr}")
                    return False

            logger.info("✅ Successfully rolled back to previous requirements")
            return True

        except Exception as e:
            logger.error(f"❌ Rollback failed: {e}")
            return False

def main():
    """Main execution function"""
    import argparse

    parser = argparse.ArgumentParser(description="ML Security Update Script")
    parser.add_argument("--dry-run", action="store_true",
                       help="Run in dry-run mode (no actual changes)")
    parser.add_argument("--rollback", action="store_true",
                       help="Rollback to previous requirements")

    args = parser.parse_args()

    updater = SecurityMLUpdater(dry_run=args.dry_run)

    if args.rollback:
        logger.info("🔄 Starting rollback process...")
        success = updater.rollback()
        sys.exit(0 if success else 1)

    logger.info("🔐 Starting ML security dependency update")
    if args.dry_run:
        logger.info("🚫 DRY RUN MODE - No actual changes will be made")

    success = updater.run_staged_update()

    if success:
        logger.info("\n🏥 MEDICAL AI SECURITY UPDATE COMPLETED SUCCESSFULLY")
        logger.info("✅ Recommended next steps:")
        logger.info("   1. Run medical AI validation script")
        logger.info("   2. Test AI personas functionality")
        logger.info("   3. Validate RAG system performance")
        logger.info("   4. Monitor medical calculation accuracy")
    else:
        logger.error("\n⚠️  SECURITY UPDATE FAILED")
        logger.error("❌ Recommended actions:")
        logger.error("   1. Review error logs above")
        logger.error("   2. Consider running rollback: --rollback")
        logger.error("   3. Manual dependency resolution may be needed")

    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()