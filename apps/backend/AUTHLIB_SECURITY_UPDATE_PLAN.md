# Authlib Security Update Plan - CVE-2025-59420

## Executive Summary
Safe incremental update of authlib from 1.6.3 to 1.6.4 to address critical JWT/JWS header vulnerability in medical application.

## Current State Analysis
✅ **System Architecture**: Medical application uses PyJWT (2.10.1) for primary JWT authentication
✅ **Authlib Usage**: Not currently imported in main application code (only in test scripts)
✅ **Risk Level**: LOW - authlib appears to be a dependency rather than direct usage
✅ **Branch Created**: `security/authlib-1.6.4-update` for safe rollback

## Vulnerability Details
- **CVE-ID**: CVE-2025-59420
- **Severity**: CRITICAL
- **Component**: authlib 1.6.3 JWT/JWS header processing
- **Impact**: Authentication/Authorization bypass
- **Fix**: authlib 1.6.4

## Medical Application Context
- **Dr. Gasnelio**: Technical pharmacist persona authentication
- **Gá**: Empathetic assistant persona authentication
- **API Security**: Medication dispensing protocol endpoints
- **LGPD Compliance**: Brazilian data protection requirements
- **Users**: Medical professionals accessing hanseníase protocols

## Safe Update Strategy

### Phase 1: Dependency Analysis ✅
- [x] Confirmed authlib not directly imported in main code
- [x] Identified PyJWT as primary JWT library
- [x] Created rollback branch
- [x] Reviewed security update preparation

### Phase 2: Requirements Update (CURRENT)
- [ ] Add authlib==1.6.4 to requirements.txt
- [ ] Validate no breaking changes in dependency tree
- [ ] Test import compatibility

### Phase 3: Authentication Flow Validation
- [ ] Test persona authentication (Dr. Gasnelio, Gá)
- [ ] Validate medical API endpoints
- [ ] Check JWT token generation/validation
- [ ] Verify LGPD compliance maintained

### Phase 4: Production Readiness
- [ ] Run security tests
- [ ] Validate deployment readiness
- [ ] Create rollback procedure
- [ ] Document changes

## Implementation Steps

### 1. Requirements Update
```bash
# Add authlib to requirements.txt
authlib==1.6.4  # SECURITY UPDATE: CVE-2025-59420 fix
```

### 2. Dependency Validation
```bash
pip-compile requirements.txt
pip install -r requirements.txt --dry-run
```

### 3. Authentication Testing
```python
# Test persona authentication flows
curl -X POST /api/chat -H "Authorization: Bearer <token>" -d '{"message": "test", "persona": "dr_gasnelio"}'
curl -X POST /api/chat -H "Authorization: Bearer <token>" -d '{"message": "test", "persona": "ga"}'
```

### 4. API Security Validation
```bash
# Test protected endpoints
curl /api/health
curl /api/personas
curl /api/chat -H "Authorization: Bearer <valid_token>"
```

## Rollback Plan

### Immediate Rollback (if needed)
```bash
git checkout hml
git branch -D security/authlib-1.6.4-update
# Or revert requirements.txt to previous version
```

### Emergency Procedure
1. Revert requirements.txt
2. Redeploy previous version
3. Monitor authentication flows
4. Validate medical application functionality

## Success Criteria
- [ ] authlib 1.6.4 installed without conflicts
- [ ] All medical persona authentications working
- [ ] API endpoints remain secure
- [ ] LGPD compliance maintained
- [ ] No regression in medical application functionality
- [ ] Security vulnerability CVE-2025-59420 resolved

## Testing Checklist
- [ ] JWT token creation/validation
- [ ] Dr. Gasnelio persona authentication
- [ ] Gá persona authentication
- [ ] Medical API endpoint access
- [ ] Rate limiting functionality
- [ ] Session management
- [ ] LGPD data handling compliance

## Risk Mitigation
- **Low Risk**: authlib not directly used in main code
- **Rollback Ready**: Safe branch for immediate revert
- **Incremental**: Phase-by-phase validation
- **Medical Safety**: Preserve all medical functionality
- **Compliance**: Maintain LGPD requirements

---
**Priority**: CRITICAL (Security vulnerability)
**Timeline**: Immediate (within 24 hours)
**Contact**: Development team for validation