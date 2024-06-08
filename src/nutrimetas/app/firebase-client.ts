import firebase, { ReactNativeFirebase } from "@react-native-firebase/app";

const FIREBASE_APP_NAME = "nutrimetas";

let firebaseApp: ReactNativeFirebase.FirebaseApp | undefined;

export const getFirebaseClient =
  async (): Promise<ReactNativeFirebase.FirebaseApp> => {
    if (firebaseApp) {
      return firebaseApp;
    }

    const firebaseClientFound = firebase.apps.find(
      (app) => app.name === FIREBASE_APP_NAME
    );
    if (firebaseClientFound) {
      return firebaseClientFound;
    }

    return firebase.initializeApp(
      {
        appId: process.env.EXPO_PUBLIC_APP_ID ?? "",
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID ?? "",
        databaseURL: "-",
        apiKey: "-",
        messagingSenderId: "-",
        storageBucket: "-",
      },
      { name: FIREBASE_APP_NAME }
    );
  };