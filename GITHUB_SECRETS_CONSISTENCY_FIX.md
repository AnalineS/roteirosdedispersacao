# GitHub Secrets Consistency Fix - Supabase Environment Variables

**Date**: 2025-10-19
**Status**: ✅ COMPLETED
**Impact**: Critical medical testing workflows + Production/Staging deployments

## Summary

Fixed inconsistent Supabase environment variable naming across GitHub Actions workflows to align with backend conventions and Supabase standards.

## Issues Identified

### Problem 1: Mixed Naming Conventions
- Workflows used `SUPABASE_PROJECT_URL` when backend expects `SUPABASE_URL`
- Workflows used `SUPABASE_PUBLISHABLE_KEY` when backend prefers `SUPABASE_ANON_KEY`
- Workflows used `SUPABASE_API_KEY` instead of `SUPABASE_SERVICE_KEY` for testing

### Problem 2: Wrong Key Type for Testing
- Medical validation tests need `SUPABASE_SERVICE_KEY` (full server-side access)
- Workflows were using `SUPABASE_API_KEY` (limited access)
- Could cause critical medical/PCDT/LGPD validation tests to fail

## Backend Environment Conventions

From `apps/backend/.env.example`:
```bash
SUPABASE_URL=https://your-project.supabase.co           # Primary URL (REQUIRED)
SUPABASE_ANON_KEY=your_supabase_anon_key                # Anonymous key (REQUIRED)
SUPABASE_SERVICE_KEY=your_supabase_service_key          # Server-side key (REQUIRED for testing)
SUPABASE_PROJECT_URL=https://your-project.supabase.co   # Alternative URL format
```

Backend code has fallback logic ([app_config.py:70-71](apps/backend/app_config.py#L70-L71)):
```python
SUPABASE_ANON_KEY: Optional[str] = os.getenv('SUPABASE_ANON_KEY') or os.getenv('SUPABASE_PUBLISHABLE_KEY')
SUPABASE_KEY: Optional[str] = os.getenv('SUPABASE_KEY') or os.getenv('SUPABASE_ANON_KEY') or os.getenv('SUPABASE_PUBLISHABLE_KEY')
```

## Available GitHub Secrets

✅ All required secrets exist in repository:

| Secret Name | Last Updated | Usage |
|-------------|--------------|-------|
| `SUPABASE_URL` | 2025-10-18 | ⭐ Primary project URL |
| `SUPABASE_ANON_KEY` | 2025-10-18 | ⭐ Anonymous/frontend access |
| `SUPABASE_SERVICE_KEY` | 2025-10-18 | ⭐ Server-side/testing access |
| `SUPABASE_PROJECT_URL` | 2025-08-30 | Alternative URL (deprecated) |
| `SUPABASE_PUBLISHABLE_KEY` | 2025-08-30 | Alternative anon key (deprecated) |
| `SUPABASE_API_KEY` | 2025-08-30 | Limited access (deprecated) |

## Changes Made

### File 1: `.github/workflows/post-security-update-validation.yml`

**Location**: Lines 189-193
**Purpose**: Critical medical functionality tests

**Before:**
```yaml
env:
  OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
  SUPABASE_URL: ${{ secrets.SUPABASE_PROJECT_URL }}  # ❌ Wrong secret
  SUPABASE_KEY: ${{ secrets.SUPABASE_API_KEY }}      # ❌ Wrong key type
```

**After:**
```yaml
env:
  OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
  SUPABASE_URL: ${{ secrets.SUPABASE_URL }}              # ✅ Correct
  SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }} # ✅ Correct
```

**Impact**:
- Dr. Gasnelio medical accuracy validation
- Gá empathetic safety messaging validation
- PCDT compliance tests
- LGPD compliance tests

### File 2: `.github/workflows/deploy-unified.yml`

**Location**: Lines 262-265 (secrets validation)
**Purpose**: Test real architecture connectivity

**Before:**
```yaml
env:
  SUPABASE_URL: ${{ secrets.SUPABASE_PROJECT_URL }}  # ❌ Wrong secret
  SUPABASE_KEY: ${{ secrets.SUPABASE_PUBLISHABLE_KEY }} # ❌ Deprecated name
```

**After:**
```yaml
env:
  SUPABASE_URL: ${{ secrets.SUPABASE_URL }}          # ✅ Correct
  SUPABASE_KEY: ${{ secrets.SUPABASE_ANON_KEY }}     # ✅ Standard name
```

**Location**: Lines 1195-1198 (backend deployment)
**Purpose**: Cloud Run backend environment variables

**Before:**
```yaml
--set-env-vars "OPENROUTER_API_KEY=${{ secrets.OPENROUTER_API_KEY }}" \
--set-env-vars "SUPABASE_PROJECT_URL=${{ secrets.SUPABASE_PROJECT_URL }}" \
--set-env-vars "SUPABASE_PUBLISHABLE_KEY=${{ secrets.SUPABASE_PUBLISHABLE_KEY }}" \
--set-env-vars "SUPABASE_DB_URL=${{ secrets.SUPABASE_DB_URL }}" \
```

**After:**
```yaml
--set-env-vars "OPENROUTER_API_KEY=${{ secrets.OPENROUTER_API_KEY }}" \
--set-env-vars "SUPABASE_URL=${{ secrets.SUPABASE_URL }}" \
--set-env-vars "SUPABASE_ANON_KEY=${{ secrets.SUPABASE_ANON_KEY }}" \
--set-env-vars "SUPABASE_DB_URL=${{ secrets.SUPABASE_DB_URL }}" \
```

**Impact**:
- Staging (HML) deployments
- Production deployments (when enabled)
- Environment variable consistency with backend code

## Why These Changes Are Safe

1. **Backend Fallback Logic**: Backend code supports both old and new names with proper fallback
2. **Secrets Exist**: All referenced secrets exist in GitHub repository
3. **More Recent Secrets**: New secrets (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_KEY`) updated 2025-10-18
4. **Standard Conventions**: Aligns with Supabase official terminology and backend `.env.example`
5. **Testing Context**: Service key is correct requirement for comprehensive backend testing

## Validation Checklist

- [x] Verified all GitHub secrets exist
- [x] Checked backend code for variable name usage
- [x] Confirmed backend has fallback logic for compatibility
- [x] Updated post-security-update-validation.yml
- [x] Updated deploy-unified.yml (secrets validation section)
- [x] Updated deploy-unified.yml (backend deployment section)
- [x] Verified no other workflows have similar issues
- [x] Documented changes

## Testing Recommendations

1. **Post-Security-Update Validation**:
   - Trigger workflow manually with `workflow_dispatch`
   - Verify medical validation tests pass
   - Check Supabase connectivity in test logs

2. **Deploy Workflow**:
   - Test on `hml` branch first (staging)
   - Verify backend health checks pass
   - Confirm Supabase vector search works

## Related Files

- [apps/backend/.env.example](apps/backend/.env.example) - Environment variable documentation
- [apps/backend/app_config.py](apps/backend/app_config.py) - Configuration with fallback logic
- [apps/backend/config/environment_config.py](apps/backend/config/environment_config.py) - Environment configuration

## References

- Supabase Documentation: Uses "anon key" terminology
- Backend `.env.example`: Documents `SUPABASE_ANON_KEY` as standard
- GitHub Secrets: More recent secrets align with standard naming
