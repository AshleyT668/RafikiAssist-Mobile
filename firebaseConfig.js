// firebaseConfig.js - UPDATED WITH IMPROVED DISABLE FUNCTION
import { initializeApp } from "firebase/app";
import {
  initializeAuth,
  getReactNativePersistence,
  sendEmailVerification,
} from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { TOTP } from 'otpauth';

const firebaseConfig = {
  apiKey: "AIzaSyDk6Il6GFA5Sqzu1Zv3UkKSjjXe9ekA2ns",
  authDomain: "rafiki-assist-952be.firebaseapp.com",
  projectId: "rafiki-assist-952be",
  storageBucket: "rafiki-assist-952be.appspot.com",
  messagingSenderId: "775541551500",
  appId: "1:775541551500:web:df4d861b1c47e93fbf26a9",
  measurementId: "G-JZ3RBK5MSB",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Auth persistence (so sessions work)
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

// Initialize Firestore and Storage
export const db = getFirestore(app);
export const storage = getStorage(app);

// Enhanced Email verification functions with detailed debugging
export const sendVerificationEmail = async (user) => {
  try {
    console.log('📧 Sending verification to:', user.email);
    console.log('👤 User UID:', user.uid);
    console.log('🔍 Current verification status:', user.emailVerified);
    
    await sendEmailVerification(user, {
      url: 'https://rafiki-assist-952be.firebaseapp.com/__/auth/action',
      handleCodeInApp: false
    });
    
    console.log('✅ Verification email sent - Firebase accepted the request');
    console.log('📋 User object after sending:', {
      email: user.email,
      uid: user.uid,
      emailVerified: user.emailVerified,
      providerData: user.providerData
    });
    
    return true;
  } catch (error) {
    console.error('❌ FAILED to send verification email:', {
      code: error.code,
      message: error.message,
      email: user.email,
      uid: user.uid
    });
    
    if (error.code === 'auth/too-many-requests') {
      console.error('🚫 Firebase email limit reached - try again later');
    } else if (error.code === 'auth/invalid-email') {
      console.error('🚫 Invalid email address format');
    } else if (error.code === 'auth/user-not-found') {
      console.error('🚫 User not found in Firebase');
    }
    
    return false;
  }
};

// Enhanced email verification check
export const isEmailVerified = (user) => {
  const verified = user && user.emailVerified;
  console.log('🔍 Email verification check:', {
    userEmail: user?.email,
    verified: verified,
    timestamp: new Date().toISOString()
  });
  return verified;
};

// Reload user to get latest verification status
export const reloadUser = async (user) => {
  try {
    console.log('🔄 Reloading user data...');
    await user.reload();
    const updatedUser = auth.currentUser;
    console.log('🔄 User reloaded - verification status:', {
      before: user.emailVerified,
      after: updatedUser.emailVerified
    });
    return updatedUser;
  } catch (error) {
    console.error('❌ Error reloading user:', error);
    return user;
  }
};

// ============================================================================
// MANUAL TOTP IMPLEMENTATION (Google Authenticator) - CORRECTED
// ============================================================================

// Generate TOTP secret - CORRECTED VERSION
export const generateTOTPSecret = async (user) => {
  try {
    console.log('🔐 Generating TOTP secret for:', user?.email);
    
    if (!user) {
      throw new Error('No user provided');
    }

    // Generate a random secret (20 characters base32 for Google Authenticator)
    const secret = generateRandomSecret();
    console.log('✅ TOTP secret generated');
    console.log('🔐 Secret preview:', secret.substring(0, 8) + '...');
    console.log('🔐 Secret length:', secret.length);
    
    return secret;
  } catch (error) {
    console.error('❌ Failed to generate TOTP secret:', error);
    throw new Error(`Failed to generate TOTP secret: ${error.message}`);
  }
};

// Generate random secret for TOTP - CORRECTED FOR GOOGLE AUTHENTICATOR
const generateRandomSecret = () => {
  // Google Authenticator requires 16-32 characters in base32 format
  // Using 20 characters (160 bits) which is the standard and works reliably
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; // Base32 characters (no 0,1,8,9)
  let secret = '';
  
  // Generate exactly 20 characters for optimal Google Authenticator compatibility
  for (let i = 0; i < 20; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return secret;
};

// Get QR code data for Google Authenticator - CORRECTED
export const getTOTPQRCodeData = (secret, user) => {
  try {
    if (!secret || !user) {
      throw new Error('Secret and user are required for QR code generation');
    }

    const issuer = 'Rafiki Assist';
    const email = user.email || 'user';
    
    // Create TOTP instance with proper configuration
    const totp = new TOTP({
      issuer: issuer,
      label: email,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: secret,
    });
    
    // Generate QR code URL - this creates the proper otpauth URL
    const qrCodeUrl = totp.toString();
    
    console.log('📱 QR Code data generated successfully');
    console.log('🔐 Secret length for QR:', secret.length);
    
    return qrCodeUrl;
  } catch (error) {
    console.error('❌ Error generating QR code:', error);
    
    // Enhanced fallback with proper formatting
    const manualFormat = `otpauth://totp/${encodeURIComponent('Rafiki Assist')}:${encodeURIComponent(user.email)}?secret=${secret}&issuer=${encodeURIComponent('Rafiki Assist')}&algorithm=SHA1&digits=6&period=30`;
    console.log('📱 Using fallback QR code format');
    return manualFormat;
  }
};

// Verify TOTP code and enable 2FA - CORRECTED
export const verifyTOTPAndEnable2FA = async (user, verificationCode, secret) => {
  try {
    console.log('🔐 Verifying TOTP code...');
    
    if (!user) {
      throw new Error('No user provided');
    }
    
    if (!verificationCode || verificationCode.length !== 6) {
      throw new Error('Please enter a 6-digit code from Google Authenticator');
    }

    if (!secret) {
      throw new Error('TOTP secret is missing. Please restart the setup process.');
    }

    console.log('🔐 Verifying code with secret length:', secret.length);
    
    // Verify the TOTP code
    const isValid = verifyTOTPCode(secret, verificationCode);
    
    if (!isValid) {
      throw new Error('Invalid code from Google Authenticator. Please try again.');
    }

    console.log('✅ TOTP code verified successfully!');
    
    // Store TOTP secret in Firestore for the user
    await storeTOTPSecret(user, secret);
    
    // Enable 2FA in our system
    await enable2FA(user);
    
    console.log('✅ TOTP 2FA enabled successfully!');
    return true;
  } catch (error) {
    console.error('❌ TOTP verification failed:', error);
    throw error;
  }
};

// Verify TOTP code - CORRECTED
const verifyTOTPCode = (secret, code) => {
  try {
    // Create TOTP instance with the secret
    const totp = new TOTP({
      secret: secret,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
    });
    
    // Validate the code (allow 30-second window for time sync issues)
    const isValid = totp.validate({ token: code, window: 1 }) !== null;
    
    console.log('🔐 TOTP validation result:', { 
      isValid, 
      code, 
      secretLength: secret.length,
      secretPreview: secret.substring(0, 8) + '...' 
    });
    
    return isValid;
  } catch (error) {
    console.error('❌ TOTP validation error:', error);
    return false;
  }
};

// Store TOTP secret in Firestore - CORRECTED
const storeTOTPSecret = async (user, secret) => {
  try {
    if (!user || !secret) {
      throw new Error('User and secret are required');
    }

    const totpData = {
      secret: secret,
      enabled: true,
      enabledAt: new Date(),
      userId: user.uid,
      lastVerified: new Date(),
      secretLength: secret.length // Store for debugging
    };
    
    await setDoc(doc(db, 'userTOTP', user.uid), totpData);
    console.log('✅ TOTP secret stored in Firestore');
    return true;
  } catch (error) {
    console.error('❌ Failed to store TOTP secret:', error);
    throw new Error('Failed to save TOTP configuration. Please try again.');
  }
};

// Check if user has TOTP enabled - CORRECTED
export const hasTOTPEnabled = async (user) => {
  try {
    if (!user) {
      console.log('❌ No user provided to hasTOTPEnabled');
      return false;
    }

    const totpDoc = await getDoc(doc(db, 'userTOTP', user.uid));
    if (!totpDoc.exists()) {
      return false;
    }
    
    const totpData = totpDoc.data();
    const isEnabled = totpData.enabled === true;
    
    console.log('🔍 TOTP Status:', { 
      email: user.email, 
      enabled: isEnabled,
      hasDoc: totpDoc.exists()
    });
    
    return isEnabled;
  } catch (error) {
    console.error('❌ Error checking TOTP status:', error);
    return false;
  }
};

// Verify TOTP during login - CORRECTED
export const verifyTOTPLogin = async (user, code) => {
  try {
    if (!user || !code) {
      throw new Error('User and code are required');
    }

    // Get TOTP secret from Firestore
    const totpDoc = await getDoc(doc(db, 'userTOTP', user.uid));
    
    if (!totpDoc.exists()) {
      throw new Error('TOTP not set up for this account');
    }
    
    const totpData = totpDoc.data();
    const secret = totpData.secret;
    
    if (!secret) {
      throw new Error('TOTP secret not found');
    }
    
    console.log('🔐 Retrieved TOTP secret for login, length:', secret.length);
    
    // Verify the code
    const isValid = verifyTOTPCode(secret, code);
    
    if (!isValid) {
      throw new Error('Invalid TOTP code. Please try again.');
    }
    
    // Update last verified timestamp
    await updateDoc(doc(db, 'userTOTP', user.uid), {
      lastVerified: new Date()
    });
    
    console.log('✅ TOTP login verification successful');
    return true;
  } catch (error) {
    console.error('❌ TOTP login verification failed:', error);
    throw error;
  }
};

// ============================================================================
// BACKUP CODES & 2FA MANAGEMENT - CORRECTED
// ============================================================================

// Generate backup codes for account recovery
export const generateBackupCodes = () => {
  const codes = [];
  for (let i = 0; i < 8; i++) {
    // Generate 8-character alphanumeric codes
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    codes.push(code);
  }
  console.log('🔑 Generated backup codes');
  return codes;
};

// Store backup codes in Firestore
export const storeBackupCodes = async (user, codes) => {
  try {
    if (!user) {
      throw new Error('No user provided for storing backup codes');
    }

    const backupCodesData = {
      codes: codes.map(code => ({ code, used: false })),
      createdAt: new Date(),
      userId: user.uid
    };
    
    await setDoc(doc(db, 'backupCodes', user.uid), backupCodesData);
    console.log('✅ Backup codes stored in Firestore');
    return true;
  } catch (error) {
    console.error('❌ Failed to store backup codes:', error);
    throw new Error('Failed to save backup codes. Please try again.');
  }
};

// Check if 2FA is enabled for a user
export const is2FAEnabled = async (user) => {
  try {
    if (!user) {
      console.log('❌ No user provided to is2FAEnabled');
      return false;
    }

    // Check if TOTP is enabled
    const totpEnabled = await hasTOTPEnabled(user);
    
    console.log('🔍 2FA Status Check:', {
      email: user.email,
      totpEnabled,
      overall: totpEnabled
    });
    
    return totpEnabled;
  } catch (error) {
    console.error('❌ Error checking 2FA status:', error);
    return false;
  }
};

// Enable 2FA for user
export const enable2FA = async (user) => {
  try {
    if (!user) {
      throw new Error('No user provided to enable2FA');
    }

    await setDoc(doc(db, 'userMFA', user.uid), {
      enabled: true,
      enabledAt: new Date(),
      method: 'totp',
      userId: user.uid
    });
    console.log('✅ 2FA enabled for user:', user.email);
    return true;
  } catch (error) {
    console.error('❌ Failed to enable 2FA:', error);
    throw new Error('Failed to enable 2FA in system. Please try again.');
  }
};

// Disable 2FA for user - IMPROVED VERSION
export const disable2FA = async (user) => {
  try {
    if (!user) {
      throw new Error('No user provided to disable2FA');
    }

    console.log('🔐 Disabling 2FA for user:', user.email);

    // Option 1: Update TOTP to disabled state (preserves history)
    await setDoc(doc(db, 'userTOTP', user.uid), {
      enabled: false,
      disabledAt: new Date(),
      previouslyEnabled: true,
      userId: user.uid
    }, { merge: true }); // Use merge to preserve other fields
    
    // Option 2: Alternatively, you can delete the TOTP document completely
    // await deleteDoc(doc(db, 'userTOTP', user.uid));
    
    // Update MFA settings
    await setDoc(doc(db, 'userMFA', user.uid), {
      enabled: false,
      disabledAt: new Date(),
      method: null,
      userId: user.uid
    }, { merge: true });
    
    console.log(`✅ 2FA disabled for user: ${user.email}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to disable 2FA:', error);
    throw new Error('Failed to disable 2FA. Please try again.');
  }
};

// Verify backup code for account recovery
export const verifyBackupCode = async (user, backupCode) => {
  try {
    if (!user || !backupCode) {
      throw new Error('User and backup code are required');
    }

    const backupDoc = await getDoc(doc(db, 'backupCodes', user.uid));
    
    if (!backupDoc.exists()) {
      throw new Error('No backup codes found for this account');
    }
    
    const backupData = backupDoc.data();
    const codeEntry = backupData.codes.find(entry => entry.code === backupCode && !entry.used);
    
    if (!codeEntry) {
      throw new Error('Invalid or already used backup code');
    }
    
    // Mark backup code as used
    const updatedCodes = backupData.codes.map(entry => 
      entry.code === backupCode ? { ...entry, used: true } : entry
    );
    
    await updateDoc(doc(db, 'backupCodes', user.uid), {
      codes: updatedCodes
    });
    
    console.log('✅ Backup code verified successfully');
    return true;
  } catch (error) {
    console.error('❌ Backup code verification failed:', error);
    throw error;
  }
};

// For login screen - check if TOTP is required
export const isTOTPRequired = async (user) => {
  return await is2FAEnabled(user);
};

// Simple TOTP function alias (for compatibility)
export const generateTOTPSecretSimple = generateTOTPSecret;

// Handle MFA challenge during sign-in (for compatibility with existing code)
export const handleMFASignIn = async (error) => {
  try {
    console.log('🔐 Handling MFA challenge...');
    throw new Error('Manual TOTP implementation - use verifyTOTPLogin instead');
  } catch (mfaError) {
    console.error('❌ MFA challenge failed:', mfaError);
    throw mfaError;
  }
};

// Check if error is MFA required (for compatibility with existing code)
export const isMFARequiredError = (error) => {
  return false; // Manual implementation doesn't use Firebase MFA errors
};

export default app;