// App.js - FIXED NAVIGATION STRUCTURE
import React, { useState, useEffect } from "react";
import { View, StyleSheet, ActivityIndicator, Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { onAuthStateChanged } from "firebase/auth";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { auth, is2FAEnabled } from "./firebaseConfig";
import { ensureUserProfile } from "./services/userService";

// Screens
import LoginScreen from "./screens/LoginScreen";
import SignupScreen from "./screens/SignupScreen";
import RoleSelectionScreen from "./screens/RoleSelectionScreen";
import CaregiverDashboard from "./screens/CaregiverDashboard";
import ChildDashboard from "./screens/ChildDashboard";
import ChatbotScreen from "./screens/ChatbotScreen";
import ManageSymbolsScreen from "./screens/ManageSymbolsScreen";
import ProfileScreen from "./screens/ProfileScreen";
import EditProfileScreen from "./screens/EditProfileScreen";
import ChangePasswordScreen from "./screens/ChangePasswordScreen";
import SymbolAnalytics from "./screens/SymbolAnalytics";
import EmailVerificationScreen from "./screens/EmailVerificationScreen";
import TOTPSetupScreen from "./screens/TOTPSetupScreen";

// Components
import BottomNavigation from "./components/BottomNavigation";

// Context Providers
import { SymbolsProvider } from "./context/SymbolsContext";
import { ThemeProvider } from "./context/ThemeContext";
import { AccessibilityProvider } from "./context/AccessibilityContext";
import { useTheme } from "./context/ThemeContext";

const Stack = createNativeStackNavigator();

// Main App Navigator (for authenticated users)
function MainAppNavigator({ setRole, user }) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Stack.Navigator 
          screenOptions={{ 
            headerShown: false,
            animation: 'slide_from_right'
          }}
        >
          <Stack.Screen name="RoleSelection">
            {(props) => (
              <RoleSelectionScreen 
                {...props} 
                setRole={setRole}
                user={user}
              />
            )}
          </Stack.Screen>

          <Stack.Screen name="CaregiverDashboard" component={CaregiverDashboard} />
          <Stack.Screen name="ChildDashboard" component={ChildDashboard} />
          <Stack.Screen name="Chatbot" component={ChatbotScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="EditProfile" component={EditProfileScreen} />
          <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
          <Stack.Screen name="ManageSymbols" component={ManageSymbolsScreen} />
          <Stack.Screen name="SymbolAnalytics" component={SymbolAnalytics} />
          
          <Stack.Screen 
            name="TOTPSetup" 
            component={TOTPSetupScreen}
            options={{
              presentation: 'modal',
              animation: 'slide_from_bottom',
              title: 'Google Authenticator Setup',
              headerShown: true,
              headerStyle: {
                backgroundColor: '#3da49a',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}
          />
        </Stack.Navigator>
      </View>
    </View>
  );
}

// Auth Navigator (for login/signup)
function AuthNavigator({ on2FASuccess }) {
  return (
    <Stack.Navigator 
      initialRouteName="Login" 
      screenOptions={{ 
        headerShown: false,
        animation: 'slide_from_right'
      }}
    >
      <Stack.Screen name="Login">
        {(props) => (
          <LoginScreen 
            {...props}
            on2FASuccess={on2FASuccess}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="Signup" component={SignupScreen} />
      
      <Stack.Screen 
        name="TOTPSetup" 
        component={TOTPSetupScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
          title: 'Google Authenticator Setup',
          headerShown: true,
          headerStyle: {
            backgroundColor: '#3da49a',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
    </Stack.Navigator>
  );
}

// Email Verification Navigator
function EmailVerificationNavigator({ user, onVerificationComplete }) {
  return (
    <Stack.Navigator 
      screenOptions={{ 
        headerShown: false,
        animation: 'slide_from_right'
      }}
    >
      <Stack.Screen name="EmailVerification">
        {(props) => (
          <EmailVerificationScreen 
            {...props} 
            user={user}
            onVerificationComplete={onVerificationComplete}
          />
        )}
      </Stack.Screen>
      
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
  );
}

function AppContent() {
  const { theme, isThemeLoaded } = useTheme();
  const [user, setUser] = useState(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [role, setRole] = useState(null);
  const [requires2FA, setRequires2FA] = useState(false);
  const [checking2FA, setChecking2FA] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('🔄 Auth state changed:', { 
        user: user ? user.email : 'none', 
        verified: user ? user.emailVerified : false 
      });
      
      setUser(user);
      setEmailVerified(user ? user.emailVerified : false);

      if (user) {
        try {
          await ensureUserProfile(user);
        } catch (profileError) {
          console.error("Failed to sync user profile:", profileError);
        }
      }
      
      if (user && user.emailVerified) {
        console.log('🔐 Checking if 2FA is required...');
        setChecking2FA(true);
        try {
          const needs2FA = await is2FAEnabled(user);
          console.log('🔐 2FA Check Result:', needs2FA);
          setRequires2FA(needs2FA);
        } catch (error) {
          console.error('❌ Error checking 2FA status:', error);
          setRequires2FA(false);
        } finally {
          setChecking2FA(false);
        }
      } else {
        setRequires2FA(false);
        setChecking2FA(false);
      }
      
      setLoadingAuth(false);
      
      if (!user) {
        setRole(null);
      }
    });
    return unsubscribe;
  }, []);

  // Show loading spinner while checking auth state or 2FA status
  if (!isThemeLoaded || loadingAuth || checking2FA) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.primary }]}>
          {checking2FA ? "Checking security settings..." : "Loading Rafiki Assist..."}
        </Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {/* 🔐 STATE 1: No user authenticated OR user requires 2FA verification */}
      {(!user || (user && requires2FA)) && (
        <AuthNavigator 
          on2FASuccess={() => {
            console.log('✅ 2FA verification completed - updating state');
            setRequires2FA(false);
          }}
        />
      )}

      {/* 📧 STATE 2: User logged in but email NOT verified */}
      {(user && !emailVerified) && (
        <EmailVerificationNavigator 
          user={user}
          onVerificationComplete={() => {
            console.log('✅ Email verification completed');
            setEmailVerified(true);
          }}
        />
      )}

      {/* ✅ STATE 3: User logged in, email verified, and NO 2FA required */}
      {(user && emailVerified && !requires2FA) && (
        <MainAppNavigator 
          setRole={setRole}
          user={user}
        />
      )}

      {/* Bottom navigation visible only when authenticated, verified, and role is selected */}
      {user && emailVerified && role && !requires2FA && (
        <BottomNavigation 
          role={role}
          onRoleChange={setRole}
        />
      )}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AccessibilityProvider>
          <SymbolsProvider>
            <AppContent />
          </SymbolsProvider>
        </AccessibilityProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: '#fff'
  },
  content: { 
    flex: 1 
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#3da49a',
    fontWeight: '500'
  }
});
