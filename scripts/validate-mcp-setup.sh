#!/bin/bash

# ============================================================================
# MCP Setup Validation Script
# Comprehensive validation of MCP servers setup across all environments
# Validates configuration, secrets, dependencies, and integration
# ============================================================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
VALIDATION_MODE="${1:-full}"
TARGET_ENV="${2:-all}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Validation results
declare -A VALIDATION_RESULTS
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNING_CHECKS=0

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
    ((PASSED_CHECKS++))
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
    ((WARNING_CHECKS++))
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    ((FAILED_CHECKS++))
}

log_check() {
    echo -e "${CYAN}[CHECK]${NC} $1"
    ((TOTAL_CHECKS++))
}

log_section() {
    echo -e "${PURPLE}[SECTION]${NC} $1"
    echo "$(printf '=%.0s' {1..60})"
}

# Record validation result
record_result() {
    local check_name="$1"
    local status="$2"
    local message="${3:-}"
    
    VALIDATION_RESULTS["$check_name"]="$status:$message"
}

# Check prerequisites
check_prerequisites() {
    log_section "Prerequisites Validation"
    
    local prerequisites=(
        "git:Git version control"
        "node:Node.js runtime"
        "npm:Node package manager"
        "jq:JSON processor"
        "gh:GitHub CLI"
    )
    
    for prereq in "${prerequisites[@]}"; do
        local cmd="${prereq%%:*}"
        local desc="${prereq##*:}"
        
        log_check "Checking $desc ($cmd)"
        
        if command -v "$cmd" >/dev/null 2>&1; then
            local version
            case "$cmd" in
                "node") version=$(node --version) ;;
                "npm") version=$(npm --version) ;;
                "git") version=$(git --version | cut -d' ' -f3) ;;
                "jq") version=$(jq --version) ;;
                "gh") version=$(gh --version | head -1 | cut -d' ' -f3) ;;
                *) version="installed" ;;
            esac
            log_success "$desc available: $version"
            record_result "prereq_$cmd" "pass" "$version"
        else
            log_error "$desc not found: $cmd"
            record_result "prereq_$cmd" "fail" "not_found"
        fi
    done
}

# Validate project structure
validate_project_structure() {
    log_section "Project Structure Validation"
    
    local required_files=(
        "mcp-config.json:MCP configuration"
        "scripts/mcp/testmaster-server.js:Test Master server"
        "scripts/health/context7.sh:Context7 health check"
        "scripts/health/postgres.sh:PostgreSQL health check"
        "scripts/tests/run_smoke.sh:Smoke test script"
        "scripts/gh/set_secrets.sh:Secrets management"
        "scripts/gh/check_env.sh:Environment validation"
        "scripts/postgres/setup-mcp-roles.sql:Database setup"
        ".github/workflows/mcp-setup.yml:MCP workflow"
        "docs/mcp-setup.md:Setup documentation"
        "docs/mcp-security-checklist.md:Security checklist"
    )
    
    for file_desc in "${required_files[@]}"; do
        local file="${file_desc%%:*}"
        local desc="${file_desc##*:}"
        
        log_check "Checking $desc"
        
        if [[ -f "$PROJECT_ROOT/$file" ]]; then
            log_success "$desc found: $file"
            record_result "structure_${file//\//_}" "pass" "found"
            
            # Additional checks for specific files
            case "$file" in
                "mcp-config.json")
                    if jq empty "$PROJECT_ROOT/$file" 2>/dev/null; then
                        log_success "MCP config JSON is valid"
                        record_result "structure_mcp_config_valid" "pass" "valid_json"
                    else
                        log_error "MCP config JSON is invalid"
                        record_result "structure_mcp_config_valid" "fail" "invalid_json"
                    fi
                    ;;
                "scripts/mcp/testmaster-server.js")
                    if node -c "$PROJECT_ROOT/$file" 2>/dev/null; then
                        log_success "Test Master server syntax is valid"
                        record_result "structure_testmaster_syntax" "pass" "valid_syntax"
                    else
                        log_error "Test Master server syntax error"
                        record_result "structure_testmaster_syntax" "fail" "syntax_error"
                    fi
                    ;;
            esac
        else
            log_error "$desc not found: $file"
            record_result "structure_${file//\//_}" "fail" "not_found"
        fi
    done
    
    # Check script permissions
    local scripts=(
        "scripts/health/context7.sh"
        "scripts/health/postgres.sh"
        "scripts/tests/run_smoke.sh"
        "scripts/gh/set_secrets.sh"
        "scripts/gh/check_env.sh"
    )
    
    for script in "${scripts[@]}"; do
        log_check "Checking executable permissions: $script"
        
        if [[ -x "$PROJECT_ROOT/$script" ]]; then
            log_success "Script is executable: $script"
            record_result "perms_${script//\//_}" "pass" "executable"
        else
            log_warning "Script not executable: $script"
            record_result "perms_${script//\//_}" "warn" "not_executable"
        fi
    done
}

