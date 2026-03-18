import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import Constants from "expo-constants";
import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { auth } from "../firebaseConfig";
import { ensureUserProfile } from "./userService";

WebBrowser.maybeCompleteAuthSession();

export const googleDiscovery = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
  revocationEndpoint: "https://oauth2.googleapis.com/revoke",
};

export const getGoogleAuthConfig = () => {
  const extra = Constants.expoConfig?.extra || {};
  const config = extra.googleAuth || {};

  return {
    expoClientId: config.expoClientId || "",
    androidClientId: config.androidClientId || "",
    iosClientId: config.iosClientId || "",
    webClientId: config.webClientId || "",
  };
};

export const getGoogleRedirectUri = () =>
  AuthSession.makeRedirectUri({
    scheme: "rafiki",
    path: "oauthredirect",
  });

export const hasGoogleAuthConfig = () => {
  const config = getGoogleAuthConfig();
  return Boolean(
    config.expoClientId ||
      config.androidClientId ||
      config.iosClientId ||
      config.webClientId
  );
};

export const createGoogleAuthRequestConfig = () => ({
  ...getGoogleAuthConfig(),
  redirectUri: getGoogleRedirectUri(),
  responseType: AuthSession.ResponseType.IdToken,
  scopes: ["openid", "profile", "email"],
  selectAccount: true,
});

export const promptGoogleSignIn = async (promptAsync) => {
  if (!promptAsync) {
    throw new Error("Google sign-in is not ready yet. Please try again.");
  }

  const result = await promptAsync();
  if (result.type !== "success") {
    if (result.type === "dismiss" || result.type === "cancel") {
      return null;
    }

    throw new Error("Google sign-in was not completed.");
  }

  const idToken = result.params?.id_token;
  if (!idToken) {
    throw new Error("Google sign-in did not return an ID token.");
  }

  const credential = GoogleAuthProvider.credential(idToken);
  const userCredential = await signInWithCredential(auth, credential);
  await ensureUserProfile(userCredential.user, { authProvider: "google" });

  return userCredential.user;
};
