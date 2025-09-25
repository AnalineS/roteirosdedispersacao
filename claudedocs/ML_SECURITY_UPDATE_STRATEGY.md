# ML/AI Dependencies Security Update Strategy
## Coordinated Update Plan for Medical Education Application

### Executive Summary

This document outlines a systematic approach to updating ML/AI dependencies in the hanseníase medical education application while maintaining the accuracy of AI personas (Dr. Gasnelio and Gá) and RAG system functionality.

### Current State Analysis

**Critical Vulnerabilities Identified:**
1. **CVE-2025-3730** - PyTorch DoS vulnerability in `ctc_loss` function (affects torch 2.7.1)
2. **CVE-2025-32434** - PyTorch RCE vulnerability in `torch.load()` (patched in 2.6.0+)
3. **CVE-2025-59420** - JWT vulnerability (already patched: authlib==1.6.4 added)

**Current ML Stack:**
- PyTorch: 2.7.1 (vulnerable) → Target: 2.8.0+
- NumPy: 1.26.4 → Target: Latest compatible (< 2.0)
- sentence-transformers: 5.0.0 → Target: 5.1.0+
- scikit-learn: 1.6.1 (current)
- transformers: 4.53.2 (current)

**Key Dependencies Chain:**
```
easyocr==1.7.1 → torch==2.7.1 (vulnerable)
sentence-transformers==5.1.0 → transformers + torch
RAG System → sentence-transformers + numpy + chromadb
AI Personas → openai + sentence-transformers + sklearn
```

### Compatibility Matrix

Based on PyTorch documentation research:

| Component | Current | Target | Compatibility Notes |
|-----------|---------|--------|-------------------|
| PyTorch | 2.7.1 | 2.8.0 | Python >=3.9, <=3.13 |
| NumPy | 1.26.4 | 1.26.x | Must be <2.0 for PyTorch compatibility |
| sentence-transformers | 5.0.0 | 5.1.0 | Compatible with torch 2.8.0 |
| transformers | 4.53.2 | 4.53.2+ | Stable, minimal changes needed |
| easyocr | 1.7.1 | 1.7.2+ | May require torch 2.8.0 compatibility |

### Update Strategy

#### Phase 1: Preparation & Backup (30 minutes)
1. **Create Backup Branch**
   ```bash
   git checkout -b security-updates-ml-dependencies
   git push -u origin security-updates-ml-dependencies
   ```

2. **Document Current Functionality**
   - Export current AI persona responses for comparison testing
   - Document RAG system performance metrics
   - Create medical calculation test cases

3. **Environment Preparation**
   ```bash
   # Create isolated test environment
   python -m venv venv_security_test
   source venv_security_test/bin/activate  # Linux/Mac
   # venv_security_test\Scripts\activate   # Windows
   ```

#### Phase 2: Staged Updates (60 minutes)

**Step 2.1: Core PyTorch Update**
```python
# New requirements_security_ml.txt
torch==2.8.0
torchvision==0.23.0  # Compatible with torch 2.8.0
numpy>=1.26.0,<2.0   # Maintain compatibility
```

**Step 2.2: ML Ecosystem Updates**
```python
# sentence-transformers and dependencies
sentence-transformers==5.1.0
transformers>=4.53.2
scikit-learn>=1.6.1
```

**Step 2.3: Multimodal Dependencies**
```python
# Handle easyocr compatibility
# Option A: Update if compatible
easyocr>=1.7.2

# Option B: Replace with direct dependencies if incompatible
opencv-python==4.10.0.84
Pillow==10.4.0
pytesseract==0.3.10
# Remove easyocr temporarily if torch 2.8.0 incompatible
```

#### Phase 3: Medical AI Validation (45 minutes)

**Critical Test Cases:**

1. **Dr. Gasnelio (Technical Persona) Tests:**
   ```python
   # Test medication dosing calculations
   test_cases = [
       "Qual a dosagem de rifampicina para adulto com 70kg?",
       "Como calcular a dose pediátrica de dapsona?",
       "Interações medicamentosas da clofazimina?"
   ]
   ```

2. **Gá (Empathetic Persona) Tests:**
   ```python
   # Test empathetic responses and medical translation
   test_cases = [
       "Estou com medo dos efeitos colaterais",
       "Como explicar hanseníase para uma criança?",
       "O tratamento é muito longo, me ajude"
   ]
   ```

3. **RAG System Tests:**
   ```python
   # Test knowledge base retrieval accuracy
   test_queries = [
       "PCDT hanseníase 2022 diretrizes",
       "Reações hansênicas tipo 1 e 2",
       "Critérios de cura hanseníase"
   ]
   ```

