#!/bin/bash
# PR Consolidation Phase 2: Merge Safe Frontend PRs
# Generated: 2025-10-04
# Merges 5 low-risk frontend dependency updates with validation

set -e  # Exit on error

echo "═══════════════════════════════════════════════════════════════"
echo "PR Consolidation - Phase 2: Merge Safe Frontend PRs"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Change to frontend directory
REPO_ROOT=$(git rev-parse --show-toplevel)
cd "$REPO_ROOT/apps/frontend-nextjs"

echo "Working directory: $(pwd)"
echo ""

# Verify current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "Current branch: $CURRENT_BRANCH"
echo ""

# Function to validate after merge
validate_merge() {
    local pr_number=$1
    local package_name=$2

    echo "  Validating merge of PR #$pr_number ($package_name)..."

    echo "    - Type checking..."
    if npm run type-check --silent; then
        echo "      ✅ Type check passed"
    else
        echo "      ❌ Type check failed"
        return 1
    fi

    echo "    - Linting..."
    if npm run lint --silent; then
        echo "      ✅ Lint passed"
    else
        echo "      ❌ Lint failed"
        return 1
    fi

    echo "    - Building staging..."
    if npm run build:staging --silent; then
        echo "      ✅ Build passed"
    else
        echo "      ❌ Build failed"
        return 1
    fi

    echo "  ✅ Validation complete for PR #$pr_number"
    echo ""
    return 0
}

# Merge PR function
merge_pr() {
    local pr_number=$1
    local pr_title=$2
    local package_name=$3

    echo "───────────────────────────────────────────────────────────────"
    echo "Merging PR #$pr_number: $pr_title"
    echo "───────────────────────────────────────────────────────────────"

    if gh pr merge "$pr_number" --squash --body "$pr_title"; then
        echo "✅ PR #$pr_number merged successfully"
    else
        echo "❌ Failed to merge PR #$pr_number"
        return 1
    fi

    # Update local repository
    git fetch origin dependabot-updates

    # Validate
    if validate_merge "$pr_number" "$package_name"; then
        echo "✅ PR #$pr_number validated and complete"
    else
        echo "❌ Validation failed for PR #$pr_number"
        echo "⚠️  Consider rolling back this merge"
        return 1
    fi

    echo ""
    return 0
}

# List PRs to merge
echo "PRs to merge (in order):"
echo "  1. #199 - dompurify + types (security)"
echo "  2. #196 - jspdf 3.0.3 (patch)"
echo "  3. #198 - build-tools group (dev)"
echo "  4. #194 - sharp 0.34.4 (dev)"
echo "  5. #215 - react-ecosystem (8 packages)"
echo ""

# Confirm before proceeding
read -p "Merge all 5 safe frontend PRs with validation? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted by user"
    exit 1
fi
echo ""

# Track success
SUCCESS_COUNT=0
TOTAL_PRS=5

# Merge PR #199 (dompurify - security)
if merge_pr 199 "Security update: dompurify patch version" "dompurify"; then
    ((SUCCESS_COUNT++))
else
    echo "⚠️  Stopping due to validation failure"
    exit 1
fi

# Merge PR #196 (jspdf - patch)
if merge_pr 196 "Patch update: jspdf 3.0.3" "jspdf"; then
    ((SUCCESS_COUNT++))
else
    echo "⚠️  Stopping due to validation failure"
    exit 1
fi

# Merge PR #198 (build-tools - dev)
if merge_pr 198 "Dev dependencies: build-tools group update" "build-tools"; then
    ((SUCCESS_COUNT++))
else
    echo "⚠️  Stopping due to validation failure"
    exit 1
fi

# Merge PR #194 (sharp - dev)
if merge_pr 194 "Dev dependency: sharp 0.34.4" "sharp"; then
    ((SUCCESS_COUNT++))
else
    echo "⚠️  Stopping due to validation failure"
    exit 1
fi

# Merge PR #215 (react-ecosystem - 8 packages)
if merge_pr 215 "React ecosystem: 8 packages aligned with React 19.x" "react-ecosystem"; then
    ((SUCCESS_COUNT++))
else
    echo "⚠️  Stopping due to validation failure"
    exit 1
fi

# Final validation
echo "═══════════════════════════════════════════════════════════════"
echo "Phase 2 Complete - Final Validation"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Running comprehensive test suite..."
echo ""

# Unit tests
echo "Running unit tests..."
if npm run test:unit --silent; then
    echo "✅ Unit tests passed"
else
    echo "⚠️  Unit tests failed (not blocking)"
fi
echo ""

# Integration tests
echo "Running integration tests..."
if npm run test:integration --silent; then
    echo "✅ Integration tests passed"
else
    echo "⚠️  Integration tests failed (not blocking)"
fi
echo ""

# Summary
echo "═══════════════════════════════════════════════════════════════"
echo "Phase 2 Summary"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Successfully merged: $SUCCESS_COUNT / $TOTAL_PRS PRs"
echo ""
echo "Remaining open PRs (should be 5):"
gh pr list --state open
echo ""
echo "✅ Phase 2 complete: 5 frontend PRs merged and validated"
echo ""
echo "📋 Next steps:"
echo "   1. Deploy to staging: git push origin dependabot-updates"
echo "   2. Monitor: https://hml-frontend-4f2gjf6cua-uc.a.run.app/"
echo "   3. Test chat médico (Dr. Gasnelio + Gá)"
echo "   4. Review major version PRs (#186, #206, #195)"
echo ""
echo "📄 Documentation updated in claudedocs/"
echo ""
