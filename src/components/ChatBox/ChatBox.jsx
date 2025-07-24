import React, { useContext, useEffect, useRef, useState } from 'react';
import './ChatBox.css';
import assets from '../../assets/assets';
import { AppContext } from '../../context/AppContext';
import { arrayUnion, doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { toast } from 'react-toastify';
import upload from '../../lib/upload';
import EmojiPicker from 'emoji-picker-react';
import emojiIcon from '../../assets/emoji_icon.jpeg';

const ChatBox = () => {
  const {
    userData, messagesId, chatUser, messages, setMessages,
    chatVisible, setChatVisible, theme, setTheme, background, setBackground
  } = useContext(AppContext);

  const [input, setInput] = useState("");
  const [showHelpMenu, setShowHelpMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const scrollEnd = useRef();
  const emojiPickerRef = useRef();

  const sendMessage = async () => {
    try {
      if (input && messagesId) {
        await updateDoc(doc(db, "messages", messagesId), {
          messages: arrayUnion({
            sId: userData.id,
            text: input,
            createdAt: new Date()
          })
        });

        const userIDs = [chatUser.rId, userData.id];
        userIDs.forEach(async (id) => {
          const userChatsRef = doc(db, "chats", id);
          const userChatsSnapshot = await getDoc(userChatsRef);
          if (userChatsSnapshot.exists()) {
            const userChatsData = userChatsSnapshot.data();
            const chatIndex = userChatsData.chatsData.findIndex((c) => c.messageId === messagesId);
            userChatsData.chatsData[chatIndex].lastMessage = input;
            userChatsData.chatsData[chatIndex].updatedAt = Date.now();
            if (userChatsData.chatsData[chatIndex].rId === userData.id) {
              userChatsData.chatsData[chatIndex].messageSeen = false;
            }
            await updateDoc(userChatsRef, { chatsData: userChatsData.chatsData });
          }
        });
      }
    } catch (error) {
      toast.error(error.message);
    }

    setInput("");
    setShowEmojiPicker(false);
  };

  const convertTimestamp = (timestamp) => {
    const date = timestamp.toDate();
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const sendImage = async (e) => {
    const fileUrl = await upload(e.target.files[0]);
    if (fileUrl && messagesId) {
      await updateDoc(doc(db, "messages", messagesId), {
        messages: arrayUnion({
          sId: userData.id,
          image: fileUrl,
          createdAt: new Date()
        })
      });

      const userIDs = [chatUser.rId, userData.id];
      userIDs.forEach(async (id) => {
        const userChatsRef = doc(db, "chats", id);
        const userChatsSnapshot = await getDoc(userChatsRef);
        if (userChatsSnapshot.exists()) {
          const userChatsData = userChatsSnapshot.data();
          const chatIndex = userChatsData.chatsData.findIndex((c) => c.messageId === messagesId);
          userChatsData.chatsData[chatIndex].lastMessage = "Image";
          userChatsData.chatsData[chatIndex].updatedAt = Date.now();
          await updateDoc(userChatsRef, { chatsData: userChatsData.chatsData });
        }
      });
    }
  };

  const handleBackgroundUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setBackground(reader.result);
    };
    reader.readAsDataURL(file);
    setShowHelpMenu(false); // ✅ Close help menu
  };

  const onEmojiClick = (emojiData) => {
    setInput(prev => prev + emojiData.emoji);
  };

  useEffect(() => {
    scrollEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (messagesId) {
      const unSub = onSnapshot(doc(db, "messages", messagesId), (res) => {
        setMessages(res.data().messages.reverse());
      });
      return () => unSub();
    }
  }, [messagesId]);

  // ✅ Close emoji picker if clicked outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target)) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showEmojiPicker]);

  return chatUser ? (
    <div
      className={`chat-box ${theme} ${chatVisible ? "" : "hidden"}`}
      style={{ backgroundImage: background ? `url(${background})` : "none" }}
    >
      <div className="chat-user">
        <img src={chatUser?.userData.avatar || assets.profile_img} alt="" />
        <p>
          {chatUser.userData.name}
          {Date.now() - chatUser.userData.lastSeen <= 70000 && (
            <img className="dot" src={assets.green_dot} alt="" />
          )}
        </p>
        <img onClick={() => setChatVisible(false)} className="arrow" src={assets.arrow_icon} alt="" />

        {/* Help Menu */}
        <div className="menu-container">
          <img className="help" src={assets.help_icon} alt="" onClick={() => setShowHelpMenu(prev => !prev)} />
          {showHelpMenu && (
            <div className="menu-dropdown">
              <p
                onClick={() => {
                  setTheme(theme === "light" ? "dark" : "light");
                  setShowHelpMenu(false); // ✅ Close menu
                }}
              >
                Switch to {theme === "light" ? "Dark" : "Light"} Theme
              </p>
              <label style={{ cursor: "pointer" }}>
                <p>Change Background</p>
                <input type="file" accept="image/*" onChange={handleBackgroundUpload} hidden />
              </label>
            </div>
          )}
        </div>
      </div>

      <div className="chat-msg">
        <div ref={scrollEnd}></div>
        {messages.map((msg, index) => (
          <div key={index} className={msg.sId === userData.id ? "s-msg" : "r-msg"}>
            {msg.image
              ? <img className="msg-img" src={msg.image} alt="" />
              : <p className="msg">{msg.text}</p>}
            <div>
              <img src={msg.sId === userData.id ? userData.avatar : chatUser.userData.avatar} alt="" />
              <p>{convertTimestamp(msg.createdAt)}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="chat-input">
        <div className="input-container">
          <input
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            onChange={(e) => setInput(e.target.value)}
            value={input}
            type="text"
            placeholder="Send a message"
          />
          <img
            src={emojiIcon}
            alt="emoji"
            onClick={() => setShowEmojiPicker(prev => !prev)}
            style={{ cursor: "pointer", width: "24px" }}
          />
        </div>

        {showEmojiPicker && (
          <div
            ref={emojiPickerRef}
            style={{
              position: "absolute",
              bottom: "70px",
              right: "60px",
              zIndex: 10
            }}
          >
            <EmojiPicker onEmojiClick={onEmojiClick} theme={theme === "dark" ? "dark" : "light"} />
          </div>
        )}

        <input onChange={sendImage} type="file" id="image" accept="image/png, image/jpeg" hidden />
        <label htmlFor="image">
          <img src={assets.gallery_icon} alt="gallery" />
        </label>
        <img onClick={sendMessage} src={assets.send_button} alt="send" />
      </div>
    </div>
  ) : (
    <div className={`chat-welcome ${chatVisible ? "" : "hidden"}`}>
      <img src={assets.logo_icon} alt='' />
      <p>Chat anytime, anywhere</p>
    </div>
  );
};

export default ChatBox;
