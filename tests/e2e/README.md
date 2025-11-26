# E2E Tests for LicenseGuard UI

This directory contains end-to-end tests for the LicenseGuard UI using Playwright.

## Test Overview

### `basic_flow.spec.ts`

This test verifies the complete user journey:

1. **Mock User Login**: Simulates user authentication with mocked API responses
2. **Upload Requirements File**: Uploads a dummy `requirements.txt` with 9 real Python packages
3. **Poll for Processing State**: Waits for the "Analyzing Dependencies..." UI state
4. **Wait for AI Summary**: Polls for up to 90 seconds for the streaming analysis report

#### Test Packages

The test uses the following real Python packages with known license conflicts:

- `flask` (BSD-3-Clause)
- `requests` (Apache-2.0)
- `pandas` (BSD-3-Clause)
- `numpy` (BSD-3-Clause)
- `unidecode` (GPL-2.0) ⚠️
- `PyQt5` (GPL-3.0) ⚠️
- `scapy` (GPL-2.0) ⚠️
- `python-nmap` (GPL-3.0) ⚠️
- `pymongo[srv]` (Apache-2.0)

The test expects to detect **3 license conflicts** related to GPL-licensed packages.

## Running the Tests

### Prerequisites

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Install Playwright browsers (first time only):
   ```bash
   pnpm exec playwright install
   ```

### Run Tests

**Headless mode** (default):
```bash
pnpm run test:e2e
```

**Headed mode** (see the browser):
```bash
pnpm run test:e2e:headed
```

**UI mode** (interactive debugging):
```bash
pnpm run test:e2e:ui
```

## Test Configuration

The test configuration is defined in `playwright.config.ts`:

- **Base URL**: `http://localhost:5173`
- **Test Directory**: `./tests/e2e`
- **Timeout**: 90 seconds for AI summary polling
- **Web Server**: Automatically starts the dev server before tests

## Mocked API Endpoints

The test mocks the following API endpoints:

1. **Login**: `POST /users/token`
   - Returns a mock JWT token
   
2. **Analysis**: `POST /generate/report`
   - Returns a streaming response with the LicenseGuard report format
   - Includes package summary, license conflicts, and actionable recommendations

## Expected Report Format

The test validates the following sections in the AI-generated report:

- 🛡️ **LicenseGuard Report** (title)
- 📦 **Package Summary** (all packages with licenses)
- ⚠️ **License Conflicts** (3 conflicts detected)
- 🪜 **Actionable Next Steps** (recommended swaps and general steps)

## Troubleshooting

### Test Fails to Start

If the test fails to start the dev server:
```bash
# Manually start the dev server in a separate terminal
pnpm run dev

# Then run tests with existing server
pnpm run test:e2e
```

### Timeout Issues

If tests timeout waiting for elements:
- Check that the dev server is running on port 5173
- Verify API endpoints match the expected URLs in `src/services/api.ts`
- Increase timeout in test if needed (currently 90s for AI summary)

### Debugging

Use Playwright's UI mode for step-by-step debugging:
```bash
pnpm run test:e2e:ui
```

This opens an interactive interface where you can:
- See each test step
- View screenshots at each stage
- Inspect the DOM
- Time-travel through test execution
