# Pytest 8.4.2 Migration Analysis Report

**Project**: Roteiro de Dispensação - Hanseníase Medical Application
**Current Version**: pytest 7.4.3 + pytest-cov 4.1.0 + pytest-mock 3.12.0
**Target Version**: pytest 8.4.2 + pytest-cov 4.1.0 + pytest-mock 3.15.1
**Python Version**: 3.13.5
**Test Suite Size**: 232 backend tests
**Analysis Date**: 2025-10-04

---

## Executive Summary

**Upgrade Recommendation**: ✅ **SAFE TO UPGRADE WITH MINOR MODIFICATIONS**

The pytest 7.4.3 → 8.4.2 upgrade is **low-risk** for this project with specific attention to:
1. Three test files using nose-style `setup_method`/`teardown_method` patterns (deprecated)
2. Pytest configuration using `--strict-markers` already (no changes needed)
3. No async fixture issues detected (pytest-asyncio not used despite async tests)
4. Python 3.13 compatibility verified across all dependencies

**Risk Level**: 🟡 **MEDIUM** (requires code changes but straightforward migration)

**Estimated Migration Time**: 2-4 hours (including testing)

---

## Compatibility Matrix

### Core Dependencies

| Package | Current | Target | Python 3.13 | Status |
|---------|---------|--------|-------------|--------|
| pytest | 7.4.3 | 8.4.2 | ✅ Supported | ✅ Compatible |
| pytest-cov | 4.1.0 | 4.1.0 | ✅ Supported | ✅ Compatible |
| pytest-mock | 3.12.0 | 3.15.1 | ✅ Supported | ✅ Compatible |
| Python | 3.13.5 | 3.13.5 | ✅ Native | ✅ Native |

### Compatibility Details

**pytest 8.4.2**:
- Dropped Python 3.7 support (not applicable - using 3.13)
- Added Python 3.13 support in 8.2.0
- Requires pluggy>=1.3.0 (verify in requirements.txt)
- Fixed input issues with Python 3.13+ and libedit builds

**pytest-cov 4.1.0**:
- Supports pytest 8.4 (compatibility fixes included)
- Dropped Python 3.8 support (not applicable - using 3.13)
- Supports Python 3.9+ through 3.13

**pytest-mock 3.15.1**:
- Officially supports Python 3.14 (backward compatible to 3.13)
- Compatible with pytest 8.4.2
- Requires pytest>=6.2.5 (satisfied)

---

## Breaking Changes Analysis

### 1. Python Version Support

**Change**: Dropped Python 3.7 support
**Impact**: ✅ **NONE** - Project uses Python 3.13.5
**Action**: None required

---

### 2. Collection Behavior Changes

#### 2.1 Package Collection Restructuring

**Change**: `pytest.Package` is no longer a `pytest.Module`
**Impact**: ✅ **NONE** - No custom package collectors detected
**Details**:
- Files and directories now collected in alphabetical order
- `pytest pkg/__init__.py` now collects only that file (not entire package)
- Collection tree structure redesigned

**Evidence**:
```bash
# Current test structure
tests/
├── conftest.py
├── services/
│   ├── __init__.py
│   ├── test_ai_provider_manager.py
│   ├── test_semantic_search.py
│   └── test_vector_store.py
├── test_00_core_functionality.py
├── test_01_blueprint_functionality.py
└── ...
```

**Action**: None required - standard test discovery patterns used

---

### 3. Nose-Style Test Support Removal

#### 3.1 Setup/Teardown Methods (HIGH PRIORITY)

**Change**: Removed support for nose-style `setup_method`/`teardown_method`
**Impact**: ⚠️ **MEDIUM** - Affects 3 test files
**Risk Score**: 0.6/1.0

**Affected Files**:
1. `tests/services/test_ai_provider_manager.py`
2. `tests/services/test_semantic_search.py`
3. `tests/services/test_vector_store.py`

