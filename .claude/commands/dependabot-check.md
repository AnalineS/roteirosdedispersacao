# Dependabot Check Command

Check and manage dependencies with medical platform compliance.

## Usage
`/dependabot-check [--security-only] [--auto-approve]`

## Function
```javascript
// Smart dependency analysis for medical platform
async function checkDependencies(options = {}) {
  const { securityOnly = false, autoApprove = false } = options;
  
  console.log("🤖 Claude analyzing dependencies for medical platform...");
  
  // Check for security updates
  if (securityOnly) {
    console.log("🔒 Focusing on security-critical updates only");
    // Run security-specific checks
    await runSecurityScan();
    return;
  }
  
  // Comprehensive dependency check
  const analysis = await analyzeDependencies();
  
  // Medical platform specific checks
  const medicalCompliance = await checkMedicalCompliance(analysis);
  
  if (medicalCompliance.hasIssues) {
    console.log("⚠️ Medical compliance issues detected:");
    medicalCompliance.issues.forEach(issue => {
      console.log(`  - ${issue.package}: ${issue.description}`);
    });
  }
  
  // LGPD compliance check
  const lgpdCompliance = await checkLGPDCompliance(analysis);
  
  if (autoApprove && analysis.canAutoApprove) {
    console.log("✅ Auto-approving safe updates...");
    await autoApproveSafeUpdates(analysis.safeUpdates);
  }
  
  // Generate report
  generateDependencyReport({
    analysis,
    medicalCompliance,
    lgpdCompliance,
    timestamp: new Date().toISOString()
  });
}

async function runSecurityScan() {
  // Focus on security vulnerabilities
  console.log("🔍 Scanning for security vulnerabilities...");
  
  // Check critical packages for medical platform
  const criticalPackages = [
    'react', 'next', 'firebase', 'supabase',
    'flask', 'cryptography', 'PyJWT'
  ];
  
  for (const pkg of criticalPackages) {
    await checkPackageSecurity(pkg);
  }
}

async function checkMedicalCompliance(analysis) {
  // Ensure dependencies don't break medical functionality
  const medicalCritical = [
    'firebase', 'supabase',  // Data storage for medical records
    'react', 'next',        // UI for medical interfaces
    'cryptography',         // LGPD data protection
    'flask'                 // Backend medical APIs
  ];
  
  const issues = [];
  
  for (const dep of analysis.updates) {
    if (medicalCritical.includes(dep.package)) {
      if (dep.changeType === 'major') {
        issues.push({
          package: dep.package,
          description: 'Major version change may affect medical functionality',
          severity: 'high'
        });
      }
    }
  }
  
  return { hasIssues: issues.length > 0, issues };
}

async function checkLGPDCompliance(analysis) {
  // Ensure updates maintain LGPD compliance
  const lgpdCritical = ['cryptography', 'firebase', 'supabase'];
  
  const complianceIssues = analysis.updates
    .filter(dep => lgpdCritical.includes(dep.package))
    .filter(dep => dep.hasSecurityFix === false && dep.changeType === 'major');
    
  return {
    isCompliant: complianceIssues.length === 0,
    issues: complianceIssues
  };
}
```

## Medical Platform Integration
- ✅ **Security First**: Prioritizes security updates for medical data
- ✅ **LGPD Compliance**: Ensures data protection compliance
- ✅ **Medical Functionality**: Validates critical medical packages
- ✅ **Hanseníase Platform**: Specific checks for platform integrity

## Examples
```bash
# Check all dependencies
/dependabot-check

# Security-only check
/dependabot-check --security-only

# Auto-approve safe updates
/dependabot-check --auto-approve
```