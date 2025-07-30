import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail
} from "firebase/auth";

import {
  getFirestore,
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  where
} from "firebase/firestore";

import { toast } from "react-toastify";

// ✅ Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBounTTpSO8FxSrKV6YKLlTja3SvwFL8ao",
  authDomain: "chat-app-74077.firebaseapp.com",
  projectId: "chat-app-74077",
  storageBucket: "chat-app-74077.firebasestorage.app",
  messagingSenderId: "776660767529",
  appId: "1:776660767529:web:4243ea29c28e1f70875d38"
};

// ✅ Initialize Firebase services
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ✅ Signup function with email verification
const signup = async (username, email, password) => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where("username", "==", username.toLowerCase()));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      toast.error("Username already taken");
      return;
    }

    const res = await createUserWithEmailAndPassword(auth, email, password);
    const user = res.user;

    await sendEmailVerification(user);
    toast.success("Verification email sent. Please verify before logging in.");

    await setDoc(doc(db, "users", user.uid), {
      id: user.uid,
      username: username.toLowerCase(),
      email,
      name: "",
      avatar: "",
      bio: "Hey, There I am using chat app",
      lastSeen: Date.now()
    });

    await setDoc(doc(db, "chats", user.uid), { chatsData: [] });

    // Force sign out after signup until verified
    await signOut(auth);
  } catch (error) {
    console.error(error);
    toast.error(error.code.split('/')[1].split('-').join(" "));
  }
};

// ✅ Login function with email verification check
const login = async (email, password) => {
  try {
    const res = await signInWithEmailAndPassword(auth, email, password);
    if (!res.user.emailVerified) {
      toast.warn("Please verify your email before logging in.");
      await signOut(auth);
      return;
    }
  } catch (error) {
    console.error(error);
    toast.error(error.code.split('/')[1].split('-').join(" "));
  }
};

// ✅ Logout function
const logout = () => {
  signOut(auth);
};

// ✅ Reset password using Firebase-hosted page
const resetPass = async (email) => {
  if (!email) {
    toast.error("Enter your email");
    return;
  }

  try {
    await sendPasswordResetEmail(auth, email);
    toast.success("Password reset email sent. Check your inbox.");
  } catch (error) {
    toast.error(error.message);
  }
};

// ✅ Export Firebase services and functions
export { auth, db, signup, login, logout, resetPass };