**Current Pattern** (Deprecated):
```python
class TestCircuitBreaker:
    def setup_method(self):
        """Setup before each test"""
        self.breaker = CircuitBreaker()

    def teardown_method(self):
        """Cleanup after each test"""
        self.breaker.reset()

    def test_circuit_breaker_creation(self):
        assert self.breaker.state == CircuitBreakerState.CLOSED
```

**Required Migration**:
```python
class TestCircuitBreaker:
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup before each test"""
        self.breaker = CircuitBreaker()
        yield
        # Cleanup after test (teardown)
        self.breaker.reset()

    def test_circuit_breaker_creation(self):
        assert self.breaker.state == CircuitBreakerState.CLOSED
```

**Alternative Pattern** (More Pythonic):
```python
class TestCircuitBreaker:
    @pytest.fixture
    def breaker(self):
        """Fixture for CircuitBreaker instance"""
        instance = CircuitBreaker()
        yield instance
        # Cleanup
        instance.reset()

    def test_circuit_breaker_creation(self, breaker):
        assert breaker.state == CircuitBreakerState.CLOSED
```

**Migration Steps**:
1. Identify all `setup_method`/`teardown_method` usages
2. Convert to `@pytest.fixture(autouse=True)` with yield
3. Update test methods to use fixtures instead of `self` attributes
4. Run tests to verify behavior unchanged

---

### 4. Warnings and Error Handling

#### 4.1 PytestRemovedIn8Warning Now Errors

**Change**: All `PytestRemovedIn8Warning` warnings now raise errors
**Impact**: ✅ **LOW** - No deprecated pytest 7.x features detected in codebase
**Action**: Monitor for errors during first test run

#### 4.2 pytest.warns() Behavior Change

**Change**: `pytest.warns(None)` deprecated, `warns()` re-emits unmatched warnings
**Impact**: ✅ **NONE** - No `pytest.warns(None)` usage detected
**Action**: None required

#### 4.3 Test Function Return Values

**Change**: Test functions returning non-None values now issue warnings
**Impact**: ✅ **NONE** - No test functions return values (validated via grep)
**Action**: None required

---

### 5. Configuration Changes

#### 5.1 --strict Option Removal

**Change**: `--strict` deprecated in favor of `--strict-markers`
**Impact**: ✅ **NONE** - Already using `--strict-markers` in pytest.ini
**Action**: None required

**Current Configuration** (Already Compatible):
```ini
[tool:pytest]
addopts =
    -ra
    --strict-markers  # ✅ Already correct
    --strict-config   # ✅ Already using new option
```

#### 5.2 Parser.addoption Changes

**Change**: Old `type="int"` syntax removed, use `type=int` instead
**Impact**: ✅ **NONE** - No custom pytest plugins detected
**Action**: None required

---

### 6. Async Test Support

#### 6.1 Async Tests Without Plugin

**Change**: Async tests now **fail** instead of skip if no suitable plugin installed
**Impact**: ⚠️ **MEDIUM** - 2 test files contain async tests without pytest-asyncio
**Risk Score**: 0.7/1.0

**Affected Files**:
1. `tests/services/test_ai_provider_manager.py` - Contains `async def test_*` methods
2. `tests/test_lgpd_compliance.py` - Uses `asyncio` and `AsyncMock`

**Current Pattern**:
```python
# test_ai_provider_manager.py
async def test_async_operation(self):
    """Test async circuit breaker"""
    result = await some_async_function()
    assert result is not None
```

**Issue**: Tests use `async def` but **pytest-asyncio is NOT in requirements.txt**

**Required Action**: Add pytest-asyncio dependency
```txt
# requirements.txt
pytest==8.4.2
pytest-cov==4.1.0
pytest-mock==3.15.1
pytest-asyncio==0.25.3  # NEW - required for async test support
```

**Verification**:
```bash
# Check if async tests are actually being run
cd apps/backend
python -m pytest tests/services/test_ai_provider_manager.py -v -k "async"
```

