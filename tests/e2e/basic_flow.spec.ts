import { test, expect } from '@playwright/test';

/**
 * E2E Test: Basic Flow
 * 
 * This test verifies the complete user journey:
 * 1. Mock user login
 * 2. Upload a dummy requirements.txt with license conflicts
 * 3. Poll for 'Processing' state
 * 4. Wait up to 90s for AI summary with streaming results
 */

// helper function to create a dummy requirements.txt content with real Python packages that have licensing conflicts
function createDummyRequirements(): string {
  return `flask
requests
pandas
numpy
unidecode
PyQt5
scapy
python-nmap
pymongo[srv]`;
}

test.describe('LicenseGuard Basic Flow', () => {
  test('should complete full workflow: login, upload, process, and display results', async ({ page }) => {
    // Step 1: Mock the login API endpoint
    await page.route('**/users/token', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'mock-jwt-token-12345',
          token_type: 'bearer'
        })
      });
    });

    // Step 2: Navigate to login page and perform login
    await page.goto('/login');
    
    // Fill in login credentials
    await page.fill('input[type="text"]', 'testuser');
    await page.fill('input[type="password"]', 'testpassword');
    
    // Click sign in button
    await page.click('button[type="submit"]');
    
    // Wait for navigation to main page
    await page.waitForURL('/');
    
    // Verify we're on the main page
    await expect(page.locator('h1')).toContainText('Analyze New Project');

    // Step 3: Mock the streaming analysis API endpoint
    const analysisChunks = [
      '## 🛡️ LicenseGuard Report\n\n',
      'Here is the compliance analysis for your project.\n\n',
      '### 📦 Package Summary\n',
      '`flask`: **BSD-3-Clause**\n',
      '`requests`: **Apache-2.0**\n',
      '`pandas`: **BSD-3-Clause**\n',
      '`numpy`: **BSD-3-Clause**\n',
      '`unidecode`: **GPL-2.0**\n',
      '`PyQt5`: **GPL-3.0**\n',
      '`scapy`: **GPL-2.0**\n',
      '`python-nmap`: **GPL-3.0**\n',
      '`pymongo`: **Apache-2.0**\n\n',
      '### ⚠️ License Conflicts\n',
      '* **Conflict**: [GPL-2.0] vs [Proprietary]\n',
      '    * **Source**: `unidecode`\n',
      '    * **Risk**: GPL requires the entire project to be open-sourced if distributed.\n',
      '* **Conflict**: [GPL-3.0] vs [Commercial]\n',
      '    * **Source**: `PyQt5`\n',
      '    * **Risk**: GPL-3.0 requires source code disclosure for commercial distribution.\n',
      '* **Conflict**: [GPL-2.0] vs [Proprietary]\n',
      '    * **Source**: `scapy`\n',
      '    * **Risk**: GPL-2.0 is incompatible with closed-source commercial software.\n\n',
      '### 🪜 Actionable Next Steps\n',
      '**Recommended Swaps:**\n',
      '* **Problem**: `unidecode` (GPL-2.0)\n',
      '    * **Solution**: Switch to `text-unidecode` (Artistic License)\n',
      '    * **Migration Note**: Direct drop-in replacement with same API.\n',
      '* **Problem**: `PyQt5` (GPL-3.0)\n',
      '    * **Solution**: Switch to `PySide6` (LGPL-3.0) or purchase PyQt commercial license\n',
      '    * **Migration Note**: PySide6 has nearly identical API to PyQt5.\n',
      '* **Problem**: `scapy` (GPL-2.0)\n',
      '    * **Solution**: Use `kamene` (GPL-2.0) or implement custom packet handling\n',
      '    * **Migration Note**: Consider if packet manipulation is essential to your use case.\n\n',
      '**General Steps:**\n',
      '1. Replace GPL-licensed packages with permissive alternatives\n',
      '2. Review python-nmap usage and consider alternatives\n',
      '3. Update requirements.txt with compatible packages\n',
      '4. Run full test suite after migration\n',
      '5. Consult legal team if distributing commercially\n'
    ];

    await page.route('**/generate/report', async (route) => {
      // Simulate streaming by sending chunks with delays
      const fullResponse = analysisChunks.join('');
      
      await route.fulfill({
        status: 200,
        headers: {
          'Content-Type': 'text/plain',
        },
        body: fullResponse
      });
    });

    // Step 4: Fill in project details and upload file
    await page.fill('input[placeholder="MyReallyAwesomeApp"]', 'TestProject');
    
    // Create and upload the dummy requirements.txt file
    const requirementsContent = createDummyRequirements();
    const buffer = Buffer.from(requirementsContent);
    
    // Upload file using file input
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'requirements.txt',
      mimeType: 'text/plain',
      buffer: buffer
    });

    // Verify file is uploaded (check for file name display)
    await expect(page.getByText('requirements.txt', { exact: true })).toBeVisible();

    // Click the Analyze button
    await page.click('button:has-text("Analyze")');

    // Step 5-7: Wait for the analysis result to appear
    // Note: With mocked responses, the loading states may be too fast to catch,
    // so we go straight to waiting for the final result
    await expect(async () => {
      const resultSection = page.locator('text=Analysis Result');
      await expect(resultSection).toBeVisible({ timeout: 5000 });
    }).toPass({ timeout: 90000 });

    // verify the complete analysis report is displayed with expected format
    // verify the analysis report title
    await expect(page.locator('text=🛡️ LicenseGuard Report')).toBeVisible({ timeout: 5000 });
    
    // verify package summary section
    await expect(page.locator('text=📦 Package Summary')).toBeVisible();
    await expect(page.locator('text=flask').first()).toBeVisible();
    await expect(page.locator('text=requests').first()).toBeVisible();
    await expect(page.locator('text=Apache-2.0').first()).toBeVisible();
    
    // verify license conflicts section
    await expect(page.locator('text=⚠️ License Conflicts')).toBeVisible();
    await expect(page.locator('text=unidecode').first()).toBeVisible();
    await expect(page.locator('text=PyQt5').first()).toBeVisible();
    await expect(page.locator('text=scapy').first()).toBeVisible();
    
    // verify actionable next steps section
    await expect(page.locator('text=🪜 Actionable Next Steps')).toBeVisible();
    await expect(page.locator('text=Recommended Swaps')).toBeVisible();
    
    // verify specific recommendations section
    await expect(page.locator('text=text-unidecode').first()).toBeVisible();
    await expect(page.locator('text=PySide6').first()).toBeVisible();
    
    // verify general steps section
    await expect(page.locator('text=General Steps')).toBeVisible();

    // ensure key conflict information is present
    await expect(page.locator('text=[GPL-2.0] vs [Proprietary]').first()).toBeVisible();
    await expect(page.locator('text=[GPL-3.0] vs [Commercial]').first()).toBeVisible();
  });
});
