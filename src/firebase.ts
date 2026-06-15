import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile
} from 'firebase/auth';

import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDXvkEJ-BLPbjo35z_VT7IyA82uoBoZzk0",
  authDomain: "duellio-game.firebaseapp.com",
  projectId: "duellio-game",
  storageBucket: "duellio-game.firebasestorage.app",
  messagingSenderId: "823314080269",
  appId: "1:823314080269:web:e309748d601d2feb0aab44"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile
};