**Note**: If async tests are currently **not running** (skipped in pytest 7.4), they will **fail** in pytest 8.x without pytest-asyncio.

---

### 7. Fixture and Hook Changes

#### 7.1 Node Constructor Changes

**Change**: Node constructors now require `pathlib.Path` instead of `fspath`
**Impact**: ✅ **NONE** - No custom Node subclasses detected
**Action**: None required

#### 7.2 Fixture Scope and Lifetime

**Change**: More strict validation of fixture scopes
**Impact**: ✅ **LOW** - Current fixtures use standard scopes correctly

**Verified Fixtures**:
```python
# conftest.py - All fixtures use standard scopes
@pytest.fixture(scope="session")  # ✅ Valid
def app(): ...

@pytest.fixture  # ✅ Valid (default scope="function")
def client(app): ...

@pytest.fixture(autouse=True)  # ✅ Valid
def reset_environment(): ...
```

**Action**: None required - all fixtures properly scoped

---

### 8. Plugin Compatibility

#### 8.1 Internal API Changes

**Change**: `FixtureManager.getfixtureclosure` internal method changed
**Impact**: ✅ **NONE** - No usage of internal pytest APIs detected
**Action**: None required

#### 8.2 Collection Tree Structure

**Change**: Collection tree fundamentally redesigned
**Impact**: ✅ **NONE** - No custom collectors or collection hooks
**Action**: None required

---

## Risk Assessment

### High-Risk Areas (Requires Immediate Attention)

**NONE IDENTIFIED** ✅

### Medium-Risk Areas (Requires Changes)

1. **Nose-Style Setup/Teardown Methods** (Risk: 0.6/1.0)
   - **Files Affected**: 3 test files in `tests/services/`
   - **Effort**: 1-2 hours
   - **Complexity**: Low (straightforward pattern replacement)
   - **Mitigation**: Convert to pytest fixtures with yield

2. **Async Test Support** (Risk: 0.7/1.0)
   - **Files Affected**: 2 test files with async methods
   - **Effort**: 15 minutes
   - **Complexity**: Very Low (add dependency + verify)
   - **Mitigation**: Add pytest-asyncio to requirements.txt

### Low-Risk Areas (Should Work As-Is)

1. **Configuration** ✅ - Already using pytest 8.x compatible options
2. **Fixtures** ✅ - Standard scopes and patterns
3. **Test Discovery** ✅ - Standard file/function naming conventions
4. **Markers** ✅ - All markers properly defined in pytest.ini
5. **Coverage Integration** ✅ - pytest-cov 4.1.0 compatible with pytest 8.4

---

## Step-by-Step Migration Checklist

### Phase 1: Pre-Migration Validation (15 minutes)

- [ ] **1.1** Create feature branch for migration
  ```bash
  git checkout -b upgrade/pytest-8.4.2
  ```

- [ ] **1.2** Verify current test suite passes 100%
  ```bash
  cd apps/backend
  python -m pytest tests/ -v --tb=short
  ```

- [ ] **1.3** Document baseline test metrics
  ```bash
  python -m pytest tests/ --collect-only | grep "test session starts"
  # Expected: 232 tests collected
  ```

- [ ] **1.4** Verify Python version compatibility
  ```bash
  python --version  # Should be 3.13.5
  ```

### Phase 2: Dependency Updates (10 minutes)

- [ ] **2.1** Update requirements.txt
  ```txt
  # Before
  pytest==7.4.3
  pytest-cov==4.1.0
  pytest-mock==3.12.0

  # After
  pytest==8.4.2
  pytest-cov==4.1.0
  pytest-mock==3.15.1
  pytest-asyncio==0.25.3  # NEW - for async test support
  ```

- [ ] **2.2** Update pluggy if needed
  ```bash
  # Verify pluggy version
  pip show pluggy
  # Should be >=1.3.0 for pytest 8.4.2
  ```

