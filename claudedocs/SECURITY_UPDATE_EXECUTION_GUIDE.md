# Security Update Execution Guide
## ML/AI Dependencies Security Update for Medical Education Application

### Quick Start (Recommended)

For immediate security update with full validation:

```bash
# Navigate to backend directory
cd "C:\Users\Ana\Meu Drive\Site roteiro de dispensação\apps\backend"

# Test run first (recommended)
python scripts/execute_security_update.py --dry-run

# Execute actual update
python scripts/execute_security_update.py
```

### Security Vulnerabilities Addressed

1. **CVE-2025-3730** - PyTorch DoS vulnerability in ctc_loss function
2. **CVE-2025-32434** - PyTorch RCE vulnerability in torch.load()
3. **CVE-2025-59420** - JWT vulnerability in authlib (already patched)

### What This Update Does

#### Dependencies Updated:
- **torch**: 2.7.1 → 2.8.0 (Critical security fix)
- **torchvision**: Updated for compatibility (0.23.0)
- **numpy**: Restricted to <2.0 (PyTorch 2.8 compatibility)
- **sentence-transformers**: 5.0.0 → 5.1.0 (Performance + compatibility)
- **authlib**: Added 1.6.4 (JWT security fix)

#### Medical AI Components Preserved:
- **Dr. Gasnelio** (Technical pharmacist persona)
- **Gá** (Empathetic assistant persona)
- **RAG System** (Knowledge base retrieval)
- **Medical Calculations** (Dosing precision)
- **Embedding Service** (Semantic search)

### Execution Options

#### 1. Safe Dry-Run Test
```bash
python scripts/execute_security_update.py --dry-run
```
- Tests compatibility without making changes
- Validates update process
- Reports potential issues

#### 2. Full Update with Validation
```bash
python scripts/execute_security_update.py
```
- Creates automatic backup branch
- Updates all dependencies
- Runs comprehensive medical AI validation
- Provides detailed execution report

#### 3. Individual Component Updates
```bash
# Just run ML security updates
python scripts/security_ml_update.py

# Just run medical AI validation
python scripts/medical_ai_validation.py
```

### Manual Update Process (Alternative)

If you prefer step-by-step manual execution:

#### Step 1: Create Backup
```bash
cd "C:\Users\Ana\Meu Drive\Site roteiro de dispensação"
git checkout -b security-backup-$(date +%Y%m%d)
git push -u origin security-backup-$(date +%Y%m%d)
```

#### Step 2: Apply Security Requirements
```bash
cd apps/backend
cp requirements_security_ml_update.txt requirements.txt
pip install -r requirements.txt --upgrade
```

#### Step 3: Validate Medical AI
```bash
python scripts/medical_ai_validation.py
```

### Validation Criteria

The update is considered successful when:
- ✅ All security vulnerabilities resolved
- ✅ AI personas maintain >90% accuracy
- ✅ RAG system maintains >85% retrieval precision
- ✅ Medical calculations maintain 100% precision
- ✅ Embedding service maintains >95% success rate
- ✅ API response time remains <5 seconds

### Rollback Instructions

If validation fails or issues arise:

#### Automatic Rollback
```bash
# Using the execution script
python scripts/execute_security_update.py --rollback

# Or using the ML update script
python scripts/security_ml_update.py --rollback
```

#### Manual Rollback
```bash
# Switch back to main branch
git checkout main
git reset --hard HEAD~1

# Restore previous requirements
pip install -r requirements_backup_[timestamp].txt
```

### Post-Update Monitoring

After successful update, monitor these metrics for 24-48 hours:

1. **AI Persona Accuracy**
   - Dr. Gasnelio technical responses
   - Gá empathetic responses
   - Medical terminology correctness

2. **RAG System Performance**
   - Knowledge base retrieval success rate
   - Medical query response quality
   - Embedding generation speed

3. **Medical Calculations**
   - Dosing calculation precision
   - Numerical accuracy validation
   - Drug interaction processing

4. **System Performance**
   - API response times
   - Memory usage patterns
   - Error rates and logs

### Troubleshooting

#### Common Issues

**Issue**: EasyOCR incompatible with torch 2.8.0
```
Solution: System will automatically fall back to opencv + pytesseract
Impact: Minimal - OCR functionality preserved with alternative stack
```

**Issue**: Sentence transformers model loading errors
```
Solution: Clear model cache and re-download
Commands:
  rm -rf ~/.cache/torch/sentence_transformers/
  python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"
```

**Issue**: NumPy compatibility warnings
```
Solution: Ensure numpy version is <2.0
Command: pip install "numpy>=1.26.0,<2.0" --force-reinstall
```

#### Validation Failures

**Dr. Gasnelio Accuracy Below 90%**
- Check medical terminology in responses
- Verify knowledge base access
- Test specific dosing calculation queries

**Gá Empathy Score Below 90%**
- Validate emotional response keywords
- Check conversation flow naturalness
- Test patient communication scenarios

**RAG Precision Below 85%**
- Clear embedding cache
- Regenerate knowledge base embeddings
- Test medical query retrieval

### Emergency Contacts

If critical issues arise:
- **Immediate Rollback**: Use rollback commands above
- **Medical Content Validation**: Consult medical subject matter experts
- **Technical Issues**: Review detailed logs in execution reports

### File Locations

All created files are located in:
```
apps/backend/
├── requirements_security_ml_update.txt    # Updated requirements
├── scripts/
│   ├── security_ml_update.py             # ML dependency updater
│   ├── medical_ai_validation.py          # Medical AI validator
│   └── execute_security_update.py        # Complete orchestration
└── claudedocs/
    ├── ML_SECURITY_UPDATE_STRATEGY.md    # Detailed strategy
    └── SECURITY_UPDATE_EXECUTION_GUIDE.md # This file
```

### Success Confirmation

You'll know the update succeeded when you see:
```
🏥 MEDICAL AI SECURITY UPDATE COMPLETED SUCCESSFULLY
✅ All validation tests passed
✅ Medical AI personas functioning correctly
✅ RAG system knowledge retrieval optimal
✅ Security vulnerabilities resolved
🚀 Safe to deploy to production
```

### Next Steps After Successful Update

1. **Update Documentation**
   - Record new dependency versions
   - Update security procedures
   - Document any configuration changes

2. **Monitor Production**
   - Set up alerts for AI response quality
   - Monitor medical calculation accuracy
   - Track system performance metrics

3. **Schedule Regular Updates**
   - Monthly security dependency checks
   - Quarterly comprehensive validation
   - Semi-annual ML model updates

### Support

For questions or issues during the update process:
1. Check the generated execution logs
2. Review validation reports in JSON format
3. Consult the detailed strategy document
4. Test individual components separately if needed

---

**⚠️ Important**: This is a medical education application. Patient safety and medical accuracy are paramount. Do not deploy to production until all validation tests pass successfully.