#!/usr/bin/env python3
"""
Comprehensive Quality Validation Suite for Roteiro de Dispensação System
Backend Flask + Frontend Next.js Integration Testing
"""

import requests
import json
import time
import statistics
import sys
from datetime import datetime
from typing import Dict, List, Tuple, Any
import concurrent.futures
import threading

class QualityValidator:
    def __init__(self, backend_url="http://localhost:5000", frontend_url="http://localhost:3003"):
        self.backend_url = backend_url
        self.frontend_url = frontend_url
        self.session = requests.Session()
        self.results = {
            'integration': {},
            'quality': {},
            'performance': {},
            'failures': {},
            'scores': {},
            'issues': [],
            'recommendations': []
        }
        
    def log_test(self, test_name: str, status: str, details: Dict = None):
        """Log test results with timestamp"""
        timestamp = datetime.now().isoformat()
        print(f"[{timestamp}] {test_name}: {status}")
        if details:
            print(f"  Details: {json.dumps(details, indent=2)}")
            
    def test_integration(self) -> Dict:
        """Test backend-frontend integration"""
        print("\n=== INTEGRATION VALIDATION ===")
        integration_results = {}
        
        # Test 1: Backend Health Check
        try:
            start_time = time.time()
            response = self.session.get(f"{self.backend_url}/api/health", timeout=10)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                health_data = response.json()
                integration_results['backend_health'] = {
                    'status': 'PASS',
                    'response_time_ms': response_time,
                    'data': health_data
                }
                self.log_test("Backend Health", "PASS", {"response_time": f"{response_time:.2f}ms"})
            else:
                integration_results['backend_health'] = {'status': 'FAIL', 'code': response.status_code}
                self.log_test("Backend Health", "FAIL", {"code": response.status_code})
        except Exception as e:
            integration_results['backend_health'] = {'status': 'ERROR', 'error': str(e)}
            self.log_test("Backend Health", "ERROR", {"error": str(e)})
            
        # Test 2: Personas Endpoint
        try:
            start_time = time.time()
            response = self.session.get(f"{self.backend_url}/api/personas", timeout=10)
            response_time = (time.time() - start_time) * 1000
            
            if response.status_code == 200:
                personas_data = response.json()
                expected_personas = ['dr_gasnelio', 'ga']
                found_personas = list(personas_data.get('personas', {}).keys())
                
                integration_results['personas_endpoint'] = {
                    'status': 'PASS' if all(p in found_personas for p in expected_personas) else 'PARTIAL',
                    'response_time_ms': response_time,
                    'expected_personas': expected_personas,
                    'found_personas': found_personas
                }
                self.log_test("Personas Endpoint", integration_results['personas_endpoint']['status'])
            else:
                integration_results['personas_endpoint'] = {'status': 'FAIL', 'code': response.status_code}
                
        except Exception as e:
            integration_results['personas_endpoint'] = {'status': 'ERROR', 'error': str(e)}
            
        # Test 3: CORS Configuration
        try:
            headers = {
                'Origin': self.frontend_url,
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'Content-Type'
            }
            response = self.session.options(f"{self.backend_url}/api/chat", headers=headers, timeout=5)
            
            cors_headers = {
                'access-control-allow-origin': response.headers.get('Access-Control-Allow-Origin'),
                'access-control-allow-methods': response.headers.get('Access-Control-Allow-Methods'),
                'access-control-allow-headers': response.headers.get('Access-Control-Allow-Headers')
            }
            
            integration_results['cors_config'] = {
                'status': 'PASS' if response.status_code == 200 else 'FAIL',
                'cors_headers': cors_headers
            }
            self.log_test("CORS Configuration", integration_results['cors_config']['status'])
            
        except Exception as e:
            integration_results['cors_config'] = {'status': 'ERROR', 'error': str(e)}
            
        return integration_results
        
    def test_response_quality(self) -> Dict:
        """Test AI response quality and persona accuracy"""
        print("\n=== RESPONSE QUALITY VALIDATION ===")
        quality_results = {}
        
        test_questions = [
            {
                'question': 'Qual é o esquema PQT-U para hanseníase paucibacilar?',
                'persona': 'dr_gasnelio',
                'expected_style': 'technical',
                'category': 'clinical'
            },
            {
                'question': 'Estou com medo de tomar os remédios da hanseníase. O que devo fazer?',
                'persona': 'ga',
                'expected_style': 'empathetic',
                'category': 'emotional_support'
            },
            {
                'question': 'Como funciona a rifampicina no tratamento?',
                'persona': 'dr_gasnelio',
                'expected_style': 'technical',
                'category': 'pharmacology'
            },
            {
                'question': 'É normal sentir tontura com os medicamentos?',
                'persona': 'ga',
                'expected_style': 'empathetic',
                'category': 'side_effects'
            }
        ]
        
        for i, test_case in enumerate(test_questions):
            try:
                chat_payload = {
                    'question': test_case['question'],
                    'personality_id': test_case['persona']
                }
                
                start_time = time.time()
                response = self.session.post(
                    f"{self.backend_url}/api/chat",
                    json=chat_payload,
                    headers={'Content-Type': 'application/json'},
                    timeout=30
                )
                response_time = (time.time() - start_time) * 1000
                
                if response.status_code == 200:
                    chat_data = response.json()
                    
                    # Analyze response quality
                    quality_score = self.analyze_response_quality(
                        chat_data.get('response', ''),
                        test_case['expected_style'],
                        test_case['category']
                    )
                    
                    quality_results[f'test_{i}_{test_case["persona"]}'] = {
                        'status': 'PASS' if quality_score >= 0.7 else 'PARTIAL',
                        'question': test_case['question'],
                        'persona': test_case['persona'],
                        'response_time_ms': response_time,
                        'quality_score': quality_score,
                        'response_length': len(chat_data.get('response', '')),
                        'has_citations': 'fonte:' in chat_data.get('response', '').lower() or 'referência:' in chat_data.get('response', '').lower(),
                        'sentiment_detected': chat_data.get('sentiment_analysis', {}).get('sentiment'),
                        'fallback_used': chat_data.get('fallback_used', False)
                    }
                    
                    self.log_test(f"Quality Test {i+1} ({test_case['persona']})", 
                                quality_results[f'test_{i}_{test_case["persona"]}']['status'],
                                {'quality_score': quality_score})
                else:
                    quality_results[f'test_{i}_{test_case["persona"]}'] = {
                        'status': 'FAIL',
                        'error_code': response.status_code
                    }
                    
                # Delay between requests to avoid rate limiting
                time.sleep(2)
                
            except Exception as e:
                quality_results[f'test_{i}_{test_case["persona"]}'] = {
                    'status': 'ERROR',
                    'error': str(e)
                }
                
        return quality_results
        
    def analyze_response_quality(self, response: str, expected_style: str, category: str) -> float:
        """Analyze response quality based on style and category"""
        score = 0.0
        
        # Base criteria
        if len(response) > 50:
            score += 0.2
        if len(response) < 1000:  # Not too verbose
            score += 0.1
            
        # Style-specific analysis
        if expected_style == 'technical':
            # Technical responses should have medical terms, dosages, references
            technical_indicators = ['mg', 'dose', 'tratamento', 'esquema', 'medicamento', 'clínica']
            found_indicators = sum(1 for indicator in technical_indicators if indicator.lower() in response.lower())
            score += min(0.4, found_indicators * 0.1)
            
        elif expected_style == 'empathetic':
            # Empathetic responses should be supportive, use simple language
            empathy_indicators = ['compreendo', 'normal', 'não se preocupe', 'vamos', 'ajudar', 'apoio']
            found_indicators = sum(1 for indicator in empathy_indicators if indicator.lower() in response.lower())
            score += min(0.4, found_indicators * 0.1)
            
        # Category-specific analysis
        if category == 'clinical' and any(term in response.lower() for term in ['pqt', 'paucibacilar', 'multibacilar']):
            score += 0.2
            
        if category == 'emotional_support' and any(term in response.lower() for term in ['sentimento', 'normal', 'apoio']):
            score += 0.2
            
        # Knowledge base indicators
        if any(term in response.lower() for term in ['hanseníase', 'hanseniase', 'rifampicina', 'dapsona']):
            score += 0.1
            
        return min(1.0, score)
        
    def test_performance(self) -> Dict:
        """Test system performance and monitoring"""
        print("\n=== PERFORMANCE & MONITORING ===")
        performance_results = {}
        
        # Response time tests
        endpoint_tests = [
            {'endpoint': '/api/health', 'method': 'GET', 'expected_time_ms': 200},
            {'endpoint': '/api/personas', 'method': 'GET', 'expected_time_ms': 500},
        ]
        
        for test in endpoint_tests:
            response_times = []
            for _ in range(5):  # 5 requests per endpoint
                try:
                    start_time = time.time()
                    response = self.session.request(
                        test['method'],
                        f"{self.backend_url}{test['endpoint']}",
                        timeout=10
                    )
                    response_time = (time.time() - start_time) * 1000
                    response_times.append(response_time)
                    time.sleep(0.5)
                except Exception as e:
                    response_times.append(10000)  # 10s penalty for errors
                    
            avg_time = statistics.mean(response_times)
            performance_results[f"{test['endpoint']}_performance"] = {
                'avg_response_time_ms': avg_time,
                'max_response_time_ms': max(response_times),
                'min_response_time_ms': min(response_times),
                'status': 'PASS' if avg_time <= test['expected_time_ms'] else 'FAIL',
                'expected_time_ms': test['expected_time_ms']
            }
            
            self.log_test(f"Performance {test['endpoint']}", 
                         performance_results[f"{test['endpoint']}_performance"]['status'],
                         {'avg_time': f"{avg_time:.2f}ms"})
            
        return performance_results
        
    def test_failure_scenarios(self) -> Dict:
        """Test failure scenarios and graceful degradation"""
        print("\n=== FAILURE SCENARIOS ===")
        failure_results = {}
        
        # Test 1: Invalid JSON payload
        try:
            response = self.session.post(
                f"{self.backend_url}/api/chat",
                data="invalid json",
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            failure_results['invalid_json'] = {
                'status': 'PASS' if response.status_code == 400 else 'FAIL',
                'response_code': response.status_code,
                'handles_gracefully': response.status_code == 400
            }
            
        except Exception as e:
            failure_results['invalid_json'] = {'status': 'ERROR', 'error': str(e)}
            
        # Test 2: Missing required fields
        try:
            response = self.session.post(
                f"{self.backend_url}/api/chat",
                json={'personality_id': 'dr_gasnelio'},  # Missing question
                timeout=10
            )
            
            failure_results['missing_fields'] = {
                'status': 'PASS' if response.status_code == 400 else 'FAIL',
                'response_code': response.status_code
            }
            
        except Exception as e:
            failure_results['missing_fields'] = {'status': 'ERROR', 'error': str(e)}
            
        # Test 3: Rate limiting (if implemented)
        rate_limit_responses = []
        try:
            for i in range(10):  # Send 10 rapid requests
                response = self.session.get(f"{self.backend_url}/api/health", timeout=5)
                rate_limit_responses.append(response.status_code)
                if i < 9:  # No delay on last request
                    time.sleep(0.1)
                    
            failure_results['rate_limiting'] = {
                'status': 'INFO',  # Rate limiting is optional
                'responses': rate_limit_responses,
                'rate_limited': 429 in rate_limit_responses
            }
            
        except Exception as e:
            failure_results['rate_limiting'] = {'status': 'ERROR', 'error': str(e)}
            
        return failure_results
        
    def calculate_overall_scores(self) -> Dict:
        """Calculate overall quality scores"""
        scores = {}
        
        # Integration Score
        integration_tests = self.results.get('integration', {})
        integration_passed = sum(1 for test in integration_tests.values() if test.get('status') == 'PASS')
        integration_total = len(integration_tests)
        scores['integration'] = (integration_passed / integration_total * 100) if integration_total > 0 else 0
        
        # Quality Score
        quality_tests = self.results.get('quality', {})
        quality_scores = [test.get('quality_score', 0) for test in quality_tests.values() if 'quality_score' in test]
        scores['response_quality'] = (statistics.mean(quality_scores) * 100) if quality_scores else 0
        
        # Performance Score
        performance_tests = self.results.get('performance', {})
        performance_passed = sum(1 for test in performance_tests.values() if test.get('status') == 'PASS')
        performance_total = len(performance_tests)
        scores['performance'] = (performance_passed / performance_total * 100) if performance_total > 0 else 0
        
        # Overall Score
        scores['overall'] = statistics.mean([scores['integration'], scores['response_quality'], scores['performance']])
        
        return scores
        
    def generate_recommendations(self):
        """Generate improvement recommendations based on test results"""
        recommendations = []
        
        # Check integration issues
        if self.results['scores']['integration'] < 80:
            recommendations.append({
                'priority': 'HIGH',
                'category': 'Integration',
                'issue': 'Integration tests failing',
                'recommendation': 'Review API endpoint configurations and CORS settings'
            })
            
        # Check response quality
        if self.results['scores']['response_quality'] < 70:
            recommendations.append({
                'priority': 'HIGH',
                'category': 'AI Quality',
                'issue': 'AI response quality below acceptable threshold',
                'recommendation': 'Review persona prompts and knowledge base content. Consider fine-tuning response generation.'
            })
            
        # Check performance
        if self.results['scores']['performance'] < 80:
            recommendations.append({
                'priority': 'MEDIUM',
                'category': 'Performance',
                'issue': 'Performance below expectations',
                'recommendation': 'Implement caching, optimize database queries, consider CDN for static assets'
            })
            
        # Check for missing features
        quality_tests = self.results.get('quality', {})
        fallback_usage = sum(1 for test in quality_tests.values() if test.get('fallback_used', False))
        if fallback_usage > 0:
            recommendations.append({
                'priority': 'LOW',
                'category': 'Reliability',
                'issue': f'Fallback system activated {fallback_usage} times during testing',
                'recommendation': 'Monitor AI service availability and consider implementing additional fallback strategies'
            })
            
        return recommendations
        
    def run_full_validation(self) -> Dict:
        """Run complete validation suite"""
        print("Starting Comprehensive Quality Validation Suite")
        print("=" * 60)
        
        # Run all test suites
        self.results['integration'] = self.test_integration()
        self.results['quality'] = self.test_response_quality()
        self.results['performance'] = self.test_performance()
        self.results['failures'] = self.test_failure_scenarios()
        
        # Calculate scores and generate recommendations
        self.results['scores'] = self.calculate_overall_scores()
        self.results['recommendations'] = self.generate_recommendations()
        
        # Generate summary
        print("\n" + "=" * 60)
        print("VALIDATION SUMMARY")
        print("=" * 60)
        print(f"Integration Score: {self.results['scores']['integration']:.1f}%")
        print(f"Response Quality Score: {self.results['scores']['response_quality']:.1f}%")
        print(f"Performance Score: {self.results['scores']['performance']:.1f}%")
        print(f"Overall Score: {self.results['scores']['overall']:.1f}%")
        
        deployment_status = "APPROVED FOR DEPLOYMENT" if self.results['scores']['overall'] >= 80 else "REQUIRES FIXES BEFORE DEPLOYMENT"
        print(f"\nDeployment Status: {deployment_status}")
        
        if self.results['recommendations']:
            print(f"\nRecommendations: {len(self.results['recommendations'])} issues identified")
            for rec in self.results['recommendations']:
                print(f"  [{rec['priority']}] {rec['category']}: {rec['recommendation']}")
        
        return self.results

if __name__ == "__main__":
    validator = QualityValidator()
    results = validator.run_full_validation()
    
    # Save detailed results
    with open('qa_validation_results.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    
    print(f"\nDetailed results saved to: qa_validation_results.json")
    sys.exit(0 if results['scores']['overall'] >= 80 else 1)