# Validate MCP configuration
validate_mcp_configuration() {
    log_section "MCP Configuration Validation"
    
    local config_file="$PROJECT_ROOT/mcp-config.json"
    
    if [[ ! -f "$config_file" ]]; then
        log_error "MCP configuration file not found"
        return 1
    fi
    
    # Validate JSON structure
    log_check "Validating MCP configuration JSON structure"
    if jq empty "$config_file" 2>/dev/null; then
        log_success "MCP configuration JSON is valid"
        record_result "config_json_valid" "pass" "valid"
    else
        log_error "MCP configuration JSON is invalid"
        record_result "config_json_valid" "fail" "invalid"
        return 1
    fi
    
    # Check required sections
    local required_sections=(
        "mcpServers:MCP servers configuration"
        "global_config:Global configuration"
        "environments:Environment settings"
    )
    
    for section_desc in "${required_sections[@]}"; do
        local section="${section_desc%%:*}"
        local desc="${section_desc##*:}"
        
        log_check "Checking $desc section"
        
        if jq -e ".$section" "$config_file" >/dev/null; then
            log_success "$desc section found"
            record_result "config_section_$section" "pass" "found"
        else
            log_error "$desc section missing"
            record_result "config_section_$section" "fail" "missing"
        fi
    done
    
    # Check MCP servers
    local mcp_servers=("context7" "testmaster" "postgres")
    
    for server in "${mcp_servers[@]}"; do
        log_check "Checking $server MCP server configuration"
        
        if jq -e ".mcpServers.$server" "$config_file" >/dev/null; then
            log_success "$server MCP server configured"
            record_result "config_server_$server" "pass" "configured"
            
            # Check server-specific requirements
            local required_fields=("command" "env" "description" "security")
            for field in "${required_fields[@]}"; do
                if jq -e ".mcpServers.$server.$field" "$config_file" >/dev/null; then
                    log_success "$server.$field configured"
                    record_result "config_${server}_${field}" "pass" "configured"
                else
                    log_warning "$server.$field not configured"
                    record_result "config_${server}_${field}" "warn" "missing"
                fi
            done
        else
            log_error "$server MCP server not configured"
            record_result "config_server_$server" "fail" "missing"
        fi
    done
    
    # Validate security settings
    log_check "Checking security configuration"
    
    local security_checks=(
        "mcpServers.context7.security.require_auth"
        "mcpServers.testmaster.security.api_key_required"
        "mcpServers.postgres.security.ssl_required"
        "global_config.audit.enabled"
    )
    
    for check in "${security_checks[@]}"; do
        if jq -e ".$check == true" "$config_file" >/dev/null; then
            log_success "Security setting enabled: $check"
            record_result "security_${check//\./_}" "pass" "enabled"
        else
            log_warning "Security setting not enabled: $check"
            record_result "security_${check//\./_}" "warn" "disabled"
        fi
    done
}