4. **Medical Calculation Precision:**
   ```python
   # Verify numerical accuracy maintained
   # Test dose calculations with numpy operations
   # Validate sentence similarity scores
   ```

### Rollback Strategy

**Immediate Rollback Triggers:**
- AI persona accuracy drops >10%
- RAG system retrieval precision decreases
- Medical calculation errors detected
- Memory usage increases >50%

**Rollback Process:**
```bash
# Quick rollback to previous working state
git checkout main
git reset --hard HEAD~1

# Alternative: Rollback specific files
git checkout HEAD~1 -- apps/backend/requirements.txt
pip install -r apps/backend/requirements.txt
```

**Gradual Rollback Options:**
1. **Partial Rollback:** Keep numpy/sklearn updates, revert torch
2. **Component Isolation:** Update torch but keep easyocr on older version
3. **Fallback Dependencies:** Use TF-IDF instead of sentence-transformers temporarily

### Implementation Script

```python
# security_ml_update.py
import subprocess
import sys
import importlib
import numpy as np
from typing import List, Dict, Any

def validate_ml_stack() -> bool:
    """Validate ML stack functionality after updates"""
    try:
        # Test torch functionality
        import torch
        x = torch.rand(5, 3)
        assert x.shape == (5, 3)

        # Test numpy compatibility
        import numpy as np
        arr = np.random.rand(10)
        torch_tensor = torch.from_numpy(arr)
        assert torch_tensor.shape == (10,)

        # Test sentence transformers
        from sentence_transformers import SentenceTransformer
        # Use lightweight model for testing
        model = SentenceTransformer('all-MiniLM-L6-v2')
        embeddings = model.encode(["test sentence"])
        assert embeddings.shape[1] == 384

        print("✅ ML stack validation passed")
        return True

    except Exception as e:
        print(f"❌ ML stack validation failed: {e}")
        return False

def update_dependencies_staged() -> bool:
    """Update dependencies in stages with validation"""

    stages = [
        {
            "name": "Core PyTorch",
            "packages": ["torch==2.8.0", "numpy>=1.26.0,<2.0"],
            "test": lambda: importlib.import_module("torch") is not None
        },
        {
            "name": "ML Ecosystem",
            "packages": ["sentence-transformers==5.1.0", "transformers>=4.53.2"],
            "test": lambda: importlib.import_module("sentence_transformers") is not None
        },
        {
            "name": "Multimodal",
            "packages": ["opencv-python==4.10.0.84", "Pillow==10.4.0"],
            "test": lambda: importlib.import_module("cv2") is not None
        }
    ]

    for stage in stages:
        print(f"🔄 Updating {stage['name']}...")

        # Install packages for this stage
        cmd = [sys.executable, "-m", "pip", "install"] + stage["packages"]
        result = subprocess.run(cmd, capture_output=True, text=True)

        if result.returncode != 0:
            print(f"❌ Failed to update {stage['name']}: {result.stderr}")
            return False

        # Test stage functionality
        try:
            if not stage["test"]():
                print(f"❌ {stage['name']} validation failed")
                return False
        except Exception as e:
            print(f"❌ {stage['name']} test error: {e}")
            return False

        print(f"✅ {stage['name']} updated successfully")

    return validate_ml_stack()

if __name__ == "__main__":
    success = update_dependencies_staged()
    sys.exit(0 if success else 1)
```

### Medical AI Specific Validation

