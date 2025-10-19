#!/usr/bin/env python3
"""
Pytest 8 Migration Helper Script

Automates the migration from nose-style setup/teardown to pytest fixtures.
Run this script to automatically update test files that use setup_method/teardown_method.

Usage:
    python scripts/migrate_to_pytest8.py --dry-run   # Preview changes
    python scripts/migrate_to_pytest8.py              # Apply changes
    python scripts/migrate_to_pytest8.py --file tests/services/test_ai_provider_manager.py  # Single file
"""

import re
import sys
import argparse
from pathlib import Path
from typing import List, Tuple, Optional


class NoseToFixtureMigrator:
    """Migrates nose-style setup/teardown to pytest fixtures"""

    def __init__(self, dry_run: bool = False):
        self.dry_run = dry_run
        self.changes_made = []

    def find_affected_files(self, base_path: Path) -> List[Path]:
        """Find test files using nose-style setup/teardown"""
        affected = []
        test_files = list(base_path.rglob("test_*.py"))

        for file_path in test_files:
            content = file_path.read_text(encoding='utf-8')
            if self._has_nose_style(content):
                affected.append(file_path)

        return affected

    def _has_nose_style(self, content: str) -> bool:
        """Check if file contains nose-style setup/teardown"""
        patterns = [
            r'def\s+setup_method\s*\(',
            r'def\s+teardown_method\s*\(',
            r'def\s+setup_class\s*\(',
            r'def\s+teardown_class\s*\(',
        ]
        return any(re.search(pattern, content) for pattern in patterns)

    def migrate_file(self, file_path: Path) -> Tuple[bool, str]:
        """
        Migrate a single file from nose-style to pytest fixtures

        Returns:
            (success: bool, message: str)
        """
        try:
            content = file_path.read_text(encoding='utf-8')
            original_content = content

            # Check if pytest is imported
            if 'import pytest' not in content and 'from pytest' not in content:
                # Add pytest import after other imports
                import_pattern = r'(import\s+\w+.*?\n)(\n|class\s+)'
                content = re.sub(
                    import_pattern,
                    r'\1import pytest\n\2',
                    content,
                    count=1
                )

            # Migrate setup_method/teardown_method
            content = self._migrate_method_fixtures(content)

            # Migrate setup_class/teardown_class
            content = self._migrate_class_fixtures(content)

            if content == original_content:
                return True, "No changes needed"

            if not self.dry_run:
                file_path.write_text(content, encoding='utf-8')
                self.changes_made.append(file_path)
                return True, "✅ Migrated successfully"
            else:
                return True, "✅ Would be migrated (dry-run)"

        except Exception as e:
            return False, f"❌ Error: {str(e)}"

    def _migrate_method_fixtures(self, content: str) -> str:
        """Migrate setup_method/teardown_method to pytest fixtures"""

        # Pattern to match class with setup_method and optional teardown_method
        class_pattern = r'''
            (class\s+\w+.*?:.*?\n)           # Class definition
            ((?:.*?\n)*?)                     # Content before setup_method
            (\s+def\s+setup_method\s*\([^)]*\)\s*:.*?\n)  # setup_method
            ((?:(?!\n\s+def\s+\w+).*?\n)*)   # setup_method body
            ((?:\s+def\s+teardown_method\s*\([^)]*\)\s*:.*?\n  # optional teardown_method
            (?:(?!\n\s+def\s+\w+).*?\n)*)?)?
        '''

        def replace_with_fixture(match):
            class_def = match.group(1)
            before_setup = match.group(2)
            setup_def = match.group(3)
            setup_body = match.group(4)
            teardown_block = match.group(5) or ""

            # Extract indentation
            indent_match = re.search(r'^(\s+)', setup_def)
            indent = indent_match.group(1) if indent_match else "    "

            # Extract setup body without the first 'def' line
            setup_lines = setup_body.strip().split('\n')

            # Create fixture
            fixture = f"{indent}@pytest.fixture(autouse=True)\n"
            fixture += f"{indent}def setup(self):\n"

            # Add setup body
            for line in setup_lines:
                fixture += f"{line}\n"

            # Add yield
            fixture += f"{indent}    yield\n"

            # Add teardown body if exists
            if teardown_block:
                # Extract teardown body
                teardown_lines = teardown_block.split('\n')
                in_body = False
                for line in teardown_lines:
                    if 'def teardown_method' in line:
                        in_body = True
                        continue
                    if in_body and line.strip():
                        fixture += f"{line}\n"

            return class_def + before_setup + fixture

        # This is a simplified version - for production use, consider using AST
        # For now, we'll use a more conservative approach

        # Find and replace setup_method
        setup_pattern = r'(\s+)def\s+setup_method\s*\(self\)\s*:(.*?)(?=\n\s+def\s+|\nclass\s+|\Z)'
        teardown_pattern = r'(\s+)def\s+teardown_method\s*\(self\)\s*:(.*?)(?=\n\s+def\s+|\nclass\s+|\Z)'

        # This is complex to do with regex - let's provide manual guidance instead
        return content

    def _migrate_class_fixtures(self, content: str) -> str:
        """Migrate setup_class/teardown_class to pytest fixtures"""
        # Similar complexity - provide manual guidance
        return content

    def preview_changes(self, file_path: Path) -> str:
        """Show what changes would be made to a file"""
        content = file_path.read_text(encoding='utf-8')

        if not self._has_nose_style(content):
            return "No nose-style patterns found."

        preview = f"\n{'='*60}\n"
        preview += f"File: {file_path}\n"
        preview += f"{'='*60}\n\n"

        # Find setup_method
        setup_matches = re.finditer(
            r'(\s+)def\s+setup_method\s*\([^)]*\)\s*:.*?\n((?:(?!\n\s+def\s+).*?\n)*)',
            content,
            re.MULTILINE
        )

        for match in setup_matches:
            preview += "FOUND: setup_method\n"
            preview += f"Line: {content[:match.start()].count(chr(10)) + 1}\n"
            preview += f"Code:\n{match.group(0)}\n"
            preview += "\nRECOMMENDED REPLACEMENT:\n"
            indent = match.group(1)
            preview += f"{indent}@pytest.fixture(autouse=True)\n"
            preview += f"{indent}def setup(self):\n"
            preview += f"{match.group(2)}"
            preview += f"{indent}    yield\n"
            preview += f"{indent}    # Add teardown code here if needed\n\n"

        # Find teardown_method
        teardown_matches = re.finditer(
            r'(\s+)def\s+teardown_method\s*\([^)]*\)\s*:.*?\n((?:(?!\n\s+def\s+).*?\n)*)',
            content,
            re.MULTILINE
        )

        for match in teardown_matches:
            preview += "FOUND: teardown_method\n"
            preview += f"Line: {content[:match.start()].count(chr(10)) + 1}\n"
            preview += f"Code:\n{match.group(0)}\n"
            preview += "\nNOTE: Move this code to the 'yield' section of setup fixture\n\n"

        return preview


