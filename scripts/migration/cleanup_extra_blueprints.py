#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Cleanup Extra Blueprint Files
Remove all remaining old blueprint files to achieve final 8-blueprint architecture
"""

import os
from pathlib import Path

def cleanup_extra_blueprints():
    """Remove all old blueprint files except the final 8"""

    backend_path = Path("C:/Users/Ana/Meu Drive/Site roteiro de dispensação/apps/backend")
    blueprints_path = backend_path / "blueprints"

    # Final 8 blueprints to keep
    keep_files = {
        "__init__.py",
        "medical_core_blueprint.py",
        "user_management_blueprint.py",
        "analytics_observability_blueprint.py",
        "engagement_multimodal_blueprint.py",
        "infrastructure_blueprint.py",
        "api_documentation_blueprint.py",
        "authentication_blueprint.py",
        "communication_blueprint.py"
    }

    print("Cleaning up extra blueprint files...")
    print(f"Target: Keep only {len(keep_files)-1} blueprint files + __init__.py")

    # Get all Python files
    all_files = list(blueprints_path.glob("*.py"))

    removed_count = 0
    for file_path in all_files:
        filename = file_path.name

        if filename not in keep_files:
            print(f"Removing: {filename}")
            file_path.unlink()
            removed_count += 1
        else:
            print(f"Keeping: {filename}")

    print(f"\nRemoved {removed_count} extra files")

    # Verify final state
    remaining_files = list(blueprints_path.glob("*.py"))
    blueprint_files = [f for f in remaining_files if f.name != "__init__.py"]

    print(f"Final verification: {len(blueprint_files)} blueprint files remaining")

    for bp_file in sorted(blueprint_files):
        print(f"  - {bp_file.name}")

    if len(blueprint_files) == 8:
        print("\nSUCCESS: Final 8-blueprint architecture achieved!")
        return True
    else:
        print(f"\nFAILURE: Expected 8 files, found {len(blueprint_files)}")
        return False

if __name__ == "__main__":
    success = cleanup_extra_blueprints()
    exit(0 if success else 1)