#!/bin/bash
# -*- coding: utf-8 -*-
"""
Blueprint Migration Wrapper Script
==================================

Simple wrapper to run the blueprint consolidation migration with common options.
"""

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo -e "${BLUE}Blueprint Consolidation Migration Tool${NC}"
echo -e "${BLUE}=====================================${NC}"
echo ""
echo "Project root: $PROJECT_ROOT"
echo ""

# Check if Python script exists
if [ ! -f "$SCRIPT_DIR/blueprint_consolidation_migration.py" ]; then
    echo -e "${RED}Error: Migration script not found!${NC}"
    echo "Expected: $SCRIPT_DIR/blueprint_consolidation_migration.py"
    exit 1
fi

# Function to run migration
run_migration() {
    local mode="$1"
    local extra_args="$2"

    echo -e "${YELLOW}Running blueprint migration ($mode mode)...${NC}"
    echo ""

    cd "$PROJECT_ROOT"
    python "$SCRIPT_DIR/blueprint_consolidation_migration.py" \
        --root-path="$PROJECT_ROOT" \
        --verbose \
        $extra_args

    local exit_code=$?
    echo ""

    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}Migration completed successfully!${NC}"
        if [ "$mode" = "dry-run" ]; then
            echo -e "${YELLOW}This was a dry run. No changes were made.${NC}"
            echo -e "${YELLOW}Run with 'apply' to execute the migration.${NC}"
        fi
    else
        echo -e "${RED}Migration failed with errors.${NC}"
        echo "Check the log files for details."
    fi

    return $exit_code
}

# Parse command line arguments
case "${1:-dry-run}" in
    "dry-run"|"test"|"preview")
        run_migration "dry-run" "--dry-run"
        ;;
    "apply"|"execute"|"run")
        echo -e "${YELLOW}This will modify your files. Continue? (y/N)${NC}"
        read -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            run_migration "apply" ""
        else
            echo "Migration cancelled."
            exit 0
        fi
        ;;
    "help"|"-h"|"--help")
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  dry-run   Preview changes without modifying files (default)"
        echo "  apply     Execute the migration and modify files"
        echo "  help      Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0                    # Preview changes"
        echo "  $0 dry-run           # Preview changes"
        echo "  $0 apply             # Execute migration"
        echo ""
        ;;
    *)
        echo -e "${RED}Unknown command: $1${NC}"
        echo "Use '$0 help' for usage information."
        exit 1
        ;;
esac