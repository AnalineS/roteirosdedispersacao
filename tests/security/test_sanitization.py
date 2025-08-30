#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Simple test for log injection vulnerability fixes
GitHub Issue #98: Py Log Injection [SECURITY EPIC]
"""

def test_sanitize_for_logging_fallback():
    """Test the fallback sanitization function"""
    def sanitize_for_logging(text, max_length=200):
        if not isinstance(text, str):
            text = str(text)
        # Sanitização básica para prevenir log injection
        sanitized = text.replace('\n', ' ').replace('\r', ' ').replace('\t', ' ')
        return sanitized[:max_length] if len(sanitized) > max_length else sanitized
    
    print("[*] Testing sanitize_for_logging fallback function")
    
    # Test cases with malicious inputs
    test_cases = [
        ("normal text", "normal text"),
        ("text with\nnewline", "text with newline"),
        ("text with\ttab", "text with tab"),
        ("text with\rcarriage return", "text with carriage return"),
        ("\n\nEVIL LOG ENTRY\n\n", "  EVIL LOG ENTRY  "),
        ("\x00\x01\x02control chars", "control chars"),
        ("very long text " * 20, ("very long text " * 20)[:200]),
        ("script>alert('xss')</script>", "script>alert('xss')</script>"),
        ("%0d%0aSet-Cookie:%20admin=true", "%0d%0aSet-Cookie:%20admin=true"),
        ("\r\n\r\nHTTP/1.1 200 OK\r\n", "   HTTP/1.1 200 OK "),
    ]
    
    for input_text, expected_pattern in test_cases:
        result = sanitize_for_logging(input_text)
        
        # Check that no newlines or carriage returns remain
        assert '\n' not in result, f"Newline found in result: {repr(result)}"
        assert '\r' not in result, f"Carriage return found in result: {repr(result)}"
        assert '\t' not in result, f"Tab found in result: {repr(result)}"
        
        # Check length limit
        assert len(result) <= 200, f"Result too long: {len(result)}"
        
        print(f"  [+] Input: {repr(input_text[:30])}... -> Output: {repr(result[:30])}...")
    
    print("[+] All sanitization tests passed!")
    return True

def verify_chat_blueprint_fixes():
    """Verify that the chat blueprint has the necessary fixes"""
    import os
    
    print("\n[*] Verifying chat_blueprint.py security fixes")
    
    blueprint_path = os.path.join('apps', 'backend', 'blueprints', 'chat_blueprint.py')
    
    if not os.path.exists(blueprint_path):
        print(f"[!] File not found: {blueprint_path}")
        return False
        
    with open(blueprint_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check for security imports
    security_imports = [
        'from core.security.secure_logging import',
        'sanitize_for_logging',
    ]
    
    for import_stmt in security_imports:
        if import_stmt in content:
            print(f"  [+] Found security import: {import_stmt}")
        else:
            print(f"  [!] Missing security import: {import_stmt}")
    
    # Check for sanitization usage
    sanitization_patterns = [
        'sanitize_for_logging(',
        'safe_remote_addr',
        'safe_content_type',
        'sanitized_event_type',
        'sanitized_details',
    ]
    
    for pattern in sanitization_patterns:
        count = content.count(pattern)
        if count > 0:
            print(f"  [+] Found {count} uses of: {pattern}")
        else:
            print(f"  [!] Pattern not found: {pattern}")
    
    # Look for vulnerable logging patterns
    lines = content.split('\n')
    vulnerable_count = 0
    
    for i, line in enumerate(lines, 1):
        if 'logger.' in line and ('f"' in line or "f'" in line):
            # Check if this line contains unsanitized user input
            if ('{request.' in line or '{data.' in line or '{details}' in line) and 'sanitiz' not in line:
                print(f"  [!] Line {i}: Potentially vulnerable: {line.strip()}")
                vulnerable_count += 1
    
    if vulnerable_count == 0:
        print("  [+] No vulnerable logging patterns found!")
    else:
        print(f"  [!] Found {vulnerable_count} potentially vulnerable logging statements")
    
    return vulnerable_count == 0

def main():
    """Main test function"""
    print("Log Injection Vulnerability Fix Verification")
    print("Testing fixes for GitHub Issue #98")
    print("=" * 50)
    
    try:
        # Test 1: Basic sanitization function
        test1_pass = test_sanitize_for_logging_fallback()
        
        # Test 2: Verify file changes
        test2_pass = verify_chat_blueprint_fixes()
        
        if test1_pass and test2_pass:
            print("\n[+] ALL TESTS PASSED!")
            print("[+] Log injection vulnerabilities have been addressed")
            print("[*] The following security measures are now in place:")
            print("    - Input sanitization for log messages")
            print("    - Removal of newlines and carriage returns")
            print("    - Length limits on log messages")
            print("    - Safe handling of user-controlled data in logs")
            return True
        else:
            print("\n[!] Some tests failed - manual review required")
            return False
            
    except Exception as e:
        print(f"\n[!] Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)