# Validate GitHub authentication and repository
validate_github_setup() {
    log_section "GitHub Setup Validation"
    
    # Check GitHub CLI authentication
    log_check "Checking GitHub CLI authentication"
    
    if gh auth status >/dev/null 2>&1; then
        local username
        username=$(gh api user --jq '.login' 2>/dev/null || echo "unknown")
        log_success "GitHub CLI authenticated as: $username"
        record_result "github_auth" "pass" "$username"
    else
        log_error "GitHub CLI not authenticated"
        record_result "github_auth" "fail" "not_authenticated"
        return 1
    fi
    
    # Check repository information
    log_check "Checking repository information"
    
    if repo_info=$(gh repo view --json owner,name 2>/dev/null); then
        local owner name
        owner=$(echo "$repo_info" | jq -r '.owner.login')
        name=$(echo "$repo_info" | jq -r '.name')
        log_success "Repository: $owner/$name"
        record_result "github_repo" "pass" "$owner/$name"
    else
        log_error "Unable to get repository information"
        record_result "github_repo" "fail" "no_repo_info"
        return 1
    fi
    
    # Check GitHub environments
    local environments=("hml" "main")
    
    for env in "${environments[@]}"; do
        log_check "Checking GitHub environment: $env"
        
        if gh api "repos/$owner/$name/environments/$env" >/dev/null 2>&1; then
            log_success "Environment $env exists"
            record_result "github_env_$env" "pass" "exists"
        else
            log_warning "Environment $env does not exist"
            record_result "github_env_$env" "warn" "missing"
        fi
    done
}

# Validate secrets configuration
validate_secrets_configuration() {
    log_section "Secrets Configuration Validation"
    
    if [[ "$TARGET_ENV" == "all" ]]; then
        local envs=("dev" "hml" "main")
    else
        local envs=("$TARGET_ENV")
    fi
    
    for env in "${envs[@]}"; do
        log_check "Validating secrets for environment: $env"
        
        # Make sure script is executable
        chmod +x "$PROJECT_ROOT/scripts/gh/check_env.sh" 2>/dev/null || true
        
        if "$PROJECT_ROOT/scripts/gh/check_env.sh" "$env" basic >/dev/null 2>&1; then
            log_success "Secrets validation passed for $env"
            record_result "secrets_$env" "pass" "validated"
        else
            log_warning "Secrets validation failed for $env"
            record_result "secrets_$env" "warn" "validation_failed"
        fi
    done
}

# Validate health check scripts
validate_health_checks() {
    log_section "Health Check Scripts Validation"
    
    local health_scripts=(
        "context7.sh:Context7 health check"
        "postgres.sh:PostgreSQL health check"
    )
    
    for script_desc in "${health_scripts[@]}"; do
        local script="${script_desc%%:*}"
        local desc="${script_desc##*:}"
        
        log_check "Validating $desc script"
        
        local script_path="$PROJECT_ROOT/scripts/health/$script"
        
        if [[ -f "$script_path" ]]; then
            if [[ -x "$script_path" ]]; then
                # Test help functionality
                if "$script_path" help >/dev/null 2>&1; then
                    log_success "$desc script functional"
                    record_result "health_${script%.sh}" "pass" "functional"
                else
                    log_warning "$desc script may have issues"
                    record_result "health_${script%.sh}" "warn" "help_failed"
                fi
            else
                log_warning "$desc script not executable"
                record_result "health_${script%.sh}" "warn" "not_executable"
            fi
        else
            log_error "$desc script not found"
            record_result "health_${script%.sh}" "fail" "not_found"
        fi
    done
    
    # Test smoke test script
    log_check "Validating smoke test script"
    
    local smoke_script="$PROJECT_ROOT/scripts/tests/run_smoke.sh"
    
    if [[ -f "$smoke_script" && -x "$smoke_script" ]]; then
        if "$smoke_script" help >/dev/null 2>&1; then
            log_success "Smoke test script functional"
            record_result "health_smoke_test" "pass" "functional"
        else
            log_warning "Smoke test script may have issues"
            record_result "health_smoke_test" "warn" "help_failed"
        fi
    else
        log_error "Smoke test script not found or not executable"
        record_result "health_smoke_test" "fail" "not_found_or_executable"
    fi
}

