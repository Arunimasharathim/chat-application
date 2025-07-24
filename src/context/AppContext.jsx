import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { createContext, useEffect, useState } from "react";
import { auth, db } from "../config/firebase";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";

export const AppContext = createContext();

const AppContextProvider = (props) => {
  const [userData, setUserData] = useState(null);
  const [chatData, setChatData] = useState(null);
  const [messagesId, setMessagesId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatUser, setChatUser] = useState(null);
  const [chatVisible, setChatVisible] = useState(false);

  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [background, setBackground] = useState(localStorage.getItem("background") || "");

  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("background", background);
  }, [background]);

  // ✅ Function to reset chat-related state
  const resetChatState = () => {
    setMessages([]);
    setMessagesId(null);
    setChatUser(null);
    setChatData(null);
    setChatVisible(false);
  };

  // ✅ Load user data and clear previous session state
  const loadUserData = async (uid) => {
    try {
      resetChatState();

      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();
      setUserData(userData);

      if (userData.avatar && userData.name) {
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
    } catch (error) {
      toast.error(error.message);
    }
  };

  // ✅ Track Firebase auth state and reset when user changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        loadUserData(user.uid);
      } else {
        setUserData(null);
        resetChatState();
        navigate('/');
      }
    });

    return () => unsubscribe();
  }, []);

  // 🔁 Real-time chat updates
  useEffect(() => {
    if (userData) {
      const chatRef = doc(db, "chats", userData.id);
      const unSub = onSnapshot(chatRef, async (res) => {
        const chatItems = res.data()?.chatsData || [];
        const tempData = [];
        for (const item of chatItems) {
          const userRef = doc(db, "users", item.rId);
          const userSnap = await getDoc(userRef);
          const userData = userSnap.data();
          tempData.push({ ...item, userData });
        }
        setChatData(tempData.sort((a, b) => b.updatedAt - a.updatedAt));
      });

      return () => unSub();
    }
  }, [userData]);

  // 🔁 Periodic refresh as backup
  useEffect(() => {
    if (userData) {
      const interval = setInterval(async () => {
        const chatRef = doc(db, "chats", userData.id);
        const data = await getDoc(chatRef);
        const chatItems = data.data()?.chatsData || [];
        const tempData = [];
        for (const item of chatItems) {
          const userRef = doc(db, "users", item.rId);
          const userSnap = await getDoc(userRef);
          const userData = userSnap.data();
          tempData.push({ ...item, userData });
        }
        setChatData(tempData.sort((a, b) => b.updatedAt - a.updatedAt));
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [userData]);

  const value = {
    userData, setUserData,
    loadUserData,
    chatData,
    messagesId, setMessagesId,
    chatUser, setChatUser,
    chatVisible, setChatVisible,
    messages, setMessages,
    theme, setTheme,
    background, setBackground
  };

  return (
    <AppContext.Provider value={value}>
      {props.children}
    </AppContext.Provider>
  );
};

export default AppContextProvider;
