# Rafiki Assist Mobile

Rafiki Assist Mobile is an Expo React Native app built to support child-caregiver communication, symbol-based expression, caregiver support, and secure account access in one mobile experience.

The current app includes Firebase-backed authentication, per-user profile storage, private user-scoped symbol data, profile photo uploads, optional TOTP-based two-factor authentication, accessibility settings, dark mode, analytics, and a caregiver chatbot interface.

## Current Status

This repository reflects the app in its current working state, including recent updates for:

- user-specific account and profile records under `users/{uid}`
- tighter Firestore and Storage security rules
- user-scoped local symbol persistence so one signed-in user does not see another user's symbols
- profile photo upload flow through Firebase Storage
- app-wide light and dark theme support across the major screens, cards, headers, and bottom navigation
- Google sign-in groundwork for Firebase Auth

## Main Features

### Authentication and Account Access

- Email/password sign up and sign in with Firebase Authentication
- Persistent signed-in session using React Native AsyncStorage
- Email verification before full app access
- Optional TOTP setup and verification using Google Authenticator-compatible codes
- Backup code generation for TOTP recovery
- Password change flow
- Password visibility toggles on login and signup

### User Profiles

- Canonical user profile document stored per authenticated user
- Edit profile flow for name and profile details
- Profile photo upload to a per-user Firebase Storage path
- Theme and accessibility preferences exposed through profile/settings flows

### Child and Caregiver Flows

- Role selection for child or caregiver use
- Child dashboard with symbol cards and tap-to-speak behavior
- Caregiver dashboard with navigation into profile, symbol management, analytics, and chatbot tools
- Symbol creation, editing, deletion, and usage tracking
- Weekly symbol analytics charts
- Rafiki chatbot with fallback replies if the backend is unavailable

### Accessibility and Theme Support

- Light mode and dark mode
- Larger text support
- High-contrast mode
- Shared theme wiring across screens, cards, headers, inputs, and bottom navigation

## Main Screens

- `LoginScreen`
- `SignupScreen`
- `EmailVerificationScreen`
- `RoleSelectionScreen`
- `CaregiverDashboard`
- `ChildDashboard`
- `ManageSymbolsScreen`
- `SymbolAnalytics`
- `ChatbotScreen`
- `ProfileScreen`
- `EditProfileScreen`
- `ChangePasswordScreen`
- `TOTPSetupScreen`
- `TotpVerifyScreen`

## Technology Stack

- Expo
- React Native
- React Navigation
- Firebase Authentication
- Cloud Firestore
- Firebase Storage
- AsyncStorage
- Expo Image Picker
- Expo Speech
- Expo Auth Session
- OTPAuth
- React Native Chart Kit

## Project Structure

```text
.
|-- App.js
|-- app.json
|-- firebaseConfig.js
|-- components/
|-- context/
|-- screens/
|-- services/
|-- assets/
|-- firestore.rules
|-- storage.rules
|-- firestore.indexes.json
|-- functions/
|-- dataconnect/
|-- dataconnect-generated/
```

Important areas:

- `App.js`
  Handles the top-level auth flow, route switching, and provider wiring.

- `context/SymbolsContext.js`
  Manages symbol state, usage counts, weekly reset handling, and user-scoped local persistence.

- `context/AccessibilityContext.js`
  Stores accessibility preferences such as larger text and high contrast.

- `context/ThemeContext.js`
  Provides the shared light/dark theme used across the app.

- `services/userService.js`
  Handles user profile reads and writes, password changes, and profile image upload helpers.

- `services/googleAuthService.js`
  Contains the Google sign-in helper logic used by the login flow.

- `services/chatService.js`
  Connects the app to the external chatbot backend.

## Setup

### Prerequisites

- Node.js
- npm
- An Expo-compatible simulator, emulator, or device
- A Firebase project with:
  - Authentication
  - Firestore
  - Storage

### Install dependencies

```bash
npm install
```

### Start the app

```bash
npm start
```

You can also use:

```bash
npm run ios
npm run android
npm run web
```

## Firebase Setup

Firebase is configured in [`firebaseConfig.js`](./firebaseConfig.js).

To run this app correctly, make sure your Firebase project has:

- Email/password authentication enabled
- Firestore enabled
- Storage enabled
- Google sign-in enabled if you want to use Google auth later

This repository includes:

- [`firestore.rules`](./firestore.rules)
- [`storage.rules`](./storage.rules)
- [`firestore.indexes.json`](./firestore.indexes.json)

Deploy the rules before relying on profile uploads or private per-user data:

```bash
firebase deploy --only firestore:rules,storage
```

If you use a different Firebase project, update the app's Firebase config values accordingly.

## User Data Model

The app now treats the authenticated Firebase user ID as the primary owner key.

Examples:

- user profile documents live under `users/{uid}`
- profile images are stored under `userProfiles/{uid}/...`
- account-protected TOTP data is tied to the authenticated user
- locally persisted symbol data is scoped by user ID so accounts on the same device do not share symbol caches

## Google Sign-In Notes

Google sign-in groundwork has been added, but there is an important development caveat:

- `Expo Go` is not the ideal environment for testing OAuth flows like Google sign-in
- the current setup is better suited to a development build or production app build
- `app.json` includes placeholders or partial values for Google OAuth client IDs

Before enabling Google sign-in fully, make sure you have:

- a Firebase Web app
- a Firebase iOS app
- a Firebase Android app
- the matching Google OAuth client IDs
- Firebase Authentication Google provider enabled

## Chatbot Backend

The chatbot uses the API endpoint defined in [`services/chatService.js`](./services/chatService.js).

If the backend is unavailable, the app falls back to built-in supportive responses in the chatbot screen.

## Security Notes

The repository now includes owner-based Firestore and Storage rules intended to make user data private by default. Even so, production deployment should still include a review of:

- Firestore rules
- Storage rules
- Firebase Authentication providers
- Storage bucket configuration
- project billing/storage plan if you rely on Firebase Storage uploads

## Known Limitations

- Google sign-in is not fully practical to test in Expo Go
- The chatbot depends on an external backend URL
- Some Firebase Functions and Data Connect files are present but are not the main runtime path for the mobile app
- Web support may require extra refinement compared with the native mobile flows

## License

The project currently lists its license as `0BSD` in [`package.json`](./package.json).