# Validate GitHub Actions workflow
validate_github_workflow() {
    log_section "GitHub Actions Workflow Validation"
    
    local workflow_file="$PROJECT_ROOT/.github/workflows/mcp-setup.yml"
    
    log_check "Checking MCP setup workflow file"
    
    if [[ -f "$workflow_file" ]]; then
        log_success "MCP setup workflow file found"
        record_result "workflow_file" "pass" "found"
        
        # Validate YAML syntax
        if command -v yamllint >/dev/null 2>&1; then
            if yamllint "$workflow_file" >/dev/null 2>&1; then
                log_success "Workflow YAML syntax is valid"
                record_result "workflow_yaml_syntax" "pass" "valid"
            else
                log_warning "Workflow YAML syntax issues detected"
                record_result "workflow_yaml_syntax" "warn" "syntax_issues"
            fi
        else
            log_warning "yamllint not available, skipping syntax check"
            record_result "workflow_yaml_syntax" "warn" "yamllint_unavailable"
        fi
        
        # Check for required jobs
        local required_jobs=(
            "validate-secrets"
            "context7-mcp-setup"
            "testmaster-mcp-setup"
            "postgres-mcp-setup"
            "comprehensive-health-checks"
        )
        
        for job in "${required_jobs[@]}"; do
            if grep -q "$job:" "$workflow_file"; then
                log_success "Workflow job found: $job"
                record_result "workflow_job_$job" "pass" "found"
            else
                log_warning "Workflow job missing: $job"
                record_result "workflow_job_$job" "warn" "missing"
            fi
        done
    else
        log_error "MCP setup workflow file not found"
        record_result "workflow_file" "fail" "not_found"
    fi
}

# Validate documentation
validate_documentation() {
    log_section "Documentation Validation"
    
    local docs=(
        "docs/mcp-setup.md:Setup documentation"
        "docs/mcp-security-checklist.md:Security checklist"
    )
    
    for doc_desc in "${docs[@]}"; do
        local doc="${doc_desc%%:*}"
        local desc="${doc_desc##*:}"
        
        log_check "Checking $desc"
        
        if [[ -f "$PROJECT_ROOT/$doc" ]]; then
            local size
            size=$(stat -f%z "$PROJECT_ROOT/$doc" 2>/dev/null || stat -c%s "$PROJECT_ROOT/$doc" 2>/dev/null || echo "0")
            
            if [[ $size -gt 1000 ]]; then
                log_success "$desc found and substantial ($size bytes)"
                record_result "docs_${doc//\//_}" "pass" "substantial_$size"
            else
                log_warning "$desc found but small ($size bytes)"
                record_result "docs_${doc//\//_}" "warn" "small_$size"
            fi
        else
            log_error "$desc not found"
            record_result "docs_${doc//\//_}" "fail" "not_found"
        fi
    done
    
    # Check for README or similar
    local readme_files=("README.md" "CLAUDE.md")
    local readme_found=false
    
    for readme in "${readme_files[@]}"; do
        if [[ -f "$PROJECT_ROOT/$readme" ]]; then
            log_success "Project documentation found: $readme"
            record_result "docs_readme" "pass" "$readme"
            readme_found=true
            break
        fi
    done
    
    if [[ "$readme_found" == "false" ]]; then
        log_warning "No README or project documentation found"
        record_result "docs_readme" "warn" "not_found"
    fi
}

# Run integration tests
run_integration_tests() {
    log_section "Integration Tests"
    
    # Test MCP configuration loading
    log_check "Testing MCP configuration loading"
    
    if node -e "
        const config = require('./mcp-config.json');
        console.log('MCP config loaded successfully');
        process.exit(0);
    " 2>/dev/null; then
        log_success "MCP configuration loads successfully in Node.js"
        record_result "integration_config_load" "pass" "loaded"
    else
        log_error "MCP configuration failed to load in Node.js"
        record_result "integration_config_load" "fail" "load_failed"
    fi
    
    # Test GitHub CLI integration
    log_check "Testing GitHub CLI integration"
    
    if gh repo view --json name >/dev/null 2>&1; then
        log_success "GitHub CLI integration working"
        record_result "integration_github_cli" "pass" "working"
    else
        log_error "GitHub CLI integration failed"
        record_result "integration_github_cli" "fail" "failed"
    fi
    
    # Test script interdependencies
    log_check "Testing script interdependencies"
    
    local scripts_dir="$PROJECT_ROOT/scripts"
    if [[ -d "$scripts_dir" ]]; then
        local script_count
        script_count=$(find "$scripts_dir" -name "*.sh" | wc -l)
        
        if [[ $script_count -ge 5 ]]; then
            log_success "Script ecosystem appears complete ($script_count scripts)"
            record_result "integration_scripts" "pass" "complete_$script_count"
        else
            log_warning "Script ecosystem may be incomplete ($script_count scripts)"
            record_result "integration_scripts" "warn" "incomplete_$script_count"
        fi
    else
        log_error "Scripts directory not found"
        record_result "integration_scripts" "fail" "no_scripts_dir"
    fi
}