```python
# medical_ai_validation.py
import json
import time
from typing import Dict, List
from services.ai.chatbot import ChatbotService
from services.embedding_service import get_embedding_service

class MedicalAIValidator:
    def __init__(self):
        self.chatbot = ChatbotService()
        self.embedding_service = get_embedding_service()

    def validate_personas(self) -> Dict[str, bool]:
        """Validate both AI personas maintain medical accuracy"""

        test_cases = {
            "dr_gasnelio": [
                "Qual a posologia da rifampicina no esquema PQT-MB?",
                "Critérios para diagnóstico de hanseníase neural pura",
                "Manejo das reações hansênicas tipo 2"
            ],
            "ga": [
                "Como posso explicar o que é hanseníase de forma simples?",
                "Estou com medo do preconceito, me ajude",
                "O tratamento demora muito tempo?"
            ]
        }

        results = {}

        for persona_id, questions in test_cases.items():
            persona_results = []

            for question in questions:
                response = self.chatbot.process_message(
                    message=question,
                    persona_id=persona_id,
                    user_session_id="validation_test"
                )

                # Validate response quality
                is_valid = (
                    response.get("response") and
                    len(response["response"]) > 50 and
                    not response.get("error", False) and
                    response.get("api_used", False)
                )

                persona_results.append(is_valid)
                time.sleep(1)  # Rate limiting

            results[persona_id] = all(persona_results)

        return results

    def validate_rag_system(self) -> bool:
        """Validate RAG system maintains medical knowledge accuracy"""

        medical_queries = [
            "PCDT hanseníase ministério saúde",
            "esquema PQT multibacilar",
            "reações hansênicas tratamento",
            "hanseníase neural diagnóstico"
        ]

        for query in medical_queries:
            # Test embedding generation
            embedding_result = self.embedding_service.embed_text(query)
            if not embedding_result.success:
                return False

            # Test knowledge base search
            docs = self.chatbot._search_knowledge_base(query, top_k=3)
            if len(docs) == 0:
                return False

        return True

    def validate_medical_calculations(self) -> bool:
        """Validate numerical precision for medical calculations"""

        import numpy as np

        # Test dose calculations (example)
        weight_kg = 70.0
        rifampicina_dose = weight_kg * 10  # 10mg/kg

        # Test numpy operations maintain precision
        weights = np.array([50, 60, 70, 80, 90], dtype=np.float64)
        doses = weights * 10.0

        expected = np.array([500, 600, 700, 800, 900], dtype=np.float64)

        return np.allclose(doses, expected, rtol=1e-10)

def run_full_validation() -> Dict[str, bool]:
    """Run comprehensive medical AI validation"""

    validator = MedicalAIValidator()

    results = {
        "personas": validator.validate_personas(),
        "rag_system": validator.validate_rag_system(),
        "medical_calculations": validator.validate_medical_calculations(),
        "embedding_service": validator.embedding_service.is_available()
    }

    return results

if __name__ == "__main__":
    validation_results = run_full_validation()

    print("\n📊 Medical AI Validation Results:")
    print("=" * 40)

    all_passed = True

    for category, result in validation_results.items():
        if isinstance(result, dict):
            for subcategory, subresult in result.items():
                status = "✅ PASS" if subresult else "❌ FAIL"
                print(f"{category}.{subcategory}: {status}")
                if not subresult:
                    all_passed = False
        else:
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{category}: {status}")
            if not result:
                all_passed = False

    print(f"\n🏥 Overall Medical AI Status: {'✅ HEALTHY' if all_passed else '❌ ISSUES DETECTED'}")

    if not all_passed:
        print("\n⚠️  RECOMMENDATION: Do not deploy to production")
        print("   Review failed components and consider rollback")
```

### Deployment Steps

1. **Test Environment Validation** (Local)
   ```bash
   python security_ml_update.py
   python medical_ai_validation.py
   ```

2. **Staging Environment Testing** (if available)
   ```bash
   # Deploy to staging with new dependencies
   # Run integration tests
   # Monitor performance metrics
   ```

3. **Production Deployment** (Only if all tests pass)
   ```bash
   # Update production requirements.txt
   # Deploy with blue-green deployment if possible
   # Monitor medical AI responses closely
   ```

### Monitoring and Validation Metrics

**Key Performance Indicators:**
- AI persona response accuracy: >95%
- RAG system retrieval precision: >90%
- Medical calculation accuracy: 100%
- API response time: <2 seconds
- Memory usage increase: <20%
- Error rate: <1%

**Continuous Monitoring:**
- Set up alerts for AI response quality degradation
- Monitor embedding service performance
- Track medical query success rates
- Log any calculation precision errors

### Risk Mitigation

**High-Risk Components:**
1. **easyocr dependency** - May not be compatible with torch 2.8.0
   - Mitigation: Replace with individual OCR components
   - Fallback: Keep easyocr on separate virtual environment

2. **sentence-transformers model compatibility** - Model weights may behave differently
   - Mitigation: Pre-validate with sample medical texts
   - Fallback: Use TF-IDF temporarily if needed

3. **Medical knowledge retrieval changes** - Vector similarity may change
   - Mitigation: Comprehensive RAG testing before deployment
   - Fallback: Maintain knowledge base in multiple formats

**Emergency Contacts:**
- Technical lead for immediate rollback decisions
- Medical content expert for accuracy validation
- DevOps team for production deployment issues

### Success Criteria

Updates are considered successful when:
- [ ] All security vulnerabilities resolved
- [ ] AI personas maintain >95% accuracy
- [ ] RAG system retrieval quality maintained
- [ ] Medical calculations remain precise
- [ ] Performance impact <20%
- [ ] Zero critical errors in production

### Post-Update Actions

1. **Documentation Update**
   - Update dependency documentation
   - Record lesson learned
   - Update security procedures

2. **Monitoring Enhancement**
   - Implement automated medical AI testing
   - Set up security vulnerability scanning
   - Create dependency update process

3. **Team Communication**
   - Share results with medical content team
   - Update development team on changes
   - Document new security procedures

---

**Document Version:** 1.0
**Last Updated:** December 2024
**Next Review:** After security update completion