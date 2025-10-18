# Pytest 8.4.2 Migration Documentation Index

Complete migration documentation for upgrading pytest from 7.4.3 to 8.4.2 in the hanseníase medical application.

---

## 📚 Documentation Files

### 1. **Comprehensive Analysis Report**
**File**: `PYTEST_8_MIGRATION_ANALYSIS.md`
**Purpose**: Complete technical analysis and step-by-step migration guide
**Use When**: Need detailed information about breaking changes and migration steps

**Contents**:
- Executive summary with risk assessment
- Compatibility matrix for all dependencies
- Detailed breaking changes analysis
- 8-phase migration checklist
- Code change examples
- Troubleshooting guide
- Rollback procedures

**Audience**: Technical leads, senior developers performing the migration

---

### 2. **Quick Migration Guide**
**File**: `PYTEST_8_QUICK_MIGRATION_GUIDE.md`
**Purpose**: Fast-track migration for experienced developers
**Use When**: Need to migrate quickly without deep dive

**Contents**:
- 3-step migration process
- Critical files to change
- Validation checklist
- Common issues and fixes
- Quick rollback instructions

**Audience**: Developers familiar with pytest who need quick reference

---

### 3. **Migration Helper Script**
**File**: `../scripts/migrate_to_pytest8.py`
**Purpose**: Automated analysis and migration assistance
**Use When**: Want to identify affected files and preview changes

**Usage**:
```bash
# Preview changes (recommended first step)
python scripts/migrate_to_pytest8.py --dry-run

# Analyze specific file
python scripts/migrate_to_pytest8.py --file tests/services/test_ai_provider_manager.py --dry-run

# Scan all test files
python scripts/migrate_to_pytest8.py --tests-dir apps/backend/tests --dry-run
```

**Features**:
- Identifies files using nose-style patterns
- Previews required changes
- Provides migration recommendations
- Shows line numbers and code context

**Audience**: All developers performing the migration

---

## 🎯 Migration Path Selection

### Path A: Quick Migration (2-3 hours)
**Best For**: Experienced pytest users, time-constrained scenarios

1. Read `PYTEST_8_QUICK_MIGRATION_GUIDE.md`
2. Run migration script with `--dry-run`
3. Apply the 3-step process
4. Run validation tests
5. Done

**Files Needed**:
- `PYTEST_8_QUICK_MIGRATION_GUIDE.md`
- `migrate_to_pytest8.py`

---

### Path B: Comprehensive Migration (3-4 hours)
**Best For**: First-time pytest upgrade, critical applications, learning opportunity

1. Read `PYTEST_8_MIGRATION_ANALYSIS.md` executive summary
2. Run migration script with `--dry-run`
3. Follow 8-phase checklist in analysis report
4. Document any deviations
5. Create pull request with detailed description
6. Done

**Files Needed**:
- `PYTEST_8_MIGRATION_ANALYSIS.md` (primary reference)
- `PYTEST_8_QUICK_MIGRATION_GUIDE.md` (quick reference)
- `migrate_to_pytest8.py` (analysis tool)

---

### Path C: Assisted Migration (4-6 hours)
**Best For**: New to pytest, unfamiliar with testing frameworks, maximum safety

1. Read both migration guides completely
2. Run migration script and save output
3. Follow comprehensive checklist with validation after each step
4. Pair program or request code review for changes
5. Extensive testing before commit
6. Done

**Files Needed**: All documentation files

---

## 📊 Quick Reference Tables

### Files Requiring Changes

| File | Type | Change Required | Complexity |
|------|------|----------------|------------|
| `requirements.txt` | Dependency | Update versions | ⭐ Easy |
| `pytest.ini` | Config | Add async config | ⭐ Easy |
| `test_ai_provider_manager.py` | Test | Convert fixtures | ⭐⭐ Medium |
| `test_semantic_search.py` | Test | Convert fixtures | ⭐⭐ Medium |
| `test_vector_store.py` | Test | Convert fixtures | ⭐⭐ Medium |

### Risk Assessment by Component

| Component | Risk Level | Mitigation |
|-----------|------------|------------|
| Dependencies | 🟢 Low | Versions verified compatible |
| Configuration | 🟢 Low | Minimal changes needed |
| Test Files | 🟡 Medium | Clear pattern to follow |
| Async Tests | 🟡 Medium | Add pytest-asyncio |
| Performance | 🟢 Low | Should be similar or better |
| Rollback | 🟢 Low | Simple git revert available |

### Validation Checkpoints

| Checkpoint | Command | Success Criteria |
|------------|---------|------------------|
| All tests pass | `pytest tests/ -v` | 232/232 passed |
| No warnings | `pytest tests/ -W error::pytest.PytestWarning` | Zero warnings |
| Coverage works | `pytest tests/ --cov=services` | Report generated |
| Async tests run | `pytest tests/ -k "async" -v` | Tests execute (not skip) |
| Performance OK | `pytest tests/ --durations=10` | Within 10% baseline |

---

## 🔧 Command Quick Reference

### Pre-Migration

