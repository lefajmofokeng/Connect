import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDX-5ECZCYsLt2mJcGqz-zGE2tmWVkD4AU",
  authDomain: "jobs-42a5d.firebaseapp.com",
  projectId: "jobs-42a5d",
  storageBucket: "jobs-42a5d.firebasestorage.app",
  messagingSenderId: "39630535466",
  appId: "1:39630535466:web:827d2a210006b5a7013c53"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);