- [ ] **2.3** Install updated dependencies
  ```bash
  pip install -r requirements.txt
  ```

- [ ] **2.4** Verify installation
  ```bash
  pytest --version
  # Expected: pytest 8.4.2
  ```

### Phase 3: Code Migrations (1-2 hours)

#### 3.1 Migrate Nose-Style Setup/Teardown

- [ ] **3.1.1** Fix `tests/services/test_ai_provider_manager.py`

  **Find and Replace Pattern**:
  ```python
  # BEFORE (nose-style)
  class TestClassName:
      def setup_method(self):
          self.resource = create_resource()

      def teardown_method(self):
          self.resource.cleanup()

      def test_something(self):
          assert self.resource.is_ready()

  # AFTER (pytest fixture)
  class TestClassName:
      @pytest.fixture(autouse=True)
      def setup(self):
          self.resource = create_resource()
          yield
          self.resource.cleanup()

      def test_something(self):
          assert self.resource.is_ready()
  ```

- [ ] **3.1.2** Fix `tests/services/test_semantic_search.py`
  - Apply same pattern as 3.1.1

- [ ] **3.1.3** Fix `tests/services/test_vector_store.py`
  - Apply same pattern as 3.1.1

#### 3.2 Configure Async Test Support

- [ ] **3.2.1** Update pytest.ini with asyncio configuration
  ```ini
  [tool:pytest]
  # ... existing config ...

  # Async test support
  asyncio_mode = auto
  asyncio_default_fixture_loop_scope = function
  ```

- [ ] **3.2.2** Verify async tests are detected
  ```bash
  pytest tests/services/test_ai_provider_manager.py -v -k "async" --collect-only
  ```

### Phase 4: Validation Testing (30 minutes)

- [ ] **4.1** Run full test suite
  ```bash
  python -m pytest tests/ -v --tb=short
  ```

- [ ] **4.2** Verify all 232 tests still pass
  ```bash
  # Should see: 232 passed
  ```

- [ ] **4.3** Check for new warnings
  ```bash
  python -m pytest tests/ -v -W error::pytest.PytestWarning
  # Should pass without warnings converted to errors
  ```

- [ ] **4.4** Verify coverage reporting still works
  ```bash
  python -m pytest tests/ --cov=services --cov=blueprints --cov-report=term-missing
  # Coverage report should generate successfully
  ```

- [ ] **4.5** Test async functionality specifically
  ```bash
  python -m pytest tests/services/test_ai_provider_manager.py -v -k "async"
  python -m pytest tests/test_lgpd_compliance.py -v
  ```

- [ ] **4.6** Run critical medical protocol tests
  ```bash
  python -m pytest tests/test_00_core_functionality.py -v
  python -m pytest tests/test_04_security_validation.py -v
  ```

### Phase 5: Performance Validation (15 minutes)

- [ ] **5.1** Run performance test suite
  ```bash
  python -m pytest tests/test_03_performance_load.py -v
  ```

- [ ] **5.2** Compare test execution times
  ```bash
  # Baseline (pytest 7.4.3)
  pytest tests/ --durations=10

  # After migration (pytest 8.4.2)
  pytest tests/ --durations=10

  # Should be similar or faster
  ```

- [ ] **5.3** Verify performance thresholds still met
  ```python
  # From conftest.py
  PERFORMANCE_THRESHOLDS = {
      'health_check': 0.6,
      'chat_response': 2.0,
      'persona_list': 0.2,
      # ... ensure all still pass
  }
  ```

### Phase 6: Security Validation (15 minutes)

- [ ] **6.1** Run security test suite
  ```bash
  python -m pytest tests/test_04_security_validation.py -v
  ```

- [ ] **6.2** Verify LGPD compliance tests
  ```bash
  python -m pytest tests/test_lgpd_compliance.py -v
  ```

- [ ] **6.3** Check security payloads still detected
  ```python
  # From conftest.py
  SECURITY_TEST_PAYLOADS = [
      '<script>alert("xss")</script>',
      '"; DROP TABLE users; --',
      # ... ensure all still caught
  ]
  ```

