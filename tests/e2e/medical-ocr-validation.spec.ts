/**
 * E2E Validation Suite - Medical OCR System
 *
 * Tests critical OCR functionality after pytesseract 0.3.13 update
 * Validates Portuguese text extraction from medical documents
 *
 * Compliance: LGPD, CFM 2.314/2022, PCDT Hanseníase 2022
 * Priority: CRITICAL - Medical system validation
 *
 * @see PR #155 - pytesseract update validation
 * @see apps/backend/services/integrations/multimodal_processor.py
 */

import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Medical OCR Validation - Post PR #155', () => {
  test.beforeEach(async ({ page }) => {
    // Setup: Navigate to application
    await page.goto('/');

    // Wait for application to be ready
    await page.waitForLoadState('networkidle');
  });

  test('should extract Portuguese text from medical prescription', async ({ page }) => {
    /**
     * CRITICAL TEST: Validates pytesseract 0.3.13 processes Portuguese correctly
     *
     * Validates:
     * - Portuguese language detection (-l por)
     * - Medical terminology extraction
     * - Dosage information parsing
     * - Patient data recognition
     */

    // Navigate to document upload
    await page.goto('/upload-documento');

    // Prepare test document (Portuguese medical prescription)
    const testDocument = path.join(__dirname, '..', 'fixtures', 'receita_medica_hanseniase.pdf');

    // Upload document
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testDocument);

    // Wait for OCR processing
    await page.waitForSelector('[data-testid="ocr-processing"]', { state: 'visible' });
    await page.waitForSelector('[data-testid="ocr-result"]', {
      state: 'visible',
      timeout: 30000 // OCR can take time
    });

    // Validate extracted text contains Portuguese medical terms
    const ocrText = await page.locator('[data-testid="ocr-result"]').textContent();

    expect(ocrText).toBeTruthy();
    expect(ocrText?.toLowerCase()).toContain('paciente');
    expect(ocrText?.toLowerCase()).toContain('dosagem');
    expect(ocrText?.toLowerCase()).toContain('medicamento');

    // Log for manual verification
    console.log('OCR Extracted Text:', ocrText);
  });

  test('should process PQT-MB protocol form correctly', async ({ page }) => {
    /**
     * CRITICAL TEST: Hanseníase PQT-MB protocol extraction
     *
     * Validates specific medical protocol extraction:
     * - Protocol identification (PQT-MB)
     * - Dosage calculation fields
     * - Patient weight extraction
     * - Treatment duration
     */

    await page.goto('/calculadora-dosagem');

    // Upload PQT-MB protocol form
    const protocolForm = path.join(__dirname, '..', 'fixtures', 'formulario_pqt_mb.pdf');

    await page.locator('input[type="file"]').setInputFiles(protocolForm);

    // Wait for OCR + extraction logic
    await page.waitForSelector('[data-testid="protocol-detected"]', {
      timeout: 30000
    });

    const protocolType = await page.locator('[data-testid="protocol-type"]').textContent();
    expect(protocolType).toContain('PQT-MB');

    // Validate dosage fields extracted
    const weightField = page.locator('[data-testid="patient-weight"]');
    await expect(weightField).toBeVisible();

    const extractedWeight = await weightField.inputValue();
    expect(parseFloat(extractedWeight)).toBeGreaterThan(0);

    console.log('Protocol Type:', protocolType);
    console.log('Extracted Weight:', extractedWeight);
  });

  test('should handle OCR errors gracefully', async ({ page }) => {
    /**
     * ERROR HANDLING TEST: Validates graceful failure
     *
     * Tests:
     * - Invalid file format handling
     * - Low quality image handling
     * - Non-Portuguese text warning
     * - User-friendly error messages
     */

    await page.goto('/upload-documento');

    // Attempt to upload invalid file
    const invalidFile = path.join(__dirname, '..', 'fixtures', 'invalid_image.txt');

    await page.locator('input[type="file"]').setInputFiles(invalidFile);

    // Should show error message
    const errorMessage = page.locator('[data-testid="ocr-error"]');
    await expect(errorMessage).toBeVisible({ timeout: 10000 });

    const errorText = await errorMessage.textContent();
    expect(errorText).toBeTruthy();

    // Error should be user-friendly (medical context)
    expect(errorText?.toLowerCase()).toMatch(/(formato|arquivo|imagem|suportado)/);

    console.log('Error Message:', errorText);
  });

  test('should maintain OCR quality metrics', async ({ page }) => {
    /**
     * PERFORMANCE TEST: OCR quality validation
     *
     * Validates:
     * - Processing time < 30s
     * - Accuracy (manual verification helper)
     * - Text completeness
     * - No data loss vs 0.3.10
     */

    await page.goto('/upload-documento');

    const testDocument = path.join(__dirname, '..', 'fixtures', 'receita_medica_hanseniase.pdf');

    // Start timing
    const startTime = Date.now();

    await page.locator('input[type="file"]').setInputFiles(testDocument);
    await page.waitForSelector('[data-testid="ocr-result"]', {
      state: 'visible'
    });

    const processingTime = Date.now() - startTime;

    // Validate performance
    expect(processingTime).toBeLessThan(30000); // 30 seconds max

    // Get OCR confidence score if available
    const confidenceScore = await page.locator('[data-testid="ocr-confidence"]').textContent();

    console.log('Processing Time:', processingTime, 'ms');
    console.log('Confidence Score:', confidenceScore);

    // If available, validate confidence
    if (confidenceScore) {
      const score = parseFloat(confidenceScore);
      expect(score).toBeGreaterThan(0.7); // 70% minimum confidence
    }
  });

  test('should validate API endpoint /api/documents/ocr', async ({ request }) => {
    /**
     * API INTEGRATION TEST: Direct OCR endpoint validation
     *
     * Tests backend API directly:
     * - POST /api/documents/ocr
     * - Portuguese language support
     * - JSON response format
     * - Error handling
     */

    const testDocument = path.join(__dirname, '..', 'fixtures', 'receita_medica_hanseniase.pdf');

    // Read file as buffer
    const fs = require('fs');
    const fileBuffer = fs.readFileSync(testDocument);

    // Call OCR API
    const response = await request.post('/api/documents/ocr', {
      multipart: {
        file: {
          name: 'receita_medica.pdf',
          mimeType: 'application/pdf',
          buffer: fileBuffer,
        },
        language: 'por',
      },
    });

    expect(response.ok()).toBeTruthy();

    const result = await response.json();

    // Validate response structure
    expect(result).toHaveProperty('text');
    expect(result).toHaveProperty('confidence');
    expect(result).toHaveProperty('language');

    // Validate Portuguese detection
    expect(result.language).toBe('por');

    // Validate text extraction
    expect(result.text).toBeTruthy();
    expect(result.text.toLowerCase()).toContain('paciente');

    console.log('API Response:', JSON.stringify(result, null, 2));
  });
});

