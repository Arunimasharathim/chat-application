import React, { useContext, useEffect, useState } from 'react'
import './RightSidebar.css'
import assets from '../../assets/assets'
import { AppContext } from '../../context/AppContext'

const RightSidebar = () => {
  const { chatUser, messages, rightSidebarVisible, setRightSidebarVisible } = useContext(AppContext);
  const [msgImages, setMsgImages] = useState([]);

  useEffect(() => {
    const tempVar = messages.filter(msg => msg.image).map(msg => msg.image);
    setMsgImages(tempVar);
  }, [messages]);

  if (!rightSidebarVisible) return null;

  return (
    <div className='rs'>
      <div className="rs-close">
        <img src={assets.arrow_icon} alt="close" onClick={() => setRightSidebarVisible(false)} />
      </div>
      {chatUser && (
        <>
          <div className='rs-profile'>
            <img src={chatUser.userData.avatar} alt="" />
            <h3>
              {Date.now() - chatUser.userData.lastSeen <= 70000 &&
                <img className='dot' src={assets.green_dot} alt='' />}
              {chatUser.userData.name}
            </h3>
            <p>{chatUser.userData.bio}</p>
          </div>
          <hr />
          <div className="rs-media">
            <p>Media</p>
            <div>
              {msgImages.map((url, index) => (
                <img onClick={() => window.open(url)} key={index} src={url} alt="" />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default RightSidebar;
