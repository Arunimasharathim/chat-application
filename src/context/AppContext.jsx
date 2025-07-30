// src/context/AppContext.jsx
import { createContext, useEffect, useState } from "react";
import { auth, db } from "../config/firebase";
import {
  doc,
  getDoc,
  onSnapshot,
  updateDoc,
  collection,
  getDocs,
} from "firebase/firestore";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";

export const AppContext = createContext();

const AppContextProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const [chatData, setChatData] = useState([]);
  const [messagesId, setMessagesId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatUser, setChatUser] = useState(null);
  const [chatVisible, setChatVisible] = useState(false);
  const [rightSidebarVisible, setRightSidebarVisible] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [background, setBackground] = useState(
    localStorage.getItem("background") || ""
  );

  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("background", background);
  }, [background]);

  const resetChatState = () => {
    setMessages([]);
    setMessagesId(null);
    setChatUser(null);
    setChatVisible(false);
    setRightSidebarVisible(true);
  };

  const loadUserData = async (uid, retryCount = 3) => {
    try {
      resetChatState();
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        if (retryCount > 0) {
          setTimeout(() => loadUserData(uid, retryCount - 1), 500);
        } else {
          toast.error("User data not found");
        }
        return;
      }

      const uData = userSnap.data();
      setUserData(uData);

      if (uData.avatar && uData.name) {
        navigate("/chat");
      } else {
        navigate("/profile");
      }

      await updateDoc(userRef, { lastSeen: Date.now() });

      setInterval(async () => {
        if (auth.currentUser) {
          await updateDoc(userRef, { lastSeen: Date.now() });
        }
      }, 60000);
    } catch (err) {
      toast.error(err.message);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        loadUserData(user.uid);
      } else {
        setUserData(null);
        resetChatState();
        navigate("/");
      }
    });

    return () => unsubscribe();
  }, []);

  // 🔄 Chat sync
  useEffect(() => {
    if (userData) {
      const chatRef = doc(db, "chats", userData.id);
      const unSub = onSnapshot(chatRef, async (snapshot) => {
        const data = snapshot.data();
        const chatItems = data?.chatsData || [];
        const enriched = [];

        for (const item of chatItems) {
          const uSnap = await getDoc(doc(db, "users", item.rId));
          enriched.push({ ...item, userData: uSnap.data() });
        }

        enriched.sort((a, b) => b.updatedAt - a.updatedAt);
        setChatData(enriched);
      });

      return () => unSub();
    }
  }, [userData]);

  const value = {
    userData,
    setUserData,
    chatData,
    setChatData,
    messagesId,
    setMessagesId,
    messages,
    setMessages,
    chatUser,
    setChatUser,
    chatVisible,
    setChatVisible,
    theme,
    setTheme,
    background,
    setBackground,
    rightSidebarVisible,
    setRightSidebarVisible,
    loadUserData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export default AppContextProvider;