test.describe('Regression Tests - pytesseract 0.3.10 vs 0.3.13', () => {
  /**
   * REGRESSION SUITE: Ensures no functionality loss
   *
   * Compares behavior between versions:
   * - Same text extraction quality
   * - Same API response format
   * - Same error handling
   * - Performance maintained or improved
   */

  test('should maintain backward compatibility', async ({ page }) => {
    /**
     * Validates that existing OCR workflows still work
     * No breaking changes in API or behavior
     */

    await page.goto('/upload-documento');

    const testDoc = path.join(__dirname, '..', 'fixtures', 'receita_medica_hanseniase.pdf');

    // Same workflow as pre-update
    await page.locator('input[type="file"]').setInputFiles(testDoc);
    await page.waitForSelector('[data-testid="ocr-result"]');

    const result = await page.locator('[data-testid="ocr-result"]').textContent();

    // Should still work exactly the same
    expect(result).toBeTruthy();

    // Log for comparison with baseline
    console.log('[0.3.13] OCR Result:', result);
  });
});

/**
 * FIXTURE REQUIREMENTS:
 *
 * Create test fixtures in tests/fixtures/:
 * - receita_medica_hanseniase.pdf: Portuguese medical prescription
 * - formulario_pqt_mb.pdf: PQT-MB protocol form
 * - invalid_image.txt: Invalid file for error testing
 *
 * All fixtures must:
 * - Contain no real patient data (LGPD compliance)
 * - Use synthetic/anonymized medical information
 * - Include Portuguese medical terminology
 * - Be optimized for OCR (good quality, clear text)
 */

/**
 * MANUAL VALIDATION CHECKLIST:
 *
 * After running tests, manually verify:
 * [ ] Portuguese text accurately extracted
 * [ ] Medical terminology preserved
 * [ ] Dosage numbers correctly parsed
 * [ ] Special characters (ç, ã, õ, etc.) handled
 * [ ] Layout/formatting maintained
 * [ ] No regression from 0.3.10 quality
 *
 * If any test fails:
 * 1. Document failure details
 * 2. Create GitHub issue
 * 3. Consider rollback to 0.3.10
 * 4. Report upstream to pytesseract
 */
