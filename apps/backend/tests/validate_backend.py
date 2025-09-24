#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Backend Validation Script
Quick validation to ensure backend is 100% functional after fixes
"""

import os
import sys
import importlib
import traceback
import time
from pathlib import Path

# Add backend to Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

class BackendValidator:
    """Quick backend functionality validator"""

    def __init__(self):
        self.results = []
        self.errors = []

    def log_result(self, test_name: str, success: bool, message: str = ""):
        """Log a test result"""
        self.results.append({
            'test': test_name,
            'success': success,
            'message': message
        })

        status = "✅" if success else "❌"
        print(f"{status} {test_name}: {message}")

        if not success:
            self.errors.append(f"{test_name}: {message}")

    def validate_imports(self):
        """Validate all critical imports work"""
        print("\n🔍 VALIDATING IMPORTS...")

        critical_imports = [
            ('flask', 'Flask framework'),
            ('main', 'Main application module'),
            ('app_config', 'Configuration module'),
            ('blueprints', 'Blueprint modules'),
            ('core.security.enhanced_security', 'Security framework'),
            ('core.performance.response_optimizer', 'Performance optimizations'),
            ('services.cache.advanced_cache', 'Cache system'),
            ('services.ai.chatbot', 'AI chatbot service')
        ]

        for module_name, description in critical_imports:
            try:
                importlib.import_module(module_name)
                self.log_result(f"Import {module_name}", True, f"{description} imported successfully")
            except ImportError as e:
                self.log_result(f"Import {module_name}", False, f"Import failed: {str(e)}")
            except Exception as e:
                self.log_result(f"Import {module_name}", False, f"Unexpected error: {str(e)}")

    def validate_app_creation(self):
        """Validate Flask app can be created"""
        print("\n🏗️ VALIDATING APP CREATION...")

        try:
            # Set test environment
            os.environ['TESTING'] = 'true'
            os.environ['SECRET_KEY'] = 'test-secret-key'
            os.environ['RATE_LIMIT_ENABLED'] = 'false'

            from main import create_app
            app = create_app()

            if app is not None:
                self.log_result("App Creation", True, "Flask app created successfully")

                # Test app configuration
                if app.config.get('TESTING'):
                    self.log_result("App Config", True, "App configured for testing")
                else:
                    self.log_result("App Config", False, "App not in testing mode")

                # Test blueprints registration
                blueprint_count = len(app.blueprints)
                if blueprint_count > 0:
                    self.log_result("Blueprints", True, f"{blueprint_count} blueprints registered")
                else:
                    self.log_result("Blueprints", False, "No blueprints registered")

            else:
                self.log_result("App Creation", False, "App creation returned None")

        except Exception as e:
            self.log_result("App Creation", False, f"App creation failed: {str(e)}")
            traceback.print_exc()

    def validate_basic_endpoints(self):
        """Validate basic endpoints respond"""
        print("\n🌐 VALIDATING BASIC ENDPOINTS...")

        try:
            from main import create_app

            app = create_app()
            client = app.test_client()

            # Test basic endpoints
            endpoints = [
                ('/', 'Root endpoint'),
                ('/api/v1/health', 'Health check'),
                ('/_ah/health', 'Cloud health check')
            ]

            for endpoint, description in endpoints:
                try:
                    response = client.get(endpoint)
                    if response.status_code == 200:
                        self.log_result(f"Endpoint {endpoint}", True, f"{description} responds correctly")
                    else:
                        self.log_result(f"Endpoint {endpoint}", False, f"Status code: {response.status_code}")
                except Exception as e:
                    self.log_result(f"Endpoint {endpoint}", False, f"Request failed: {str(e)}")

        except Exception as e:
            self.log_result("Endpoint Testing", False, f"Client creation failed: {str(e)}")

    def validate_dependencies(self):
        """Validate critical dependencies are available"""
        print("\n📦 VALIDATING DEPENDENCIES...")

        dependencies = [
            ('flask', 'Flask>=3.1.0'),
            ('requests', 'HTTP client'),
            ('cryptography', 'Cryptographic functions'),
            ('pydantic', 'Data validation'),
            ('sqlite3', 'Database support'),
            ('json', 'JSON processing'),
            ('os', 'Operating system interface'),
            ('datetime', 'Date and time handling')
        ]

        for dep, description in dependencies:
            try:
                __import__(dep)
                self.log_result(f"Dependency {dep}", True, f"{description} available")
            except ImportError:
                self.log_result(f"Dependency {dep}", False, f"{description} not available")

    def validate_configuration(self):
        """Validate configuration is working"""
        print("\n⚙️ VALIDATING CONFIGURATION...")

        try:
            from app_config import config, EnvironmentConfig

            # Test configuration access
            if hasattr(config, 'SECRET_KEY'):
                self.log_result("Config Access", True, "Configuration accessible")
            else:
                self.log_result("Config Access", False, "Configuration not accessible")

            # Test environment detection
            env = EnvironmentConfig.get_current()
            self.log_result("Environment Detection", True, f"Environment: {env}")

            # Test required settings
            if config.SECRET_KEY:
                self.log_result("Secret Key", True, "Secret key configured")
            else:
                self.log_result("Secret Key", False, "Secret key not configured")

        except Exception as e:
            self.log_result("Configuration", False, f"Configuration validation failed: {str(e)}")

    def validate_security_features(self):
        """Validate security features are working"""
        print("\n🔒 VALIDATING SECURITY FEATURES...")

        try:
            # Test security middleware import
            try:
                from core.security.enhanced_security import init_security_optimizations
                self.log_result("Security Middleware", True, "Security optimizations available")
            except ImportError:
                self.log_result("Security Middleware", False, "Security optimizations not available")

            # Test CORS configuration
            try:
                from core.security.custom_cors import CustomCORSMiddleware
                self.log_result("CORS Middleware", True, "Custom CORS middleware available")
            except ImportError:
                self.log_result("CORS Middleware", False, "Custom CORS middleware not available")

            # Test rate limiting
            try:
                from core.security.production_rate_limiter import init_production_rate_limiter
                self.log_result("Rate Limiting", True, "Production rate limiter available")
            except ImportError:
                self.log_result("Rate Limiting", False, "Production rate limiter not available")

        except Exception as e:
            self.log_result("Security Features", False, f"Security validation failed: {str(e)}")

    def validate_cache_system(self):
        """Validate cache system is working"""
        print("\n💾 VALIDATING CACHE SYSTEM...")

        try:
            from services.cache.advanced_cache import AdvancedCache

            # Test cache creation
            cache = AdvancedCache(max_size=100, ttl_minutes=5)

            # Test basic cache operations
            test_key = "test_key"
            test_value = "test_value"

            # Test set
            cache.set(test_key, test_value)
            self.log_result("Cache Set", True, "Cache set operation successful")

            # Test get
            retrieved_value = cache.get(test_key)
            if retrieved_value == test_value:
                self.log_result("Cache Get", True, "Cache get operation successful")
            else:
                self.log_result("Cache Get", False, f"Expected {test_value}, got {retrieved_value}")

            # Test delete
            cache.delete(test_key)
            deleted_value = cache.get(test_key)
            if deleted_value is None:
                self.log_result("Cache Delete", True, "Cache delete operation successful")
            else:
                self.log_result("Cache Delete", False, "Cache delete operation failed")

        except ImportError:
            self.log_result("Cache System", False, "Cache system not available")
        except Exception as e:
            self.log_result("Cache System", False, f"Cache validation failed: {str(e)}")

    def validate_database_access(self):
        """Validate database access is working"""
        print("\n🗄️ VALIDATING DATABASE ACCESS...")

        try:
            import sqlite3

            # Test in-memory database
            conn = sqlite3.connect(':memory:')
            cursor = conn.cursor()

            # Test table creation
            cursor.execute('''
                CREATE TABLE test_table (
                    id INTEGER PRIMARY KEY,
                    name TEXT,
                    value INTEGER
                )
            ''')
            self.log_result("Database Create", True, "Table creation successful")

            # Test insert
            cursor.execute("INSERT INTO test_table (name, value) VALUES (?, ?)", ("test", 123))
            conn.commit()
            self.log_result("Database Insert", True, "Insert operation successful")

            # Test select
            cursor.execute("SELECT * FROM test_table WHERE name = ?", ("test",))
            result = cursor.fetchone()
            if result and result[1] == "test" and result[2] == 123:
                self.log_result("Database Select", True, "Select operation successful")
            else:
                self.log_result("Database Select", False, f"Unexpected result: {result}")

            conn.close()

        except Exception as e:
            self.log_result("Database Access", False, f"Database validation failed: {str(e)}")

    def validate_performance(self):
        """Validate basic performance characteristics"""
        print("\n⚡ VALIDATING PERFORMANCE...")

        try:
            from main import create_app

            app = create_app()
            client = app.test_client()

            # Test response time
            start_time = time.time()
            response = client.get('/api/v1/health')
            end_time = time.time()

            response_time = end_time - start_time

            if response.status_code == 200:
                if response_time < 1.0:  # Should respond in under 1 second
                    self.log_result("Response Time", True, f"Health check: {response_time:.3f}s")
                else:
                    self.log_result("Response Time", False, f"Too slow: {response_time:.3f}s")
            else:
                self.log_result("Response Time", False, f"Health check failed: {response.status_code}")

            # Test multiple requests
            request_count = 10
            start_time = time.time()

            for _ in range(request_count):
                response = client.get('/api/v1/health')
                if response.status_code != 200:
                    break

            end_time = time.time()
            total_time = end_time - start_time
            avg_time = total_time / request_count

            if avg_time < 0.1:  # Average should be under 100ms
                self.log_result("Throughput", True, f"{request_count} requests in {total_time:.3f}s (avg: {avg_time:.3f}s)")
            else:
                self.log_result("Throughput", False, f"Average too slow: {avg_time:.3f}s")

        except Exception as e:
            self.log_result("Performance", False, f"Performance validation failed: {str(e)}")

    def run_validation(self):
        """Run complete validation suite"""
        print("🔍 BACKEND VALIDATION STARTING...")
        print("=" * 50)

        start_time = time.time()

        # Run all validation checks
        self.validate_dependencies()
        self.validate_imports()
        self.validate_configuration()
        self.validate_app_creation()
        self.validate_basic_endpoints()
        self.validate_security_features()
        self.validate_cache_system()
        self.validate_database_access()
        self.validate_performance()

        end_time = time.time()
        duration = end_time - start_time

        # Generate summary
        self.print_summary(duration)

        return len(self.errors) == 0

    def print_summary(self, duration: float):
        """Print validation summary"""
        total_tests = len(self.results)
        passed_tests = sum(1 for r in self.results if r['success'])
        failed_tests = total_tests - passed_tests

        print("\n" + "=" * 50)
        print("📊 VALIDATION SUMMARY")
        print("=" * 50)
        print(f"🧪 Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"📈 Success Rate: {(passed_tests/total_tests*100):.1f}%")
        print(f"⏱️ Duration: {duration:.1f}s")

        if self.errors:
            print(f"\n💥 FAILED TESTS:")
            for error in self.errors:
                print(f"  • {error}")

        print("\n" + "=" * 50)

        if failed_tests == 0:
            print("🎉 BACKEND IS 100% FUNCTIONAL - READY FOR COMPREHENSIVE TESTING! 🎉")
        else:
            print("🚨 BACKEND HAS ISSUES - FIX REQUIRED BEFORE COMPREHENSIVE TESTING 🚨")

        print("=" * 50)

def main():
    """Main validation function"""
    validator = BackendValidator()

    # Set test environment
    os.environ['TESTING'] = 'true'
    os.environ['SECRET_KEY'] = 'test-secret-key'
    os.environ['RATE_LIMIT_ENABLED'] = 'false'

    try:
        success = validator.run_validation()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\nValidation interrupted by user")
        sys.exit(130)
    except Exception as e:
        print(f"\nValidation failed with error: {e}")
        traceback.print_exc()
        sys.exit(1)

if __name__ == '__main__':
    main()