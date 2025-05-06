import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Dropdown } from 'antd';
import { UserOutlined, LogoutOutlined } from '@ant-design/icons';

const AdminNavbar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleAbout = () => {
    navigate('/about');
  };

  const items = [
    {
      key: 'about',
      label: 'Tentang',
      icon: <UserOutlined />,
      onClick: handleAbout
    },
    {
      key: 'logout',
      label: 'Logout',
      icon: <LogoutOutlined />,
      onClick: handleLogout
    }
  ];

  return (
    <div className="admin-navbar">
      <div className="logo">
        <h1>Water Sensor</h1>
      </div>
      <div className="menu">
        <Dropdown
          menu={{ items }}
          placement="bottomRight"
          trigger={['click']}
        >
          <div className="user-menu">
            <UserOutlined style={{ fontSize: '20px' }} />
          </div>
        </Dropdown>
      </div>

      <style>
        {`
          .admin-navbar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1rem 2rem;
            background-color: white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }

          .logo h1 {
            margin: 0;
            color: #E62F2A;
            font-size: 1.5rem;
          }

          .user-menu {
            cursor: pointer;
            padding: 8px;
            border-radius: 50%;
            transition: background-color 0.3s;
          }

          .user-menu:hover {
            background-color: #f5f5f5;
          }

          .ant-dropdown-menu {
            min-width: 150px;
          }

          .ant-dropdown-menu-item {
            display: flex;
            align-items: center;
            gap: 8px;
          }
        `}
      </style>
    </div>
  );
};

export default AdminNavbar; 