# Generate validation report
generate_validation_report() {
    log_section "Validation Report Generation"
    
    local report_dir="$PROJECT_ROOT/qa-reports/mcp-validation"
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local report_file="$report_dir/mcp-validation-$timestamp.json"
    
    mkdir -p "$report_dir"
    
    # Calculate statistics
    local success_rate=0
    if [[ $TOTAL_CHECKS -gt 0 ]]; then
        success_rate=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))
    fi
    
    # Generate JSON report
    {
        echo "{"
        echo "  \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%S.%3NZ)\","
        echo "  \"validation_mode\": \"$VALIDATION_MODE\","
        echo "  \"target_environment\": \"$TARGET_ENV\","
        echo "  \"summary\": {"
        echo "    \"total_checks\": $TOTAL_CHECKS,"
        echo "    \"passed_checks\": $PASSED_CHECKS,"
        echo "    \"failed_checks\": $FAILED_CHECKS,"
        echo "    \"warning_checks\": $WARNING_CHECKS,"
        echo "    \"success_rate\": $success_rate"
        echo "  },"
        echo "  \"results\": {"
        
        local first_result=true
        for check in "${!VALIDATION_RESULTS[@]}"; do
            [[ "$first_result" == "false" ]] && echo ","
            first_result=false
            
            local status="${VALIDATION_RESULTS[$check]%%:*}"
            local message="${VALIDATION_RESULTS[$check]##*:}"
            
            echo -n "    \"$check\": {\"status\": \"$status\", \"message\": \"$message\"}"
        done
        
        echo ""
        echo "  },"
        echo "  \"metadata\": {"
        echo "    \"script_version\": \"1.0.0\","
        echo "    \"project_root\": \"$PROJECT_ROOT\","
        echo "    \"execution_time\": \"$(date +%s)\","
        echo "    \"validation_duration\": \"$SECONDS seconds\""
        echo "  }"
        echo "}"
    } > "$report_file"
    
    log_success "Validation report generated: $report_file"
    
    # Generate human-readable summary
    local summary_file="$report_dir/mcp-validation-summary-$timestamp.txt"
    
    {
        echo "MCP Setup Validation Summary"
        echo "============================"
        echo ""
        echo "Validation completed at: $(date)"
        echo "Mode: $VALIDATION_MODE"
        echo "Target Environment: $TARGET_ENV"
        echo ""
        echo "Results:"
        echo "  Total Checks: $TOTAL_CHECKS"
        echo "  Passed: $PASSED_CHECKS"
        echo "  Failed: $FAILED_CHECKS"
        echo "  Warnings: $WARNING_CHECKS"
        echo "  Success Rate: $success_rate%"
        echo ""
        
        if [[ $FAILED_CHECKS -gt 0 ]]; then
            echo "Failed Checks:"
            for check in "${!VALIDATION_RESULTS[@]}"; do
                local status="${VALIDATION_RESULTS[$check]%%:*}"
                if [[ "$status" == "fail" ]]; then
                    echo "  - $check"
                fi
            done
            echo ""
        fi
        
        if [[ $WARNING_CHECKS -gt 0 ]]; then
            echo "Warnings:"
            for check in "${!VALIDATION_RESULTS[@]}"; do
                local status="${VALIDATION_RESULTS[$check]%%:*}"
                if [[ "$status" == "warn" ]]; then
                    echo "  - $check"
                fi
            done
            echo ""
        fi
        
        echo "Recommendations:"
        if [[ $FAILED_CHECKS -gt 0 ]]; then
            echo "  - Address failed checks before proceeding with deployment"
            echo "  - Review installation documentation: docs/mcp-setup.md"
            echo "  - Check security requirements: docs/mcp-security-checklist.md"
        elif [[ $WARNING_CHECKS -gt 0 ]]; then
            echo "  - Consider addressing warnings for optimal setup"
            echo "  - Review configuration for completeness"
        else
            echo "  - Setup appears to be complete and ready for deployment"
            echo "  - Proceed with environment-specific testing"
        fi
        
        echo ""
        echo "Next Steps:"
        echo "  1. Configure secrets using: scripts/gh/set_secrets.sh"
        echo "  2. Run health checks: scripts/health/context7.sh dev"
        echo "  3. Test integration: scripts/tests/run_smoke.sh dev both"
        echo "  4. Deploy to target environment"
        
    } > "$summary_file"
    
    log_success "Validation summary generated: $summary_file"
    
    # Display summary
    echo ""
    cat "$summary_file"
}

