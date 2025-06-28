import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';
import { Alert, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { port } from '../constant/https.jsx'; // Import port dari constant

const login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertType, setAlertType] = useState('error');
  const [alertMessage, setAlertMessage] = useState('');
  const navigate = useNavigate();

  // Check if user is already logged in
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (isLoggedIn === 'true') {
      navigate('/dashboard');
    }
  }, [navigate]);

  // Fungsi untuk logout
  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Validasi koneksi server
  const checkServerConnection = async () => {
    try {
      const response = await axios.get(port, {
        timeout: 5000,
        headers: { 'Accept': 'text/plain' }
      });
      return response.status === 200;
    } catch (error) {
      console.error('Server connection error:', error);
      return false;
    }
  };

  // Fungsi untuk menampilkan alert
  const showAlert = (type, message) => {
    setAlertType(type);
    setAlertMessage(message);
    setAlertVisible(true);
    setTimeout(() => {
      setAlertVisible(false);
    }, 5000);
  };

  // Validasi form
  const validateForm = () => {
    if (!username.trim()) {
      showAlert('error', 'Username harus diisi');
      return false;
    }
    if (!password) {
      showAlert('error', 'Password harus diisi');
      return false;
    }
    if (password.length < 6) {
      showAlert('error', 'Password minimal 6 karakter');
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
      const isConnected = await checkServerConnection();
      if (!isConnected) {
        showAlert('error', 'Tidak dapat terhubung ke server. Periksa koneksi Anda dan coba lagi.');
        return;
      }

      const response = await axios.post(`${port}auth/login`, {
        identifier: username,
        password
      });

      if (response.data.token) {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        navigate('/dashboardAdmin');
      } else {
        showAlert('error', 'Login gagal: Token tidak ditemukan');
      }
    } catch (error) {
      console.error('Admin login error:', error);
      if (error.response) {
        showAlert('error', error.response.data.error || 'Username atau password admin salah');
      } else {
        showAlert('error', 'Terjadi kesalahan saat login admin');
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
      const isConnected = await checkServerConnection();
      if (!isConnected) {
        showAlert('error', 'Tidak dapat terhubung ke server. Periksa koneksi Anda dan coba lagi.');
        return;
      }

      const response = await axios.post(`${port}auth/guest`);

      if (response.data.token) {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        navigate('/dashboard');
      } else {
        showAlert('error', 'Login sebagai tamu gagal: Token tidak ditemukan');
      }
    } catch (error) {
      console.error('Guest login error:', error);
      if (error.response) {
        showAlert('error', error.response.data.error || 'Gagal login sebagai tamu');
      } else {
        showAlert('error', 'Tidak dapat terhubung ke server');
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
      const isConnected = await checkServerConnection();
      if (!isConnected) {
        showAlert('error', 'Tidak dapat terhubung ke server. Periksa koneksi Anda dan coba lagi.');
        return;
      }

      const response = await axios.post(`${port}auth/login`, {
        identifier: username,
        password
      });

      if (response.data.token) {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        navigate('/dashboard');
      } else {
        showAlert('error', 'Login gagal: Token tidak ditemukan');
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error.response) {
        showAlert('error', error.response.data.error || 'Username atau password salah');
      } else {
        showAlert('error', 'Terjadi kesalahan saat login');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login">
      <Button 
        type="link" 
        onClick={() => navigate('/home')}
        style={{ 
          position: 'absolute',
          top: '60px',
          left: '20px',
          color: '#E62F2A',
          fontSize: '28px',
          fontWeight: '500',
          padding: '10px 15px',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        ←
      </Button>

      <h1 style={{ marginTop: '20px' }}>Selamat Datang Kembali</h1>
      <img src="./Security-pana.svg" alt="Security Icon" />

      {alertVisible && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          zIndex: 2000,
          display: 'flex',
          justifyContent: 'center',
          pointerEvents: 'none',
          animation: 'slideDown 0.4s',
        }}>
          <Alert
            message={alertMessage}
            type={alertType}
            showIcon
            closable
            onClose={() => setAlertVisible(false)}
            style={{
              marginTop: 16,
              width: '100%',
              maxWidth: 420,
              backgroundColor: alertType === 'success' ? '#e6ffed' : '#fff1f0',
              // borderColor: alertType === 'success' ? '#52c41a' : '#ff4d4f',
              color: alertType === 'success' ? '#389e0d' : '#cf1322',
              fontWeight: 500,
              fontSize: 16,
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              borderRadius: 10,
              pointerEvents: 'auto',
            }}
            icon={null}
          />
          <style>{`
            @keyframes slideDown {
              0% { transform: translateY(-100%); opacity: 0; }
              100% { transform: translateY(0); opacity: 1; }
            }
          `}</style>
        </div>
      )}

      {/* <div className="login-toggle-container">
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
      </div> */}

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
          {loading ? 'Loading...' : 'Masuk'}
        </button>

        {!isAdmin && (
          <p 
            className="guest-login" 
            onClick={handleGuestLogin}
            role="button"
            tabIndex="0"
            aria-label="Login sebagai tamu"
          >
            Masuk sebagai Tamu
          </p>
        )}
      </form>

      <style>
        {`
          .login {
            padding: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
            position: relative;
          }

          h1 {
            font-size: 24px;
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
