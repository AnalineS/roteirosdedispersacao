#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Blueprint Consolidation Migration Script
========================================

Migrates codebase from 20-blueprint architecture to strategic 8-blueprint consolidation.
Updates all import statements, references, and configurations automatically.

Usage:
    python blueprint_consolidation_migration.py [--dry-run] [--backup] [--verbose]

Features:
- Automatic import statement updates
- Backup creation before changes
- Dry-run mode for safe testing
- Comprehensive logging and reporting
- Rollback capability
"""

import os
import re
import shutil
import argparse
import json
from pathlib import Path
from typing import Dict, List, Tuple, Set
from datetime import datetime
import logging

# Blueprint mapping configuration
BLUEPRINT_CONSOLIDATION_MAP = {
    # Source blueprint -> Target consolidated blueprint
    'chat_blueprint': 'core_blueprint',
    'personas_blueprint': 'core_blueprint',
    'health_blueprint': 'core_blueprint',

    'auth_blueprint': 'user_blueprint',
    'user_profiles_blueprint': 'user_blueprint',
    # user_blueprint stays as user_blueprint

    'analytics_blueprint': 'analytics_blueprint_consolidated',
    'metrics_blueprint': 'analytics_blueprint_consolidated',
    'monitoring_blueprint': 'analytics_blueprint_consolidated',
    'observability': 'analytics_blueprint_consolidated',

    'feedback_blueprint': 'engagement_blueprint',
    'gamification_blueprint': 'engagement_blueprint',
    'notifications_blueprint': 'engagement_blueprint',

    # These stay the same
    'validation_blueprint': 'validation_blueprint',
    'multimodal_blueprint': 'multimodal_blueprint',
    'cache_blueprint': 'cache_blueprint',
    'docs_blueprint': 'docs_blueprint',

    # Legacy/specialized
    'memory_blueprint': 'memory_blueprint',
    'logging_blueprint': 'logging_blueprint',

    # Deprecated/removed
    'predictions_blueprint': None,  # Functionality moved to analytics_blueprint_consolidated
}

# Blueprint variable name mapping
BLUEPRINT_VAR_MAP = {
    'chat_bp': 'core_bp',
    'personas_bp': 'core_bp',
    'health_bp': 'core_bp',

    'auth_bp': 'user_bp',
    'user_profiles_blueprint': 'user_bp',
    # user_bp stays as user_bp

    'analytics_bp': 'analytics_bp',
    'metrics_bp': 'analytics_bp',
    'monitoring_bp': 'analytics_bp',
    'observability_bp': 'analytics_bp',

    'feedback_bp': 'engagement_bp',
    'gamification_bp': 'engagement_bp',
    'notifications_bp': 'engagement_bp',

    # These stay the same
    'validation_bp': 'validation_bp',
    'multimodal_bp': 'multimodal_bp',
    'cache_blueprint': 'cache_blueprint',
    'docs_bp': 'docs_bp',

    # Legacy/specialized
    'memory_bp': 'memory_bp',
    'logging_bp': 'logging_bp',

    # Deprecated
    'predictions_bp': None,
}

class BlueprintMigrator:
    """Handles the migration from 20-blueprint to 8-blueprint architecture."""

    def __init__(self, root_path: str, dry_run: bool = False,
                 create_backup: bool = True, verbose: bool = False):
        self.root_path = Path(root_path)
        self.dry_run = dry_run
        self.create_backup = create_backup
        self.verbose = verbose

        # Setup logging
        log_level = logging.DEBUG if verbose else logging.INFO
        logging.basicConfig(
            level=log_level,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler(f'blueprint_migration_{datetime.now().strftime("%Y%m%d_%H%M%S")}.log'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)

        # Migration tracking
        self.changes_made: List[Dict] = []
        self.files_processed: Set[str] = set()
        self.errors: List[Dict] = []

        self.logger.info(f"Blueprint Migration initialized")
        self.logger.info(f"Root path: {self.root_path}")
        self.logger.info(f"Dry run: {self.dry_run}")
        self.logger.info(f"Create backup: {self.create_backup}")

    def create_backup_directory(self) -> Path:
        """Create backup directory with timestamp."""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_dir = self.root_path / f"backup_blueprint_migration_{timestamp}"

        if not self.dry_run:
            backup_dir.mkdir(exist_ok=True)
            self.logger.info(f"Created backup directory: {backup_dir}")

        return backup_dir

    def backup_file(self, file_path: Path, backup_dir: Path) -> bool:
        """Backup a file before modification."""
        try:
            if not self.dry_run and self.create_backup:
                relative_path = file_path.relative_to(self.root_path)
                backup_file_path = backup_dir / relative_path
                backup_file_path.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(file_path, backup_file_path)
                self.logger.debug(f"Backed up: {file_path}")
            return True
        except Exception as e:
            self.logger.error(f"Failed to backup {file_path}: {e}")
            return False

    def find_python_files(self) -> List[Path]:
        """Find all Python files that might contain blueprint imports."""
        python_files = []

        # Search in apps directory primarily
        search_paths = [
            self.root_path / "apps",
            self.root_path / "scripts",
            self.root_path / "tests",
        ]

        for search_path in search_paths:
            if search_path.exists():
                python_files.extend(search_path.rglob("*.py"))

        # Also search root level Python files
        python_files.extend(self.root_path.glob("*.py"))

        self.logger.info(f"Found {len(python_files)} Python files to process")
        return python_files

    def update_import_statements(self, content: str, file_path: Path) -> Tuple[str, List[str]]:
        """Update import statements in file content."""
        changes = []
        lines = content.split('\n')
        updated_lines = []

        for line_num, line in enumerate(lines, 1):
            original_line = line

            # Pattern 1: from .blueprint_name import blueprint_var
            pattern1 = r'from\s+\.([a-zA-Z_]+)\s+import\s+([a-zA-Z_]+)'
            match1 = re.search(pattern1, line)
            if match1:
                blueprint_file = match1.group(1)
                blueprint_var = match1.group(2)

                # Check if this is a blueprint we're consolidating
                if blueprint_file in BLUEPRINT_CONSOLIDATION_MAP:
                    new_blueprint_file = BLUEPRINT_CONSOLIDATION_MAP[blueprint_file]
                    new_blueprint_var = BLUEPRINT_VAR_MAP.get(blueprint_var, blueprint_var)

                    if new_blueprint_file is None:
                        # Blueprint is deprecated - comment out the import
                        line = f"# DEPRECATED: {line}  # Moved to consolidated blueprint"
                        changes.append(f"Line {line_num}: Deprecated import commented out")
                    elif new_blueprint_var is None:
                        # Variable is deprecated - comment out
                        line = f"# DEPRECATED: {line}  # Variable moved to consolidated blueprint"
                        changes.append(f"Line {line_num}: Deprecated variable commented out")
                    else:
                        # Update the import
                        line = f"from .{new_blueprint_file} import {new_blueprint_var}"
                        changes.append(f"Line {line_num}: Updated import {blueprint_file} -> {new_blueprint_file}")

            # Pattern 2: from blueprints.blueprint_name import blueprint_var
            pattern2 = r'from\s+blueprints\.([a-zA-Z_]+)\s+import\s+([a-zA-Z_]+)'
            match2 = re.search(pattern2, line)
            if match2:
                blueprint_file = match2.group(1)
                blueprint_var = match2.group(2)

                if blueprint_file in BLUEPRINT_CONSOLIDATION_MAP:
                    new_blueprint_file = BLUEPRINT_CONSOLIDATION_MAP[blueprint_file]
                    new_blueprint_var = BLUEPRINT_VAR_MAP.get(blueprint_var, blueprint_var)

                    if new_blueprint_file is None or new_blueprint_var is None:
                        line = f"# DEPRECATED: {line}  # Moved to consolidated blueprint"
                        changes.append(f"Line {line_num}: Deprecated import commented out")
                    else:
                        line = f"from blueprints.{new_blueprint_file} import {new_blueprint_var}"
                        changes.append(f"Line {line_num}: Updated import {blueprint_file} -> {new_blueprint_file}")

            # Pattern 3: Blueprint variable usage in lists/registrations
            for old_var, new_var in BLUEPRINT_VAR_MAP.items():
                if new_var is None:
                    # Comment out deprecated variables
                    if old_var in line and not line.strip().startswith('#'):
                        line = re.sub(rf'\b{old_var}\b', f'# {old_var}  # DEPRECATED', line)
                        changes.append(f"Line {line_num}: Deprecated variable {old_var} commented out")
                elif old_var != new_var and old_var in line:
                    # Replace variable names
                    line = re.sub(rf'\b{old_var}\b', new_var, line)
                    changes.append(f"Line {line_num}: Replaced variable {old_var} -> {new_var}")

            updated_lines.append(line)

        return '\n'.join(updated_lines), changes

    def process_file(self, file_path: Path, backup_dir: Path) -> bool:
        """Process a single Python file for blueprint migrations."""
        try:
            # Read file content
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            # Update imports and references
            updated_content, changes = self.update_import_statements(content, file_path)

            # Only proceed if changes were made
            if changes:
                # Backup original file
                if not self.backup_file(file_path, backup_dir):
                    return False

                # Write updated content
                if not self.dry_run:
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write(updated_content)

                # Record changes
                change_record = {
                    'file': str(file_path),
                    'changes': changes,
                    'timestamp': datetime.now().isoformat()
                }
                self.changes_made.append(change_record)

                self.logger.info(f"Updated {file_path}: {len(changes)} changes")
                if self.verbose:
                    for change in changes:
                        self.logger.debug(f"  - {change}")

            self.files_processed.add(str(file_path))
            return True

        except Exception as e:
            error_record = {
                'file': str(file_path),
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            }
            self.errors.append(error_record)
            self.logger.error(f"Error processing {file_path}: {e}")
            return False

    def generate_migration_report(self) -> Dict:
        """Generate comprehensive migration report."""
        report = {
            'migration_summary': {
                'timestamp': datetime.now().isoformat(),
                'dry_run': self.dry_run,
                'total_files_processed': len(self.files_processed),
                'total_files_changed': len(self.changes_made),
                'total_errors': len(self.errors),
                'backup_created': self.create_backup
            },
            'blueprint_mapping': BLUEPRINT_CONSOLIDATION_MAP,
            'variable_mapping': BLUEPRINT_VAR_MAP,
            'changes_made': self.changes_made,
            'errors': self.errors,
            'files_processed': list(self.files_processed)
        }

        return report

    def save_migration_report(self, report: Dict) -> Path:
        """Save migration report to JSON file."""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_file = self.root_path / f"blueprint_migration_report_{timestamp}.json"

        if not self.dry_run:
            with open(report_file, 'w', encoding='utf-8') as f:
                json.dump(report, f, indent=2, ensure_ascii=False)

        return report_file

    def run_migration(self) -> bool:
        """Execute the complete blueprint migration process."""
        self.logger.info("Starting blueprint consolidation migration...")

        # Create backup directory
        backup_dir = self.create_backup_directory()

        # Find all Python files
        python_files = self.find_python_files()

        # Process each file
        success_count = 0
        for file_path in python_files:
            if self.process_file(file_path, backup_dir):
                success_count += 1

        # Generate and save report
        report = self.generate_migration_report()
        report_file = self.save_migration_report(report)

        # Summary
        self.logger.info("Migration completed!")
        self.logger.info(f"Files processed: {len(self.files_processed)}")
        self.logger.info(f"Files changed: {len(self.changes_made)}")
        self.logger.info(f"Errors: {len(self.errors)}")
        self.logger.info(f"Success rate: {success_count}/{len(python_files)} ({success_count/len(python_files)*100:.1f}%)")

        if not self.dry_run:
            self.logger.info(f"Migration report saved: {report_file}")
            if self.create_backup:
                self.logger.info(f"Backup created: {backup_dir}")

        return len(self.errors) == 0

def main():
    parser = argparse.ArgumentParser(description='Blueprint Consolidation Migration Tool')
    parser.add_argument('--dry-run', action='store_true',
                      help='Run migration without making changes')
    parser.add_argument('--no-backup', action='store_true',
                      help='Skip creating backup files')
    parser.add_argument('--verbose', '-v', action='store_true',
                      help='Enable verbose logging')
    parser.add_argument('--root-path', default='.',
                      help='Root path of the project (default: current directory)')

    args = parser.parse_args()

    # Initialize migrator
    migrator = BlueprintMigrator(
        root_path=args.root_path,
        dry_run=args.dry_run,
        create_backup=not args.no_backup,
        verbose=args.verbose
    )

    # Run migration
    success = migrator.run_migration()

    if args.dry_run:
        print("\n🔍 DRY RUN COMPLETED - No changes were made")
        print("Run without --dry-run to apply changes")
    elif success:
        print("\n✅ MIGRATION COMPLETED SUCCESSFULLY")
    else:
        print("\n❌ MIGRATION COMPLETED WITH ERRORS")
        print("Check the log file for details")

    return 0 if success else 1

if __name__ == '__main__':
    exit(main())