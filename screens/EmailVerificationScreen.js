// screens/EmailVerificationScreen.js
import React, { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, Alert, StyleSheet, 
  ActivityIndicator, ScrollView 
} from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { sendVerificationEmail, auth, reloadUser } from '../firebaseConfig';
import { useAccessibility } from '../context/AccessibilityContext';
import { useTheme } from '../context/ThemeContext';

export default function EmailVerificationScreen({ navigation }) {
  const { user, emailVerified, refreshVerificationStatus } = useAuth();
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [autoCheckCount, setAutoCheckCount] = useState(0);
  const { highContrast, largerText } = useAccessibility();
  const { theme, isDark } = useTheme();

  // Auto-check verification status every 15 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      if (user && !emailVerified) {
        console.log(`🔄 Auto-checking verification status (attempt ${autoCheckCount + 1})`);
        await checkVerificationStatus();
        setAutoCheckCount(prev => prev + 1);
      }
    }, 15000); // Check every 15 seconds

    return () => clearInterval(interval);
  }, [user, emailVerified, autoCheckCount]);

  // Check verification status with enhanced logging
  const checkVerificationStatus = async () => {
    if (!user) return;
    
    setChecking(true);
    try {
      console.log('🔍 Checking verification status for:', user.email);
      
      // Use the enhanced reload function
      const updatedUser = await reloadUser(user);
      
      console.log('📊 Verification status check result:', {
        email: updatedUser.email,
        verified: updatedUser.emailVerified,
        timestamp: new Date().toISOString()
      });

      if (updatedUser.emailVerified) {
        console.log('🎉 Email verified! Navigating to dashboard...');
        Alert.alert("Success", "Your email has been verified successfully!");
        // Let the auth listener handle navigation
      } else {
        console.log('⏳ Email not verified yet, continue waiting...');
      }
    } catch (error) {
      console.error('❌ Error checking verification status:', error);
    } finally {
      setChecking(false);
    }
  };

  // Enhanced resend verification with detailed logging
  const handleResendVerification = async () => {
    if (!user) return;
    
    setResending(true);
    try {
      console.log('🔄 Resending verification email to:', user.email);
      console.log('👤 User details:', {
        uid: user.uid,
        currentVerified: user.emailVerified
      });
      
      const sent = await sendVerificationEmail(user);
      
      if (sent) {
        console.log('✅ Resend successful - email should arrive soon');
        Alert.alert(
          "Verification Email Sent", 
          "Please check your inbox (and spam folder) for the verification link. It may take a few minutes to arrive.",
          [{ text: "OK" }]
        );
      } else {
        console.log('❌ Resend failed - check Firebase console for details');
        Alert.alert(
          "Sending Failed", 
          "We couldn't send the verification email. Please try again in a few minutes."
        );
      }
    } catch (error) {
      console.error('❌ Error in resend:', error);
      Alert.alert(
        "Error", 
        `Failed to send verification email: ${error.message}`
      );
    } finally {
      setResending(false);
    }
  };

  const handleRefresh = async () => {
    console.log('🔄 Manual refresh requested');
    await checkVerificationStatus();
  };

  const handleSignOut = async () => {
    try {
      console.log('🚪 User signing out from verification screen');
      await auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Debug info on component mount
  useEffect(() => {
    console.log('📧 EmailVerificationScreen mounted:', {
      userEmail: user?.email,
      emailVerified: emailVerified,
      autoCheckEnabled: true
    });
  }, []);

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.title, { color: theme.text }]}>Please log in first</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[
        styles.title,
        { color: theme.text },
        largerText && styles.largerTitle
      ]}>
        Verify Your Email
      </Text>
      
      <Text style={[
        styles.message,
        { color: theme.subtext },
        largerText && styles.largerMessage
      ]}>
        We've sent a verification link to:
      </Text>
      
      <Text style={[styles.email, { color: theme.primary }]}>{user.email}</Text>
      
      <Text style={[
        styles.instructions,
        { color: theme.subtext },
        largerText && styles.largerInstructions
      ]}>
        Please check your email and click the verification link to activate your account.
      </Text>

      <Text style={[styles.note, { color: theme.warning }]}>
        💡 Don't forget to check your spam folder!
      </Text>

      <Text style={[styles.debugInfo, { color: theme.subtext }]}>
        Auto-checking every 15 seconds... ({autoCheckCount} checks)
      </Text>

      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: theme.primary },
          (resending || loading) && styles.buttonDisabled,
          highContrast && styles.highContrastBorder
        ]}
        onPress={handleResendVerification}
        disabled={resending || loading}
      >
        {resending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={[
            styles.buttonText,
            largerText && styles.largerButtonText
          ]}>
            Resend Verification Email
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.secondaryButton,
          { borderColor: theme.primary, backgroundColor: theme.card },
          checking && styles.buttonDisabled,
          highContrast && styles.highContrastBorder
        ]}
        onPress={handleRefresh}
        disabled={checking}
      >
        {checking ? (
          <ActivityIndicator color={theme.primary} />
        ) : (
          <Text style={[
            styles.secondaryButtonText,
            { color: theme.primary },
            largerText && styles.largerButtonText
          ]}>
            Check Verification Status
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.linkButton}
        onPress={handleSignOut}
      >
        <Text style={[styles.linkButtonText, { color: theme.subtext }]}>
          Use Different Email
        </Text>
      </TouchableOpacity>

      {/* Debug section - can be removed in production */}
      <View style={[styles.debugSection, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Text style={[styles.debugTitle, { color: theme.subtext }]}>Debug Info:</Text>
        <Text style={[styles.debugText, { color: theme.subtext }]}>Email: {user.email}</Text>
        <Text style={[styles.debugText, { color: theme.subtext }]}>UID: {user.uid.substring(0, 8)}...</Text>
        <Text style={[styles.debugText, { color: theme.subtext }]}>Verified: {emailVerified ? 'Yes' : 'No'}</Text>
        <Text style={[styles.debugText, { color: theme.subtext }]}>Checks: {autoCheckCount}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  email: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  instructions: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  note: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  debugInfo: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
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
    borderRadius: 10,
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
    borderWidth: 2,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkButton: {
    padding: 16,
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
  },
  linkButtonText: {
    fontSize: 14,
  },
  debugSection: {
    marginTop: 20,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    width: '100%',
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    marginBottom: 4,
  },

  // Accessibility Styles
  highContrastBorder: {
    borderWidth: 2,
    borderColor: '#4AADA3',
  },
  largerTitle: {
    fontSize: 28,
  },
  largerMessage: {
    fontSize: 18,
  },
  largerInstructions: {
    fontSize: 16,
  },
  largerButtonText: {
    fontSize: 18,
  },
});
