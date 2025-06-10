# Test Suite Documentation

This comprehensive test suite covers all core features of the application, ensuring reliability and preventing regressions.

## Test Structure

```
__tests__/
├── api/                    # API endpoint tests
│   ├── resume-analysis.test.ts
│   ├── linkedin-analysis.test.ts
│   ├── improve-resume.test.ts
│   ├── tailor-resume.test.ts
│   └── use-credits.test.ts
├── integration/           # Integration tests
│   └── resume-workflow.test.ts
├── utils/                 # Test utilities
│   └── test-helpers.ts
└── README.md             # This file
```

## Core Features Tested

### 1. Resume Analysis (`resume-analysis.test.ts`)
- **Credits**: 1 per analysis
- **Features Tested**:
  - Resume upload and analysis
  - Credit deduction
  - Result caching
  - Error handling
  - Performance monitoring
  - Database persistence

**Key Test Cases**:
- ✅ Successful analysis with new resume
- ✅ Cached analysis retrieval
- ✅ Force reanalysis functionality
- ✅ Authentication and authorization
- ✅ Credit system integration
- ✅ Error handling (model failures, JSON parsing, database issues)

### 2. LinkedIn Profile Analysis (`linkedin-analysis.test.ts`)
- **Credits**: 3 per analysis
- **Features Tested**:
  - LinkedIn profile URL processing
  - Streaming response handling
  - Credit deduction
  - Web search integration

**Key Test Cases**:
- ✅ Profile URL validation
- ✅ Streaming response processing
- ✅ Credit verification and deduction
- ✅ OpenAI configuration and tool usage
- ✅ Error handling (API failures, stream errors)

### 3. Resume Improvement (`improve-resume.test.ts`)
- **Credits**: 2 per improvement
- **Features Tested**:
  - Resume file processing
  - Role and industry targeting
  - Custom prompt handling
  - File format support (data URLs)

**Key Test Cases**:
- ✅ Input validation (file, role, industry)
- ✅ Data URL format handling
- ✅ Custom prompt processing
- ✅ Model service integration
- ✅ Credit deduction
- ✅ Error handling (model failures, JSON parsing)

### 4. Resume Tailoring (`tailor-resume.test.ts`)
- **Credits**: 4 per tailoring
- **Features Tested**:
  - Job description analysis
  - Resume customization
  - Cover letter generation
  - Company-specific tailoring

**Key Test Cases**:
- ✅ Job description processing
- ✅ Cover letter generation (optional)
- ✅ Company and role customization
- ✅ Performance monitoring
- ✅ Complex job description handling
- ✅ Credit system integration

### 5. URL Improvement (Covered in tailoring tests)
- URL processing and job extraction functionality
- Integration with job description analysis

### 6. Credit System (`use-credits.test.ts`)
- **Features Tested**:
  - Credit validation and deduction
  - Transaction recording
  - Multiple credit amounts
  - Action descriptions

**Key Test Cases**:
- ✅ Credit amount validation
- ✅ Sufficient/insufficient credit handling
- ✅ Transaction creation
- ✅ Various action descriptions
- ✅ Error handling (database failures)

## Integration Tests

### Resume Workflow (`resume-workflow.test.ts`)
Tests the complete user journey:
1. **Resume Upload & Analysis** (1 credit)
2. **Resume Improvement** (2 credits)
3. **Resume Tailoring** (4 credits)
4. **LinkedIn Analysis** (3 credits)

**Scenarios Covered**:
- ✅ Full workflow completion
- ✅ Credit tracking across operations
- ✅ Error handling at each step
- ✅ Caching behavior
- ✅ Performance monitoring

## Running Tests

### Install Dependencies
```bash
npm install
```

### Run All Tests
```bash
npm test
```

### Run Specific Test Suites
```bash
# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run only API tests
npm run test:api

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Run Individual Test Files
```bash
# Resume analysis tests
npm test resume-analysis.test.ts

# LinkedIn analysis tests  
npm test linkedin-analysis.test.ts

# Credit system tests
npm test use-credits.test.ts

# Integration tests
npm test resume-workflow.test.ts
```

## Test Configuration

### Jest Configuration (`jest.config.js`)
- **Environment**: jsdom for frontend, node for API tests
- **Coverage**: 70% threshold for branches, functions, lines, statements
- **Setup**: Automatic test environment setup with mocks

### Test Setup (`jest.setup.js`)
- Environment variables configuration
- Global mocks (fetch, console methods)
- Test cleanup utilities

## Mock Data and Utilities

### Test Helpers (`test-helpers.ts`)
- Mock user and database data
- Sample resume and job descriptions
- API request creators
- Database operation mocks
- Cleanup utilities

**Key Mocks**:
- `mockUser`: Authenticated user data
- `mockDbUser`: Database user with credits
- `mockResumeData`: Sample resume file data
- `mockAnalysisResponse`: AI analysis results
- `mockJobDescription`: Job posting sample

## Coverage Goals

### Current Coverage Targets
- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

### Critical Paths Covered
- ✅ Authentication flows
- ✅ Credit validation and deduction
- ✅ File upload and processing
- ✅ AI model integration
- ✅ Database operations
- ✅ Error handling and recovery
- ✅ Caching mechanisms

## Error Scenarios Tested

### Authentication Errors
- Unauthenticated users
- Missing database users
- Invalid user states

### Credit System Errors
- Insufficient credits
- Credit deduction failures
- Database transaction errors

### File Processing Errors
- Missing or invalid files
- Corrupted file data
- Unsupported formats

### AI Model Errors
- API failures
- Timeout errors
- Invalid responses
- JSON parsing failures

### Database Errors
- Connection failures
- Transaction rollbacks
- Constraint violations

## Performance Testing

### Metrics Tracked
- Processing time for each operation
- Response time monitoring
- Memory usage (in development)
- Credit calculation accuracy

### Performance Thresholds
- Resume analysis: < 30 seconds
- Resume improvement: < 45 seconds
- Resume tailoring: < 60 seconds
- LinkedIn analysis: < 30 seconds

## Continuous Integration

### GitHub Actions (Recommended Setup)
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:ci
```

### Pre-commit Hooks
```bash
# Install husky for git hooks
npm install --save-dev husky

# Add pre-commit test hook
npx husky add .husky/pre-commit "npm test"
```

## Debugging Tests

### Common Issues
1. **Mock not working**: Check module path and mock timing
2. **Async test failures**: Ensure proper await/Promise handling
3. **Database errors**: Verify mock data consistency
4. **Credit calculation errors**: Check test user credit setup

### Debug Commands
```bash
# Run with verbose output
npm test -- --verbose

# Run specific test with debugging
npm test -- --testNamePattern="should successfully analyze"

# Debug with Node inspector
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Contributing to Tests

### Adding New Tests
1. Follow existing test structure
2. Use descriptive test names
3. Include both success and failure cases
4. Mock external dependencies
5. Clean up after tests

### Test Naming Convention
- `should [expected behavior] when [condition]`
- Group related tests with `describe` blocks
- Use consistent mock data

### Code Coverage
- Aim for >80% coverage on new features
- Test both happy path and edge cases
- Include error handling tests
- Verify all credit deduction paths

## Monitoring and Alerts

### Test Metrics to Monitor
- Test suite execution time
- Flaky test detection
- Coverage trends
- Credit calculation accuracy

### Production Validation
- Sample test data periodically in production
- Monitor API response times
- Track credit deduction accuracy
- Validate caching behavior

---

This test suite ensures your application is robust, reliable, and ready for production deployment. Regular test execution prevents regressions and maintains code quality as you add new features.