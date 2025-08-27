# 📁 Repository Structure

This repository has been organized for better maintainability and navigation.

## 📚 Documentation (/docs)

### /docs/deployment
- Firebase setup and configuration
- GitHub secrets management  
- Environment configuration guides

### /docs/security
- Security vulnerability reports
- Security logging configurations
- Snyk integration guides

### /docs/qa-reports
- Quality assurance reports
- Audit results
- Security automation reports

### /docs/user-guides
- User-facing documentation
- Feature planning documents
- UX transformation guides

### /docs/archived
- Legacy documentation
- Old release notes
- Deprecated guides

## 🔧 Scripts (/scripts)

### /scripts/deployment
- Environment deployment scripts
- Firebase setup automation
- Data seeding scripts

### /scripts/setup
- Initial configuration scripts
- GCP observability setup
- Permission management

### /scripts/maintenance
- Dashboard creation scripts
- Monitoring setup
- System maintenance tools

### /scripts/automation
- Security automation (CodeQL integration)
- Vulnerability scanning
- Automated reporting

## 🧪 Tests (/tests)

### /tests/backend
- Backend unit tests
- API endpoint tests
- Service layer tests

### /tests/frontend  
- Frontend component tests
- Integration tests
- E2E test suites

### /tests/integration
- Cross-system integration tests
- Scientific validation tests
- End-to-end workflows

### /tests/security
- Security validation tests
- Penetration testing scripts
- Vulnerability assessments

## 🚀 Usage Examples

### Running Tests
```bash
# Backend tests
cd tests/backend && python -m pytest

# Frontend tests  
cd apps/frontend-nextjs && npm test

# Integration tests
cd tests/integration && python -m pytest
```

### Deployment
```bash
# Deploy to HML
./scripts/deployment/deploy-hml.sh

# Run security automation
python scripts/automation/security_issues_safe.py
```

### Documentation
- Main documentation: /docs
- API documentation: /apps/backend/docs
- Component guides: /apps/frontend-nextjs/docs

---

**🔧 Maintained by:** Development Team  
**📅 Last Updated:** Tue, Aug 26, 2025  9:55:41 PM  
**🎯 Purpose:** Educational platform for hanseníase medication dispensing

