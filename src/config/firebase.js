import {
  initializeApp
} from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  query,
  setDoc,
  where
} from 'firebase/firestore';
import { toast } from "react-toastify";

const firebaseConfig = {
  apiKey: "AIzaSyBounTTpSO8FxSrKV6YKLlTja3SvwFL8ao",
  authDomain: "chat-app-74077.firebaseapp.com",
  projectId: "chat-app-74077",
  storageBucket: "chat-app-74077.appspot.com",
  messagingSenderId: "776660767529",
  appId: "1:776660767529:web:4243ea29c28e1f70875d38"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

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
    signOut(auth); // Force signout until they verify

  } catch (error) {
    console.error(error);
    toast.error(error.code.split('/')[1].split('-').join(" "));
  }
};

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

const logout = () => {
  signOut(auth);
};

const resetPass = async (email) => {
  if (!email) {
    toast.error("Enter your email");
    return null;
  }
  try {
    const userRef = collection(db, "users");
    const q = query(userRef, where("email", "==", email));
    const querySnap = await getDocs(q);
    if (!querySnap.empty) {
      await sendPasswordResetEmail(auth, email);
      toast.success("Reset Email Sent");
    } else {
      toast.error("Email doesn't exist");
    }
  } catch (error) {
    toast.error(error.message);
  }
};

export { auth, db, login, signup, logout, resetPass };
