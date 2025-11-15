# Refactoring Analysis & Implementation Plan

## Problems Identified

### 1. Reload Crashes

**Root Causes:**
- Multiple async operations in `useEffect` without proper cleanup/abort controllers
- Race conditions when components unmount during async operations
- Markets array can be `undefined`/`null` causing `.map()` crashes
- Missing null checks before accessing nested object properties
- No error boundaries around individual route components

**Examples:**
- `App.jsx`: Two async operations in useEffect without shared abort controller
- `marketsStore.js`: No error handling if API fails completely
- `pages.MarketDetail.jsx`: Accesses `markets.find()` without null check
- Multiple components: Direct array access without checking if array exists

### 2. Data Consistency Issues

**Root Causes:**
- User data stored in 3 places: React state (App.jsx), localforage, server
- Balance data duplicated: App.jsx state, localforage, server
- Leaderboard fetches separately, might show stale data
- Forum fetches user profiles separately for each idea (N+1 problem)
- No centralized user context/store - each component manages its own state

**Examples:**
- `App.jsx`: Manages `cash`, `portfolio`, `userEmail` in local state
- `pages.Account.jsx`: Fetches user data separately
- `pages.Leaderboard.jsx`: Fetches all user data separately
- `pages.Forum.jsx`: Fetches user profiles for each idea separately
- Login/Signup: Sets balances from localforage instead of server

### 3. Admin → Frontend Flow

**Root Causes:**
- Contracts created in admin are stored correctly in server.cjs (JSON files)
- Frontend fetches from `/api/contracts` which works
- But there's a fallback to `markets.json` which might be stale
- News posts created in admin should be visible (they fetch from `/api/news` which works)
- No refresh mechanism when admin creates new content

**Examples:**
- `marketsStore.js`: Falls back to `/markets.json` if API fails
- No polling or websocket to detect new contracts/news
- Admin creates contract → frontend doesn't know to refresh

## Implementation Plan

### Phase 1: Create Centralized Data Store
1. Create `src/contexts/UserContext.jsx` - Single source of truth for user data
2. Create `src/contexts/MarketsContext.jsx` - Centralized markets/contracts state
3. Wrap App with these contexts

### Phase 2: Fix Reload Crashes
1. Add proper cleanup to all useEffect hooks (AbortController)
2. Add null checks before array operations
3. Add error boundaries around route components
4. Add loading states to prevent rendering with undefined data

### Phase 3: Refactor Data Access
1. Replace all direct balance/user state with context
2. Remove duplicate data fetching
3. Implement proper cache invalidation
4. Fix N+1 queries in Forum

### Phase 4: Fix Admin → Frontend Flow
1. Remove fallback to markets.json (rely only on API)
2. Add polling mechanism for contracts/news
3. Add manual refresh button
4. Ensure admin-created content is immediately visible

### Phase 5: Error Handling & Loading States
1. Add proper error handling throughout
2. Add loading states to all async operations
3. Add retry mechanisms for failed requests
4. Improve error messages

