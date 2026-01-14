# Deploy Firestore Rules

The Firestore security rules need to be deployed to Firebase for them to take effect.

## Option 1: Using Firebase CLI

1. Install Firebase CLI if you haven't already:
```bash
npm install -g firebase-tools
```

2. Login to Firebase:
```bash
firebase login
```

3. Initialize Firebase in your project (if not already done):
```bash
firebase init firestore
```

4. Deploy the rules:
```bash
firebase deploy --only firestore:rules
```

## Option 2: Using Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `tracker-d1610`
3. Go to **Firestore Database** → **Rules** tab
4. Copy the contents from `firestore.rules` file
5. Paste into the rules editor
6. Click **Publish**

## Current Rules Summary

- **Goals**: Users can only read/write their own goals (where `userId` matches `auth.uid`)
- **Completions**: Users can only read/write their own completions (where `userId` matches `auth.uid`)
- **Settings**: Users can only read/write their own settings (document ID = `auth.uid`)
- **Users**: Users can only read/write their own user document (document ID = `auth.uid`)

## Important Notes

⚠️ **User Data Isolation**: All data is now properly isolated by user. Each user can only access their own goals, completions, and settings. See `USER_DATA_MAPPING.md` for details on how to query user-specific data.

