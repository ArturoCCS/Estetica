import "dotenv/config";

/** @type {import('expo/config').ExpoConfig} */
export default () => {
  console.log("USING app.config.js", {
    hasApiKey: !!process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  });

  return {
    name: "Estetica App",
    slug: "estetica-app",
    scheme: "estetica",

    version: "1.0.0",
    orientation: "portrait",

    icon: "./assets/images/icono.jpeg",

    userInterfaceStyle: "light",

    splash: {
      image: "./assets/images/EsteticaInit2.jpeg",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },

    assetBundlePatterns: ["**/*"],

    ios: {
      supportsTablet: true,
    },

    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/icono.jpeg",
        backgroundColor: "#ffffff",
      },
    },

    web: {
      bundler: "metro",
      output: "single",
      favicon: "./assets/images/icono.jpeg",
    },

    extra: {
      firebase: {
        apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId:
          process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ??
          process.env.EXO_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId:
          process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
      },
      adminEmails: process.env.EXPO_PUBLIC_ADMIN_EMAILS?.split(","),
    },
  };
};