```bash
# Verify current version
pytest --version

# Run baseline tests
pytest tests/ -v --tb=short > baseline_pytest_7.4.3.txt

# Check for deprecation warnings
pytest tests/ -W default::DeprecationWarning

# Analyze affected files
python scripts/migrate_to_pytest8.py --dry-run
```

### During Migration

```bash
# Install new versions
pip install -r requirements.txt

# Verify installation
pytest --version  # Should show 8.4.2

# Test individual files after changes
pytest tests/services/test_ai_provider_manager.py -v

# Run full suite
pytest tests/ -v
```

### Post-Migration

```bash
# Full validation
pytest tests/ -v --tb=short

# Check for warnings
pytest tests/ -W error::pytest.PytestWarning

# Verify coverage
pytest tests/ --cov=services --cov=blueprints --cov-report=html

# Performance check
pytest tests/ --durations=20

# Critical path validation
pytest tests/test_00_core_functionality.py tests/test_04_security_validation.py -v
```

### Rollback (if needed)

```bash
# Revert code
git checkout main
git branch -D upgrade/pytest-8.4.2

# Reinstall old versions
pip install pytest==7.4.3 pytest-mock==3.12.0

# Verify rollback
pytest tests/ -v
```

---

## 📝 Migration Checklist

Print this checklist and check off items as you complete them:

- [ ] Read appropriate migration guide for your path
- [ ] Create feature branch `upgrade/pytest-8.4.2`
- [ ] Run baseline tests and save output
- [ ] Run migration script with `--dry-run`
- [ ] Update `requirements.txt`
- [ ] Update `pytest.ini`
- [ ] Convert test file #1: `test_ai_provider_manager.py`
- [ ] Convert test file #2: `test_semantic_search.py`
- [ ] Convert test file #3: `test_vector_store.py`
- [ ] Install new dependencies
- [ ] Run full test suite
- [ ] Verify 232/232 tests pass
- [ ] Check for warnings
- [ ] Verify coverage reporting works
- [ ] Test async functionality
- [ ] Run performance validation
- [ ] Run security validation
- [ ] Update CHANGELOG.md
- [ ] Commit changes with detailed message
- [ ] Create pull request
- [ ] Request code review
- [ ] Merge after approval

---

## 🆘 Troubleshooting Quick Links

### Issue: "setup_method is deprecated"
**Solution**: See Section 3 in `PYTEST_8_MIGRATION_ANALYSIS.md`
**Quick Fix**: Convert to `@pytest.fixture(autouse=True)` with yield

### Issue: "async tests cannot run"
**Solution**: See Section 6.1 in `PYTEST_8_MIGRATION_ANALYSIS.md`
**Quick Fix**: Install `pytest-asyncio==0.25.3`

### Issue: Tests slower than before
**Solution**: See Performance Validation in `PYTEST_8_MIGRATION_ANALYSIS.md`
**Quick Fix**: Check `--durations=10` output for bottlenecks

### Issue: Coverage report not generated
**Solution**: See Troubleshooting Guide in `PYTEST_8_MIGRATION_ANALYSIS.md`
**Quick Fix**: Verify `pytest-cov` installed and config correct

---

## 📈 Success Metrics

After migration, verify these metrics:

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Tests passing | 232/232 (100%) | `pytest tests/ -v` |
| Warnings | 0 | `pytest tests/ -W error::pytest.PytestWarning` |
| Coverage | No decrease | `pytest tests/ --cov-report=term` |
| Performance | ±10% of baseline | `pytest tests/ --durations=20` |
| Security tests | All passing | `pytest tests/test_04_security_validation.py` |
| LGPD compliance | All passing | `pytest tests/test_lgpd_compliance.py` |

---

## 🔗 External Resources

- **Pytest 8.0 Release Notes**: https://docs.pytest.org/en/stable/announce/release-8.0.0.html
- **Pytest Changelog**: https://docs.pytest.org/en/stable/changelog.html
- **Pytest-Asyncio Docs**: https://pytest-asyncio.readthedocs.io/
- **Python 3.13 What's New**: https://docs.python.org/3.13/whatsnew/3.13.html

---

## 📞 Support

If you encounter issues not covered in the documentation:

1. Check the Troubleshooting Guide in `PYTEST_8_MIGRATION_ANALYSIS.md`
2. Run the migration script with `--dry-run` for detailed analysis
3. Review pytest's official documentation
4. Search pytest GitHub issues for similar problems
5. Create detailed issue report with error messages and stack traces

---

## 📅 Migration Timeline

**Recommended Schedule**:

| Day | Activity | Duration |
|-----|----------|----------|
| Day 1 | Read documentation, run analysis script | 1 hour |
| Day 1 | Update dependencies and config | 30 min |
| Day 1 | Convert test files | 1-2 hours |
| Day 1 | Run validation tests | 30 min |
| Day 2 | Code review and refinement | 1 hour |
| Day 2 | Final validation and commit | 30 min |

**Total Estimated Time**: 4-6 hours spread over 1-2 days

---

**Last Updated**: 2025-10-04
**Documentation Version**: 1.0
**Target pytest Version**: 8.4.2
**Compatibility**: Python 3.13.5
