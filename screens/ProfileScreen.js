// screens/ProfileScreen.js - UPDATED 2FA LOGIC
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth, is2FAEnabled, hasTOTPEnabled, disable2FA } from "../firebaseConfig";
import { useSymbols } from "../context/SymbolsContext";
import { useTheme } from "../context/ThemeContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { useAccessibility } from "../context/AccessibilityContext";

const db = getFirestore();

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [totpEnabled, setTotpEnabled] = useState(false);
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profilePic, setProfilePic] = useState(null);
  const [displayName, setDisplayName] = useState("");

  const { symbols } = useSymbols();
  const { theme, toggleTheme, isDark } = useTheme();
  const { 
    highContrast, 
    largerText, 
    saveAccessibilityPreferences,
  } = useAccessibility();

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) {
          setUser(null);
          setLoading(false);
          return;
        }
        setUser(currentUser);
        setDisplayName(currentUser.displayName || "");
        setProfilePic(currentUser.photoURL || null);

        // Try to load cached userData for instant UI
        const cached = await AsyncStorage.getItem("userData");
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (mounted) {
              setDisplayName(parsed.displayName || displayName);
              setProfilePic(parsed.photoURL || profilePic);
            }
          } catch (e) {
            // ignore parse issues
          }
        }

        // fetch latest from firestore "users" doc if exists
        try {
          const docRef = doc(db, "users", currentUser.uid);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const data = snap.data();
            if (mounted) {
              if (data.displayName) setDisplayName(data.displayName);
              if (data.photoURL) setProfilePic(data.photoURL);
            }
            // update cache
            await AsyncStorage.setItem("userData", JSON.stringify({
              uid: currentUser.uid,
              displayName: data.displayName || currentUser.displayName || "",
              photoURL: data.photoURL || currentUser.photoURL || null,
            }));
          }
        } catch (err) {
          // network error: show nothing, keep cached/UI values
          console.warn("Could not fetch user doc:", err.message || err);
        }

        // Check 2FA status
        await check2FAStatus(currentUser);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setTwoFAEnabled(false);
        setTotpEnabled(false);
      } else {
        check2FAStatus(u);
      }
    });

    return () => {
      mounted = false;
      unsub();
    };
  }, []);

  const check2FAStatus = async (currentUser) => {
    try {
      setTwoFALoading(true);
      const enabled = await is2FAEnabled(currentUser);
      const totpEnabledStatus = await hasTOTPEnabled(currentUser);
      
      setTwoFAEnabled(enabled);
      setTotpEnabled(totpEnabledStatus);
      
      console.log('🔍 2FA Status Check:', { 
        email: currentUser.email, 
        enabled: enabled,
        totpEnabled: totpEnabledStatus
      });
    } catch (error) {
      console.error('❌ Error checking 2FA status:', error);
      setTwoFAEnabled(false);
      setTotpEnabled(false);
    } finally {
      setTwoFALoading(false);
    }
  };

  const handleDisable2FA = async () => {
    Alert.alert(
      "Disable Two-Factor Authentication",
      "Are you sure you want to disable Google Authenticator? This will make your account less secure.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Disable", 
          style: "destructive",
          onPress: async () => {
            try {
              const user = auth.currentUser;
              await disable2FA(user);
              // Update local state
              setTotpEnabled(false);
              setTwoFAEnabled(false);
              Alert.alert("Success", "Google Authenticator has been disabled.");
            } catch (error) {
              console.error('❌ Failed to disable 2FA:', error);
              Alert.alert("Error", "Failed to disable 2FA. Please try again.");
            }
          }
        }
      ]
    );
  };

  const handleSetup2FA = () => {
    navigation.navigate('TOTPSetup', {
      onSetupComplete: () => {
        // Refresh 2FA status after setup
        check2FAStatus(auth.currentUser);
      }
    });
  };

  const toggleHighContrast = () => {
    const newValue = !highContrast;
    saveAccessibilityPreferences({ highContrast: newValue });
  };

  const toggleLargerText = () => {
    const newValue = !largerText;
    saveAccessibilityPreferences({ largerText: newValue });
  };

  const handleSignOut = async () => {
    try {
      await AsyncStorage.removeItem("userData");
      await signOut(auth);
      navigation.replace("Login");
    } catch (error) {
      Alert.alert("Sign out failed", error.message || "Please try again.");
    }
  };

  const handleEditProfile = () => navigation.navigate("EditProfile");
  const handleChangePassword = () => navigation.navigate("ChangePassword");
  const handleManageSymbols = () => navigation.navigate("ManageSymbols");
  const handleSymbolAnalytics = () => navigation.navigate("SymbolAnalytics");

  const get2FAStatusText = () => {
    if (twoFALoading) return "Checking...";
    if (totpEnabled) return "Google Authenticator Enabled";
    return "Not set up";
  };

  const get2FAStatusColor = () => {
    if (twoFALoading) return "#666";
    return totpEnabled ? "#4CAF50" : "#FF6B35";
  };

  const get2FAActionText = () => {
    return totpEnabled ? "Disable Google Authenticator" : "Set Up Google Authenticator";
  };

  const get2FADescription = () => {
    return totpEnabled 
      ? "Tap to disable " 
      : "Add extra security with Google Authenticator";
  };

  const get2FAIcon = () => {
    return totpEnabled ? "shield-checkmark" : "shield-outline";
  };

  const handle2FAPress = () => {
    if (totpEnabled) {
      // If TOTP is already enabled, show disable option
      handleDisable2FA();
    } else {
      // Navigate to TOTP setup
      handleSetup2FA();
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#3da49a" />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={{ paddingBottom: 40 }}
      accessibilityRole="main"
      accessibilityLabel="Profile settings"
    >
      {/* Top header */}
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <TouchableOpacity 
          style={[
            styles.headerBack,
            highContrast && styles.highContrastBorder
          ]} 
          onPress={() => navigation.goBack()}
          accessibilityLabel="Go back"
          accessibilityRole="button"
          accessibilityHint="Returns to previous screen"
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.avatarWrapper,
            highContrast && styles.highContrastBorder
          ]}
          onPress={handleEditProfile}
          accessibilityLabel="Open edit profile"
          accessibilityRole="button"
          accessibilityHint="Opens screen to edit your profile information"
        >
          <Image
            source={profilePic ? { uri: profilePic } : require("../assets/default_avatar.jpg")}
            style={styles.avatar}
            accessible={true}
            accessibilityLabel="User profile picture"
          />
        </TouchableOpacity>

        <Text style={[
          styles.nameText,
          largerText && styles.largerNameText
        ]}>
          {displayName || user?.displayName || "Rafiki User"}
        </Text>
        <Text style={[
          styles.emailText,
          largerText && styles.largerEmailText
        ]}>
          {user?.email || "No email available"}
        </Text>

        <TouchableOpacity 
          style={[
            styles.editButton,
            highContrast && styles.highContrastBorder
          ]} 
          onPress={handleEditProfile}
          accessibilityLabel="Edit profile"
          accessibilityRole="button"
          accessibilityHint="Opens screen to edit your profile information"
        >
          <Ionicons name="pencil" size={18} color="#0c0c0c" />
          <Text style={[
            styles.editButtonText,
            largerText && styles.largerButtonText
          ]}>
            Edit Profile
          </Text>
        </TouchableOpacity>
      </View>

      {/* Body */}
      <View style={styles.body}>
        {/* Stats / Quick actions */}
        <View style={styles.statRow}>
          {/* Total Symbols */}
          <View style={[
            styles.statCard, 
            { backgroundColor: theme.card },
            highContrast && styles.highContrastBorder
          ]}>
            <Text style={[
              styles.statNumber, 
              { color: theme.text },
              largerText && styles.largerStatNumber
            ]}>
              {symbols?.length ?? 0}
            </Text>
            <Text style={[
              styles.statLabel, 
              { color: theme.subtext },
              largerText && styles.largerStatLabel
            ]}>
              Total Symbols
            </Text>
          </View>

          {/* Manage Symbols */}
          <TouchableOpacity
            style={[
              styles.statCard, 
              styles.statAction, 
              { backgroundColor: theme.card },
              highContrast && styles.highContrastBorder
            ]}
            onPress={handleManageSymbols}
            accessibilityLabel="Manage symbols"
            accessibilityRole="button"
            accessibilityHint="Opens screen to add, edit, or delete communication symbols"
          >
            <Ionicons name="images-outline" size={28} color="#3da49a" />
            <Text style={[
              styles.statLabel, 
              { marginTop: 6, color: theme.subtext },
              largerText && styles.largerStatLabel
            ]}>
              Manage Symbols
            </Text>
          </TouchableOpacity>

          {/* Analytics */}
          <TouchableOpacity
            style={[
              styles.statCard, 
              styles.statAction, 
              { backgroundColor: theme.card },
              highContrast && styles.highContrastBorder
            ]}
            onPress={handleSymbolAnalytics}
            accessibilityLabel="View symbol analytics"
            accessibilityRole="button"
            accessibilityHint="Opens screen showing symbol usage statistics"
          >
            <Ionicons name="analytics-outline" size={28} color="#3da49a" />
            <Text style={[
              styles.statLabel, 
              { marginTop: 6, color: theme.subtext },
              largerText && styles.largerStatLabel
            ]}>
              Symbol Analytics
            </Text>
          </TouchableOpacity>
        </View>

        {/* Security Section - Moved to top for importance */}
        <View style={[
          styles.section, 
          { backgroundColor: theme.card },
          highContrast && styles.highContrastBorder
        ]}>
          <Text style={[
            styles.sectionTitle, 
            { color: theme.text },
            largerText && styles.largerSectionTitle
          ]}>
            Security
          </Text>
          
          {/* Two-Factor Authentication (Google Authenticator) */}
          <TouchableOpacity 
            style={styles.row} 
            onPress={handle2FAPress}
            accessibilityLabel={get2FAActionText()}
            accessibilityRole="button"
            accessibilityHint={totpEnabled ? "Disables Google Authenticator" : "Sets up Google Authenticator"}
          >
            <View style={styles.rowLeft}>
              <Ionicons 
                name={get2FAIcon()} 
                size={22} 
                color={totpEnabled ? "#34A853" : "#3da49a"} 
              />
              <View style={{ marginLeft: 12 }}>
                <Text style={[
                  styles.rowTitle, 
                  { color: theme.text },
                  largerText && styles.largerRowTitle
                ]}>
                  Google Authenticator
                </Text>
                <Text style={[
                  styles.rowSubtitle, 
                  { color: theme.subtext },
                  largerText && styles.largerRowSubtitle
                ]}>
                  {get2FADescription()}
                </Text>
                <Text style={[
                  styles.statusText, 
                  { color: get2FAStatusColor() },
                  largerText && styles.largerStatusText
                ]}>
                  {get2FAStatusText()}
                  {totpEnabled && " 🔒"}
                </Text>
              </View>
            </View>
            <View style={styles.rowRight}>
              {twoFALoading ? (
                <ActivityIndicator size="small" color="#3da49a" />
              ) : (
                <Ionicons 
                  name={totpEnabled ? "remove-circle-outline" : "add-circle-outline"} 
                  size={22} 
                  color={totpEnabled ? "#e53935" : "#3da49a"} 
                />
              )}
            </View>
          </TouchableOpacity>

          {/* Change Password */}
          <TouchableOpacity 
            style={styles.row} 
            onPress={handleChangePassword}
            accessibilityLabel="Change password"
            accessibilityRole="button"
            accessibilityHint="Opens screen to update your account password"
          >
            <View style={styles.rowLeft}>
              <Ionicons name="lock-closed-outline" size={22} color="#3da49a" />
              <View style={{ marginLeft: 12 }}>
                <Text style={[
                  styles.rowTitle, 
                  { color: theme.text },
                  largerText && styles.largerRowTitle
                ]}>
                  Change Password
                </Text>
                <Text style={[
                  styles.rowSubtitle, 
                  { color: theme.subtext },
                  largerText && styles.largerRowSubtitle
                ]}>
                  Update your account password
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={theme.subtext} />
          </TouchableOpacity>
        </View>

        {/* Rest of your existing sections remain the same... */}
        {/* Theme Settings */}
        <View style={[
          styles.section, 
          { backgroundColor: theme.card },
          highContrast && styles.highContrastBorder
        ]}>
          <Text style={[
            styles.sectionTitle, 
            { color: theme.text },
            largerText && styles.largerSectionTitle
          ]}>
            Appearance
          </Text>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons 
                name={isDark ? "moon" : "sunny"} 
                size={22} 
                color={isDark ? "#bb86fc" : "#ffa000"} 
                accessible={true}
                accessibilityLabel={isDark ? "Dark mode enabled" : "Light mode enabled"}
              />
              <View style={{ marginLeft: 12 }}>
                <Text style={[
                  styles.rowTitle, 
                  { color: theme.text },
                  largerText && styles.largerRowTitle
                ]}>
                  Dark Mode
                </Text>
                <Text style={[
                  styles.rowSubtitle, 
                  { color: theme.subtext },
                  largerText && styles.largerRowSubtitle
                ]}>
                  {isDark ? "Enabled" : "Disabled"}
                </Text>
              </View>
            </View>
            <Switch 
              value={isDark} 
              onValueChange={toggleTheme} 
              trackColor={{ false: "#767577", true: "#3da49a" }} 
              thumbColor="#f4f3f4"
              accessibilityLabel="Dark mode toggle switch"
              accessibilityRole="switch"
              accessibilityState={{ checked: isDark }}
              accessibilityHint="Turns dark mode on or off for better visibility"
            />
          </View>
        </View>

        {/* Accessibility Settings */}
        <View style={[
          styles.section, 
          { backgroundColor: theme.card },
          highContrast && styles.highContrastBorder
        ]}>
          <Text style={[
            styles.sectionTitle, 
            { color: theme.text },
            largerText && styles.largerSectionTitle
          ]}>
            Accessibility
          </Text>
          
          {/* High Contrast */}
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="contrast-outline" size={22} color="#3da49a" />
              <View style={{ marginLeft: 12 }}>
                <Text style={[
                  styles.rowTitle, 
                  { color: theme.text },
                  largerText && styles.largerRowTitle
                ]}>
                  High Contrast
                </Text>
                <Text style={[
                  styles.rowSubtitle, 
                  { color: theme.subtext },
                  largerText && styles.largerRowSubtitle
                ]}>
                  Enhanced visibility for low vision
                </Text>
              </View>
            </View>
            <Switch 
              value={highContrast} 
              onValueChange={toggleHighContrast}
              trackColor={{ false: "#767577", true: "#3da49a" }} 
              thumbColor="#f4f3f4"
              accessibilityLabel="High contrast mode toggle"
              accessibilityRole="switch"
              accessibilityState={{ checked: highContrast }}
              accessibilityHint="Turns high contrast mode on or off"
            />
          </View>

          {/* Larger Text */}
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name="text-outline" size={22} color="#3da49a" />
              <View style={{ marginLeft: 12 }}>
                <Text style={[
                  styles.rowTitle, 
                  { color: theme.text },
                  largerText && styles.largerRowTitle
                ]}>
                  Larger Text
                </Text>
                <Text style={[
                  styles.rowSubtitle, 
                  { color: theme.subtext },
                  largerText && styles.largerRowSubtitle
                ]}>
                  Increase text size throughout app
                </Text>
              </View>
            </View>
            <Switch 
              value={largerText} 
              onValueChange={toggleLargerText}
              trackColor={{ false: "#767577", true: "#3da49a" }} 
              thumbColor="#f4f3f4"
              accessibilityLabel="Larger text toggle"
              accessibilityRole="switch"
              accessibilityState={{ checked: largerText }}
              accessibilityHint="Turns larger text mode on or off"
            />
          </View>
        </View>

        {/* Sign Out */}
        <View style={[
          styles.section, 
          { backgroundColor: theme.card },
          highContrast && styles.highContrastBorder
        ]}>
          <TouchableOpacity 
            style={[
              styles.signOutBtn,
              highContrast && styles.highContrastBorder
            ]} 
            onPress={handleSignOut}
            accessibilityLabel="Sign out"
            accessibilityRole="button"
            accessibilityHint="Signs you out of your account"
          >
            <Ionicons name="log-out-outline" size={18} color="#fff" />
            <Text style={[
              styles.signOutText,
              largerText && styles.largerButtonText
            ]}>
              Sign Out
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