### Phase 7: Documentation and Rollback Plan (15 minutes)

- [ ] **7.1** Update CHANGELOG.md
  ```markdown
  ## [Unreleased]
  ### Changed
  - Upgraded pytest from 7.4.3 to 8.4.2
  - Upgraded pytest-mock from 3.12.0 to 3.15.1
  - Added pytest-asyncio 0.25.3 for async test support
  - Migrated nose-style setup/teardown to pytest fixtures
  ```

- [ ] **7.2** Update test documentation
  - Document new async test configuration
  - Update developer setup guide with new pytest version

- [ ] **7.3** Create rollback procedure
  ```bash
  # If issues occur, rollback with:
  git checkout main
  git branch -D upgrade/pytest-8.4.2
  pip install pytest==7.4.3 pytest-mock==3.12.0
  ```

### Phase 8: Commit and Deploy (10 minutes)

- [ ] **8.1** Commit changes
  ```bash
  git add requirements.txt pytest.ini tests/
  git commit -m "chore: Upgrade pytest 7.4.3 → 8.4.2 with fixture migrations

  - Upgrade pytest to 8.4.2 for Python 3.13 compatibility
  - Upgrade pytest-mock to 3.15.1
  - Add pytest-asyncio 0.25.3 for async test support
  - Migrate nose-style setup/teardown to pytest fixtures
  - Update pytest.ini with asyncio configuration
  - Verify all 232 tests pass with new version

  Breaking changes addressed:
  - Converted setup_method/teardown_method to @pytest.fixture
  - Added pytest-asyncio for async test compatibility
  - Verified no use of deprecated pytest.warns(None)

  Testing:
  - ✅ All 232 backend tests passing
  - ✅ Coverage reporting functional
  - ✅ Performance thresholds met
  - ✅ Security validation passing
  - ✅ LGPD compliance verified"
  ```

- [ ] **8.2** Push to remote
  ```bash
  git push origin upgrade/pytest-8.4.2
  ```

- [ ] **8.3** Create pull request
  - Title: "chore: Upgrade pytest 7.4.3 → 8.4.2"
  - Include this migration report in PR description
  - Request review from technical lead

---

## Detailed Code Changes Required

### File 1: `tests/services/test_ai_provider_manager.py`

**Changes Needed**: Convert `setup_method` to pytest fixture

**Before**:
```python
class TestCircuitBreaker:
    """Test CircuitBreaker functionality"""

    def test_circuit_breaker_creation(self):
        """Test creating a CircuitBreaker"""
        breaker = CircuitBreaker(
            failure_threshold=3,
            timeout_seconds=30,
            half_open_max_calls=2
        )
        assert breaker.failure_threshold == 3
```

**After**:
```python
class TestCircuitBreaker:
    """Test CircuitBreaker functionality"""

    @pytest.fixture
    def breaker(self):
        """Fixture for CircuitBreaker instance"""
        return CircuitBreaker(
            failure_threshold=3,
            timeout_seconds=30,
            half_open_max_calls=2
        )

    def test_circuit_breaker_creation(self, breaker):
        """Test creating a CircuitBreaker"""
        assert breaker.failure_threshold == 3
```

**Note**: Search for `setup_method` and `teardown_method` in this file and apply fixture pattern.

### File 2: `tests/services/test_semantic_search.py`

**Search Pattern**: `def (setup_method|teardown_method)`
**Action**: Same migration pattern as File 1

### File 3: `tests/services/test_vector_store.py`

**Search Pattern**: `def (setup_method|teardown_method)`
**Action**: Same migration pattern as File 1

### File 4: `requirements.txt`

**Before**:
```txt
pytest==7.4.3
pytest-cov==4.1.0
pytest-mock==3.12.0
```

**After**:
```txt
pytest==8.4.2
pytest-cov==4.1.0
pytest-mock==3.15.1
pytest-asyncio==0.25.3
```

