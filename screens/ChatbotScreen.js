// screens/ChatbotScreen.js - REVAMPED UI (autism-friendly, modern, clean)
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Rect, Circle, Path, Line } from "react-native-svg";
import { chatWithRafiki } from "../services/chatService";
import { useAccessibility } from "../context/AccessibilityContext";

// ── Design tokens (consistent across all screens) ───────────────
const COLORS = {
  bg: "#F4F8F7",
  card: "#FFFFFF",
  primary: "#4AADA3",
  primaryLight: "#E6F4F3",
  primaryDark: "#37877E",
  text: "#2C3E3D",
  textSoft: "#6B8280",
  textOnPrimary: "#FFFFFF",
  border: "#D6E8E6",
  shadow: "#2C3E3D",
  overlayBg: "rgba(244, 248, 247, 0.72)",
  userBubble: "#4AADA3",
  userBubbleText: "#FFFFFF",
  botBubble: "#FFFFFF",
  botBubbleText: "#2C3E3D",
  botBubbleBorder: "#D6E8E6",
  inputBarBg: "rgba(255,255,255,0.97)",
  loadingText: "#6B8280",
};

const RADIUS = {
  bubble: 18,
  bubbleTail: 4,
  input: 24,
  full: 999,
};

// ── Rafiki SVG Bot Icon ──────────────────────────────────────────
// Friendly rounded robot face drawn on a 24×24 grid.
// Props:
//   size   — rendered px dimensions (default 20)
//   color  — stroke/fill color for use on light backgrounds
//   onDark — renders in white, for use on teal/dark backgrounds
function RafikiBotIcon({ size = 20, color = "#4AADA3", onDark = false }) {
  const c = onDark ? "#FFFFFF" : color;
  const fillOpacity = onDark ? 0.25 : 0.12;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Antenna stem */}
      <Line
        x1="12" y1="2.5" x2="12" y2="5.5"
        stroke={c} strokeWidth="1.6" strokeLinecap="round"
      />
      {/* Antenna tip dot */}
      <Circle cx="12" cy="1.6" r="1.1" fill={c} />
      {/* Head — soft filled rounded rect */}
      <Rect
        x="3" y="5.5" width="18" height="13" rx="3.5" ry="3.5"
        fill={c} fillOpacity={fillOpacity}
      />
      <Rect
        x="3" y="5.5" width="18" height="13" rx="3.5" ry="3.5"
        stroke={c} strokeWidth="1.6"
      />
      {/* Left eye */}
      <Circle cx="8.8" cy="11" r="1.7" fill={c} />
      {/* Right eye */}
      <Circle cx="15.2" cy="11" r="1.7" fill={c} />
      {/* Mouth — friendly smile arc */}
      <Path
        d="M9 14 Q12 16 15 14"
        stroke={c} strokeWidth="1.5" strokeLinecap="round" fill="none"
      />
      {/* Left ear nub */}
      <Rect x="1.2" y="9.5" width="2" height="4" rx="1" fill={c} />
      {/* Right ear nub */}
      <Rect x="20.8" y="9.5" width="2" height="4" rx="1" fill={c} />
    </Svg>
  );
}
// ────────────────────────────────────────────────────────────────

