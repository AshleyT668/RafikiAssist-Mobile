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
import { chatWithRafiki } from "../services/chatService";
import { useAccessibility } from "../context/AccessibilityContext";

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

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Keyboard handlers
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardOffset(e.endCoordinates.height);
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardOffset(0);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

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
          botText =
            "I understand this is challenging. I'm here to listen and support you.";
        }
      } else {
        botText = getFallbackResponse(input.trim());
      }

      const botMessage = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: botText,
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.log("Chat error:", error);
      const botMessage = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: getFallbackResponse(input.trim()),
      };
      setMessages((prev) => [...prev, botMessage]);
    } finally {
      setLoading(false);
    }
  };

  const getFallbackResponse = (userMessage) => {
    const lower = userMessage.toLowerCase();
    if (lower.includes("hello") || lower.includes("hi")) {
      return "Jambo! I'm Rafiki. How are you feeling today?";
    } else if (lower.includes("help")) {
      return "I'm here to listen and offer support. You can share your challenges, feelings, or ask for coping strategies.";
    } else if (lower.includes("tired") || lower.includes("exhausted")) {
      return "I hear you're feeling tired. Caregiving is demanding work. Remember to be gentle with yourself today.";
    } else if (lower.includes("frustrated") || lower.includes("angry")) {
      return "Your feelings are completely valid. It's okay to feel frustrated. Would you like to talk about what's bothering you?";
    } else if (lower.includes("meltdown") || lower.includes("screaming")) {
      return "That sounds really tough. First, ensure safety. Try to stay calm and use simple words. This will pass.";
    } else if (lower.includes("overwhelmed")) {
      return "I hear you're feeling overwhelmed. That's completely valid. Would taking some deep breaths together help right now?";
    } else {
      return "Thank you for sharing with me. I'm here to listen and support you. Could you tell me more about what you're experiencing?";
    }
  };

  const renderItem = ({ item }) => (
    <View
      style={[
        styles.messageContainer,
        item.sender === "user" ? styles.userMsg : styles.botMsg,
        highContrast && styles.highContrastBorder
      ]}
      accessible={true}
      accessibilityLabel={`${item.sender === 'user' ? 'You said' : 'Rafiki said'}: ${item.text}`}
      accessibilityRole="text"
    >
      <Text
        style={[
          styles.messageText,
          item.sender === "bot" ? { color: "#333" } : { color: "#fff" },
          largerText && styles.largerMessageText
        ]}
      >
        {item.text}
      </Text>
    </View>
  );

  const dismissKeyboard = () => {
    Keyboard.dismiss();
  };

  return (
    <TouchableWithoutFeedback onPress={dismissKeyboard}>
      <View style={styles.container}>
        {/* Teal Header - Fixed to cover status bar area */}
        <View style={[styles.header, { backgroundColor: '#009688' }]}>
          <StatusBar
            translucent
            backgroundColor="#009688"
            barStyle="light-content"
          />
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.headerContent}>
              <TouchableOpacity 
                style={[
                  styles.headerBack,
                  highContrast && styles.highContrastBorder
                ]} 
                onPress={() => {
                  if (navigation.canGoBack()) {
                    navigation.goBack();
                  } else {
                    navigation.navigate("Home");
                  }
                }}
                accessibilityLabel="Go back"
                accessibilityRole="button"
                accessibilityHint="Returns to previous screen"
              >
                <Ionicons name="arrow-back" size={22} color="#fff" />
              </TouchableOpacity>
              <Text style={[
                styles.headerTitle,
                largerText && styles.largerHeaderTitle
              ]}>
                Rafiki Chatbot
              </Text>
              <View style={styles.headerPlaceholder} />
            </View>
          </SafeAreaView>
        </View>

        {/* Background Image - Now starts below the header */}
        <ImageBackground
          source={require("../assets/rafiki_background.png")}
          style={styles.background}
          resizeMode="cover"
        >
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
          >
            {/* Chat messages */}
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={[
                styles.chatContainer,
                { paddingBottom: keyboardOffset > 0 ? 20 : 16 }
              ]}
              showsVerticalScrollIndicator={false}
              accessibilityLabel="Chat conversation with Rafiki"
              accessibilityRole="list"
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />

            {/* Loading indicator */}
            {loading && (
              <View 
                style={styles.loadingContainer}
                accessible={true}
                accessibilityLabel="Rafiki is thinking"
                accessibilityRole="status"
              >
                <ActivityIndicator size="small" color="#3da49a" />
                <Text style={[
                  styles.loadingText,
                  largerText && styles.largerLoadingText
                ]}>
                  Rafiki is thinking...
                </Text>
              </View>
            )}

            {/* Input field with dynamic bottom padding */}
            <View style={[
              styles.inputContainer,
              { marginBottom: keyboardOffset > 0 ? (Platform.OS === 'ios' ? keyboardOffset - 35 : 10) : 0 }
            ]}>
              <TextInput
                ref={inputRef}
                style={[
                  styles.input,
                  largerText && styles.largerInputText,
                  highContrast && styles.highContrastInputBorder
                ]}
                value={input}
                onChangeText={setInput}
                placeholder="Share what's on your mind..."
                placeholderTextColor="#666"
                onSubmitEditing={sendMessage}
                returnKeyType="send"
                editable={!loading}
                multiline
                accessibilityLabel="Type your message"
                accessibilityHint="Enter your message to chat with Rafiki"
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!input.trim() || loading) && styles.sendButtonDisabled,
                  highContrast && styles.highContrastBorder
                ]}
                onPress={sendMessage}
                disabled={!input.trim() || loading}
                accessibilityLabel={loading ? "Sending message" : "Send message"}
                accessibilityRole="button"
                accessibilityHint={loading ? "Message is being sent" : "Sends your message to Rafiki"}
                accessibilityState={{ disabled: !input.trim() || loading }}
              >
                <Text style={[
                  styles.sendButtonText,
                  largerText && styles.largerButtonText
                ]}>
                  {loading ? "..." : "Send"}
                </Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </ImageBackground>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  header: {
    // Header now covers status bar area
  },
  safeArea: {
    // Safe area for notch devices
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 8 : 16,
    paddingBottom: 20,
  },
  headerBack: { 
    padding: 8 
  },
  headerTitle: { 
    color: "#fff", 
    fontSize: 18, 
    fontWeight: "700" 
  },
  headerPlaceholder: { 
    width: 40 
  },
  background: {
    flex: 1,
  },
  chatContainer: {
    padding: 16,
    flexGrow: 1,
    paddingBottom: 16,
  },
  messageContainer: {
    marginVertical: 6,
    padding: 16,
    borderRadius: 20,
    maxWidth: "75%",
  },
  userMsg: {
    backgroundColor: "#3da49a",
    alignSelf: "flex-end",
  },
  botMsg: {
    backgroundColor: "#e0e0e0",
    alignSelf: "flex-start",
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
  inputContainer: {
    flexDirection: "row",
    padding: 12,
    borderTopWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 25,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: "#fff",
    maxHeight: 100,
    paddingVertical: 10,
  },
  sendButton: {
    marginLeft: 8,
    backgroundColor: "#3da49a",
    borderRadius: 25,
    justifyContent: "center",
    paddingHorizontal: 20,
    height: 45,
    minWidth: 60,
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#cccccc",
  },
  sendButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },

  // Accessibility Styles
  highContrastBorder: {
    borderWidth: 2,
    borderColor: '#FF0000',
  },
  highContrastInputBorder: {
    borderWidth: 2,
    borderColor: '#FF0000',
  },
  largerHeaderTitle: {
    fontSize: 20,
  },
  largerMessageText: {
    fontSize: 17,
    lineHeight: 22,
  },
  largerLoadingText: {
    fontSize: 16,
  },
  largerInputText: {
    fontSize: 18,
  },
  largerButtonText: {
    fontSize: 18,
  },
});