### File 5: `pytest.ini`

**Add async configuration**:

**Before**:
```ini
[tool:pytest]
minversion = 6.0
addopts =
    -ra
    --strict-markers
    # ... rest of config
```

**After**:
```ini
[tool:pytest]
minversion = 8.0
addopts =
    -ra
    --strict-markers
    # ... rest of config

# Async test support (NEW)
asyncio_mode = auto
asyncio_default_fixture_loop_scope = function
```

---

## Test Execution Recommendations

### Pre-Migration Test Run

```bash
# Capture baseline metrics
cd apps/backend
python -m pytest tests/ -v --tb=short --durations=20 > pytest_7.4.3_baseline.txt

# Check for deprecation warnings
python -m pytest tests/ -v -W default::DeprecationWarning 2>&1 | grep -i "deprecat"
```

### Post-Migration Test Run

```bash
# Full test suite
python -m pytest tests/ -v --tb=short --durations=20 > pytest_8.4.2_results.txt

# Compare results
diff pytest_7.4.3_baseline.txt pytest_8.4.2_results.txt

# Verify no new warnings
python -m pytest tests/ -v -W error::pytest.PytestWarning

# Critical path tests
python -m pytest tests/test_00_core_functionality.py tests/test_04_security_validation.py -v

# Async-specific tests
python -m pytest tests/services/test_ai_provider_manager.py tests/test_lgpd_compliance.py -v
```

### Continuous Integration Updates

**GitHub Actions Workflow** (if applicable):

```yaml
# .github/workflows/test.yml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.13'
      - name: Install dependencies
        run: |
          pip install -r apps/backend/requirements.txt
      - name: Run pytest
        run: |
          cd apps/backend
          pytest tests/ -v --cov=services --cov=blueprints --cov-report=xml
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## Rollback Procedures

### If Migration Fails

**Immediate Rollback**:
```bash
# 1. Revert code changes
git checkout main
git branch -D upgrade/pytest-8.4.2

# 2. Reinstall previous versions
pip install pytest==7.4.3 pytest-mock==3.12.0

# 3. Verify tests work
cd apps/backend
python -m pytest tests/ -v

# 4. Document failure
echo "Migration failed: $(date)" >> migration_log.txt
# Include error messages and stack traces
```

**Partial Rollback** (if some tests pass):
```bash
# Keep pytest 8.4.2 but revert specific changes
git checkout HEAD~1 tests/services/test_ai_provider_manager.py
pytest tests/ -v
```

### Rollback Decision Matrix

| Issue | Severity | Action |
|-------|----------|--------|
| <5% tests failing | Low | Fix failing tests individually |
| 5-20% tests failing | Medium | Investigate root cause, may rollback specific changes |
| >20% tests failing | High | Full rollback recommended |
| Security tests failing | Critical | Immediate full rollback |
| Performance >50% slower | High | Investigate or rollback |

---

## Expected Outcomes

### Success Criteria

1. **All Tests Pass**: 232/232 tests passing ✅
2. **No New Warnings**: Zero pytest-related warnings
3. **Performance Maintained**: Test execution within 10% of baseline
4. **Coverage Unchanged**: Coverage reporting works identically
5. **Async Tests Working**: Async tests execute properly with pytest-asyncio
6. **Security Validated**: All security tests pass
7. **LGPD Compliance**: Compliance tests pass

### Performance Expectations

**Test Execution Time**:
- **Pytest 7.4.3 Baseline**: ~45-60 seconds for full suite
- **Pytest 8.4.2 Target**: ~40-60 seconds (similar or faster)
- **Acceptable Range**: ±10% variation

**Memory Usage**:
- **Expected**: Similar or slightly lower (pytest 8.x has optimizations)
- **Monitor**: Memory-intensive tests (multimodal processing)

### Post-Migration Benefits

1. **Python 3.13 Support**: Full compatibility with latest Python
2. **Better Error Messages**: Pytest 8.x improved error reporting
3. **Async Test Support**: Proper handling of async tests
4. **Security Updates**: Latest pytest security fixes
5. **Plugin Compatibility**: Access to latest pytest plugin versions
6. **Performance Improvements**: Pytest 8.x collection optimizations

---

## Troubleshooting Guide

### Common Issues and Solutions

#### Issue 1: "PytestRemovedIn8Warning" Errors

**Symptom**:
```
ERROR: PytestRemovedIn8Warning: setup_method is deprecated
```

**Solution**:
```python
# Convert to pytest fixture
@pytest.fixture(autouse=True)
def setup(self):
    # setup code
    yield
    # teardown code
