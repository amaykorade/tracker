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

- **Goals**: Allow read/write for all users (authenticated and unauthenticated)
- **Completions**: Require authentication (only logged-in users can track progress)
- **Settings**: Require authentication (only logged-in users can save settings)

