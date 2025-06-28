# 🎭 Playwright Testing Guide for Auto-Save Feature

## Setup Instructions

### 1. Get Your Clerk Testing Token

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Navigate to **API Keys** → **Testing tokens**
3. Copy the testing token
4. Update `.env.test` with your token

### 2. Update Environment Variables

Edit `.env.test` and replace the placeholders:

```env
# Copy from your .env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx

# Get from Clerk Dashboard > API Keys > Testing tokens
CLERK_TESTING_TOKEN=your_actual_testing_token_here

# Your test user credentials
TEST_USER_EMAIL=your_actual_email@example.com
TEST_USER_PASSWORD=your_actual_password
```

### 3. Install Dependencies

```bash
npm install --save-dev @playwright/test @clerk/testing
```

### 4. Run Tests

```bash
# Run all tests with UI mode (recommended)
npm run test:e2e

# Run auto-save tests specifically
npm run test:autosave

# Run in headless mode
npm run test:e2e:headless
```

## Test Structure

```
tests/
├── auth/
│   ├── global-setup.ts    # Clerk testing setup
│   ├── auth.setup.ts      # Authentication flow
│   └── .auth/             # Saved auth state
│       └── user.json
└── auto-save.spec.ts      # Auto-save tests
```

## What the Tests Do

### 1. **Authentication Setup** (`auth.setup.ts`)
- Sets up Clerk testing environment
- Authenticates using your test credentials
- Saves authentication state for reuse

### 2. **Auto-Save Tests** (`auto-save.spec.ts`)

#### Test 1: Auto-save every 10 seconds
- Uploads your CV
- Starts analysis
- Monitors network for checkpoint saves
- Verifies saves happen at 10-second intervals

#### Test 2: Recovery from interruption
- Starts analysis
- Waits for progress
- Refreshes page
- Checks for recovery banner
- Tests resume functionality

#### Test 3: Infrastructure check
- Verifies auto-save modules are loaded
- Tests recovery API endpoint
- Checks database connectivity

## Expected Results

### ✅ Success Indicators:
- Authentication works automatically
- CV uploads successfully
- Network tab shows checkpoint saves every 10 seconds
- Page refresh shows recovery banner
- Resume button restores progress

### 📸 Screenshots Generated:
- `test-results/01-analyze-page.png` - Initial page
- `test-results/02-cv-uploaded.png` - After upload
- `test-results/03-analysis-streaming.png` - During analysis
- `test-results/04-after-refresh.png` - After page refresh
- `test-results/05-recovery-banner.png` - Recovery UI
- `test-results/06-after-resume.png` - After resuming

## Troubleshooting

### ❌ "Clerk testing token not found"
- Make sure `CLERK_TESTING_TOKEN` is set in `.env.test`
- Get token from Clerk Dashboard > API Keys > Testing tokens

### ❌ "Authentication failed"
- Verify `TEST_USER_EMAIL` and `TEST_USER_PASSWORD` are correct
- Make sure the user exists in your Clerk instance

### ❌ "No recovery banner after refresh"
- Check browser console for errors
- Verify database migrations are complete
- Check if checkpoint APIs are returning 200 status

## Manual Verification

After running tests, you can manually verify:

1. **Check Database**:
```sql
SELECT * FROM analysis_checkpoints 
ORDER BY updatedAt DESC 
LIMIT 5;
```

2. **Check Browser Console**:
```javascript
// Run in browser console during test
console.log({
  backgroundProcessor: typeof window.backgroundProcessor,
  streamingAutoSave: typeof window.streamingAutoSave,
  sessionData: {
    analysis: sessionStorage.getItem('streamingAnalysis'),
    progress: sessionStorage.getItem('streamingAnalysisProgress'),
    status: sessionStorage.getItem('streamingAnalysisStatus')
  }
});
```

## Running Specific Tests

```bash
# Run only auto-save tests
npx playwright test auto-save

# Run with UI mode for debugging
npx playwright test --ui

# Run a specific test
npx playwright test -g "should auto-save analysis progress"

# Generate HTML report
npx playwright test --reporter=html
```

## CI/CD Integration

For GitHub Actions or other CI:

```yaml
- name: Run Playwright tests
  env:
    CLERK_TESTING_TOKEN: ${{ secrets.CLERK_TESTING_TOKEN }}
    TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
    TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
  run: npm run test:e2e
```

---

🎯 **Goal**: Verify that the auto-save system prevents users from losing progress during CV analysis!