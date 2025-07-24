import React, { useState } from 'react'
import './Login.css'
import assets from '../../assets/assets';
import { signup, login, resetPass } from '../../config/firebase';

const Login = () => {
  const [currState, setCurrState] = useState("Sign up");
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agree, setAgree] = useState(false); // NEW

  const onSubmitHandler = (event) => {
    event.preventDefault();
    if (currState === "Sign up") {
      if (!agree) {
        alert("You must agree to the terms and conditions.");
        return;
      }
      signup(userName, email, password);
    } else {
      login(email, password);
    }
  }

  return (
    <div className='login'>
      <img className='logo' src={assets.logo_big} alt="" />
      <form onSubmit={onSubmitHandler} className='login-form'>
        <h2>{currState}</h2>
        {currState === "Sign up" && (
          <>
            <input
              onChange={(e) => setUserName(e.target.value)}
              value={userName}
              className='form-input'
              type="text"
              placeholder='username'
              required
            />
          </>
        )}
        <input
          onChange={(e) => setEmail(e.target.value)}
          value={email}
          className='form-input'
          type="email"
          placeholder='Email address'
          required
        />
        <input
          onChange={(e) => setPassword(e.target.value)}
          value={password}
          className='form-input'
          type="password"
          placeholder='password'
          required
        />

        {/* ✅ Terms Checkbox */}
        {currState === "Sign up" && (
          <div className='login-term'>
            <input
              type="checkbox"
              id="terms"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              required
            />
            <label htmlFor="terms">Agree to the terms of use & privacy policy.</label>
          </div>
        )}

        <button type='submit'>
          {currState === "Sign up" ? "Create account" : "Login now"}
        </button>

        <div className='login-forgot'>
          {currState === "Sign up" ? (
            <p className='login-toggle'>
              Already have an account? <span onClick={() => setCurrState("Login")}>Login here</span>
            </p>
          ) : (
            <>
              <p className='login-toggle'>
                Create an account <span onClick={() => setCurrState("Sign up")}>Click here</span>
              </p>
              <p className='login-toggle'>
                Forgot Password? <span onClick={() => resetPass(email)}>Click here</span>
              </p>
            </>
          )}
        </div>
      </form>
    </div>
  );
};

export default Login;
