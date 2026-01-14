# User Data Mapping in Firestore

This document explains how goals, completions, and settings are mapped to specific users in the database.

## Overview

All user data is now properly isolated by `userId`. Each authenticated user can only access their own goals, completions, and settings.

## Database Structure

### 1. Goals Collection (`goals`)

**Document Structure:**
```javascript
{
  id: "goal-document-id",
  title: "Goal Title",
  createdAt: Timestamp,
  sortOrder: 0,
  userId: "user-firebase-uid"  // ← User identifier
}
```

**How to Query:**
```javascript
// Get all goals for a specific user
const goalsQuery = query(
  collection(db, "goals"),
  where("userId", "==", user.uid)
);

// In Firestore Console:
// Filter: userId == "user-firebase-uid"
```

**Security Rules:**
- Users can only read/write goals where `userId` matches their `auth.uid`
- Unauthenticated users cannot access Firestore goals (they use localStorage)

### 2. Completions Collection (`completions`)

**Document Structure:**
```javascript
{
  id: "user-uid-goalId-date",  // Composite ID includes userId
  goalId: "goal-document-id",
  date: "2025-01-15",  // YYYY-MM-DD format
  completed: true,
  userId: "user-firebase-uid"  // ← User identifier
}
```

**How to Query:**
```javascript
// Get all completions for a specific user
const completionsQuery = query(
  collection(db, "completions"),
  where("userId", "==", user.uid)
);

// Get completions for a specific goal and user
const goalCompletionsQuery = query(
  collection(db, "completions"),
  where("goalId", "==", goalId),
  where("userId", "==", user.uid)
);

// In Firestore Console:
// Filter: userId == "user-firebase-uid"
// Or: goalId == "goal-id" AND userId == "user-firebase-uid"
```

**Security Rules:**
- Users can only read/write completions where `userId` matches their `auth.uid`
- Document ID format: `{userId}-{goalId}-{date}` ensures uniqueness per user

### 3. Settings Collection (`settings`)

**Document Structure:**
```javascript
{
  id: "user-firebase-uid",  // Document ID IS the userId
  text: "User's motivation line"
}
```

**How to Query:**
```javascript
// Get settings for a specific user (document ID = userId)
const settingsRef = doc(db, "settings", user.uid);

// In Firestore Console:
// Navigate to: settings/{user-firebase-uid}
```

**Security Rules:**
- Users can only read/write settings where document ID matches their `auth.uid`
- Each user has their own settings document

### 4. Users Collection (`users`)

**Document Structure:**
```javascript
{
  id: "user-firebase-uid",  // Document ID IS the userId
  email: "user@example.com",
  displayName: "User Name",
  photoURL: "https://...",
  accountCreatedAt: Timestamp,
  lastLoginAt: Timestamp,
  plan: "free" | "pro",
  billingInterval: "monthly" | "yearly" | null,
  planExpiresAt: Timestamp | null
}
```

**Security Rules:**
- Users can only read/write their own user document (document ID = `auth.uid`)

## Finding Goals by User

### In Firestore Console:

1. **Go to Firestore Database** in Firebase Console
2. **Select `goals` collection**
3. **Add a filter:**
   - Field: `userId`
   - Operator: `==`
   - Value: `{user-firebase-uid}`

### Using Firebase CLI:

```bash
# Query goals for a specific user
firebase firestore:query goals --where userId==USER_UID
```

### Using JavaScript/TypeScript:

```javascript
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

async function getUserGoals(userId) {
  const goalsRef = collection(db, "goals");
  const q = query(goalsRef, where("userId", "==", userId));
  const snapshot = await getDocs(q);
  
  const goals = [];
  snapshot.forEach((doc) => {
    goals.push({
      id: doc.id,
      ...doc.data()
    });
  });
  
  return goals;
}
```

## Data Migration

When a user logs in for the first time:
1. Goals stored in `localStorage` are migrated to Firestore with `userId` field
2. Motivation stored in `localStorage` is migrated to user-specific settings document
3. All new data created after login includes `userId` automatically

## Important Notes

1. **Unauthenticated Users:**
   - Goals are stored in `localStorage` (no `userId` needed)
   - Completions are not stored until user authenticates
   - Data is migrated to Firestore with `userId` upon first login

2. **Security:**
   - Firestore security rules enforce user isolation
   - Users cannot access other users' data
   - All queries automatically filter by `userId`

3. **Indexes:**
   - Firestore may require composite indexes for queries with multiple `where` clauses
   - If you see an index error, follow the link in the error message to create the index

## Example: Complete User Data Query

```javascript
import { collection, query, where, getDocs } from "firebase/firestore";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

async function getUserData(userId) {
  // Get user's goals
  const goalsQuery = query(
    collection(db, "goals"),
    where("userId", "==", userId)
  );
  const goalsSnapshot = await getDocs(goalsQuery);
  const goals = goalsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  // Get user's completions
  const completionsQuery = query(
    collection(db, "completions"),
    where("userId", "==", userId)
  );
  const completionsSnapshot = await getDocs(completionsQuery);
  const completions = completionsSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  // Get user's settings
  const settingsRef = doc(db, "settings", userId);
  const settingsSnapshot = await getDoc(settingsRef);
  const settings = settingsSnapshot.exists() ? settingsSnapshot.data() : null;

  // Get user's profile
  const userRef = doc(db, "users", userId);
  const userSnapshot = await getDoc(userRef);
  const userProfile = userSnapshot.exists() ? userSnapshot.data() : null;

  return {
    goals,
    completions,
    settings,
    userProfile
  };
}
```

## Deployment

**Important:** After updating the code, you must deploy the new Firestore security rules:

```bash
firebase deploy --only firestore:rules
```

Or manually update them in the Firebase Console:
1. Go to Firestore Database → Rules
2. Copy the contents from `firestore.rules`
3. Click "Publish"