export default function ChatbotScreen({ navigation }) {
  const [messages, setMessages] = useState([
    {
      id: "1",
      sender: "bot",
      text: "Jambo! I'm Rafiki, your supportive assistant. How are you feeling today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const { highContrast, largerText } = useAccessibility();
  const flatListRef = useRef(null);
  const inputRef = useRef(null);

  // ── Auto-scroll (unchanged) ──────────────────────────────────
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // ── Keyboard handlers (unchanged) ───────────────────────────
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => setKeyboardOffset(e.endCoordinates.height)
    );
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setKeyboardOffset(0)
    );
    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  // ── Send message (unchanged) ─────────────────────────────────
  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: input.trim(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const result = await chatWithRafiki(input.trim());
      let botText;
      if (result.success) {
        botText = result.response;
        if (!botText || botText.length < 5) {
          botText = "I understand this is challenging. I'm here to listen and support you.";
        }
      } else {
        botText = getFallbackResponse(input.trim());
      }
      setMessages((prev) => [
        ...prev,
        { id: (Date.now() + 1).toString(), sender: "bot", text: botText },
      ]);
    } catch (error) {
      console.log("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "bot",
          text: getFallbackResponse(input.trim()),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ── Fallback responses (unchanged) ──────────────────────────
  const getFallbackResponse = (userMessage) => {
    const lower = userMessage.toLowerCase();
    if (lower.includes("hello") || lower.includes("hi"))
      return "Jambo! I'm Rafiki. How are you feeling today?";
    if (lower.includes("help"))
      return "I'm here to listen and offer support. You can share your challenges, feelings, or ask for coping strategies.";
    if (lower.includes("tired") || lower.includes("exhausted"))
      return "I hear you're feeling tired. Caregiving is demanding work. Remember to be gentle with yourself today.";
    if (lower.includes("frustrated") || lower.includes("angry"))
      return "Your feelings are completely valid. It's okay to feel frustrated. Would you like to talk about what's bothering you?";
    if (lower.includes("meltdown") || lower.includes("screaming"))
      return "That sounds really tough. First, ensure safety. Try to stay calm and use simple words. This will pass.";
    if (lower.includes("overwhelmed"))
      return "I hear you're feeling overwhelmed. That's completely valid. Would taking some deep breaths together help right now?";
    return "Thank you for sharing with me. I'm here to listen and support you. Could you tell me more about what you're experiencing?";
  };

  // ── Chat bubble ──────────────────────────────────────────────
  const renderItem = ({ item }) => {
    const isUser = item.sender === "user";
    return (
      <View
        style={[
          styles.bubbleRow,
          isUser ? styles.bubbleRowUser : styles.bubbleRowBot,
        ]}
      >
        {/* Bot avatar with SVG icon */}
        {!isUser && (
          <View style={styles.botAvatar}>
            <RafikiBotIcon size={18} color={COLORS.primary} />
          </View>
        )}

        <View
          style={[
            styles.bubble,
            isUser ? styles.userBubble : styles.botBubble,
            highContrast && styles.highContrastBubble,
          ]}
          accessible={true}
          accessibilityLabel={`${isUser ? "You said" : "Rafiki said"}: ${item.text}`}
          accessibilityRole="text"
        >
          <Text
            style={[
              styles.bubbleText,
              isUser ? styles.userBubbleText : styles.botBubbleText,
              largerText && styles.largerMessageText,
            ]}
          >
            {item.text}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        {/* ── Header ──────────────────────────────────────────── */}
        <View style={styles.header}>
          <StatusBar
            translucent
            backgroundColor={COLORS.primary}
            barStyle="light-content"
          />
          <SafeAreaView>
            <View style={styles.headerContent}>
              <TouchableOpacity
                style={[styles.headerIconBtn, highContrast && styles.highContrastBubble]}
                onPress={() => {
                  if (navigation.canGoBack()) navigation.goBack();
                  else navigation.navigate("Home");
                }}
                accessibilityLabel="Go back"
                accessibilityRole="button"
                accessibilityHint="Returns to previous screen"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="arrow-back" size={22} color={COLORS.textOnPrimary} />
              </TouchableOpacity>

              {/* Bot identity — SVG icon in header */}
              <View style={styles.headerCenter}>
                <View style={styles.headerAvatarCircle}>
                  <RafikiBotIcon size={17} onDark />
                </View>
                <Text style={[styles.headerTitle, largerText && styles.largerHeaderTitle]}>
                  Rafiki Chatbot
                </Text>
              </View>

              <View style={styles.headerPlaceholder} />
            </View>
          </SafeAreaView>
        </View>

        {/* ── Body ────────────────────────────────────────────── */}
        <ImageBackground
          source={require("../assets/rafiki_background.png")}
          style={styles.background}
          resizeMode="cover"
        >
          <View style={styles.overlay} />

          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
          >
            {/* Messages */}
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={[
                styles.chatContainer,
                { paddingBottom: keyboardOffset > 0 ? 20 : 24 },
              ]}
              showsVerticalScrollIndicator={false}
              accessibilityLabel="Chat conversation with Rafiki"
              accessibilityRole="list"
              onContentSizeChange={() =>
                flatListRef.current?.scrollToEnd({ animated: true })
              }
            />

            {/* Typing indicator */}
            {loading && (
              <View
                style={styles.typingRow}
                accessible={true}
                accessibilityLabel="Rafiki is thinking"
                accessibilityRole="status"
              >
                <View style={styles.botAvatar}>
                  <RafikiBotIcon size={18} color={COLORS.primary} />
                </View>
                <View style={styles.typingBubble}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                  <Text style={[styles.loadingText, largerText && styles.largerLoadingText]}>
                    Rafiki is thinking…
                  </Text>
                </View>
              </View>
            )}

            {/* Input bar */}
            <View
              style={[
                styles.inputBar,
                {
                  marginBottom:
                    keyboardOffset > 0
                      ? Platform.OS === "ios"
                        ? keyboardOffset - 35
                        : 10
                      : 0,
                },
              ]}
            >
              <TextInput
                ref={inputRef}
                style={[
                  styles.input,
                  largerText && styles.largerInputText,
                  highContrast && styles.highContrastInput,
                ]}
                value={input}
                onChangeText={setInput}
                placeholder="Share what's on your mind…"
                placeholderTextColor={COLORS.textSoft}
                onSubmitEditing={sendMessage}
                returnKeyType="send"
                editable={!loading}
                multiline
                accessibilityLabel="Type your message"
                accessibilityHint="Enter your message to chat with Rafiki"
              />

              <TouchableOpacity
                style={[
                  styles.sendBtn,
                  (!input.trim() || loading) && styles.sendBtnDisabled,
                ]}
                onPress={sendMessage}
                disabled={!input.trim() || loading}
                accessibilityLabel={loading ? "Sending message" : "Send message"}
                accessibilityRole="button"
                accessibilityHint={
                  loading ? "Message is being sent" : "Sends your message to Rafiki"
                }
                accessibilityState={{ disabled: !input.trim() || loading }}
              >
                <Ionicons
                  name="send"
                  size={18}
                  color={
                    !input.trim() || loading ? COLORS.textSoft : COLORS.textOnPrimary
                  }
                />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </ImageBackground>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // ── Header ───────────────────────────────────────────────────
  header: { backgroundColor: COLORS.primary },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 8 : 16,
    paddingBottom: 14,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    justifyContent: "center",
  },
  headerAvatarCircle: {
    width: 30,
    height: 30,
    borderRadius: RADIUS.full,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: COLORS.textOnPrimary,
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  headerPlaceholder: { width: 40 },

  // ── Background & overlay ─────────────────────────────────────
  background: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlayBg,
  },

  // ── Chat list ─────────────────────────────────────────────────
  chatContainer: { padding: 16, flexGrow: 1 },

  // ── Bubble rows ───────────────────────────────────────────────
  bubbleRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 10,
  },
  bubbleRowUser: { justifyContent: "flex-end" },
  bubbleRowBot: { justifyContent: "flex-start" },

  // ── Bot avatar ────────────────────────────────────────────────
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    flexShrink: 0,
    alignSelf: "flex-end",
  },

  // ── Bubbles ───────────────────────────────────────────────────
  bubble: {
    maxWidth: "75%",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: RADIUS.bubble,
  },
  userBubble: {
    backgroundColor: COLORS.userBubble,
    borderBottomRightRadius: RADIUS.bubbleTail,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  botBubble: {
    backgroundColor: COLORS.botBubble,
    borderBottomLeftRadius: RADIUS.bubbleTail,
    borderWidth: 1,
    borderColor: COLORS.botBubbleBorder,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  userBubbleText: { color: COLORS.userBubbleText, fontWeight: "500" },
  botBubbleText: { color: COLORS.botBubbleText },
  highContrastBubble: { borderWidth: 2, borderColor: COLORS.primary },

  // ── Typing indicator ──────────────────────────────────────────
  typingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  typingBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.botBubble,
    borderWidth: 1,
    borderColor: COLORS.botBubbleBorder,
    borderRadius: RADIUS.bubble,
    borderBottomLeftRadius: RADIUS.bubbleTail,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  loadingText: { fontSize: 14, color: COLORS.loadingText, fontStyle: "italic" },

  // ── Input bar ─────────────────────────────────────────────────
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: COLORS.inputBarBg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.bg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: RADIUS.input,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.text,
    maxHeight: 100,
    minHeight: 44,
  },
  highContrastInput: { borderWidth: 2, borderColor: COLORS.primary },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  sendBtnDisabled: {
    backgroundColor: COLORS.primaryLight,
    shadowOpacity: 0,
    elevation: 0,
  },

  // ── Accessibility ─────────────────────────────────────────────
  largerHeaderTitle: { fontSize: 20 },
  largerMessageText: { fontSize: 17, lineHeight: 24 },
  largerLoadingText: { fontSize: 16 },
  largerInputText: { fontSize: 18 },
});