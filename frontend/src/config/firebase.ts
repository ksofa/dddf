import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDseHIGOCQSRKOoYAJmuXTt6sV3OTV6YdQ",
  authDomain: "taska-4fee2.firebaseapp.com",
  projectId: "taska-4fee2",
  storageBucket: "taska-4fee2.firebasestorage.app",
  messagingSenderId: "461235597833",
  appId: "1:461235597833:web:116dbd608558f004adfed8",
  measurementId: "G-WJCZ738RCB"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const analytics = getAnalytics(app); 