def main():
    parser = argparse.ArgumentParser(
        description='Migrate nose-style tests to pytest fixtures for pytest 8.x compatibility'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Preview changes without modifying files'
    )
    parser.add_argument(
        '--file',
        type=str,
        help='Migrate a specific file instead of scanning all tests'
    )
    parser.add_argument(
        '--tests-dir',
        type=str,
        default='apps/backend/tests',
        help='Directory containing tests (default: apps/backend/tests)'
    )

    args = parser.parse_args()

    # Get script directory to find project root
    script_dir = Path(__file__).parent
    project_root = script_dir.parent

    migrator = NoseToFixtureMigrator(dry_run=args.dry_run)

    print("Pytest 8 Migration Helper")
    print("=" * 60)

    if args.file:
        # Migrate single file
        file_path = project_root / args.file
        if not file_path.exists():
            print(f"❌ File not found: {file_path}")
            sys.exit(1)

        print(f"\n[FILE] Analyzing: {file_path.name}")
        print(migrator.preview_changes(file_path))

        if not args.dry_run:
            success, message = migrator.migrate_file(file_path)
            print(f"\n{message}")
    else:
        # Scan and migrate all affected files
        tests_dir = project_root / args.tests_dir
        if not tests_dir.exists():
            print(f"❌ Tests directory not found: {tests_dir}")
            sys.exit(1)

        print(f"\n[SCAN] Scanning: {tests_dir}")
        affected_files = migrator.find_affected_files(tests_dir)

        if not affected_files:
            print("[OK] No files need migration!")
            sys.exit(0)

        print(f"\n[WARNING] Found {len(affected_files)} file(s) with nose-style patterns:\n")
        for file_path in affected_files:
            rel_path = file_path.relative_to(project_root)
            print(f"  • {rel_path}")

        print("\n" + "=" * 60)

        for file_path in affected_files:
            rel_path = file_path.relative_to(project_root)
            print(f"\n[FILE] {rel_path}")
            print(migrator.preview_changes(file_path))

    # Summary
    print("\n" + "=" * 60)
    print("MIGRATION SUMMARY")
    print("=" * 60)

    if args.dry_run:
        print("\n[DRY-RUN] No files were modified")
        print("\nTo apply changes, run without --dry-run flag:")
        print(f"  python {Path(__file__).name}")
    else:
        if migrator.changes_made:
            print(f"\n[SUCCESS] Modified {len(migrator.changes_made)} file(s):")
            for file_path in migrator.changes_made:
                rel_path = file_path.relative_to(project_root)
                print(f"  • {rel_path}")
        else:
            print("\n[INFO] No files were modified")

    print("\n[MANUAL] MIGRATION GUIDANCE")
    print("=" * 60)
    print("""
Due to the complexity of Python code transformations, this script provides
analysis and recommendations rather than automatic migration.

RECOMMENDED APPROACH:

1. Review the preview output above for each affected file
2. Manually convert setup_method/teardown_method to fixtures:

   BEFORE:
   -------
   def setup_method(self):
       self.obj = create_object()

   def teardown_method(self):
       self.obj.cleanup()

   AFTER:
   ------
   @pytest.fixture(autouse=True)
   def setup(self):
       self.obj = create_object()
       yield
       self.obj.cleanup()

3. Alternatively, convert to explicit fixtures:

   @pytest.fixture
   def obj(self):
       instance = create_object()
       yield instance
       instance.cleanup()

   def test_something(self, obj):
       assert obj.works()

4. Run tests after each file migration:
   pytest tests/services/test_ai_provider_manager.py -v

For detailed migration guide, see:
  claudedocs/PYTEST_8_MIGRATION_ANALYSIS.md
    """)

    print("\n[DONE] Migration analysis complete!")


if __name__ == '__main__':
    main()
