# 🔐 Authenticated Auto-Save Testing Instructions

## Quick Setup (5 minutes)

### Step 1: Extract Your Session Cookies

1. **Open your browser** and navigate to `http://localhost:3001`
2. **Log in to Aplycat** with your account
3. **Open Developer Tools** (F12 or Cmd+Option+I)
4. **Go to Console tab** and paste this script:

```javascript
// === PASTE THIS IN YOUR BROWSER CONSOLE ===
const cookies = document.cookie.split(';').map(cookie => {
  const [name, value] = cookie.trim().split('=');
  return { name, value };
}).filter(cookie => 
  cookie.name.startsWith('__session') || 
  cookie.name.startsWith('__clerk') ||
  cookie.name.includes('clerk') ||
  cookie.name.includes('session') ||
  cookie.name.includes('auth')
);

const playwrightCookies = cookies.map(cookie => ({
  name: cookie.name,
  value: cookie.value,
  domain: 'localhost',
  path: '/',
  httpOnly: false,
  secure: false,
  sameSite: 'Lax'
}));

console.log('🍪 Copy this JSON to auth-cookies.json:');
console.log(JSON.stringify(playwrightCookies, null, 2));

// Auto-download the file
const dataStr = JSON.stringify(playwrightCookies, null, 2);
const dataBlob = new Blob([dataStr], {type: 'application/json'});
const url = URL.createObjectURL(dataBlob);
const link = document.createElement('a');
link.href = url;
link.download = 'auth-cookies.json';
link.click();
console.log('📥 Downloaded auth-cookies.json!');
// === END SCRIPT ===
```

5. **Copy the JSON output** and save it as `auth-cookies.json` in your project root

### Step 2: Run Authenticated Tests

```bash
# Install Playwright if not already installed
npm install playwright

# Run the authenticated test
node scripts/test-auto-save-with-auth.js
```

## What the Test Does

The test script will:

1. ✅ **Launch Chrome** with your authentication cookies
2. ✅ **Verify login** - Check that you're actually authenticated
3. ✅ **Navigate to dashboard** and analysis pages
4. ✅ **Test API endpoints** that require authentication
5. ✅ **Simulate auto-save scenarios** 
6. ✅ **Take screenshots** at each step for visual verification
7. ✅ **Generate test report** with results

## Expected Results

If everything works correctly, you should see:

```
🎭 Starting Authenticated Auto-Save Testing...
🍪 Loaded 3 authentication cookies
🚀 Launching Chrome browser...
🔐 Creating authenticated browser context...
✅ Injected authentication cookies
🌐 Navigating to http://localhost:3001...
📸 Screenshot: 01-initial-page.png
✅ Authentication successful! User is logged in.
🏠 Navigating to dashboard...
📸 Screenshot: 02-dashboard.png
📊 Navigating to analysis page...
📸 Screenshot: 03-analyze-page.png
🔄 Testing Auto-Save Functionality...
🗄️ Testing database checkpoint functionality...
  ✅ /api/recovery/list: 200
  ✅ /api/user/credits: 200
  ✅ /api/dashboard: 200
📎 Testing file upload and auto-save simulation...
📸 Screenshot: 04-final-state.png

📊 Test Summary:
  ✅ Authentication: Working
  ✅ Page Navigation: Working  
  ✅ Dashboard Access: Working
  ✅ Analysis Page: Working
  📋 Auto-save Features: Ready for testing
```

## Manual Testing Steps

After the automated test passes, you can manually test:

### 1. Upload Resume & Test Auto-Save

1. In the authenticated browser session, upload a resume
2. **Start analysis** and let it begin streaming
3. **Refresh the page** during streaming
4. Check if **recovery banner appears**
5. Verify you can **resume from where you left off**

### 2. Database Verification

Check your database for checkpoint entries:

```sql
-- Check for analysis checkpoints
SELECT * FROM analysis_checkpoints ORDER BY createdAt DESC LIMIT 5;

-- Check for improvement sessions  
SELECT * FROM improvement_sessions ORDER BY createdAt DESC LIMIT 5;
```

### 3. Network Monitoring

1. Open **Developer Tools > Network tab**
2. Start an analysis
3. Look for API calls to:
   - `/api/recovery/list`
   - Background auto-save requests every 10 seconds

## Troubleshooting

### ❌ Authentication Failed

```
❌ Authentication failed! Still seeing sign-in button.
```

**Solution**: Your session cookies expired or are invalid
1. Log out and log back in to Aplycat
2. Re-extract cookies using the console script
3. Update `auth-cookies.json`

### ❌ API Errors

```
❌ /api/recovery/list: 401 Unauthorized
```

**Solution**: Database connection or auth issues
1. Check if your dev server is running
2. Verify database connection
3. Check Clerk authentication setup

### ❌ Browser Launch Failed

```
❌ Error: Executable doesn't exist at /path/to/browser
```

**Solution**: Install Playwright browsers
```bash
npx playwright install chromium
```

## Visual Verification

The test generates screenshots in `test-results/`:

- `01-initial-page.png` - Landing page with authentication
- `02-dashboard.png` - User dashboard (proves auth working)
- `03-analyze-page.png` - Analysis page ready for testing
- `04-final-state.png` - Final state after auto-save setup

## Next Steps

Once authentication testing passes:

1. **Test real resume upload** with auto-save
2. **Verify recovery UI** components
3. **Test checkpoint cleanup** functionality
4. **Performance testing** with multiple auto-save operations

---

🎯 **Goal**: Verify that users never lose progress during CV processing workflows, even with browser refresh/close events!