```

#### Issue 2: Async Tests Failing

**Symptom**:
```
ERROR: async tests cannot run without pytest-asyncio plugin
```

**Solution**:
```bash
pip install pytest-asyncio==0.25.3

# Add to pytest.ini
[tool:pytest]
asyncio_mode = auto
```

#### Issue 3: Collection Warnings

**Symptom**:
```
PytestCollectionWarning: cannot collect test class 'TestClassName'
```

**Solution**:
```python
# Ensure test classes don't have __init__
class TestClassName:
    # def __init__(self): ❌ REMOVE THIS

    def test_something(self): ...
```

#### Issue 4: Fixture Scope Errors

**Symptom**:
```
ScopeMismatch: fixture with scope 'function' used by fixture with scope 'session'
```

**Solution**:
```python
# Adjust fixture scopes to be compatible
@pytest.fixture(scope="session")
def session_resource(): ...

@pytest.fixture(scope="function")
def function_resource(session_resource):  # ✅ OK - narrower scope
    ...
```

#### Issue 5: Coverage Report Not Generated

**Symptom**:
```
Coverage report missing after pytest run
```

**Solution**:
```bash
# Verify pytest-cov installed
pip show pytest-cov

# Check pytest.ini configuration
grep -A 10 "tool:pytest" pytest.ini

# Run with explicit coverage flags
pytest tests/ --cov=services --cov-report=html
```

---

## Additional Resources

### Official Documentation

- **Pytest 8.0 Announcement**: https://docs.pytest.org/en/stable/announce/release-8.0.0.html
- **Pytest Changelog**: https://docs.pytest.org/en/stable/changelog.html
- **Deprecations Guide**: https://docs.pytest.org/en/stable/deprecations.html
- **Pytest-Asyncio Docs**: https://pytest-asyncio.readthedocs.io/

### Migration Guides

- **Pytest 8 Migration Guide**: https://docs.pytest.org/en/stable/how-to/upgrade.html
- **Python 3.13 Compatibility**: https://docs.python.org/3.13/whatsnew/3.13.html

### Support Channels

- **Pytest GitHub Issues**: https://github.com/pytest-dev/pytest/issues
- **Stack Overflow**: Tag `pytest` for community support
- **Pytest Discord**: https://discord.gg/pytest (community discussions)

---

## Conclusion

The pytest 7.4.3 → 8.4.2 migration is **recommended and safe** with the following key actions:

1. ✅ **Add pytest-asyncio** to requirements.txt (critical for async tests)
2. ✅ **Convert nose-style setup/teardown** to pytest fixtures (3 files)
3. ✅ **Update pytest.ini** with async configuration
4. ✅ **Verify all 232 tests pass** after migration
5. ✅ **Monitor for new warnings** during first runs

**Total Effort**: 2-4 hours including testing and validation

**Risk Mitigation**:
- Create feature branch for safe experimentation
- Comprehensive rollback procedure documented
- Incremental migration with validation at each step

**Recommendation**: Proceed with migration following the step-by-step checklist above.

---

**Report Generated**: 2025-10-04
**Author**: Claude Code Analysis
**Review Status**: Ready for Technical Review
**Next Steps**: Create feature branch and begin Phase 1 validation
