import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';

const API_URL = 'https://server-water-sensors.onrender.com/';

const login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Check if user is already logged in
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (isLoggedIn) {
      window.location.href = '/dashboard';
    }
  }, []);

  // Validasi koneksi server
  const checkServerConnection = async () => {
    try {
      const response = await axios.get(API_URL, {
        timeout: 5000, // timeout 5 detik
        headers: { 'Accept': 'text/plain' }
      });
      return response.status === 200;
    } catch (error) {
      console.error('Server connection error:', error);
      return false;
    }
  };

  // Validasi form
  const validateForm = () => {
    if (!username.trim()) {
      alert('Username harus diisi');
      return false;
    }
    if (!password) {
      alert('Password harus diisi');
      return false;
    }
    if (password.length < 6) {
      alert('Password minimal 6 karakter');
      return false;
    }
    return true;
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    setErrorMessage('');

    try {
      // Cek koneksi server terlebih dahulu
      const isConnected = await checkServerConnection();
      if (!isConnected) {
        alert('Tidak dapat terhubung ke server. Periksa koneksi Anda dan coba lagi.');
        return;
      }

      const response = await axios.post(`${API_URL}auth/login`, {
        identifier: username, // menggunakan identifier untuk username/email
        password
      });

      console.log('Admin login response:', response.data);

      if (response.data.token) {
        localStorage.setItem('isLoggedIn', true);
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        window.location.href = '/dashboardAdmin';
      } else {
        alert('Login gagal: Token tidak ditemukan');
      }
    } catch (error) {
      console.error('Admin login error:', error);
      if (error.response) {
        alert(error.response.data.error || 'Username atau password admin salah');
      } else {
        alert('Terjadi kesalahan saat login admin');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      // Cek koneksi server terlebih dahulu
      const isConnected = await checkServerConnection();
      if (!isConnected) {
        alert('Tidak dapat terhubung ke server. Periksa koneksi Anda dan coba lagi.');
        return;
      }

      const response = await axios.post(`${API_URL}auth/guest`);
      
      console.log('Guest login response:', response.data);

      if (response.data.token) {
        localStorage.setItem('isLoggedIn', true);
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        window.location.href = '/dashboard';
      } else {
        alert('Login sebagai tamu gagal: Token tidak ditemukan');
      }
    } catch (error) {
      console.error('Guest login error:', error);
      if (error.response) {
        alert(error.response.data.error || 'Gagal login sebagai tamu');
      } else {
        alert('Tidak dapat terhubung ke server');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegularLogin = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    setErrorMessage('');

    try {
      // Cek koneksi server terlebih dahulu
      const isConnected = await checkServerConnection();
      if (!isConnected) {
        alert('Tidak dapat terhubung ke server. Periksa koneksi Anda dan coba lagi.');
        return;
      }

      const response = await axios.post(`${API_URL}auth/login`, {
        identifier: username, // menggunakan identifier untuk username/email
        password
      });

      console.log('User login response:', response.data);

      if (response.data.token) {
        localStorage.setItem('isLoggedIn', true);
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        window.location.href = '/dashboard';
      } else {
        alert('Login gagal: Token tidak ditemukan');
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error.response) {
        alert(error.response.data.error || 'Username atau password salah');
      } else {
        alert('Terjadi kesalahan saat login');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="login">
        <h1>SELAMAT DATANG</h1>
        <img src="./Security-pana.svg" alt="Security Icon" />

        <div className="login-toggle-container">
          <div className="login-toggle">
            <button 
              className={`toggle-button ${!isAdmin ? 'active' : ''}`}
              onClick={() => setIsAdmin(false)}
            >
              User Login
            </button>
            <button 
              className={`toggle-button ${isAdmin ? 'active' : ''}`}
              onClick={() => setIsAdmin(true)}
            >
              Admin Login
            </button>
          </div>
        </div>

        <form onSubmit={isAdmin ? handleAdminLogin : handleRegularLogin}>
          <div className="form-input">
            <label htmlFor="username"><b>Username</b></label>
            <input 
              onChange={(e) => setUsername(e.target.value)} 
              type="text" 
              id="username" 
              name="username"
              autoComplete="username"
              placeholder="Masukkan Username" 
              required 
            />
            <span></span>
          </div>

          <div className="form-input">
            <label htmlFor="password"><b>Password</b></label>
            <div className="password-input-container">
              <input 
                onChange={(e) => setPassword(e.target.value)} 
                type={showPassword ? "text" : "password"}
                id="password" 
                name="password"
                autoComplete="current-password"
                placeholder="Masukkan Password" 
                required 
              />
              <span 
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                role="button"
                tabIndex="0"
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              >
                {showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              </span>
            </div>
            <span></span>
          </div>

          <button 
            type="submit" 
            className="login-button" 
            disabled={loading}
            aria-label={loading ? "Loading..." : "Login"}
          >
            {loading ? 'Loading...' : 'LOGIN'}
          </button>

          {!isAdmin && (
            <p 
              className="guest-login" 
              onClick={handleGuestLogin}
              role="button"
              tabIndex="0"
              aria-label="Login sebagai tamu"
            >
              Login as Guest
            </p>
          )}
        </form>
      </div>

      <style>
        {`
          .login {
            padding: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
          }

          .login form {
            width: 100%;
            max-width: 400px;
          }

          .form-input {
            width: 100%;
            margin-bottom: 20px;
          }

          .form-input input {
            width: 100%;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 8px;
            font-size: 14px;
          }

          .form-input label {
            display: block;
            margin-bottom: 8px;
            color: #333;
          }

          .login-toggle-container {
            display: flex;
            justify-content: center;
            margin: 20px 0 30px 0;
            width: 100%;
            max-width: 400px;
          }
          
          .login-toggle {
            display: flex;
            background-color: #f7f7f7;
            border-radius: 100px;
            padding: 4px;
            width: 300px;
            justify-content: center;
            gap: 4px;
          }
          
          .toggle-button {
            padding: 10px 25px;
            border-radius: 100px;
            border: none;
            background: none;
            cursor: pointer;
            font-weight: 600;
            font-size: 15px;
            color: #636E72;
            width: 48%;
            transition: all 0.3s ease;
          }
          
          .toggle-button.active {
            background-color: #E62F2A;
            color: white;
          }
          
          .toggle-button:hover {
            background-color: #FFD3D3;
            color: #E62F2A;
          }
          
          .toggle-button.active:hover {
            background-color: #E62F2A;
            color: white;
          }

          .login-button {
            width: 100%;
            padding: 12px;
            background-color: #E62F2A;
            color: white;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: background-color 0.3s ease;
            margin-bottom: ${isAdmin ? '20px' : '0'};
          }

          .login-button:hover {
            background-color: #d42a25;
          }

          .login-button:disabled {
            background-color: #ffb3b3;
            cursor: not-allowed;
          }

          .password-input-container {
            position: relative;
            width: 100%;
          }

          .password-toggle {
            position: absolute;
            right: 10px;
            top: 50%;
            transform: translateY(-50%);
            cursor: pointer;
            color: #636E72;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 5px;
            transition: color 0.3s ease;
          }

          .password-toggle:hover {
            color: #E62F2A;
          }

          .guest-login {
            text-align: center;
            color: #E62F2A;
            cursor: pointer;
            margin-top: 15px;
            font-weight: 500;
          }

          .guest-login:hover {
            text-decoration: underline;
          }
        `}
      </style>
    </div>
  );
};

export default login;