# Show help
show_help() {
    cat << EOF
MCP Setup Validation Script

USAGE:
    $0 [mode] [environment]

MODES:
    full        - Complete validation (default)
    quick       - Essential checks only
    config      - Configuration validation only
    security    - Security-focused validation
    integration - Integration tests only

ENVIRONMENTS:
    all         - All environments (default)
    dev         - Development environment
    hml         - Staging environment
    main        - Production environment

EXAMPLES:
    $0                          # Full validation for all environments
    $0 quick dev               # Quick validation for development
    $0 security main           # Security validation for production
    $0 config                  # Configuration validation only

VALIDATION CATEGORIES:
    - Prerequisites (Node.js, Git, GitHub CLI, etc.)
    - Project structure and file permissions
    - MCP configuration validation
    - GitHub setup and authentication
    - Secrets configuration
    - Health check scripts
    - GitHub Actions workflow
    - Documentation completeness
    - Integration tests

OUTPUT:
    - Console output with colored status indicators
    - JSON report: qa-reports/mcp-validation/
    - Summary report with recommendations

EXIT CODES:
    0 - All checks passed
    1 - Critical failures detected
    2 - Warnings present but no failures
    3 - Validation could not complete

EOF
}

# Main execution logic
main() {
    local start_time=$SECONDS
    
    echo "🤖 MCP Setup Validation Script"
    echo "================================"
    echo "Mode: $VALIDATION_MODE"
    echo "Target: $TARGET_ENV"
    echo "Started: $(date)"
    echo ""
    
    # Ensure we're in the right directory
    cd "$PROJECT_ROOT"
    
    case "$VALIDATION_MODE" in
        "full")
            check_prerequisites
            validate_project_structure
            validate_mcp_configuration
            validate_github_setup
            validate_secrets_configuration
            validate_health_checks
            validate_github_workflow
            validate_documentation
            run_integration_tests
            ;;
        "quick")
            check_prerequisites
            validate_project_structure
            validate_mcp_configuration
            ;;
        "config")
            validate_mcp_configuration
            ;;
        "security")
            check_prerequisites
            validate_mcp_configuration
            validate_github_setup
            validate_secrets_configuration
            ;;
        "integration")
            run_integration_tests
            ;;
        *)
            log_error "Invalid validation mode: $VALIDATION_MODE"
            show_help
            exit 1
            ;;
    esac
    
    # Generate report
    generate_validation_report
    
    local duration=$((SECONDS - start_time))
    echo ""
    echo "Validation completed in ${duration} seconds"
    
    # Determine exit code
    if [[ $FAILED_CHECKS -gt 0 ]]; then
        echo "❌ Validation FAILED with $FAILED_CHECKS critical issues"
        exit 1
    elif [[ $WARNING_CHECKS -gt 0 ]]; then
        echo "⚠️ Validation completed with $WARNING_CHECKS warnings"
        exit 2
    else
        echo "✅ Validation PASSED - All checks successful"
        exit 0
    fi
}

# Handle script arguments
case "${1:-}" in
    "help"|"-h"|"--help")
        show_help
        exit 0
        ;;
    "")
        main
        ;;
    *)
        main
        ;;
esac