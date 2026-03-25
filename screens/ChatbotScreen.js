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
  ScrollView,
  StatusBar,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Rect, Circle, Path, Line } from "react-native-svg";
import { chatWithRafiki } from "../services/chatService";
import {
  archiveChatSession,
  deleteChatSession,
  saveChatSession,
  listChatSessions,
  pinChatSession,
  renameChatSession,
} from "../services/chatHistoryService";
import { auth } from "../firebaseConfig";
import { useAccessibility } from "../context/AccessibilityContext";
import { useTheme } from "../context/ThemeContext";

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

const WELCOME_MESSAGE = {
  id: "welcome-message",
  sender: "bot",
  text: "Hujambo, Rafiki. I am also Rafiki, your friend and companion on this journey. How are you feeling today? Whether you're exhausted, confused, or just need someone to talk to, I am here for you. Tuko pamoja.",
};

const createFreshConversation = () => [
  { ...WELCOME_MESSAGE, timestampMs: Date.now() },
];

const WELCOME_SUGGESTIONS = [
  "I feel overwhelmed today",
  "How can I calm down after a hard moment?",
  "Can you help me support my child better?",
];

const formatSessionTime = (timestamp) => {
  if (!timestamp) {
    return "Recent chat";
  }

  return new Date(timestamp).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatMessageTime = (timestamp) => {
  if (!timestamp) {
    return "";
  }

  return new Date(timestamp).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
};

const getHistoryGroupLabel = (timestamp) => {
  if (!timestamp) {
    return "Older";
  }

  const now = new Date();
  const currentDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(timestamp);
  const targetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const diffDays = Math.floor((currentDay - targetDay) / 86400000);

  if (diffDays <= 0) {
    return "Today";
  }

  if (diffDays === 1) {
    return "Yesterday";
  }

  if (diffDays < 7) {
    return "Last 7 Days";
  }

  return "Older";
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
  const [messages, setMessages] = useState(createFreshConversation);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const [chatSessions, setChatSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [undoDeleteState, setUndoDeleteState] = useState(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [historySearchQuery, setHistorySearchQuery] = useState("");
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const { highContrast, largerText } = useAccessibility();
  const { theme, isDark } = useTheme();
  const flatListRef = useRef(null);
  const inputRef = useRef(null);
  const undoTimerRef = useRef(null);
  const shouldAutoScrollRef = useRef(true);
  const streamTimerRef = useRef(null);
  const toastTimerRef = useRef(null);

  const filteredChatSessions = chatSessions.filter((session) => {
    const query = historySearchQuery.trim().toLowerCase();

    if (!query) {
      return true;
    }

    return (session.messages || []).some((message) =>
      typeof message?.text === "string" &&
      message.text.toLowerCase().includes(query)
    );
  });

  const activeChatSessions = filteredChatSessions.filter(
    (session) => !session.archivedAtMs
  );
  const archivedChatSessions = filteredChatSessions.filter(
    (session) => session.archivedAtMs
  );

  const buildGroupedSessions = (sessions) => {
    const sections = [];

    sessions.forEach((session) => {
      const label = getHistoryGroupLabel(session.updatedAtMs);
      const existingSection = sections.find((section) => section.label === label);

      if (existingSection) {
        existingSection.sessions.push(session);
      } else {
        sections.push({ label, sessions: [session] });
      }
    });

    return sections;
  };

  const activeChatGroups = buildGroupedSessions(activeChatSessions);
  const archivedChatGroups = buildGroupedSessions(archivedChatSessions);
  const pinnedChatSessions = activeChatSessions.filter((session) => session.pinnedAtMs);
  const unpinnedActiveGroups = buildGroupedSessions(
    activeChatSessions.filter((session) => !session.pinnedAtMs)
  );
  const showWelcomeSuggestions =
    !loading &&
    messages.length === 1 &&
    messages[0]?.id === WELCOME_MESSAGE.id &&
    !input.trim();

  const buildApiHistory = (chatMessages) =>
    chatMessages
      .map((message) => {
        if (message.sender === "user") {
          return { role: "user", text: message.text };
        }

        if (message.sender === "bot") {
          return { role: "model", text: message.text };
        }

        return null;
      })
      .filter(Boolean);

  // ── Auto-scroll (unchanged) ──────────────────────────────────
  const scrollToLatest = (animated = true) => {
    requestAnimationFrame(() => {
      flatListRef.current?.scrollToEnd({ animated });
    });
  };

  const handleChatScroll = ({ nativeEvent }) => {
    const { contentOffset, contentSize, layoutMeasurement } = nativeEvent;
    const distanceFromBottom =
      contentSize.height - (contentOffset.y + layoutMeasurement.height);

    const isNearBottom = distanceFromBottom < 72;
    shouldAutoScrollRef.current = isNearBottom;
    setShowScrollToBottom(!isNearBottom);
  };

  useEffect(() => {
    if (messages.length > 0 && shouldAutoScrollRef.current) {
      scrollToLatest();
    }
  }, [messages]);

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) {
        clearTimeout(undoTimerRef.current);
      }
      if (streamTimerRef.current) {
        clearInterval(streamTimerRef.current);
      }
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

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
  const loadChatHistory = async (preferredSessionId = null) => {
    if (!auth.currentUser) {
      setHistoryLoading(false);
      return;
    }

    setHistoryLoading(true);

    try {
      const savedSessions = await listChatSessions(auth.currentUser);
      setChatSessions(savedSessions);

      if (preferredSessionId) {
        const matchingSession = savedSessions.find(
          (session) => session.id === preferredSessionId
        );

        if (matchingSession?.messages?.length) {
          setMessages(matchingSession.messages);
          setCurrentSessionId(matchingSession.id);
        }
      }
    } catch (error) {
      console.log("Failed to load chat history:", error);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    loadChatHistory();
  }, []);

  const updateSessionList = (savedSession) => {
    setChatSessions((previousSessions) => {
      const nextSessions = [
        savedSession,
        ...previousSessions.filter((session) => session.id !== savedSession.id),
      ];

      nextSessions.sort((a, b) => {
        const pinDiff = (b.pinnedAtMs || 0) - (a.pinnedAtMs || 0);
        if (pinDiff !== 0) return pinDiff;
        return (b.updatedAtMs || 0) - (a.updatedAtMs || 0);
      });
      return nextSessions;
    });
  };

  const removeSessionFromList = (sessionId) => {
    setChatSessions((previousSessions) =>
      previousSessions.filter((session) => session.id !== sessionId)
    );
  };

  const dismissUndoDelete = () => {
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }

    setUndoDeleteState(null);
  };

  const showToast = (message) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    setToastMessage(message);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage("");
      toastTimerRef.current = null;
    }, 1800);
  };

  const cancelRenameSession = () => {
    setEditingSessionId(null);
    setEditingTitle("");
  };

  const buildMessage = (sender, text) => ({
    id: `${sender}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    sender,
    text,
    timestampMs: Date.now(),
  });

  const streamBotResponse = (baseMessages, botText) =>
    new Promise((resolve) => {
      if (streamTimerRef.current) {
        clearInterval(streamTimerRef.current);
      }

      const botMessage = buildMessage("bot", "");
      const nextMessages = [...baseMessages, botMessage];
      setMessages(nextMessages);

      if (!botText) {
        resolve(nextMessages);
        return;
      }

      let index = 0;
      const step = Math.max(2, Math.ceil(botText.length / 30));

      streamTimerRef.current = setInterval(() => {
        index = Math.min(botText.length, index + step);
        const partialMessage = {
          ...botMessage,
          text: botText.slice(0, index),
        };
        const partialMessages = [...baseMessages, partialMessage];
        setMessages(partialMessages);

        if (index >= botText.length) {
          clearInterval(streamTimerRef.current);
          streamTimerRef.current = null;
          resolve(partialMessages);
        }
      }, 35);
    });

  const requestBotReply = async ({
    userText,
    baseMessages,
    persist = true,
  }) => {
    shouldAutoScrollRef.current = true;
    setShowScrollToBottom(false);
    setLoading(true);

    let botText = getFallbackResponse(userText);

    try {
      const result = await chatWithRafiki(userText, buildApiHistory(baseMessages));

      if (result.success && result.response) {
        botText =
          result.response.length < 5
            ? "I understand this is challenging. I'm here to listen and support you."
            : result.response;
      }
    } catch (error) {
      console.log("Chat error:", error);
    }

    const finalMessages = await streamBotResponse(baseMessages, botText);

    if (persist) {
      await persistConversation(finalMessages);
    }

    setLoading(false);
    return finalMessages;
  };

  const persistConversation = async (nextMessages) => {
    if (!auth.currentUser) {
      return null;
    }

    try {
      const savedSession = await saveChatSession({
        sessionId: currentSessionId,
        messages: nextMessages,
        user: auth.currentUser,
      });

      setCurrentSessionId(savedSession.id);
      updateSessionList(savedSession);
      return savedSession.id;
    } catch (error) {
      console.log("Failed to save chat history:", error);
      return null;
    }
  };

  const startNewChat = () => {
    shouldAutoScrollRef.current = true;
    setShowScrollToBottom(false);
    cancelRenameSession();
    setCurrentSessionId(null);
    setMessages(createFreshConversation());
    setInput("");
    setHistoryDrawerOpen(false);
    Keyboard.dismiss();
  };

  const openSavedSession = (session) => {
    if (!session?.messages?.length) {
      return;
    }

    shouldAutoScrollRef.current = true;
    setShowScrollToBottom(false);
    cancelRenameSession();
    setCurrentSessionId(session.id);
    setMessages(session.messages);
    setInput("");
    setHistoryDrawerOpen(false);
    Keyboard.dismiss();
  };

  const handleDeleteSession = async (session, event) => {
    event?.stopPropagation?.();

    if (!session?.id) {
      return;
    }

    if (editingSessionId === session.id) {
      cancelRenameSession();
    }

    dismissUndoDelete();

    try {
      await deleteChatSession(session.id, auth.currentUser);
      removeSessionFromList(session.id);

      if (currentSessionId === session.id) {
        setCurrentSessionId(null);
        setMessages(createFreshConversation());
        setInput("");
      }

      setUndoDeleteState(session);
      undoTimerRef.current = setTimeout(() => {
        setUndoDeleteState(null);
        undoTimerRef.current = null;
      }, 5000);
    } catch (error) {
      console.log("Failed to delete chat session:", error);
    }
  };

  const handleUndoDelete = async () => {
    if (!undoDeleteState) {
      return;
    }

    const deletedSession = undoDeleteState;
    dismissUndoDelete();

    try {
      const restoredSession = await saveChatSession({
        sessionId: deletedSession.id,
        messages: deletedSession.messages,
        user: auth.currentUser,
      });

      updateSessionList(restoredSession);
    } catch (error) {
      console.log("Failed to restore deleted chat session:", error);
    }
  };

  const handleStartRenameSession = (session, event) => {
    event?.stopPropagation?.();
    setEditingSessionId(session.id);
    setEditingTitle(session.title || "");
  };

  const handleSaveRenamedSession = async (sessionId) => {
    const nextTitle = editingTitle.trim();

    if (!nextTitle) {
      return;
    }

    try {
      const renamedSession = await renameChatSession(
        sessionId,
        nextTitle,
        auth.currentUser
      );
      updateSessionList(renamedSession);
      cancelRenameSession();
    } catch (error) {
      console.log("Failed to rename chat session:", error);
    }
  };

  const handleArchiveSession = async (session, archived, event) => {
    event?.stopPropagation?.();

    try {
      const updatedSession = await archiveChatSession(
        session.id,
        archived,
        auth.currentUser
      );
      updateSessionList(updatedSession);
      showToast(archived ? "Chat archived" : "Chat restored");
    } catch (error) {
      console.log("Failed to update archive state:", error);
    }
  };

  const handlePinSession = async (session, pinned, event) => {
    event?.stopPropagation?.();

    try {
      const updatedSession = await pinChatSession(
        session.id,
        pinned,
        auth.currentUser
      );
      updateSessionList(updatedSession);
      showToast(pinned ? "Chat pinned" : "Pin removed");
    } catch (error) {
      console.log("Failed to update pin state:", error);
    }
  };

  const handleRetryResponse = async (botMessageId) => {
    if (loading) {
      return;
    }

    const botIndex = messages.findIndex((message) => message.id === botMessageId);

    if (botIndex <= 0) {
      return;
    }

    const previousUserMessage = [...messages.slice(0, botIndex)]
      .reverse()
      .find((message) => message.sender === "user");

    if (!previousUserMessage?.text) {
      return;
    }

    const baseMessages = messages.filter((message) => message.id !== botMessageId);
    setMessages(baseMessages);
    await requestBotReply({
      userText: previousUserMessage.text,
      baseMessages,
      persist: true,
    });
  };

  const handleCopyMessage = async (messageText) => {
    try {
      await Clipboard.setStringAsync(messageText);
      showToast("Copied");
    } catch (error) {
      console.log("Failed to copy message:", error);
      Alert.alert("Copy failed", "Could not copy that message right now.");
    }
  };

  const sendMessage = async (presetMessage = "") => {
    const trimmedMessage = (presetMessage || input).trim();

    if (!trimmedMessage || loading) return;

    const userMessage = buildMessage("user", trimmedMessage);
    const nextMessages = [...messages, userMessage];

    shouldAutoScrollRef.current = true;
    setShowScrollToBottom(false);
    cancelRenameSession();
    setMessages(nextMessages);
    setInput("");

    await requestBotReply({
      userText: trimmedMessage,
      baseMessages: nextMessages,
      persist: true,
    });
  };

  // ── Fallback responses (unchanged) ──────────────────────────
  const getFallbackResponse = (userMessage) => {
    const lower = userMessage.toLowerCase();
    if (lower.includes("hello") || lower.includes("hi"))
      return "Hujambo, Rafiki. I am here with you. How are you feeling today? Tuko pamoja.";
    if (lower.includes("help"))
      return "I am here to listen and support you, step by step. You can share what is weighing on your heart, and we can work through it together. Tuko pamoja.";
    if (lower.includes("tired") || lower.includes("exhausted"))
      return "Pole sana. I hear that you are feeling tired, and caregiving can be very heavy. Please be gentle with yourself today, even if all you can manage is one small breath at a time.";
    if (lower.includes("frustrated") || lower.includes("angry"))
      return "Your feelings are valid. It is okay to feel frustrated, especially when things have been hard for a while. If you want, tell me what happened, and I will stay with you through it.";
    if (lower.includes("meltdown") || lower.includes("screaming"))
      return "That sounds really overwhelming. First, focus on safety for both of you, then try to use a calm voice and simple words. This moment is hard, but it will pass. Tuko pamoja.";
    if (lower.includes("overwhelmed"))
      return "I hear that you are overwhelmed, and that feeling is real. Let us slow things down together. One breath, one thought, one step at a time. Would it help to talk through what feels heaviest right now?";
    return "Thank you for sharing that with me. I am here for you, and you do not have to carry it alone in this moment. If you want, tell me a little more about what you are going through. Tuko pamoja.";
  };

  // ── Chat bubble ──────────────────────────────────────────────
  const latestBotMessageId = [...messages]
    .reverse()
    .find((message) => message.sender === "bot")?.id;

  const renderItem = ({ item }) => {
    const isUser = item.sender === "user";
    const isLatestBotMessage = item.id === latestBotMessageId;
    return (
      <View
        style={[
          styles.bubbleRow,
          isUser ? styles.bubbleRowUser : styles.bubbleRowBot,
        ]}
      >
        {/* Bot avatar with SVG icon */}
        {!isUser && (
          <View style={[styles.botAvatar, { backgroundColor: theme.primaryLight }]}>
            <RafikiBotIcon size={18} color={theme.primary} />
          </View>
        )}

        <View
          style={[
            styles.bubble,
            isUser
              ? [styles.userBubble, { backgroundColor: theme.primary, shadowColor: theme.shadow }]
              : [styles.botBubble, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }],
            highContrast && styles.highContrastBubble,
          ]}
          accessible={true}
          accessibilityLabel={`${isUser ? "You said" : "Rafiki said"}: ${item.text}`}
          accessibilityRole="text"
        >
          <Text
            style={[
              styles.bubbleText,
              isUser
                ? [styles.userBubbleText, { color: theme.textOnPrimary }]
                : [styles.botBubbleText, { color: theme.text }],
              largerText && styles.largerMessageText,
            ]}
          >
            {item.text}
          </Text>
          <View style={styles.messageMetaRow}>
            <Text
              style={[
                styles.messageTimestamp,
                { color: isUser ? "rgba(255,255,255,0.78)" : theme.subtext },
              ]}
            >
              {formatMessageTime(item.timestampMs)}
            </Text>
            <View style={styles.messageActions}>
              <TouchableOpacity
                style={[
                  styles.messageActionBtn,
                  { backgroundColor: isUser ? "rgba(255,255,255,0.16)" : theme.secondaryCard },
                ]}
                onPress={() => handleCopyMessage(item.text)}
                accessibilityLabel={`Copy ${isUser ? "your" : "Rafiki"} message`}
                accessibilityRole="button"
              >
                <Ionicons
                  name="copy-outline"
                  size={13}
                  color={isUser ? theme.textOnPrimary : theme.text}
                />
              </TouchableOpacity>
              {!isUser && isLatestBotMessage && (
                <TouchableOpacity
                  style={[
                    styles.messageActionBtn,
                    { backgroundColor: theme.secondaryCard },
                  ]}
                  onPress={() => handleRetryResponse(item.id)}
                  accessibilityLabel="Retry response"
                  accessibilityRole="button"
                  accessibilityHint="Asks Rafiki to generate the response again"
                >
                  <Ionicons name="refresh-outline" size={13} color={theme.text} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderSessionCard = (session) => {
    const isActive = currentSessionId === session.id;
    const isEditing = editingSessionId === session.id;

    return (
      <TouchableOpacity
        key={session.id}
        style={[
          styles.drawerSessionCard,
          {
            backgroundColor: isActive ? theme.primaryLight : theme.card,
            borderColor: isActive ? theme.primary : theme.border,
          },
        ]}
        onPress={() => openSavedSession(session)}
        accessibilityLabel={`Open chat: ${session.title}`}
        accessibilityRole="button"
        accessibilityHint="Loads a previous chat for reference"
      >
        <View style={styles.drawerSessionTopRow}>
          {isEditing ? (
            <View style={styles.renameRow}>
              <TextInput
                style={[
                  styles.renameInput,
                  {
                    backgroundColor: theme.inputBackground,
                    borderColor: theme.border,
                    color: theme.text,
                  },
                ]}
                value={editingTitle}
                onChangeText={setEditingTitle}
                placeholder="Chat title"
                placeholderTextColor={theme.subtext}
                autoFocus
                maxLength={48}
                returnKeyType="done"
                onSubmitEditing={() => handleSaveRenamedSession(session.id)}
                accessibilityLabel="Rename chat title"
              />
              <TouchableOpacity
                style={[styles.renameActionBtn, { backgroundColor: theme.primaryLight }]}
                onPress={() => handleSaveRenamedSession(session.id)}
                accessibilityLabel={`Save title for ${session.title}`}
                accessibilityRole="button"
              >
                <Ionicons name="checkmark" size={16} color={theme.primaryDark} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.renameActionBtn, { backgroundColor: theme.secondaryCard }]}
                onPress={cancelRenameSession}
                accessibilityLabel="Cancel rename"
                accessibilityRole="button"
              >
                <Ionicons name="close" size={16} color={theme.text} />
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text
                style={[
                  styles.historyCardTitle,
                  styles.drawerSessionTitle,
                  { color: theme.text },
                  largerText && styles.largerHistoryCardTitle,
                ]}
                numberOfLines={1}
              >
                {session.title}
              </Text>
              <View style={styles.drawerSessionActions}>
                <TouchableOpacity
                  style={[styles.renameSessionBtn, { backgroundColor: theme.secondaryCard }]}
                  onPress={(event) =>
                    handlePinSession(session, !session.pinnedAtMs, event)
                  }
                  accessibilityLabel={
                    session.pinnedAtMs
                      ? `Unpin chat: ${session.title}`
                      : `Pin chat: ${session.title}`
                  }
                  accessibilityRole="button"
                >
                  <Ionicons
                    name={session.pinnedAtMs ? "star" : "star-outline"}
                    size={15}
                    color={session.pinnedAtMs ? theme.primary : theme.text}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.renameSessionBtn, { backgroundColor: theme.secondaryCard }]}
                  onPress={(event) => handleStartRenameSession(session, event)}
                  accessibilityLabel={`Rename chat: ${session.title}`}
                  accessibilityRole="button"
                  accessibilityHint="Edits this saved chat title"
                >
                  <Ionicons name="pencil-outline" size={15} color={theme.text} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.renameSessionBtn, { backgroundColor: theme.secondaryCard }]}
                  onPress={(event) =>
                    handleArchiveSession(session, !session.archivedAtMs, event)
                  }
                  accessibilityLabel={
                    session.archivedAtMs
                      ? `Restore chat: ${session.title}`
                      : `Archive chat: ${session.title}`
                  }
                  accessibilityRole="button"
                >
                  <Ionicons
                    name={session.archivedAtMs ? "archive-outline" : "archive"}
                    size={15}
                    color={theme.text}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.deleteChatBtn, { backgroundColor: theme.primaryLight }]}
                  onPress={(event) => handleDeleteSession(session, event)}
                  accessibilityLabel={`Delete chat: ${session.title}`}
                  accessibilityRole="button"
                  accessibilityHint="Deletes this saved chat"
                >
                  <Ionicons name="trash-outline" size={16} color={theme.primaryDark} />
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
        <Text
          style={[
            styles.historyCardPreview,
            { color: theme.subtext },
            largerText && styles.largerHistoryCardPreview,
          ]}
          numberOfLines={2}
        >
          {session.preview}
        </Text>
        <Text style={[styles.historyCardMeta, { color: theme.subtext }]}>
          {formatSessionTime(session.updatedAtMs)}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderSessionGroups = (label, groups) => {
    if (!groups.length) {
      return null;
    }

    return (
      <View key={label} style={styles.historySection}>
        <Text style={[styles.historySectionTitle, { color: theme.subtext }]}>
          {label}
        </Text>
        {groups.map((group) => (
          <View key={`${label}-${group.label}`} style={styles.historyGroup}>
            <Text style={[styles.historyGroupTitle, { color: theme.subtext }]}>
              {group.label}
            </Text>
            {group.sessions.map(renderSessionCard)}
          </View>
        ))}
      </View>
    );
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        {/* ── Header ──────────────────────────────────────────── */}
      <View style={[styles.header, { backgroundColor: theme.headerBackground }]}>
        <StatusBar
          translucent
          backgroundColor={theme.primary}
            barStyle="light-content"
          />
          <SafeAreaView>
            <View style={styles.headerContent}>
              <TouchableOpacity
                style={[styles.headerIconBtn, { backgroundColor: theme.headerIconBackground }, highContrast && styles.highContrastBubble]}
                onPress={() => {
                  if (navigation.canGoBack()) navigation.goBack();
                  else navigation.navigate("Profile");
                }}
                accessibilityLabel="Go back"
                accessibilityRole="button"
                accessibilityHint="Returns to previous screen"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="arrow-back" size={22} color={theme.headerText} />
              </TouchableOpacity>

              {/* Bot identity — SVG icon in header */}
              <View style={styles.headerCenter}>
                <View style={[styles.headerAvatarCircle, { backgroundColor: theme.headerIconBackground }]}>
                  <RafikiBotIcon size={17} onDark />
                </View>
                <Text style={[styles.headerTitle, { color: theme.headerText }, largerText && styles.largerHeaderTitle]}>
                  Rafiki Chatbot
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.headerIconBtn, { backgroundColor: theme.headerIconBackground }, highContrast && styles.highContrastBubble]}
                onPress={() => {
                  loadChatHistory(currentSessionId);
                  setHistoryDrawerOpen(true);
                }}
                accessibilityLabel="Open chat history"
                accessibilityRole="button"
                accessibilityHint="Opens your saved chats panel"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="menu-outline" size={22} color={theme.headerText} />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>

        {/* ── Body ────────────────────────────────────────────── */}
        <ImageBackground
          source={require("../assets/rafiki_background.png")}
          style={styles.background}
          resizeMode="cover"
        >
          <View style={[styles.overlay, { backgroundColor: theme.overlay }]} />

          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
          >
            {/* Messages */}
            <FlatList
              ref={flatListRef}
              style={styles.messagesList}
              data={messages}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={[
                styles.chatContainer,
                { paddingBottom: keyboardOffset > 0 ? 20 : 24 },
              ]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
              nestedScrollEnabled
              scrollEventThrottle={16}
              onScroll={handleChatScroll}
              accessibilityLabel="Chat conversation with Rafiki"
              accessibilityRole="list"
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
                  <RafikiBotIcon size={18} color={theme.primary} />
                </View>
                <View style={[styles.typingBubble, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <ActivityIndicator size="small" color={theme.primary} />
                  <Text style={[styles.loadingText, { color: theme.subtext }, largerText && styles.largerLoadingText]}>
                    Rafiki is thinking…
                  </Text>
                </View>
              </View>
            )}

            {showScrollToBottom && (
              <View style={styles.scrollToBottomWrapper} pointerEvents="box-none">
                <TouchableOpacity
                  style={[
                    styles.scrollToBottomBtn,
                    { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow },
                    highContrast && styles.highContrastBubble,
                  ]}
                  onPress={() => {
                    shouldAutoScrollRef.current = true;
                    setShowScrollToBottom(false);
                    scrollToLatest();
                  }}
                  accessibilityLabel="Jump to latest message"
                  accessibilityRole="button"
                  accessibilityHint="Scrolls to the bottom of the chat"
                >
                  <Ionicons name="chevron-down" size={18} color={theme.primary} />
                </TouchableOpacity>
              </View>
            )}

            {showWelcomeSuggestions && (
              <View style={styles.suggestionsWrap}>
                <Text style={[styles.suggestionsTitle, { color: theme.subtext }]}>
                  Start with a suggestion
                </Text>
                <View style={styles.suggestionsRow}>
                  {WELCOME_SUGGESTIONS.map((suggestion) => (
                    <TouchableOpacity
                      key={suggestion}
                      style={[
                        styles.suggestionChip,
                        {
                          backgroundColor: theme.card,
                          borderColor: theme.border,
                          shadowColor: theme.shadow,
                        },
                        highContrast && styles.highContrastBubble,
                      ]}
                      onPress={() => sendMessage(suggestion)}
                      accessibilityLabel={`Send suggestion: ${suggestion}`}
                      accessibilityRole="button"
                      accessibilityHint="Starts a new chat with this suggested prompt"
                    >
                      <Text style={[styles.suggestionChipText, { color: theme.text }]}>
                        {suggestion}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Input bar */}
            <View
              style={[
                styles.inputBar,
                { backgroundColor: isDark ? theme.card : COLORS.inputBarBg, borderTopColor: theme.border },
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
                  { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text },
                  largerText && styles.largerInputText,
                  highContrast && styles.highContrastInput,
                ]}
                value={input}
                onChangeText={setInput}
                placeholder="Share what's on your mind…"
                placeholderTextColor={theme.subtext}
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
                  {
                    backgroundColor: !input.trim() || loading ? theme.secondaryCard : theme.primary,
                    shadowColor: theme.primary,
                  },
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
                  !input.trim() || loading ? theme.subtext : theme.textOnPrimary
                  }
                />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </ImageBackground>

        {historyDrawerOpen && (
          <View style={styles.drawerOverlay}>
            <TouchableOpacity
              style={styles.drawerScrim}
              onPress={() => setHistoryDrawerOpen(false)}
              accessibilityLabel="Close chat history"
              accessibilityRole="button"
              accessibilityHint="Closes the chat history panel"
            />

            <View
              style={[
                styles.drawerPanel,
                { backgroundColor: theme.card, borderRightColor: theme.border },
              ]}
            >
              <SafeAreaView style={styles.drawerSafeArea}>
                <View style={[styles.drawerHeader, { borderBottomColor: theme.border }]}>
                  <View style={styles.drawerHeaderText}>
                    <Text style={[styles.drawerTitle, { color: theme.text }, largerText && styles.largerHistoryTitle]}>
                      Your chats
                    </Text>
                    <Text style={[styles.drawerSubtitle, { color: theme.subtext }]}>
                      Only your account can see these conversations.
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.drawerCloseBtn, { backgroundColor: theme.primaryLight }, highContrast && styles.highContrastBubble]}
                    onPress={() => setHistoryDrawerOpen(false)}
                    accessibilityLabel="Close chat history"
                    accessibilityRole="button"
                  >
                    <Ionicons name="close" size={20} color={theme.primary} />
                  </TouchableOpacity>
                </View>

                <View style={[styles.drawerActions, { borderBottomColor: theme.border }]}>
                  <TouchableOpacity
                    style={[styles.newChatBtn, styles.drawerActionBtn, { backgroundColor: theme.primaryLight }, highContrast && styles.highContrastBubble]}
                    onPress={startNewChat}
                    accessibilityLabel="Start a new chat"
                    accessibilityRole="button"
                    accessibilityHint="Clears the current conversation and starts a new chat"
                  >
                    <Ionicons name="add" size={16} color={theme.primary} />
                    <Text style={[styles.newChatBtnText, { color: theme.primary }]}>New chat</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.drawerRefreshBtn, { borderColor: theme.border, backgroundColor: theme.card }]}
                    onPress={() => loadChatHistory(currentSessionId)}
                    accessibilityLabel="Refresh chat history"
                    accessibilityRole="button"
                    accessibilityHint="Reloads your saved chats"
                  >
                    <Ionicons name="refresh" size={16} color={theme.primary} />
                    <Text style={[styles.drawerRefreshText, { color: theme.text }]}>Refresh</Text>
                  </TouchableOpacity>
                </View>

                <View style={[styles.drawerSearchWrap, { borderBottomColor: theme.border }]}>
                  <View
                    style={[
                      styles.drawerSearchInputWrap,
                      {
                        backgroundColor: theme.inputBackground,
                        borderColor: theme.border,
                      },
                      highContrast && styles.highContrastInput,
                    ]}
                  >
                    <Ionicons name="search-outline" size={16} color={theme.subtext} />
                    <TextInput
                      style={[styles.drawerSearchInput, { color: theme.text }]}
                      value={historySearchQuery}
                      onChangeText={setHistorySearchQuery}
                      placeholder="Search chats"
                      placeholderTextColor={theme.subtext}
                      accessibilityLabel="Search chat history"
                      accessibilityHint="Filters your saved chats by conversation content"
                    />
                    {!!historySearchQuery && (
                      <TouchableOpacity
                        onPress={() => setHistorySearchQuery("")}
                        accessibilityLabel="Clear chat search"
                        accessibilityRole="button"
                      >
                        <Ionicons name="close-circle" size={16} color={theme.subtext} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                <ScrollView
                  style={styles.drawerList}
                  contentContainerStyle={styles.drawerListContent}
                  showsVerticalScrollIndicator={false}
                >
                  {historyLoading ? (
                    <View style={[styles.drawerEmptyState, { backgroundColor: theme.primaryLight, borderColor: theme.border }]}>
                      <Text style={[styles.historyCardTitle, { color: theme.text }]}>Loading chats...</Text>
                    </View>
                  ) : filteredChatSessions.length ? (
                    <>
                      {pinnedChatSessions.length ? (
                        <View style={styles.historySection}>
                          <Text style={[styles.historySectionTitle, { color: theme.subtext }]}>
                            Favorites
                          </Text>
                          {pinnedChatSessions.map(renderSessionCard)}
                        </View>
                      ) : null}
                      {renderSessionGroups("Chats", unpinnedActiveGroups)}
                      {renderSessionGroups("Archived", archivedChatGroups)}
                    </>
                  ) : historySearchQuery.trim() ? (
                    <View style={[styles.drawerEmptyState, { backgroundColor: theme.primaryLight, borderColor: theme.border }]}>
                      <Text style={[styles.historyCardTitle, { color: theme.text }]}>No matches found</Text>
                      <Text style={[styles.historyCardPreview, { color: theme.subtext }]}>
                        Try a different keyword from the conversation itself.
                      </Text>
                    </View>
                  ) : (
                    <View style={[styles.drawerEmptyState, { backgroundColor: theme.primaryLight, borderColor: theme.border }]}>
                      <Text style={[styles.historyCardTitle, { color: theme.text }]}>No previous chats yet</Text>
                      <Text style={[styles.historyCardPreview, { color: theme.subtext }]}>
                        Your conversations will appear here after you start chatting.
                      </Text>
                    </View>
                  )}
                </ScrollView>
              </SafeAreaView>
            </View>
          </View>
        )}

        {undoDeleteState && (
          <View style={styles.undoToastWrapper} pointerEvents="box-none">
            <View
              style={[
                styles.undoToast,
                {
                  backgroundColor: isDark ? "rgba(10, 15, 15, 0.96)" : theme.text,
                  shadowColor: theme.shadow,
                },
              ]}
            >
              <Text
                style={[
                  styles.undoToastText,
                  { color: theme.textOnPrimary },
                  largerText && styles.largerLoadingText,
                ]}
              >
                Deleted
              </Text>
              <TouchableOpacity
                style={styles.undoToastAction}
                onPress={handleUndoDelete}
                accessibilityLabel="Undo delete"
                accessibilityRole="button"
                accessibilityHint="Restores the deleted chat"
              >
                <Ionicons name="arrow-undo" size={12} color={theme.primaryLight} />
                <Text style={[styles.undoToastActionText, { color: theme.primaryLight }]}>
                  Undo
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {!undoDeleteState && !!toastMessage && (
          <View style={styles.undoToastWrapper} pointerEvents="box-none">
            <View
              style={[
                styles.undoToast,
                {
                  backgroundColor: isDark ? "rgba(10, 15, 15, 0.96)" : theme.text,
                  shadowColor: theme.shadow,
                },
              ]}
            >
              <Text
                style={[
                  styles.undoToastText,
                  { color: theme.textOnPrimary },
                  largerText && styles.largerLoadingText,
                ]}
              >
                {toastMessage}
              </Text>
            </View>
          </View>
        )}
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
  drawerOverlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    zIndex: 30,
  },
  drawerScrim: {
    flex: 1,
    backgroundColor: "rgba(44, 62, 61, 0.34)",
  },
  drawerPanel: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: "82%",
    maxWidth: 340,
    borderRightWidth: 1,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 8,
  },
  drawerSafeArea: {
    flex: 1,
  },
  drawerHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  drawerHeaderText: {
    flex: 1,
  },
  drawerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  drawerSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  drawerCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
  },
  drawerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  drawerActionBtn: {
    flex: 1,
    justifyContent: "center",
  },
  drawerRefreshBtn: {
    minWidth: 100,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  drawerRefreshText: {
    fontSize: 13,
    fontWeight: "600",
  },
  drawerSearchWrap: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  drawerSearchInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  drawerSearchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  drawerList: {
    flex: 1,
  },
  drawerListContent: {
    padding: 16,
    gap: 10,
  },
  historySection: {
    gap: 10,
  },
  historySectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  historyGroup: {
    gap: 8,
  },
  historyGroupTitle: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  drawerSessionTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  drawerSessionActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 0,
  },
  drawerSessionCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
  },
  drawerSessionTitle: {
    flex: 1,
  },
  deleteChatBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  renameSessionBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  renameRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  renameInput: {
    flex: 1,
    minHeight: 38,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
  },
  renameActionBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
  },
  drawerEmptyState: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  largerHistoryTitle: {
    fontSize: 18,
  },
  historyCardTitle: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 6,
  },
  largerHistoryCardTitle: {
    fontSize: 16,
  },
  historyCardPreview: {
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
  largerHistoryCardPreview: {
    fontSize: 14,
    lineHeight: 20,
  },
  historyCardMeta: {
    fontSize: 11,
    marginTop: 8,
    fontWeight: "500",
  },
  newChatBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
  },
  newChatBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },
  undoToastWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 18,
    paddingHorizontal: 16,
    alignItems: "center",
    zIndex: 40,
  },
  undoToast: {
    width: "100%",
    maxWidth: 232,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 6,
  },
  undoToastText: {
    fontSize: 12,
    fontWeight: "600",
  },
  undoToastAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginLeft: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  undoToastActionText: {
    fontSize: 12,
    fontWeight: "700",
  },

  // ── Background & overlay ─────────────────────────────────────
  background: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlayBg,
  },

  // ── Chat list ─────────────────────────────────────────────────
  messagesList: {
    flex: 1,
  },
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
  messageMetaRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  messageTimestamp: {
    fontSize: 11,
    fontWeight: "500",
  },
  messageActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  messageActionBtn: {
    width: 24,
    height: 24,
    borderRadius: RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
  },

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
  scrollToBottomWrapper: {
    position: "absolute",
    right: 16,
    bottom: 84,
    zIndex: 20,
  },
  scrollToBottomBtn: {
    width: 42,
    height: 42,
    borderRadius: RADIUS.full,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 5,
  },
  suggestionsWrap: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 10,
  },
  suggestionsTitle: {
    fontSize: 12,
    fontWeight: "600",
  },
  suggestionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  suggestionChip: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    maxWidth: "100%",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  suggestionChipText: {
    fontSize: 13,
    fontWeight: "600",
  },

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
