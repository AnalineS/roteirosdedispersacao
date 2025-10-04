# Path Validation Security Guide

Quick reference for using the path traversal protection framework.

---

## Usage Pattern

### Basic Validation
```python
from core.security.cicd_security import validate_safe_path, PathTraversalError

# Validate user input path
try:
    safe_path = validate_safe_path(user_input_path)
    # Use safe_path for file operations
    with open(safe_path, 'r') as f:
        content = f.read()
except PathTraversalError as e:
    logger.warning(f"Path traversal blocked: {e}")
    # Handle security violation
```

### Custom Base Directory
```python
# Restrict to specific directory
try:
    safe_path = validate_safe_path(
        user_input_path,
        allowed_base_dir="/app/data"
    )
    # Path guaranteed to be within /app/data
except PathTraversalError as e:
    logger.error(f"Security violation: {e}")
```

---

## Integration Examples

### File Reading
```python
def read_user_file(file_path: str) -> str:
    """Read user-provided file securely"""
    try:
        safe_path = validate_safe_path(file_path)
        with open(safe_path, 'r') as f:
            return f.read()
    except PathTraversalError as e:
        raise ValueError(f"Invalid file path: {e}")
```

### Directory Scanning
```python
def scan_user_directory(directory: str) -> List[str]:
    """Scan user-provided directory securely"""
    try:
        safe_dir = validate_safe_path(directory)
        return [f for f in os.listdir(safe_dir)]
    except PathTraversalError as e:
        logger.warning(f"Path traversal attempt: {e}")
        return []
```

### File Writing
```python
def write_user_file(file_path: str, content: str) -> bool:
    """Write to user-provided path securely"""
    try:
        safe_path = validate_safe_path(
            file_path,
            allowed_base_dir="/app/uploads"
        )
        with open(safe_path, 'w') as f:
            f.write(content)
        return True
    except PathTraversalError as e:
        logger.error(f"Security violation blocked: {e}")
        return False
```

---

## Security Checklist

When handling user-provided paths:

- [ ] Import `validate_safe_path` and `PathTraversalError`
- [ ] Call `validate_safe_path()` before ANY file operation
- [ ] Use returned `safe_path` for file operations
- [ ] Handle `PathTraversalError` separately from general exceptions
- [ ] Log security violations with appropriate severity
- [ ] Never concatenate user input directly into paths
- [ ] Document security validation in function docstrings

---

## What Gets Validated

### ✅ Protection Against
- `../` directory traversal sequences
- Symbolic link escape attacks
- Absolute paths outside allowed directories
- Mixed path separators (Windows/Unix)
- Path normalization bypasses

### ✅ Validation Steps
1. Empty path rejection
2. Base directory resolution
3. User path normalization with `realpath()`
4. Common path verification
5. Prefix boundary checking
6. Validation logging

---

## Error Handling Pattern

```python
try:
    safe_path = validate_safe_path(user_path)
    # File operation here

except PathTraversalError as e:
    # Security violation - log and reject
    logger.warning(f"Path traversal blocked: {e}")
    return {'error': 'Invalid path', 'security_violation': True}

except ValueError as e:
    # Invalid input - log and reject
    logger.error(f"Invalid path input: {e}")
    return {'error': str(e)}

except Exception as e:
    # Unexpected error - log and fail safe
    logger.error(f"Path validation error: {e}")
    return {'error': 'Path validation failed'}
```

---

## Testing Examples

### Unit Tests
```python
def test_path_validation():
    # Valid paths
    assert validate_safe_path("./data") # ✅ Pass
    assert validate_safe_path("subdir/file.txt") # ✅ Pass

    # Invalid paths
    with pytest.raises(PathTraversalError):
        validate_safe_path("../../etc/passwd") # ❌ Blocked

    with pytest.raises(PathTraversalError):
        validate_safe_path("/etc/shadow") # ❌ Blocked
```

### Integration Tests
```python
def test_secure_file_reading():
    # Valid file access
    content = read_user_file("data/config.json")
    assert content is not None

    # Traversal attempt
    with pytest.raises(ValueError):
        read_user_file("../../../etc/passwd")
```

---

## Common Patterns

### API Endpoint
```python
@app.route('/api/file', methods=['POST'])
def handle_file():
    file_path = request.json.get('path')

    try:
        safe_path = validate_safe_path(
            file_path,
            allowed_base_dir=app.config['UPLOAD_DIR']
        )
        # Process file
        return {'status': 'success', 'path': safe_path}

    except PathTraversalError as e:
        return {'error': 'Invalid path'}, 400
```

### Background Job
```python
def process_user_directory(directory: str):
    try:
        safe_dir = validate_safe_path(directory)
        logger.info(f"Processing directory: {safe_dir}")

        for file in os.listdir(safe_dir):
            # Process files

    except PathTraversalError as e:
        logger.error(f"Security violation in job: {e}")
        raise
```

---

## Migration Guide

### Before (VULNERABLE)
```python
def scan_files(directory):
    for root, dirs, files in os.walk(directory):  # ❌
        # ...
```

### After (SECURE)
```python
def scan_files(directory):
    safe_dir = validate_safe_path(directory)  # ✅
    for root, dirs, files in os.walk(safe_dir):
        # ...
```

---

## Performance Considerations

- `validate_safe_path()` uses `os.path.realpath()` which resolves symlinks
- Adds ~0.1ms overhead per validation call
- Recommend caching validated paths for repeated operations
- Negligible impact vs. security benefits

---

## Security Logging

All validations are logged:
```
DEBUG: Path validation successful: ./data -> /app/project/data
WARNING: Path traversal attempt blocked: '../../../etc/passwd' escapes allowed directory '/app/project'
ERROR: Path traversal attempt blocked in dependency scan: ...
```

Monitor logs for:
- Repeated traversal attempts (attack indicator)
- Unusual path patterns
- Failed validation spikes

---

## Additional Resources

- **CWE-22**: https://cwe.mitre.org/data/definitions/22.html
- **OWASP Path Traversal**: https://owasp.org/www-community/attacks/Path_Traversal
- **Python Path Security**: https://docs.python.org/3/library/pathlib.html

---

## Support

For security questions or issues:
1. Review this guide and security fix report
2. Check audit logs for validation attempts
3. Test with provided examples
4. Contact security team if vulnerability suspected
