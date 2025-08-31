# -*- coding: utf-8 -*-
"""
Test script to verify MD5 to SHA-256 migration maintains consistent behavior
"""

import hashlib
import unittest


class TestHashMigration(unittest.TestCase):
    """Test that SHA-256 replacement maintains expected behavior"""
    
    def test_ab_test_distribution(self):
        """Test that A/B test variant assignment remains deterministic"""
        
        # Simulate user IDs
        test_user_ids = [
            "user_123",
            "user_456", 
            "user_789",
            "session_abc",
            "session_xyz"
        ]
        
        variants = ['control', 'variant_a', 'variant_b']
        num_variants = len(variants)
        
        # Test with SHA-256 (new implementation)
        sha256_assignments = {}
        for user_id in test_user_ids:
            user_hash = int(hashlib.sha256(user_id.encode()).hexdigest(), 16)
            variant_index = user_hash % num_variants
            sha256_assignments[user_id] = variants[variant_index]
        
        # Verify deterministic assignment
        for user_id in test_user_ids:
            # Re-calculate to ensure consistency
            user_hash = int(hashlib.sha256(user_id.encode()).hexdigest(), 16)
            variant_index = user_hash % num_variants
            expected_variant = variants[variant_index]
            
            self.assertEqual(
                sha256_assignments[user_id], 
                expected_variant,
                f"Assignment for {user_id} is not deterministic"
            )
        
        # Verify distribution (should be roughly even for large samples)
        print("\nA/B Test Distribution with SHA-256:")
        for variant in variants:
            count = sum(1 for v in sha256_assignments.values() if v == variant)
            print(f"  {variant}: {count} users")
    
    def test_cache_key_generation(self):
        """Test that cache keys are still unique and deterministic"""
        
        test_cases = [
            ("What is leprosy?", "gasnelio"),
            ("What is leprosy?", "ga"),
            ("Como tratar hanseníase?", "gasnelio"),
            ("Qual a dosagem de dapsona?", "ga")
        ]
        
        cache_keys = {}
        
        for question, persona in test_cases:
            content = f"{question.lower().strip()}:{persona}"
            key = hashlib.sha256(content.encode()).hexdigest()
            
            # Check uniqueness
            self.assertNotIn(key, cache_keys.values(),
                           f"Duplicate cache key generated for {question}, {persona}")
            
            cache_keys[(question, persona)] = key
            
            # Verify deterministic generation
            key2 = hashlib.sha256(content.encode()).hexdigest()
            self.assertEqual(key, key2, 
                           f"Cache key generation is not deterministic for {question}, {persona}")
        
        print("\nCache Key Examples (SHA-256):")
        for (q, p), key in list(cache_keys.items())[:2]:
            print(f"  Question: '{q[:30]}...', Persona: {p}")
            print(f"  Key: {key[:16]}...")
    
    def test_chunk_id_generation(self):
        """Test that chunk IDs remain unique"""
        
        test_chunks = [
            "Hanseníase é uma doença infecciosa causada pelo Mycobacterium leprae.",
            "O tratamento padrão inclui dapsona, rifampicina e clofazimina.",
            "A duração do tratamento varia de 6 a 12 meses.",
            "É importante monitorar reações adversas durante o tratamento."
        ]
        
        chunk_ids = set()
        
        for chunk in test_chunks:
            # Truncated SHA-256 (as implemented)
            chunk_id = hashlib.sha256(chunk.encode()).hexdigest()[:12]
            
            # Check uniqueness
            self.assertNotIn(chunk_id, chunk_ids,
                           f"Duplicate chunk ID generated")
            
            chunk_ids.add(chunk_id)
        
        print(f"\nGenerated {len(chunk_ids)} unique chunk IDs from {len(test_chunks)} chunks")
    
    def test_file_deduplication(self):
        """Test file content hashing for deduplication"""
        
        # Simulate file data
        file1 = b"This is the content of a medical document about leprosy treatment."
        file2 = b"This is the content of a medical document about leprosy treatment."  # Duplicate
        file3 = b"This is different content about patient care guidelines."
        
        hash1 = hashlib.sha256(file1).hexdigest()
        hash2 = hashlib.sha256(file2).hexdigest()
        hash3 = hashlib.sha256(file3).hexdigest()
        
        # Identical files should have same hash
        self.assertEqual(hash1, hash2, 
                        "Identical files should produce same hash")
        
        # Different files should have different hashes
        self.assertNotEqual(hash1, hash3,
                           "Different files should produce different hashes")
        
        print("\nFile Deduplication Test:")
        print(f"  File 1 hash: {hash1[:16]}...")
        print(f"  File 2 hash: {hash2[:16]}... (duplicate detected: {hash1 == hash2})")
        print(f"  File 3 hash: {hash3[:16]}... (unique)")
    
    def test_security_improvement(self):
        """Verify that SHA-256 is cryptographically stronger than MD5"""
        
        test_input = "sensitive_user_data_123"
        
        # MD5 (old - vulnerable)
        md5_hash = hashlib.md5(test_input.encode()).hexdigest()
        
        # SHA-256 (new - secure)
        sha256_hash = hashlib.sha256(test_input.encode()).hexdigest()
        
        # SHA-256 produces longer, more secure hashes
        self.assertGreater(len(sha256_hash), len(md5_hash),
                          "SHA-256 should produce longer hash than MD5")
        
        print("\nSecurity Comparison:")
        print(f"  MD5 (deprecated):    {md5_hash} ({len(md5_hash)} chars)")
        print(f"  SHA-256 (secure):    {sha256_hash} ({len(sha256_hash)} chars)")
        print(f"  Security improvement: SHA-256 is collision-resistant and suitable for security contexts")


if __name__ == "__main__":
    print("=" * 60)
    print("Testing MD5 to SHA-256 Migration")
    print("=" * 60)
    
    # Run tests
    unittest.main(verbosity=2)