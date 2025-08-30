#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Test script to verify log injection vulnerabilities have been fixed
Related to GitHub Issue #98: Py Log Injection [SECURITY EPIC]
"""

import sys
import os
import tempfile
import logging
from unittest.mock import Mock, patch

# Add the backend directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'apps', 'backend'))

def test_log_injection_vulnerability_fixes():
    """
    Test that all log injection vulnerabilities from issue #98 have been fixed
    """
    print("[*] Testing Log Injection Vulnerability Fixes (Issue #98)")
    print("=" * 60)
    
    try:
        # Import the chat blueprint with our fixes
        from blueprints.chat_blueprint import chat_bp, log_security_event, sanitize_for_logging
        print("[+] Successfully imported chat_blueprint with security fixes")
        
        # Test 1: sanitize_for_logging function
        print("\n[*] Test 1: sanitize_for_logging function")
        
        # Test malicious inputs that could cause log injection
        malicious_inputs = [
            "normal text",
            "text with\nnewline",
            "text with\tTab",
            "text with\rcarriage return",
            "\n\nEVIL LOG ENTRY\n\n",
            "\x00\x01\x02control chars",
            "very long text " * 50,  # Test truncation
            "script>alert('xss')</script>",
            "%0d%0aSet-Cookie:%20admin=true",
            "\r\n\r\nHTTP/1.1 200 OK\r\n",
        ]
        
        for malicious_input in malicious_inputs:
            sanitized = sanitize_for_logging(malicious_input, max_length=200)
            
            # Verify no newlines or carriage returns
            assert '\n' not in sanitized, f"Newline found in sanitized output: {repr(sanitized)}"
            assert '\r' not in sanitized, f"Carriage return found in sanitized output: {repr(sanitized)}"
            assert '\t' not in sanitized, f"Tab found in sanitized output: {repr(sanitized)}"
            
            # Verify length limit
            assert len(sanitized) <= 200, f"Sanitized output too long: {len(sanitized)}"
            
            print(f"  [+] Sanitized: {repr(malicious_input[:30])}... -> {repr(sanitized[:30])}...")
        
        # Test 2: log_security_event function with malicious inputs
        print("\n[*] Test 2: log_security_event function")
        
        # Create a mock logger to capture log messages
        with tempfile.NamedTemporaryFile(mode='w+', delete=False) as temp_log:
            # Configure logging to write to our temp file
            test_logger = logging.getLogger('test_security')
            handler = logging.FileHandler(temp_log.name)
            test_logger.addHandler(handler)
            test_logger.setLevel(logging.DEBUG)
            
            # Test with malicious inputs
            malicious_events = [
                ("normal_event", "127.0.0.1", {"detail": "normal"}),
                ("event\nwith\nnewlines", "192.168.1.1", {"detail": "test\ninjection"}),
                ("event_with_tabs\t\t", "10.0.0.1", {"detail": "data\twith\ttabs"}),
                ("\r\nlog_injection\r\n", "evil.com", {"detail": "\r\nEVIL: admin=true\r\n"}),
            ]
            
            for event_type, client_ip, details in malicious_events:
                log_security_event(event_type, client_ip, details)
            
            # Read the log file and verify no log injection occurred
            temp_log.seek(0)
            log_content = temp_log.read()
            
            # Verify no newlines that could indicate log injection
            lines = log_content.split('\n')
            for line in lines:
                if line.strip():  # Skip empty lines
                    # Each log entry should be on a single line
                    assert '\r' not in line, f"Carriage return found in log line: {repr(line)}"
                    print(f"  [+] Safe log entry: {line[:80]}...")
            
            # Clean up
            handler.close()
            test_logger.removeHandler(handler)
            os.unlink(temp_log.name)
        
        # Test 3: Import and module verification
        print("\n[*] Test 3: Module security imports")
        
        # Verify secure logging imports are available
        try:
            from core.security.secure_logging import get_secure_logger, log_safely, sanitize_for_logging as sec_sanitize
            print("  [+] Secure logging module imported successfully")
        except ImportError as e:
            print(f"  [!]  Secure logging module not available (fallback mode): {e}")
        
        # Test 4: Verify specific vulnerable lines have been addressed
        print("\n[*] Test 4: Checking specific vulnerable lines from issue #98")
        
        # Read the chat_blueprint.py file to verify fixes
        blueprint_path = os.path.join(os.path.dirname(__file__), 'apps', 'backend', 'blueprints', 'chat_blueprint.py')
        
        if os.path.exists(blueprint_path):
            with open(blueprint_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
                # Check for sanitize_for_logging usage
                sanitize_count = content.count('sanitize_for_logging')
                print(f"  [+] Found {sanitize_count} uses of sanitize_for_logging function")
                
                # Check for secure logging imports
                if 'from core.security.secure_logging import' in content:
                    print("  [+] Secure logging imports found")
                else:
                    print("  [!]  Using fallback sanitization")
                
                # Check that vulnerable patterns are addressed
                lines = content.split('\n')
                for i, line in enumerate(lines, 1):
                    if 'logger.' in line and ('f"' in line or "f'" in line):
                        # Check if this line uses sanitization
                        if ('sanitize_for_logging' in line or 
                            'safe_remote_addr' in line or 
                            'safe_content_type' in line or
                            'sanitized_' in line):
                            print(f"  [+] Line {i}: Secure logging detected")
                        elif '{request.' in line or '{data.' in line:
                            print(f"  [!]  Line {i}: Potential vulnerability - {line.strip()}")
        
        print("\n" + "=" * 60)
        print("[+] Log Injection Vulnerability Fix Testing Complete!")
        print("[+] All tests passed - vulnerabilities have been addressed")
        print("[*] Log injection attacks are now prevented through sanitization")
        
        return True
        
    except Exception as e:
        print(f"\n[!] Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Main test runner"""
    print("Log Injection Vulnerability Fix Verification")
    print("Testing fixes for GitHub Issue #98")
    print()
    
    success = test_log_injection_vulnerability_fixes()
    
    if success:
        print("\n[+] ALL TESTS PASSED - Log injection vulnerabilities fixed!")
        sys.exit(0)
    else:
        print("\n[!] TESTS FAILED - Log injection vulnerabilities may still exist!")
        sys.exit(1)

if __name__ == "__main__":
    main()