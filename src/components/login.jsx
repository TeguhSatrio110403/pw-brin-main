import React, { useState } from 'react';
import axios from 'axios';

const login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const onSubmit = (e) => {

    const dataToSend = {
      username: username,
      password: password
    };

    axios.post('http://localhost:3000/login', dataToSend)
      .then(response => {
        console.log('POST request successful:', response.data);
        // Handle response if needed, e.g., redirect to dashboard
      })
      .catch(error => {
        console.error('Error sending POST request:', error);
        if (error.response && error.response.status === 401) {
          setErrorMessage('Username or password is incorrect');
        } else {
          setErrorMessage('An error occurred during login');
        }
    e.preventDefault(); // Prevent default form submission behavior
      });
        localStorage.setItem('isLoggedIn', true);
  };

  return (
    <div>
      <div className="login">
        <h1>SELAMAT DATANG</h1>
        <img src="./Security-pana.svg" alt="Security Icon" />

        <form action='/dashboard' onSubmit={onSubmit}>
          <div className="form-input">
          <label><b>Username</b></label>
            <input onChange={(e) => setUsername(e.target.value)} type="text" id="username" placeholder="Masukkan Username" required />
            <span></span>
          </div>

          <div className="form-input">
          <label><b>Password</b></label>
            <input onChange={(e) => setPassword(e.target.value)} type="password" id="password" placeholder="Masukkan Password" required />
            <span></span>
          </div>
          <button type="submit" class="login-button">LOGIN</button>
                <p class="guest-login">Login as Guest</p>
        </form>
        {errorMessage && <p>{errorMessage}</p>}
      </div>
    </div>
  );
};

export default login;
