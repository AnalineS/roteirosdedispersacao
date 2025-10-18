@echo off
REM Blueprint Migration Wrapper Script (Windows)
REM =============================================
REM
REM Simple wrapper to run the blueprint consolidation migration with common options.

setlocal enabledelayedexpansion

REM Script directory and project root
set "SCRIPT_DIR=%~dp0"
set "PROJECT_ROOT=%SCRIPT_DIR%..\.."

echo Blueprint Consolidation Migration Tool
echo =====================================
echo.
echo Project root: %PROJECT_ROOT%
echo.

REM Check if Python script exists
if not exist "%SCRIPT_DIR%blueprint_consolidation_migration.py" (
    echo Error: Migration script not found!
    echo Expected: %SCRIPT_DIR%blueprint_consolidation_migration.py
    exit /b 1
)

REM Parse command line arguments
set "COMMAND=%~1"
if "%COMMAND%"=="" set "COMMAND=dry-run"

if /i "%COMMAND%"=="dry-run" goto DRY_RUN
if /i "%COMMAND%"=="test" goto DRY_RUN
if /i "%COMMAND%"=="preview" goto DRY_RUN
if /i "%COMMAND%"=="apply" goto APPLY
if /i "%COMMAND%"=="execute" goto APPLY
if /i "%COMMAND%"=="run" goto APPLY
if /i "%COMMAND%"=="help" goto HELP
if /i "%COMMAND%"=="-h" goto HELP
if /i "%COMMAND%"=="--help" goto HELP

echo Unknown command: %COMMAND%
echo Use '%~nx0 help' for usage information.
exit /b 1

:DRY_RUN
echo Running blueprint migration (dry-run mode)...
echo.
cd /d "%PROJECT_ROOT%"
python "%SCRIPT_DIR%blueprint_consolidation_migration.py" --root-path="%PROJECT_ROOT%" --verbose --dry-run
set "EXIT_CODE=!ERRORLEVEL!"
echo.
if !EXIT_CODE! equ 0 (
    echo Migration completed successfully!
    echo This was a dry run. No changes were made.
    echo Run with 'apply' to execute the migration.
) else (
    echo Migration failed with errors.
    echo Check the log files for details.
)
exit /b !EXIT_CODE!

:APPLY
echo This will modify your files. Continue? (y/N)
set /p "REPLY="
if /i not "!REPLY!"=="y" (
    echo Migration cancelled.
    exit /b 0
)
echo Running blueprint migration (apply mode)...
echo.
cd /d "%PROJECT_ROOT%"
python "%SCRIPT_DIR%blueprint_consolidation_migration.py" --root-path="%PROJECT_ROOT%" --verbose
set "EXIT_CODE=!ERRORLEVEL!"
echo.
if !EXIT_CODE! equ 0 (
    echo Migration completed successfully!
) else (
    echo Migration failed with errors.
    echo Check the log files for details.
)
exit /b !EXIT_CODE!

:HELP
echo Usage: %~nx0 [command]
echo.
echo Commands:
echo   dry-run   Preview changes without modifying files (default)
echo   apply     Execute the migration and modify files
echo   help      Show this help message
echo.
echo Examples:
echo   %~nx0                    # Preview changes
echo   %~nx0 dry-run           # Preview changes
echo   %~nx0 apply             # Execute migration
echo.
exit /b 0