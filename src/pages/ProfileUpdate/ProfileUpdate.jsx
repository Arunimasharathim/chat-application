import React, { useContext, useEffect, useState } from 'react';
import './ProfileUpdate.css';
import backarrow from '../../assets/backarrow.jpeg';
import assets from '../../assets/assets';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import upload from '../../lib/upload';
import { toast } from 'react-toastify';
import { AppContext } from '../../context/AppContext';

const ProfileUpdate = () => {
  const [image, setImage] = useState(null);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [uid, setUid] = useState('');
  const [prevImage, setPrevImage] = useState('');
  const { setUserData } = useContext(AppContext);
  const navigate = useNavigate();

  const profileImgSrc = image
    ? URL.createObjectURL(image)
    : prevImage
    ? prevImage
    : assets.logo_icon;

  const profileUpdate = async (event) => {
    event.preventDefault();

    if (!name.trim() || !bio.trim()) {
      toast.error('Name and Bio cannot be empty.');
      return;
    }

    if (!uid) {
      toast.error('User not authenticated.');
      return;
    }

    try {
      const docRef = doc(db, 'users', uid);
      let imgUrl = prevImage;

      if (image) {
        imgUrl = await upload(image);
        setPrevImage(imgUrl);
      }

      await updateDoc(docRef, {
        avatar: imgUrl,
        bio: bio,
        name: name,
      });

      const snap = await getDoc(docRef);
      setUserData(snap.data());

      toast.success('Profile updated successfully!');
      navigate('/chat');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile.');
    }
  };

  useEffect(() => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUid(user.uid);
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.name) setName(data.name);
          if (data.bio) setBio(data.bio);
          if (data.avatar) setPrevImage(data.avatar);
        }
      } else {
        navigate('/');
      }
    });
  }, [navigate]);

  return (
    <div className="profile">
      <div className="profile-container">
        <img
          src={backarrow}
          className="back-arrow"
          alt="Back"
          onClick={() => navigate('/chat')}
        />

        <form onSubmit={profileUpdate}>
          <h3>Profile details</h3>

          <label htmlFor="avatar">
            <input
              onChange={(e) => setImage(e.target.files[0])}
              id="avatar"
              type="file"
              accept=".png, .jpg, .jpeg"
              hidden
            />
            <img src={profileImgSrc} alt="Avatar preview" />
            upload profile image
          </label>

          <input
            onChange={(e) => setName(e.target.value)}
            value={name}
            placeholder="Your name"
            type="text"
            required
          />

          <textarea
            onChange={(e) => setBio(e.target.value)}
            value={bio}
            placeholder="Write profile bio"
            required
          />

          <button type="submit">Save</button>
        </form>

        <img className="profile-pic" src={profileImgSrc} alt="Full profile preview" />
      </div>
    </div>
  );
};

export default ProfileUpdate;
