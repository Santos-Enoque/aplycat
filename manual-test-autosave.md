# 🔄 Manual Auto-Save Testing Guide

Since you already have Chrome open with your session at http://localhost:3002/en/dashboard, here's how to manually test if the auto-save functionality is working:

## 📋 Quick Test Steps

### 1. Open Developer Tools (F12)
In your logged-in Chrome window, press F12 to open Developer Tools.

### 2. Go to Network Tab
Click on the "Network" tab to monitor API requests.

### 3. Navigate to Analyze Page
Go to: http://localhost:3002/en/analyze

### 4. Upload Your CV
Upload your CV file: `/Users/santossafrao/Library/Mobile Documents/com~apple~CloudDocs/Favela Fotos/Cv.pdf`

### 5. Monitor Auto-Save Requests
As the analysis runs, watch the Network tab for:
- Requests to `/api/recovery/list`
- Requests containing "checkpoint" or "auto-save"
- Any POST requests that happen every 10 seconds

### 6. Check Console for Auto-Save Activity
In the Console tab, run this to check auto-save status:

```javascript
// Check if background processor is available
console.log('Background Processor:', typeof window.backgroundProcessor);
console.log('Streaming Auto-Save:', typeof window.streamingAutoSave);

// Check session storage for analysis state
console.log('Analysis State:', {
  analysis: sessionStorage.getItem('streamingAnalysis'),
  progress: sessionStorage.getItem('streamingAnalysisProgress'),
  status: sessionStorage.getItem('streamingAnalysisStatus')
});

// Monitor auto-save activity
setInterval(() => {
  const progress = sessionStorage.getItem('streamingAnalysisProgress');
  const status = sessionStorage.getItem('streamingAnalysisStatus');
  console.log(`[AUTO-SAVE CHECK] Progress: ${progress}%, Status: ${status}`);
}, 5000);
```

### 7. Test Recovery
While analysis is running (after ~20-30% progress):
1. **Refresh the page** (F5)
2. Check if a **recovery banner** appears
3. Look for text like "Continue where you left off" or "Resume analysis"

## 🔍 What to Look For

### ✅ Auto-Save is Working If:
- Network tab shows checkpoint API calls every 10 seconds
- Session storage updates with progress
- After refresh, you see a recovery option
- Console shows background processor activity

### ❌ Auto-Save is NOT Working If:
- No checkpoint API calls in Network tab
- Session storage doesn't update
- Page refresh loses all progress
- No recovery banner after refresh

## 📊 Database Verification

To verify checkpoints are saved in the database, you can:

1. **Check PostgreSQL directly:**
```sql
-- Connect to your database and run:
SELECT * FROM analysis_checkpoints 
WHERE userId = 'your-clerk-user-id' 
ORDER BY updatedAt DESC 
LIMIT 5;
```

2. **Check via API** (in browser console):
```javascript
// Check recovery API
fetch('/api/recovery/list')
  .then(res => res.json())
  .then(data => console.log('Recoverable sessions:', data));
```

## 🎯 Quick Console Test

Paste this in your browser console to test everything at once:

```javascript
// Complete Auto-Save Test
console.log('🔄 AUTO-SAVE TEST STARTING...\n');

// 1. Check infrastructure
console.log('1️⃣ Infrastructure Check:');
console.log(`   Background Processor: ${typeof window.backgroundProcessor !== 'undefined' ? '✅' : '❌'}`);
console.log(`   Streaming Auto-Save: ${typeof window.streamingAutoSave !== 'undefined' ? '✅' : '❌'}`);

// 2. Check current state
console.log('\n2️⃣ Current State:');
const currentState = {
  analysis: sessionStorage.getItem('streamingAnalysis'),
  progress: sessionStorage.getItem('streamingAnalysisProgress'),
  status: sessionStorage.getItem('streamingAnalysisStatus'),
  resumeId: sessionStorage.getItem('aplycat_uploadthing_resume_id') || 
            sessionStorage.getItem('aplycat_fallback_resume_id')
};
console.log('   Session State:', currentState);

// 3. Check recovery API
console.log('\n3️⃣ Recovery API Check:');
fetch('/api/recovery/list')
  .then(res => res.json())
  .then(data => {
    console.log(`   API Status: ${data.success ? '✅' : '❌'}`);
    console.log(`   Recoverable Sessions: ${data.count || 0}`);
    if (data.sessions && data.sessions.length > 0) {
      console.log('   Recent Sessions:', data.sessions);
    }
  })
  .catch(err => console.log('   API Error:', err.message));

// 4. Monitor progress
console.log('\n4️⃣ Starting Progress Monitor (30 seconds)...');
let monitorCount = 0;
const monitor = setInterval(() => {
  monitorCount++;
  const progress = sessionStorage.getItem('streamingAnalysisProgress') || '0';
  const status = sessionStorage.getItem('streamingAnalysisStatus') || 'idle';
  console.log(`   [${monitorCount * 5}s] Progress: ${progress}%, Status: ${status}`);
  
  if (monitorCount >= 6 || status === 'completed') {
    clearInterval(monitor);
    console.log('\n✅ Monitoring complete!');
  }
}, 5000);
```

## 🚀 Expected Results

If auto-save is working correctly, you should see:

1. **Network Tab**: POST requests to checkpoint endpoints every 10 seconds
2. **Console**: Progress updates showing increasing percentages
3. **After Refresh**: A recovery banner or option to resume
4. **Database**: Checkpoint entries with your user ID

## 💡 Tips

- Start analysis and wait at least 30 seconds before testing recovery
- The auto-save triggers every 10 seconds during streaming
- Recovery works best when progress is between 20-80%
- Check browser console for any error messages

This manual approach will definitively show if the auto-save system is working in your authenticated session!