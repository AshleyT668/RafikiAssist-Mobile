# Rafiki Assist Mobile

Rafiki Assist Mobile is a React Native and Expo application designed to support child-caregiver communication, symbol-based expression, and caregiver wellbeing in one mobile experience. The app combines AAC-style symbol interaction, caregiver-facing management tools, analytics, and a supportive chatbot experience backed by Firebase services and a custom chat API.

This repository reflects the current implementation of the Rafiki Assist mobile project, including authentication, profile management, accessibility settings, symbol management, usage analytics, and two-factor authentication with Google Authenticator.

## Project Overview

Rafiki Assist Mobile was built as a companion platform for two main user roles:

- Children who use visual symbols and text-to-speech support to communicate.
- Caregivers who manage symbols, review usage analytics, and access emotional support through the Rafiki chatbot.

The current application flow includes:

- Account registration and login with Firebase Authentication
- Email verification before full app access
- Optional TOTP-based two-factor authentication
- Role selection for child or caregiver mode
- Symbol creation and management
- Text-to-speech playback for symbols
- Weekly usage tracking and analytics
- Profile editing, password changes, and accessibility preferences
- Chat support through the Rafiki chatbot

## Core Features

### Authentication and Account Security

- Firebase Authentication for sign up and sign in
- Email verification flow before entering the main app
- Google Authenticator style TOTP setup and verification
- Backup code generation for account recovery
- Password change flow
- Persistent login state using AsyncStorage

### Child Experience

- Child dashboard for symbol-based communication
- Tap-to-speak functionality powered by `expo-speech`
- Larger text and high-contrast accessibility support
- Simple, touch-friendly interface for everyday use

### Caregiver Experience

- Caregiver dashboard for navigation to support tools
- Symbol management screen to add, edit, and delete communication symbols
- Symbol analytics to review usage patterns and reset weekly counts
- Rafiki chatbot for supportive conversations and guidance
- Profile screen with security, theme, and accessibility controls

### Accessibility and Usability

- High contrast mode
- Larger text mode
- Theme switching with light and dark themes
- Accessibility labels, hints, and roles across major screens
- Persistent accessibility and symbol preferences using AsyncStorage

## Screens Included

The app currently includes the following main screens:

- `LoginScreen`
- `SignupScreen`
- `EmailVerificationScreen`
- `RoleSelectionScreen`
- `CaregiverDashboard`
- `ChildDashboard`
- `ChatbotScreen`
- `ManageSymbolsScreen`
- `SymbolAnalytics`
- `ProfileScreen`
- `EditProfileScreen`
- `ChangePasswordScreen`
- `TOTPSetupScreen`
- `TotpVerifyScreen`

## Technology Stack

- React Native
- Expo
- React Navigation
- Firebase Authentication
- Cloud Firestore
- Firebase Storage
- AsyncStorage
- Expo Speech
- Expo Image Picker
- OTPAuth for TOTP generation and verification
- React Native Chart Kit

## Architecture Summary

The project is structured around a mobile-first React Native app, with shared state managed through context providers:

- `context/SymbolsContext.js`
  Manages symbols, usage counts, persistence, and weekly resets.

- `context/AccessibilityContext.js`
  Stores accessibility preferences such as high contrast and larger text.

- `context/ThemeContext.js`
  Provides light and dark theme support.

- `services/chatService.js`
  Connects the app to the external Rafiki chatbot API.

- `services/userService.js`
  Handles profile image uploads, profile updates, and password changes.

Firebase is used for authentication, Firestore data storage, and media storage. Local app preferences and symbol state are also persisted with AsyncStorage to improve continuity and usability.

## Repository Structure

```text
.
|-- App.js
|-- firebaseConfig.js
|-- components/
|-- context/
|-- screens/
|-- services/
|-- assets/
|-- functions/
|-- dataconnect/
|-- dataconnect-generated/
|-- firestore.rules
|-- firestore.indexes.json
```

Notable folders:

- `screens/` contains the main app interfaces and navigation targets.
- `components/` contains reusable UI elements such as bottom navigation.
- `context/` contains state providers for theme, accessibility, profile, and symbols.
- `services/` contains API and Firebase-related helper logic.
- `functions/` contains Firebase Functions-related code.
- `dataconnect/` and `dataconnect-generated/` contain Firebase Data Connect configuration and generated connector files.

## Setup Instructions

### Prerequisites

Install the following before running the project:

- Node.js
- npm
- Expo CLI tools if needed
- Android Studio or Xcode for emulator/simulator testing
- A Firebase project configured for Authentication, Firestore, and Storage

### 1. Install dependencies

```bash
npm install
```

### 2. Start the Expo app

```bash
npm start
```

You can also run:

```bash
npm run android
npm run ios
npm run web
```

## Firebase Configuration

Firebase is configured in `firebaseConfig.js`.

The current app uses:

- Firebase Authentication
- Cloud Firestore
- Firebase Storage

If you are adapting this project for a different Firebase project, update the configuration values in `firebaseConfig.js` and ensure the following services are enabled in Firebase Console:

- Email/password authentication
- Firestore database
- Storage

This app also includes Firestore rules and indexes:

- `firestore.rules`
- `firestore.indexes.json`

## Chatbot Backend

The chatbot currently relies on an external API URL defined in `services/chatService.js`.

At the moment, the chat service is pointed to a LocalTunnel-based endpoint:

- `https://large-masks-try.loca.lt`

Before using the chatbot in another environment, update `KAGGLE_API_URL` in `services/chatService.js` to the active backend URL.

If the chatbot API is unavailable, the app falls back to built-in supportive responses inside `ChatbotScreen.js`.

## Security Notes

- Email verification is required before full access to the app.
- TOTP-based two-factor authentication is available through Google Authenticator.
- Backup codes are generated and stored for account recovery.
- Sensitive Firebase configuration is currently stored directly in `firebaseConfig.js`.
- Firestore rules in this repository should be reviewed before production deployment.

Important: the current `firestore.rules` file contains time-limited development-style access rules and should be tightened for production use.

## Current Limitations

- The chatbot depends on an external backend URL that may change or expire.
- Firebase configuration is hardcoded instead of using environment-based secrets management.
- Some project modules, such as Firebase Functions and Data Connect assets, are included but may require additional setup before use.
- The app is mobile-focused and some flows may need refinement for web deployment.

## Recommended Improvements

- Move Firebase and backend configuration into environment variables or app config
- Harden Firestore and Storage security rules
- Add automated tests for authentication, navigation, and symbol management flows
- Document backend deployment for the chatbot service
- Add CI/CD for linting, testing, and deployment checks
- Expand analytics and caregiver reporting

## Documentation Alignment

This README has been updated to reflect the current implemented mobile application and its documented goals: supporting caregiver-child communication, accessibility, symbol-assisted interaction, and secure account access. It is intended to serve as the main technical and project-facing overview for the repository.

## Authors and Project Identity

Project owner:

- Ashley T668
- Email: `ashley.adhiambo@strathmore.edu`

## License

This repository currently lists the project license as `0BSD` in `package.json`.
