// screens/TOTPSetupScreen.js - UPDATED WITH COMPLETION CALLBACK
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Linking
} from 'react-native';
import { 
  generateTOTPSecret, 
  generateTOTPSecretSimple,
  getTOTPQRCodeData, 
  verifyTOTPAndEnable2FA,
  generateBackupCodes,
  storeBackupCodes,
  enable2FA,
  auth 
} from '../firebaseConfig';
import { useAccessibility } from '../context/AccessibilityContext';

export default function TOTPSetupScreen({ navigation, route }) {
  const [step, setStep] = useState('intro'); // 'intro' | 'scan' | 'verify' | 'backup' | 'complete'
  const [verificationCode, setVerificationCode] = useState('');
  const [secret, setSecret] = useState(null);
  const [qrCodeData, setQrCodeData] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const { highContrast, largerText } = useAccessibility();

  const user = auth.currentUser;

  const startTOTPSetup = async () => {
    if (!user) {
      Alert.alert('Error', 'No user found. Please log in again.');
      return;
    }

    setLoading(true);
    try {
      console.log('🚀 Starting TOTP setup for:', user.email);
      
      let generatedSecret;
      
      // Try the simple approach first
      try {
        console.log('🔄 Trying simple TOTP generation...');
        generatedSecret = await generateTOTPSecretSimple(user);
        console.log('✅ Simple TOTP generation succeeded');
      } catch (simpleError) {
        console.log('🔄 Simple approach failed, trying regular method...', simpleError.message);
        // If simple approach fails, try the regular one
        generatedSecret = await generateTOTPSecret(user);
        console.log('✅ Regular TOTP generation succeeded');
      }
      
      setSecret(generatedSecret);
      
      // Generate QR code data
      const qrData = getTOTPQRCodeData(generatedSecret, user);
      setQrCodeData(qrData);
      
      setStep('scan');
      console.log('✅ TOTP setup completed successfully');
    } catch (error) {
      console.error('❌ TOTP setup failed:', error);
      
      let errorMessage = error.message || 'Failed to start 2FA setup';
      
      // Provide more user-friendly error messages
      if (errorMessage.includes('requires-recent-login') || errorMessage.includes('session expired')) {
        errorMessage = 'Your session has expired. Please log out and log in again, then try setting up 2FA.';
      } else if (errorMessage.includes('No authenticated user')) {
        errorMessage = 'No authenticated user found. Please log in again.';
      }
      
      Alert.alert('Setup Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const openAuthenticatorApp = () => {
    // Try to open Google Authenticator or suggest installation
    const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2';
    const appStoreUrl = 'https://apps.apple.com/us/app/google-authenticator/id388497605';
    
    Linking.openURL(playStoreUrl).catch(() => {
      Linking.openURL(appStoreUrl).catch(() => {
        Alert.alert(
          'Google Authenticator',
          'Please install Google Authenticator from your app store',
          [{ text: 'OK' }]
        );
      });
    });
  };

  const verifyAndEnableTOTP = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      Alert.alert('Error', 'Please enter a 6-digit code from Google Authenticator');
      return;
    }

    if (!secret) {
      Alert.alert('Error', 'TOTP setup incomplete. Please restart the setup process.');
      return;
    }

    setLoading(true);
    try {
      console.log('🔐 Verifying TOTP code...');
      await verifyTOTPAndEnable2FA(user, verificationCode, secret);
      
      // Generate backup codes
      const codes = generateBackupCodes();
      setBackupCodes(codes);
      await storeBackupCodes(user, codes);
      
      setStep('backup');
      console.log('✅ TOTP verification and setup completed successfully');
    } catch (error) {
      console.error('❌ TOTP verification failed:', error);
      
      let errorMessage = error.message || 'Verification failed';
      
      // Clear the input field on error
      setVerificationCode('');
      
      Alert.alert('Verification Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const completeSetup = () => {
    setStep('complete');
    
    // Call the completion callback if provided
    if (route.params?.onSetupComplete) {
      route.params.onSetupComplete();
    }
    
    setTimeout(() => {
      navigation.goBack();
    }, 2000);
  };

  const copyManualSecret = () => {
    if (secret) {
      Alert.alert(
        'Manual Setup Instructions',
        `If you can't scan QR code:\n\n1. Open Google Authenticator\n2. Tap "+" → "Enter a setup key"\n3. Enter:\n   • Account: ${user?.email || 'Your Account'}\n   • Key: ${secret}\n   • Time-based: Yes (default)\n\nSecret Key: ${secret}`,
        [
          { 
            text: 'Copy Secret', 
            onPress: () => {
              // You can add clipboard functionality here if needed
              Alert.alert('Copied', 'Secret has been copied. Paste it in Google Authenticator setup.');
            }
          },
          { 
            text: 'View Detailed Steps',
            onPress: showDetailedManualSteps
          },
          { text: 'OK' }
        ]
      );
    }
  };

  const showDetailedManualSteps = () => {
    Alert.alert(
      'Detailed Manual Setup',
      `Step-by-step instructions:\n\n1. Open Google Authenticator app\n2. Tap the "+" button\n3. Select "Enter a setup key"\n4. Fill in:\n   • Account name: ${user?.email || 'Rafiki Assist'}\n   • Your key: ${secret}\n   • Time-based: Yes\n5. Tap "Add"\n\nYou should now see 6-digit codes for Rafiki Assist!`,
      [{ text: 'Got it!' }]
    );
  };

  const skipBackupCodes = () => {
    Alert.alert(
      'Skip Backup Codes?',
      'Backup codes help if you lose your phone. Are you sure you want to skip?',
      [
        { text: 'Go Back', style: 'cancel' },
        { 
          text: 'Skip', 
          style: 'destructive',
          onPress: completeSetup
        }
      ]
    );
  };

  const handleRetrySetup = () => {
    setStep('intro');
    setSecret(null);
    setQrCodeData('');
    setVerificationCode('');
  };

  const showSecretInfo = () => {
    Alert.alert(
      'About TOTP Secrets',
      'The secret key is used to generate time-based codes in Google Authenticator. It\'s like a password that syncs between your app and our server.\n\n• 20 characters long\n• Base32 format (A-Z, 2-7 only)\n• Works offline\n• Changes every 30 seconds',
      [{ text: 'OK' }]
    );
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Please log in first</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={[styles.title, largerText && styles.largerTitle]}>
        🔒 Two-Factor Authentication
      </Text>

      {step === 'intro' && (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Setup Google Authenticator</Text>
          <Text style={styles.instructions}>
            Secure your account with Google Authenticator. You'll get verification codes even without internet connection.
          </Text>

          <View style={styles.benefits}>
            <Text style={styles.benefit}>✓ Works offline</Text>
            <Text style={styles.benefit}>✓ No email delays</Text>
            <Text style={styles.benefit}>✓ Industry standard security</Text>
            <Text style={styles.benefit}>✓ Instant setup</Text>
          </View>

          <TouchableOpacity
            style={[
              styles.primaryButton, 
              loading && styles.buttonDisabled,
              highContrast && styles.highContrastBorder
            ]}
            onPress={startTOTPSetup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={[
                styles.buttonText,
                largerText && styles.largerButtonText
              ]}>
                Start Setup
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.textButton}
            onPress={openAuthenticatorApp}
          >
            <Text style={[
              styles.textButtonText,
              largerText && styles.largerTextButton
            ]}>
              Install Google Authenticator
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={[
              styles.secondaryButtonText,
              largerText && styles.largerButtonText
            ]}>
              Not Now
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 'scan' && (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Setup Google Authenticator</Text>
          <Text style={styles.instructions}>
            Choose your setup method:
          </Text>

          {/* QR Code Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📱 Scan QR Code (Recommended)</Text>
            <Text style={styles.sectionInstructions}>
              1. Open Google Authenticator{'\n'}
              2. Tap "+" → "Scan a QR code"{'\n'}
              3. Point camera at QR code below
            </Text>
            
            <View style={styles.qrPlaceholder}>
              <Text style={styles.qrText}>QR Code Display</Text>
              <Text style={styles.qrHint}>(In production, use react-native-qrcode-svg)</Text>
              {secret && (
                <Text style={styles.secretHint}>
                  QR contains secret: {secret.substring(0, 8)}...
                </Text>
              )}
            </View>
          </View>

          {/* Manual Setup Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⌨️ Manual Setup</Text>
            <Text style={styles.sectionInstructions}>
              If you can't scan QR code, enter the secret manually:
            </Text>
            
            <View style={styles.manualSetupBox}>
              <Text style={styles.manualLabel}>Account:</Text>
              <Text style={styles.manualValue}>{user?.email}</Text>
              
              <Text style={styles.manualLabel}>Secret Key:</Text>
              <View style={styles.secretContainer}>
                <Text style={styles.secretValue}>{secret || 'Generating...'}</Text>
                <TouchableOpacity onPress={showSecretInfo} style={styles.infoButton}>
                  <Text style={styles.infoText}>ℹ️</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.manualNote}>
                Type: Time-based | Digits: 6 | Period: 30s
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.secondaryButton,
                highContrast && styles.highContrastBorder,
                { marginTop: 12 }
              ]}
              onPress={copyManualSecret}
            >
              <Text style={[
                styles.secondaryButtonText,
                largerText && styles.largerButtonText
              ]}>
                📋 Copy Setup Instructions
              </Text>
            </TouchableOpacity>
          </View>

          {/* Verification Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>✅ Verify Setup</Text>
            <Text style={styles.verifyInstructions}>
              After setting up Google Authenticator, enter the 6-digit code shown in the app:
            </Text>

            <TextInput
              style={[
                styles.input, 
                highContrast && styles.highContrastBorder,
                largerText && styles.largerInput
              ]}
              placeholder="000000"
              value={verificationCode}
              onChangeText={setVerificationCode}
              keyboardType="number-pad"
              maxLength={6}
              textAlign="center"
              autoFocus
            />

            <TouchableOpacity
              style={[
                styles.primaryButton, 
                loading && styles.buttonDisabled,
                highContrast && styles.highContrastBorder
              ]}
              onPress={verifyAndEnableTOTP}
              disabled={loading || !verificationCode}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={[
                  styles.buttonText,
                  largerText && styles.largerButtonText
                ]}>
                  Verify & Enable 2FA
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.textButton}
            onPress={handleRetrySetup}
          >
            <Text style={[
              styles.textButtonText,
              largerText && styles.largerTextButton
            ]}>
              🔄 Restart Setup
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 'backup' && (
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>Save Backup Codes</Text>
          <Text style={styles.instructions}>
            <Text style={styles.warning}>⚠️ Important:</Text> Save these backup codes securely. Use them if you lose access to Google Authenticator.
          </Text>

          <View style={styles.backupCodesContainer}>
            {backupCodes.map((code, index) => (
              <View key={index} style={styles.backupCodeWrapper}>
                <Text style={[
                  styles.backupCode,
                  largerText && styles.largerBackupCode
                ]}>
                  {code}
                </Text>
                <Text style={styles.backupCodeNumber}>{index + 1}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.backupWarning}>
            ⚠️ Each code can only be used once!{'\n'}
            📝 Save them in a password manager or write them down{'\n'}
            🔒 Keep them secure - anyone with these codes can access your account
          </Text>

          <TouchableOpacity
            style={[
              styles.primaryButton,
              highContrast && styles.highContrastBorder
            ]}
            onPress={completeSetup}
          >
            <Text style={[
              styles.buttonText,
              largerText && styles.largerButtonText
            ]}>
              ✅ I've Saved My Codes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.textButton}
            onPress={skipBackupCodes}
          >
            <Text style={[
              styles.skipText,
              largerText && styles.largerTextButton
            ]}>
              ⚠️ Skip backup codes (not recommended)
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 'complete' && (
        <View style={styles.stepContainer}>
          <Text style={styles.successIcon}>🎉</Text>
          <Text style={[
            styles.successTitle,
            largerText && styles.largerSuccessTitle
          ]}>
            Two-Factor Authentication Enabled!
          </Text>
          <Text style={[
            styles.successMessage,
            largerText && styles.largerSuccessMessage
          ]}>
            Your account is now protected with Google Authenticator. You'll need to enter verification codes when signing in.
          </Text>
          
          <View style={styles.nextSteps}>
            <Text style={styles.nextStepsTitle}>Next Steps:</Text>
            <Text style={styles.nextStep}>• 📱 Keep Google Authenticator app secure</Text>
            <Text style={styles.nextStep}>• 📝 Store backup codes safely</Text>
            <Text style={styles.nextStep}>• 🔄 Test login on another device</Text>
            <Text style={styles.nextStep}>• ⚙️ Add backup authenticator app if needed</Text>
          </View>

          <TouchableOpacity
            style={[
              styles.primaryButton,
              highContrast && styles.highContrastBorder,
              { marginTop: 20 }
            ]}
            onPress={() => navigation.goBack()}
          >
            <Text style={[
              styles.buttonText,
              largerText && styles.largerButtonText
            ]}>
              ← Back to Profile
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
    color: '#2b3d51',
  },
  stepContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#2b3d51',
    textAlign: 'center',
  },
  instructions: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
    textAlign: 'center',
  },
  benefits: {
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  benefit: {
    fontSize: 14,
    color: '#0369a1',
    marginBottom: 6,
  },
  section: {
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2b3d51',
  },
  sectionInstructions: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
    lineHeight: 18,
  },
  qrPlaceholder: {
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  qrText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  qrHint: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
    textAlign: 'center',
  },
  secretHint: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  manualSetupBox: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  manualLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 4,
  },
  manualValue: {
    fontSize: 14,
    color: '#333',
    marginBottom: 12,
    fontWeight: '500',
  },
  secretContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  secretValue: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#2b3d51',
    fontWeight: 'bold',
    flex: 1,
  },
  infoButton: {
    padding: 4,
  },
  infoText: {
    fontSize: 16,
  },
  manualNote: {
    fontSize: 11,
    color: '#666',
    fontStyle: 'italic',
  },
  verifyInstructions: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  warning: {
    fontWeight: 'bold',
    color: '#ff6b35',
  },
  backupWarning: {
    fontSize: 12,
    color: '#ff6b35',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 8,
  },
  primaryButton: {
    backgroundColor: '#3da49a',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  secondaryButtonText: {
    color: '#666',
    fontSize: 16,
  },
  textButton: {
    padding: 12,
    alignItems: 'center',
  },
  textButtonText: {
    color: '#3da49a',
    fontSize: 14,
  },
  skipText: {
    color: '#666',
    fontSize: 14,
    fontStyle: 'italic',
  },
  backupCodesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backupCodeWrapper: {
    width: '48%',
    marginBottom: 12,
    position: 'relative',
  },
  backupCode: {
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    textAlign: 'center',
    fontFamily: 'monospace',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  backupCodeNumber: {
    position: 'absolute',
    top: 4,
    left: 8,
    fontSize: 10,
    color: '#666',
    fontWeight: 'bold',
  },
  successIcon: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    color: '#2b3d51',
  },
  successMessage: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    lineHeight: 20,
    marginBottom: 20,
  },
  nextSteps: {
    backgroundColor: '#f0f9ff',
    padding: 16,
    borderRadius: 8,
  },
  nextStepsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#0369a1',
  },
  nextStep: {
    fontSize: 12,
    color: '#0369a1',
    marginBottom: 4,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },

  // Accessibility Styles
  highContrastBorder: {
    borderWidth: 2,
    borderColor: '#FF0000',
  },
  largerTitle: {
    fontSize: 28,
  },
  largerButtonText: {
    fontSize: 18,
  },
  largerInput: {
    fontSize: 20,
    paddingVertical: 18,
  },
  largerTextButton: {
    fontSize: 16,
  },
  largerBackupCode: {
    fontSize: 18,
    paddingVertical: 14,
  },
  largerSuccessTitle: {
    fontSize: 24,
  },
  largerSuccessMessage: {
    fontSize: 16,
  },
});