// Your existing styles remain exactly the same...
const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: "center", alignItems: "center" },

  header: {
    paddingTop: 40,
    paddingBottom: 24,
    alignItems: "center",
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerBack: {
    position: "absolute",
    left: 16,
    top: 44,
    padding: 8,
  },
  avatarWrapper: {
    marginTop: 6,
    width: 110,
    height: 110,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.3)",
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  avatar: { width: "100%", height: "100%" },

  nameText: {
    marginTop: 12,
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },
  emailText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    marginTop: 6,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editButtonText: {
    marginLeft: 8,
    fontWeight: "600",
    color: "#0c0c0c",
    fontSize: 14,
  },

  body: { padding: 18 },
  statRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 18 },
  statCard: {
    flex: 1,
    padding: 12,
    marginHorizontal: 6,
    borderRadius: 12,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statNumber: { fontSize: 20, fontWeight: "800" },
  statLabel: { fontSize: 13 },
  statAction: { justifyContent: "center" },

  section: {
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },

  row: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between", 
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  rowLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  rowRight: { flexDirection: "row", alignItems: "center" },
  rowTitle: { fontSize: 16, fontWeight: "600" },
  rowSubtitle: { fontSize: 12, marginTop: 2 },
  statusText: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },

  signOutBtn: {
    backgroundColor: "#e53935",
    paddingVertical: 12,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  signOutText: { color: "#fff", fontWeight: "700", marginLeft: 8, fontSize: 16 },

  // Accessibility Styles
  highContrastBorder: {
    borderWidth: 2,
    borderColor: '#FF0000',
  },
  largerNameText: {
    fontSize: 22,
  },
  largerEmailText: {
    fontSize: 16,
  },
  largerButtonText: {
    fontSize: 16,
  },
  largerStatNumber: {
    fontSize: 22,
  },
  largerStatLabel: {
    fontSize: 14,
  },
  largerSectionTitle: {
    fontSize: 18,
  },
  largerRowTitle: {
    fontSize: 18,
  },
  largerRowSubtitle: {
    fontSize: 14,
  },
  largerStatusText: {
    fontSize: 14,
  },
});