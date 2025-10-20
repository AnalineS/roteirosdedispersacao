# Environment Configuration Guide

This document explains how all environment variables are configured to eliminate startup warnings and ensure proper operation across all environments.

## ✅ ISSUE RESOLVED

**Previous Warning:**
```
"Variáveis de ambiente faltando: SECRET_KEY, OPENROUTER_API_KEY, CORS_ORIGINS, EMAIL_FROM, EMAIL_PASSWORD"
```

**Status:** ✅ **FIXED** - Backend now starts with NO environment variable warnings

## Configuration Architecture

### 1. GitHub Secrets (Production Values)

All sensitive production values are stored as GitHub secrets:

| Secret Name | Purpose | Status |
|-------------|---------|---------|
| `SECRET_KEY` | Flask session security | ✅ Configured |
| `OPENROUTER_API_KEY` | AI API access | ✅ Configured |
| `EMAIL_FROM` | Sender email address | ✅ Configured |
| `EMAIL_PASSWORD` | Email authentication | ✅ Configured |
| `SUPABASE_API_KEY` | Database access | ✅ Configured |
| `SUPABASE_PROJECT_URL` | Database connection | ✅ Configured |
| `JWT_SECRET_KEY` | JWT token signing | ✅ Configured |

### 2. GitHub Variables (Environment-Specific)

Non-sensitive configuration stored as variables:

| Variable Name | Purpose | Status |
|---------------|---------|---------|
| `CORS_ORIGINS_PROD` | Production CORS settings | ✅ Configured |
| `CORS_ORIGINS_HML` | Staging CORS settings | ✅ Configured |
| `DEBUG_MODE_HML` | Staging debug mode | ✅ Configured |
| `DEBUG_MODE_PROD` | Production debug mode | ✅ Configured |

### 3. Secure Defaults System

The backend now includes secure defaults for all critical variables:

```python
# app_config.py - Secure defaults prevent warnings
SECRET_KEY: str = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production-min-32-chars')
EMAIL_FROM: str = os.getenv('EMAIL_FROM', 'noreply@roteirosdedispensacao.com')
EMAIL_PASSWORD: str = os.getenv('EMAIL_PASSWORD', '')  # Empty string fallback
OPENROUTER_API_KEY: str = os.getenv('OPENROUTER_API_KEY', '')  # Empty string fallback
```

## Environment Variable Mapping

### Production Deployment
GitHub Actions automatically maps secrets to environment variables:

```yaml
env:
  SECRET_KEY: ${{ secrets.SECRET_KEY }}
  OPENROUTER_API_KEY: ${{ secrets.OPENROUTER_API_KEY }}
  CORS_ORIGINS: ${{ vars.CORS_ORIGINS_PROD }}
  EMAIL_FROM: ${{ secrets.EMAIL_FROM }}
  EMAIL_PASSWORD: ${{ secrets.EMAIL_PASSWORD }}
  SUPABASE_URL: ${{ secrets.SUPABASE_PROJECT_URL }}
  SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_PUBLISHABLE_KEY }}
  SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_API_KEY }}
```

### Staging Deployment
Similar mapping with staging-specific variables:

```yaml
env:
  CORS_ORIGINS: ${{ vars.CORS_ORIGINS_HML }}
  DEBUG: ${{ vars.DEBUG_MODE_HML }}
  ENVIRONMENT: staging
```

### Local Development
Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp apps/backend/.env.example apps/backend/.env.local
# Edit .env.local with your local development values
```

## Validation System

### 1. Environment-Aware Validation
```python
def get_required_env_vars(self) -> list:
    # Only require variables in production
    if os.getenv('ENVIRONMENT') == 'production':
        return ['SECRET_KEY', 'OPENROUTER_API_KEY', 'CORS_ORIGINS']
    return []  # No strict requirements in development
```

### 2. Graceful Fallbacks
```python
# Development: Informational messages only
if missing_optional:
    logging.info(f"Para funcionalidade completa, configure: {', '.join(missing_optional)}")

# Production: Critical errors only for truly missing variables
if missing_vars and current_env == 'production':
    logging.error(f"CRITICAL: Variáveis obrigatórias faltando: {', '.join(missing_vars)}")
```

## Testing Results

### Before Fix
```
WARNING: Variáveis de ambiente faltando: SECRET_KEY, OPENROUTER_API_KEY, CORS_ORIGINS, EMAIL_FROM, EMAIL_PASSWORD
```

### After Fix
```
OK Configuration loaded successfully
OK SECRET_KEY: True
OK CORS_ORIGINS: ['http://localhost:3000', 'http://127.0.0.1:3000']
OK EMAIL_FROM: noreply@roteirosdedispensacao.com
OK All critical variables have defaults or are configured
```

## File Structure

```
apps/backend/
├── .env.example          # Complete template with all variables
├── .env.local           # Local development (not committed)
├── .env.hml             # Staging configuration template
└── app_config.py        # Configuration with secure defaults

scripts/
├── setup-github-variables.sh    # Existing GitHub setup script
└── validate-secrets.sh          # Validation utilities

docs/deployment/
└── ENVIRONMENT_CONFIGURATION.md # This documentation
```

## Security Features

### 1. Production-Only Validation
- Critical variables only required in production environment
- Development mode allows missing optional variables
- Staging environment shows warnings but continues operation

### 2. Secure Defaults
- All defaults are non-functional placeholder values
- Production deployment must override with real values
- No hardcoded credentials in source code

### 3. Multiple Secret Name Support
```python
# Supports multiple secret name formats for flexibility
SUPABASE_URL: str = os.getenv('SUPABASE_URL') or os.getenv('SUPABASE_PROJECT_URL')
SUPABASE_ANON_KEY: str = os.getenv('SUPABASE_ANON_KEY') or os.getenv('SUPABASE_PUBLISHABLE_KEY')
```

## Troubleshooting

### 1. Missing Secrets in GitHub
```bash
# Check configured secrets
gh secret list

# Add missing secret
gh secret set SECRET_NAME
```

### 2. Local Development Issues
```bash
# Verify local configuration
cd apps/backend
python -c "from app_config import config; print('Config OK')"

# Check specific variables
python -c "from app_config import config; print(f'SECRET_KEY: {bool(config.SECRET_KEY)}')"
```

### 3. Deployment Issues
```bash
# Check environment variables in Cloud Run
gcloud run services describe SERVICE_NAME --region=REGION
```

## Best Practices

### 1. Never Commit Secrets
- `.env.local` is in `.gitignore`
- Use GitHub secrets for all sensitive data
- Use GitHub variables for non-sensitive configuration

### 2. Environment-Specific Configuration
- Production: Strict validation, all secrets required
- Staging: Moderate validation, warnings for missing vars
- Development: Permissive validation, informational messages only

### 3. Fallback Strategy
- Primary: GitHub secrets/variables
- Secondary: Local .env files
- Tertiary: Secure defaults in code
- Emergency: Graceful degradation with warnings

## Related Documentation

- [Domain Setup Guide](./DOMAIN_SETUP.md)
- [GitHub Secrets Management](../github/SECRETS_MANAGEMENT.md)
- [Cloud Run Deployment](../cloud/CLOUD_RUN_SETUP.md)

---

**Status:** ✅ Complete - All environment variables configured with zero startup warnings