#!/bin/bash

# Security Configuration Validation Script
# Validates that the security scanning configuration is properly set up
# and tests the false positive suppression system

set -e

echo "🛡️ Security Configuration Validation Script"
echo "============================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# Check if required tools are available
check_dependencies() {
    log_info "Checking dependencies..."

    local missing_deps=()

    if ! command -v gh &> /dev/null; then
        missing_deps+=("GitHub CLI (gh)")
    fi

    if ! command -v node &> /dev/null; then
        missing_deps+=("Node.js")
    fi

    if [ ${#missing_deps[@]} -ne 0 ]; then
        log_error "Missing dependencies: ${missing_deps[*]}"
        exit 1
    fi

    log_success "All dependencies available"
}

# Validate CodeQL configuration
validate_codeql_config() {
    log_info "Validating CodeQL configuration..."

    local config_file=".github/codeql-config.yml"

    if [ ! -f "$config_file" ]; then
        log_error "CodeQL config file not found: $config_file"
        return 1
    fi

    # Check for key sections
    if grep -q "paths-ignore:" "$config_file"; then
        log_success "Found paths-ignore configuration"
    else
        log_warning "No paths-ignore configuration found"
    fi

    if grep -q "filters:" "$config_file"; then
        log_success "Found filters configuration"
    else
        log_warning "No filters configuration found"
    fi

    # Count excluded patterns
    local excluded_patterns=$(grep -c "exclude:" "$config_file" || echo "0")
    log_info "Found $excluded_patterns exclusion patterns"

    log_success "CodeQL configuration validated"
}

# Validate Dependabot configuration
validate_dependabot_config() {
    log_info "Validating Dependabot configuration..."

    local config_file=".github/dependabot.yml"

    if [ ! -f "$config_file" ]; then
        log_error "Dependabot config file not found: $config_file"
        return 1
    fi

    # Check for security advisory configuration
    if grep -q "security-advisories:" "$config_file"; then
        log_success "Found security advisory configuration"
    else
        log_warning "No security advisory configuration found"
    fi

    # Check for ignore patterns
    if grep -q "ignore:" "$config_file"; then
        log_success "Found dependency ignore patterns"
    else
        log_warning "No dependency ignore patterns found"
    fi

    log_success "Dependabot configuration validated"
}

# Validate security workflows
validate_security_workflows() {
    log_info "Validating security workflows..."

    local workflow_dir=".github/workflows"
    local security_workflow="$workflow_dir/security-alert-management.yml"

    if [ ! -f "$security_workflow" ]; then
        log_error "Security alert management workflow not found"
        return 1
    fi

    # Check workflow permissions
    if grep -q "security-events: write" "$security_workflow"; then
        log_success "Security workflow has proper permissions"
    else
        log_warning "Security workflow may lack required permissions"
    fi

    log_success "Security workflows validated"
}

# Test false positive dismissal script
test_dismissal_script() {
    log_info "Testing false positive dismissal script..."

    local script_file=".github/scripts/dismiss-false-positives.js"

    if [ ! -f "$script_file" ]; then
        log_error "Dismissal script not found: $script_file"
        return 1
    fi

    # Test script syntax
    if node -c "$script_file" 2>/dev/null; then
        log_success "Dismissal script syntax is valid"
    else
        log_error "Dismissal script has syntax errors"
        return 1
    fi

    # Test script exports
    if node -e "const script = require('./$script_file'); console.log('Patterns:', script.FALSE_POSITIVE_PATTERNS.length)" 2>/dev/null; then
        log_success "Dismissal script exports are accessible"
    else
        log_warning "Dismissal script exports may not be properly configured"
    fi

    log_success "False positive dismissal script validated"
}

# Check current security alert status
check_current_alerts() {
    log_info "Checking current security alert status..."

    if ! gh auth status &> /dev/null; then
        log_warning "GitHub CLI not authenticated - skipping alert check"
        return 0
    fi

    # Try to get current alerts
    local alerts_count
    alerts_count=$(gh api "repos/$(gh repo view --json owner,name -q '.owner.login + "/" + .name')/code-scanning/alerts" --paginate 2>/dev/null | jq '. | length' || echo "unknown")

    if [ "$alerts_count" = "unknown" ]; then
        log_warning "Could not fetch current alert count (may require additional permissions)"
    else
        log_info "Current security alerts: $alerts_count"

        if [ "$alerts_count" -lt 50 ]; then
            log_success "Alert count is reasonable (< 50)"
        elif [ "$alerts_count" -lt 200 ]; then
            log_warning "Alert count is moderate ($alerts_count)"
        else
            log_warning "Alert count is high ($alerts_count) - configuration may need tuning"
        fi
    fi
}

# Generate configuration summary
generate_summary() {
    log_info "Generating configuration summary..."

    echo ""
    echo "📋 Security Configuration Summary"
    echo "================================="
    echo ""

    echo "🔧 Configuration Files:"
    echo "  • CodeQL Config: .github/codeql-config.yml"
    echo "  • Dependabot Config: .github/dependabot.yml"
    echo "  • Query Pack: .github/codeql-queries.yml"
    echo ""

    echo "🤖 Automation Scripts:"
    echo "  • Security Alert Management: .github/workflows/security-alert-management.yml"
    echo "  • False Positive Dismissal: .github/scripts/dismiss-false-positives.js"
    echo "  • Validation Script: .github/scripts/validate-security-config.sh"
    echo ""

    echo "🎯 Optimization Features:"
    echo "  • False positive pattern exclusion"
    echo "  • Aggressive path filtering for test files and dependencies"
    echo "  • Severity-based alert filtering"
    echo "  • Automated vulnerability dismissal"
    echo "  • Development dependency risk acceptance"
    echo ""

    echo "📊 Expected Results:"
    echo "  • ~80-90% reduction in false positive alerts"
    echo "  • Focus on critical and high-severity real vulnerabilities"
    echo "  • Automated processing of known false positive patterns"
    echo "  • Daily cleanup of newly generated false positives"
    echo ""

    log_success "Configuration summary generated"
}

# Provide next steps
provide_next_steps() {
    echo ""
    echo "🚀 Next Steps"
    echo "============="
    echo ""
    echo "1. 🔄 Run the security alert management workflow:"
    echo "   gh workflow run security-alert-management.yml"
    echo ""
    echo "2. 📊 Monitor alert reduction:"
    echo "   gh api repos/OWNER/REPO/code-scanning/alerts --paginate | jq '. | length'"
    echo ""
    echo "3. 🎯 Review remaining alerts for legitimate issues:"
    echo "   gh api repos/OWNER/REPO/code-scanning/alerts --paginate | jq '.[] | select(.state == \"open\")'"
    echo ""
    echo "4. 🔧 Fine-tune configuration if needed based on results"
    echo ""
    echo "5. 📅 Schedule regular reviews of the suppression patterns"
    echo ""
}

# Main execution
main() {
    echo "Starting security configuration validation..."
    echo ""

    check_dependencies
    validate_codeql_config
    validate_dependabot_config
    validate_security_workflows
    test_dismissal_script
    check_current_alerts

    echo ""
    log_success "All validation checks completed!"

    generate_summary
    provide_next_steps
}

# Run main function
main "$@"