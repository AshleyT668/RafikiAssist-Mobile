import { auth, db } from "../firebaseConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
} from "firebase/firestore";

const CHAT_SESSIONS_SUBCOLLECTION = "chatSessions";
const MAX_TITLE_LENGTH = 48;
const MAX_PREVIEW_LENGTH = 80;
const LOCAL_CHAT_HISTORY_KEY = (userId) => `chatHistory:${userId}`;
const TITLE_STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "can",
  "for",
  "help",
  "hey",
  "hi",
  "how",
  "i",
  "im",
  "is",
  "me",
  "my",
  "please",
  "the",
  "this",
  "to",
  "today",
  "with",
  "you",
]);

function getCurrentUser(user = auth.currentUser) {
  if (!user?.uid) {
    throw new Error("No authenticated user");
  }

  return user;
}

function getChatSessionsCollection(userId) {
  return collection(db, "users", userId, CHAT_SESSIONS_SUBCOLLECTION);
}

function trimText(value, maxLength) {
  const text = typeof value === "string" ? value.trim() : "";

  if (!text) {
    return "";
  }

  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 1).trimEnd()}...`;
}

function normalizeMessages(messages = []) {
  return messages
    .map((message, index) => {
      const text = typeof message?.text === "string" ? message.text.trim() : "";
      const sender = message?.sender === "user" ? "user" : "bot";

      if (!text) {
        return null;
      }

      return {
        id: message?.id || `${sender}-${index}-${Date.now()}`,
        sender,
        text,
        timestampMs:
          typeof message?.timestampMs === "number"
            ? message.timestampMs
            : Date.now() + index,
      };
    })
    .filter(Boolean);
}

function buildSessionSummary(sessionId, data = {}) {
  return {
    id: sessionId,
    title: data.customTitle || data.title || "Untitled chat",
    customTitle: data.customTitle || "",
    preview: data.preview || "Open chat",
    createdAtMs: data.createdAtMs || 0,
    updatedAtMs: data.updatedAtMs || 0,
    pinnedAtMs: data.pinnedAtMs || 0,
    archivedAtMs: data.archivedAtMs || 0,
    messageCount: data.messageCount || 0,
    messages: Array.isArray(data.messages) ? data.messages : [],
  };
}

function sortSessions(sessions = []) {
  return [...sessions].sort((a, b) => {
    const pinDiff = (b.pinnedAtMs || 0) - (a.pinnedAtMs || 0);

    if (pinDiff !== 0) {
      return pinDiff;
    }

    return (b.updatedAtMs || 0) - (a.updatedAtMs || 0);
  });
}

function toTitleCase(text) {
  return text.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function generateSessionTitle(messages = []) {
  const firstUserMessage =
    messages.find((message) => message.sender === "user")?.text ||
    messages[0]?.text ||
    "Untitled chat";

  const normalized = firstUserMessage
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const meaningfulWords = normalized
    .split(" ")
    .filter(Boolean)
    .filter((word) => !TITLE_STOP_WORDS.has(word))
    .slice(0, 4);

  if (meaningfulWords.length) {
    return trimText(toTitleCase(meaningfulWords.join(" ")), MAX_TITLE_LENGTH);
  }

  return trimText(toTitleCase(firstUserMessage), MAX_TITLE_LENGTH);
}

function buildSessionMetadata(messages) {
  const firstUserMessage =
    messages.find((message) => message.sender === "user")?.text ||
    messages[0]?.text ||
    "Untitled chat";
  const lastMessage = messages[messages.length - 1]?.text || firstUserMessage;

  return {
    title: generateSessionTitle(messages),
    preview: trimText(lastMessage, MAX_PREVIEW_LENGTH),
  };
}

async function readLocalChatSessions(userId) {
  try {
    const rawValue = await AsyncStorage.getItem(LOCAL_CHAT_HISTORY_KEY(userId));

    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue);
    const sessions = Array.isArray(parsedValue) ? parsedValue : [];

    return sessions
      .map((session) => buildSessionSummary(session.id, session))
      .sort((a, b) => {
        const pinDiff = (b.pinnedAtMs || 0) - (a.pinnedAtMs || 0);
        if (pinDiff !== 0) return pinDiff;
        return (b.updatedAtMs || 0) - (a.updatedAtMs || 0);
      });
  } catch (error) {
    console.log("Failed to read local chat history:", error);
    return [];
  }
}

async function writeLocalChatSessions(userId, sessions) {
  await AsyncStorage.setItem(
    LOCAL_CHAT_HISTORY_KEY(userId),
    JSON.stringify(sessions)
  );
}

async function upsertLocalChatSession(userId, session) {
  const existingSessions = await readLocalChatSessions(userId);
  const nextSessions = sortSessions([
    session,
    ...existingSessions.filter((existingSession) => existingSession.id !== session.id),
  ]);

  await writeLocalChatSessions(userId, nextSessions);
}

async function removeLocalChatSession(userId, sessionId) {
  const existingSessions = await readLocalChatSessions(userId);
  const nextSessions = existingSessions.filter((session) => session.id !== sessionId);
  await writeLocalChatSessions(userId, nextSessions);
}

export async function listChatSessions(user = auth.currentUser) {
  const currentUser = getCurrentUser(user);

  try {
    const chatSessionsQuery = query(
      getChatSessionsCollection(currentUser.uid),
      orderBy("updatedAtMs", "desc")
    );
    const snapshot = await getDocs(chatSessionsQuery);
    const sessions = snapshot.docs.map((chatDoc) =>
      buildSessionSummary(chatDoc.id, chatDoc.data())
    );

    await writeLocalChatSessions(currentUser.uid, sessions);
    return sessions;
  } catch (error) {
    console.log("Falling back to local chat history:", error);
    return await readLocalChatSessions(currentUser.uid);
  }
}

export async function saveChatSession({
  sessionId,
  messages,
  user = auth.currentUser,
}) {
  const currentUser = getCurrentUser(user);
  const normalizedMessages = normalizeMessages(messages);

  if (!normalizedMessages.length) {
    throw new Error("Cannot save an empty chat session");
  }

  const now = Date.now();
  const metadata = buildSessionMetadata(normalizedMessages);
  const chatSessionRef = sessionId
    ? doc(db, "users", currentUser.uid, CHAT_SESSIONS_SUBCOLLECTION, sessionId)
    : doc(getChatSessionsCollection(currentUser.uid));
  const existingChatSession = sessionId ? await getDoc(chatSessionRef) : null;
  const createdAtMs =
    existingChatSession?.exists() && existingChatSession.data()?.createdAtMs
      ? existingChatSession.data().createdAtMs
      : now;

  const payload = {
    userId: currentUser.uid,
    title: metadata.title,
    customTitle: existingChatSession?.data()?.customTitle || "",
    preview: metadata.preview,
    messageCount: normalizedMessages.length,
    messages: normalizedMessages,
    pinnedAtMs: existingChatSession?.data()?.pinnedAtMs || 0,
    archivedAtMs: existingChatSession?.data()?.archivedAtMs || 0,
    updatedAtMs: now,
    createdAtMs,
  };

  const savedSession = buildSessionSummary(chatSessionRef.id, payload);

  try {
    await setDoc(chatSessionRef, payload, { merge: true });
    await upsertLocalChatSession(currentUser.uid, savedSession);
    return savedSession;
  } catch (error) {
    console.log("Falling back to local chat save:", error);
    await upsertLocalChatSession(currentUser.uid, savedSession);
    return savedSession;
  }
}

export async function deleteChatSession(sessionId, user = auth.currentUser) {
  const currentUser = getCurrentUser(user);

  if (!sessionId) {
    throw new Error("A chat session ID is required");
  }

  const chatSessionRef = doc(
    db,
    "users",
    currentUser.uid,
    CHAT_SESSIONS_SUBCOLLECTION,
    sessionId
  );

  try {
    await deleteDoc(chatSessionRef);
  } catch (error) {
    console.log("Falling back to local chat delete:", error);
  }

  await removeLocalChatSession(currentUser.uid, sessionId);
  return true;
}

export async function renameChatSession(
  sessionId,
  title,
  user = auth.currentUser
) {
  const currentUser = getCurrentUser(user);
  const nextTitle = trimText(title, MAX_TITLE_LENGTH);

  if (!sessionId) {
    throw new Error("A chat session ID is required");
  }

  if (!nextTitle) {
    throw new Error("A chat title is required");
  }

  const existingSessions = await readLocalChatSessions(currentUser.uid);
  const existingSession = existingSessions.find((session) => session.id === sessionId);

  if (!existingSession) {
    throw new Error("Chat session not found");
  }

  const updatedSession = {
    ...existingSession,
    title: nextTitle,
    customTitle: nextTitle,
  };

  const chatSessionRef = doc(
    db,
    "users",
    currentUser.uid,
    CHAT_SESSIONS_SUBCOLLECTION,
    sessionId
  );

  try {
    await setDoc(
      chatSessionRef,
      {
        customTitle: nextTitle,
      },
      { merge: true }
    );
  } catch (error) {
    console.log("Falling back to local chat rename:", error);
  }

  await upsertLocalChatSession(currentUser.uid, updatedSession);
  return updatedSession;
}

export async function pinChatSession(
  sessionId,
  pinned,
  user = auth.currentUser
) {
  const currentUser = getCurrentUser(user);

  if (!sessionId) {
    throw new Error("A chat session ID is required");
  }

  const existingSessions = await readLocalChatSessions(currentUser.uid);
  const existingSession = existingSessions.find((session) => session.id === sessionId);

  if (!existingSession) {
    throw new Error("Chat session not found");
  }

  const updatedSession = {
    ...existingSession,
    pinnedAtMs: pinned ? Date.now() : 0,
  };

  const chatSessionRef = doc(
    db,
    "users",
    currentUser.uid,
    CHAT_SESSIONS_SUBCOLLECTION,
    sessionId
  );

  try {
    await setDoc(
      chatSessionRef,
      {
        pinnedAtMs: updatedSession.pinnedAtMs,
      },
      { merge: true }
    );
  } catch (error) {
    console.log("Falling back to local chat pin update:", error);
  }

  await upsertLocalChatSession(currentUser.uid, updatedSession);
  return updatedSession;
}

export async function archiveChatSession(
  sessionId,
  archived,
  user = auth.currentUser
) {
  const currentUser = getCurrentUser(user);

  if (!sessionId) {
    throw new Error("A chat session ID is required");
  }

  const existingSessions = await readLocalChatSessions(currentUser.uid);
  const existingSession = existingSessions.find((session) => session.id === sessionId);

  if (!existingSession) {
    throw new Error("Chat session not found");
  }

  const updatedSession = {
    ...existingSession,
    archivedAtMs: archived ? Date.now() : 0,
  };

  const chatSessionRef = doc(
    db,
    "users",
    currentUser.uid,
    CHAT_SESSIONS_SUBCOLLECTION,
    sessionId
  );

  try {
    await setDoc(
      chatSessionRef,
      {
        archivedAtMs: updatedSession.archivedAtMs,
      },
      { merge: true }
    );
  } catch (error) {
    console.log("Falling back to local chat archive update:", error);
  }

  await upsertLocalChatSession(currentUser.uid, updatedSession);
  return updatedSession;
}
