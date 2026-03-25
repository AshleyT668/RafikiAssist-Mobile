import Constants from "expo-constants";

const extraConfig =
  Constants.expoConfig?.extra ||
  Constants.manifest2?.extra ||
  Constants.manifest?.extra ||
  {};
const rafikiApiConfig = extraConfig.rafikiApi || {};

const RAFIKI_API_BASE_URL =
  rafikiApiConfig.baseUrl || "https://bright-worms-look.loca.lt";
const RAFIKI_CHAT_ENDPOINT = rafikiApiConfig.chatPath || "/chat";
const RAFIKI_HEALTH_ENDPOINT = rafikiApiConfig.healthPath || "/health";

const JSON_HEADERS = {
  "Content-Type": "application/json",
};

const COOKIE_CHECK_PATTERN = /cookie check|action required to load your app/i;
const PLACEHOLDER_URL_PATTERN = /your-colab-flask-url|example\.com/i;

const mapHistoryItem = (item) => {
  if (!item) return null;

  const role = item.role === "model" ? "model" : "user";
  const text = typeof item.text === "string" ? item.text.trim() : "";

  if (!text) return null;

  return { role, text };
};

const joinUrl = (baseUrl, path) => {
  const safeBaseUrl = String(baseUrl || "").replace(/\/+$/, "");
  const safePath = String(path || "").startsWith("/") ? path : `/${path}`;
  return `${safeBaseUrl}${safePath}`;
};

const isJsonResponse = (contentType, rawBody) =>
  contentType.includes("application/json") ||
  rawBody.trim().startsWith("{") ||
  rawBody.trim().startsWith("[");

const extractChatResponse = (data) => {
  const candidates = [
    data?.response,
    data?.reply,
    data?.answer,
    data?.message,
    data?.text,
  ];

  const matchedValue = candidates.find(
    (candidate) => typeof candidate === "string" && candidate.trim()
  );

  return matchedValue ? matchedValue.trim() : "";
};

const buildBackendUnavailableMessage = (rawBody = "") => {
  if (COOKIE_CHECK_PATTERN.test(rawBody)) {
    return "Rafiki API is returning a browser cookie-check page instead of JSON. Update app.json with your public Flask API URL.";
  }

  return "Rafiki API did not return valid JSON. Check your Flask base URL and route paths in app.json.";
};

const getConfiguredBaseUrl = () => String(RAFIKI_API_BASE_URL || "").trim();

const ensureApiConfig = () => {
  const baseUrl = getConfiguredBaseUrl();

  if (!baseUrl || PLACEHOLDER_URL_PATTERN.test(baseUrl)) {
    throw new Error(
      "Rafiki API base URL is still using a placeholder. Set expo.extra.rafikiApi.baseUrl in app.json to your public Colab Flask URL."
    );
  }

  return baseUrl;
};

const buildNetworkFailureMessage = (requestUrl) =>
  `Cannot reach Rafiki API at ${requestUrl}. Make sure your Colab Flask server is running, publicly reachable over HTTPS, and the base URL in app.json is correct.`;

export const chatWithRafiki = async (message, history = []) => {
  try {
    const baseUrl = ensureApiConfig();
    const requestUrl = joinUrl(baseUrl, RAFIKI_CHAT_ENDPOINT);
    const response = await fetch(requestUrl, {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify({
        message,
        history: history.map(mapHistoryItem).filter(Boolean),
      }),
    });
    const rawBody = await response.text();
    const contentType = response.headers.get("content-type") || "";

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${rawBody || "Request failed"}`);
    }

    if (!isJsonResponse(contentType, rawBody)) {
      throw new Error(buildBackendUnavailableMessage(rawBody));
    }

    const data = JSON.parse(rawBody);
    const parsedResponse = extractChatResponse(data);

    if (!parsedResponse) {
      throw new Error(
        "Flask API returned JSON, but no supported response field was found. Expected one of: response, reply, answer, message, text."
      );
    }

    return {
      success: true,
      response: parsedResponse,
    };
  } catch (error) {
    const baseUrl = getConfiguredBaseUrl();
    const requestUrl = joinUrl(baseUrl, RAFIKI_CHAT_ENDPOINT);
    const isNetworkFailure =
      error?.message === "Network request failed" ||
      error?.name === "TypeError";
    const resolvedErrorMessage = isNetworkFailure
      ? buildNetworkFailureMessage(requestUrl)
      : error.message;

    console.error("Rafiki API connection error:", resolvedErrorMessage);

    return {
      success: false,
      response: null,
      error: resolvedErrorMessage,
    };
  }
};

export const testConnection = async () => {
  try {
    const baseUrl = ensureApiConfig();
    const requestUrl = joinUrl(baseUrl, RAFIKI_HEALTH_ENDPOINT);
    const response = await fetch(requestUrl);
    const rawBody = await response.text();
    const contentType = response.headers.get("content-type") || "";

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${rawBody || "Request failed"}`);
    }

    if (!isJsonResponse(contentType, rawBody)) {
      throw new Error(buildBackendUnavailableMessage(rawBody));
    }

    return JSON.parse(rawBody);
  } catch (error) {
    const baseUrl = getConfiguredBaseUrl();
    const requestUrl = joinUrl(baseUrl, RAFIKI_HEALTH_ENDPOINT);
    const isNetworkFailure =
      error?.message === "Network request failed" ||
      error?.name === "TypeError";

    return {
      status: "error",
      error: isNetworkFailure
        ? buildNetworkFailureMessage(requestUrl)
        : error.message || "Cannot connect to Rafiki API.",
    };
  }
};
