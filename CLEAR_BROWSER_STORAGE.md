# Clear Browser Storage

If you're experiencing issues with login accepting emails that don't exist in Supabase, it might be due to cached browser storage.

## How to Clear Browser Storage:

### Chrome/Edge:
1. Open Developer Tools (F12)
2. Go to "Application" tab
3. Under "Storage" section:
   - Click "Clear site data" button
   - OR manually clear:
     - Local Storage → Right-click → Clear
     - IndexedDB → Right-click → Delete database "futurbet"
     - Session Storage → Right-click → Clear

### Firefox:
1. Open Developer Tools (F12)
2. Go to "Storage" tab
3. Clear:
   - Local Storage
   - IndexedDB
   - Session Storage

### Or use Console:
Open browser console (F12) and run:
```javascript
// Clear all localforage data
localforage.clear();
// Clear localStorage
localStorage.clear();
// Clear sessionStorage
sessionStorage.clear();
// Reload page
location.reload();
```

## Verification:

After clearing, try logging in with `makwansoran@outlook.com` - it should show "Invalid email" error since the account was deleted from Supabase.

