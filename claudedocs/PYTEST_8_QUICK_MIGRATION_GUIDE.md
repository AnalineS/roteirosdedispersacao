# Pytest 8.4.2 Quick Migration Guide

**TL;DR**: Safe to upgrade. 2-4 hours effort. Medium risk with clear mitigation path.

---

## Quick Decision Matrix

| Question | Answer | Action |
|----------|--------|--------|
| Safe to upgrade? | ✅ YES | Proceed with migration |
| Breaking changes? | ⚠️ YES | 3 files need updates |
| Python 3.13 compatible? | ✅ YES | Fully supported |
| Test failures expected? | ⚠️ MAYBE | Async tests need pytest-asyncio |
| Rollback available? | ✅ YES | Simple git revert |

---

## 3-Step Quick Migration

### Step 1: Update Dependencies (5 minutes)

```bash
# Edit apps/backend/requirements.txt
pytest==8.4.2                  # was 7.4.3
pytest-mock==3.15.1           # was 3.12.0
pytest-asyncio==0.25.3        # NEW - required for async tests
```

```bash
pip install -r requirements.txt
pytest --version  # verify 8.4.2
```

### Step 2: Fix Nose-Style Tests (30 minutes)

**Convert setup_method/teardown_method to fixtures in 3 files:**

1. `tests/services/test_ai_provider_manager.py`
2. `tests/services/test_semantic_search.py`
3. `tests/services/test_vector_store.py`

**Pattern**:
```python
# BEFORE ❌
class TestSomething:
    def setup_method(self):
        self.obj = create_object()

    def teardown_method(self):
        self.obj.cleanup()

    def test_feature(self):
        assert self.obj.works()

# AFTER ✅
class TestSomething:
    @pytest.fixture(autouse=True)
    def setup(self):
        self.obj = create_object()
        yield
        self.obj.cleanup()

    def test_feature(self):
        assert self.obj.works()
```

### Step 3: Configure Async Support (5 minutes)

**Edit pytest.ini**, add at the end:

```ini
# Async test support
asyncio_mode = auto
asyncio_default_fixture_loop_scope = function
```

**Test it works**:
```bash
cd apps/backend
python -m pytest tests/ -v
# Expected: 232 passed
```

---

## Critical Files to Change

### 1. requirements.txt
```diff
- pytest==7.4.3
+ pytest==8.4.2
- pytest-mock==3.12.0
+ pytest-mock==3.15.1
+ pytest-asyncio==0.25.3
```

### 2. pytest.ini
```diff
  [tool:pytest]
- minversion = 6.0
+ minversion = 8.0
  addopts =
      -ra
      --strict-markers
      # ... existing config ...
+
+ # Async test support
+ asyncio_mode = auto
+ asyncio_default_fixture_loop_scope = function
```

### 3. Test Files with setup_method/teardown_method
- `tests/services/test_ai_provider_manager.py` → convert to fixtures
- `tests/services/test_semantic_search.py` → convert to fixtures
- `tests/services/test_vector_store.py` → convert to fixtures

---

## Validation Checklist

```bash
# ✅ All tests pass
pytest tests/ -v
# Expected: 232 passed

# ✅ No warnings
pytest tests/ -W error::pytest.PytestWarning

# ✅ Coverage works
pytest tests/ --cov=services --cov=blueprints

# ✅ Async tests run
pytest tests/services/test_ai_provider_manager.py -v -k "async"

# ✅ Critical tests pass
pytest tests/test_00_core_functionality.py tests/test_04_security_validation.py -v
```

---

## Rollback If Needed

```bash
# Instant rollback
git checkout main
pip install pytest==7.4.3 pytest-mock==3.12.0
pytest tests/ -v
```

---

## Common Issues

### "async tests cannot run"
**Fix**: Install pytest-asyncio
```bash
pip install pytest-asyncio==0.25.3
```

### "setup_method is deprecated"
**Fix**: Convert to pytest fixture (see Step 2 above)

### Tests slower than before
**Fix**: Should be similar speed. If >20% slower, investigate or rollback.

---

## Success Metrics

- ✅ 232/232 tests passing
- ✅ Zero pytest warnings
- ✅ Test time within 10% of baseline
- ✅ Coverage report generates
- ✅ All async tests execute

---

## Get Detailed Info

See full analysis: `claudedocs/PYTEST_8_MIGRATION_ANALYSIS.md`

---

**Estimated Time**: 2-4 hours total
**Difficulty**: Medium
**Risk**: Medium (with clear mitigation)
**Recommendation**: ✅ Proceed with migration
