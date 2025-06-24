import React, { useState, useEffect, useMemo } from 'react';
import { 
  Layout, 
  Menu, 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  message,
  Card,
  Statistic,
  Row,
  Col,
  Space,
  Input as AntInput,
  ConfigProvider,
  Select,
  Dropdown,
  App,
  Spin
} from 'antd';
import {
  DashboardOutlined,
  EnvironmentOutlined,
  BarChartOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  InfoCircleOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Marker, Popup } from 'react-leaflet';
import { useRef } from 'react';
import { port } from '../constant/https.jsx';

const { Header, Sider, Content } = Layout;
const { Search } = AntInput;

const DashboardAdmin = () => {
  const { message } = App.useApp();
  const [activeMenu, setActiveMenu] = useState('locations');
  const [showSidebar, setShowSidebar] = useState(true);
  const [locations, setLocations] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingStates, setLoadingStates] = useState({
    locations: false
  });
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchText, setSearchText] = useState('');
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [isUserModalVisible, setIsUserModalVisible] = useState(false);
  const [userForm] = Form.useForm();
  const [editingUserId, setEditingUserId] = useState(null);
  const [userLoading, setUserLoading] = useState(false);
  const [userSearchText, setUserSearchText] = useState('');
  const [anomaliData, setAnomaliData] = useState([]);
  const [filteredAnomali, setFilteredAnomali] = useState([]);
  const [anomaliLocations, setAnomaliLocations] = useState([]);
  const [selectedAnomaliLocation, setSelectedAnomaliLocation] = useState('');
  const [anomaliLoading, setAnomaliLoading] = useState(false);
  const navigate = useNavigate();

  const menuItems = [
    {
      key: 'locations',
      icon: <EnvironmentOutlined />,
      label: 'Lokasi Penelitian',
    },
    {
      key: 'users',
      icon: <EditOutlined />,
      label: 'Manajemen User',
    },
    {
      key: 'anomali',
      icon: <InfoCircleOutlined />,
      label: 'Anomali Sensor',
    },
    {
      key: 'statistik-sensor',
      icon: <BarChartOutlined />,
      label: 'Statistik Sensor',
    },
  ];

  useEffect(() => {
    const initializeData = async () => {
      try {
        setInitialLoading(true);
        await fetchData();
      } catch (error) {
        console.error('Error initializing data:', error);
        message.error('Gagal memuat data awal');
      } finally {
        setInitialLoading(false);
      }
    };

    initializeData();
  }, []);

  const fetchData = async () => {
    try {
      console.log('Starting fetchData for:', activeMenu);
      setLoading(true);

      // Selalu ambil data lokasi terlebih dahulu
      console.log('Fetching locations data...');
      const locationsResponse = await axios.get(`${port}data_lokasi`);
      console.log('Raw locations response:', locationsResponse);
      
      if (locationsResponse.data) {
        const formattedData = locationsResponse.data.map(item => ({
          id: item.id_lokasi,
          name: item.nama_sungai,
          coordinates: `${item.lat}, ${item.lon}`,
          address: item.alamat,
          date: item.tanggal,
          rawDate: new Date(item.tanggal)
        }));
        console.log('Formatted locations:', formattedData);
        setLocations(formattedData);
        setFilteredLocations(formattedData);
      }

      switch (activeMenu) {
        default:
          break;
      }
    } catch (error) {
      console.error('Error in fetchData:', error);
      message.error('Gagal mengambil data');
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeMenu === 'locations') {
      fetchData();
    }
  }, [activeMenu]);

  const handleMenuClick = async (key) => {
    setLoading(true);
    setActiveMenu(key);
    try {
      await fetchData();
    } catch (error) {
      console.error('Error fetching data:', error);
      message.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const showModal = (record = null) => {
    if (record) {
      // Format data untuk ditampilkan di form
      const formData = {
        id: record.id,
        name: record.name,
        address: record.address,
        lat: record.coordinates ? record.coordinates.split(',')[0].trim() : '',
        lon: record.coordinates ? record.coordinates.split(',')[1].trim() : ''
      };
      form.setFieldsValue(formData);
      setEditingId(record.id);
    } else {
      form.resetFields();
      setEditingId(null);
    }
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setEditingId(null);
  };

  const handleSubmit = async (values) => {
    try {
      if (editingId) {
        // Format data untuk update lokasi
        const updateData = {
          nama_sungai: values.name,
          alamat: values.address,
          lat: values.lat,
          lon: values.lon,
          tanggal: values.date
        };
        
        await axios.put(`${port}data_lokasi/${editingId}`, updateData);
        message.success('Data berhasil diperbarui');
      } else {
        // Format data untuk tambah lokasi baru
        const newData = {
          nama_sungai: values.name,
          alamat: values.address,
          lat: values.lat,
          lon: values.lon,
          tanggal: new Date().toISOString()
        };
        
        await axios.post(`${port}data_lokasi`, newData);
        message.success('Data berhasil ditambahkan');
      }
      handleCancel();
      fetchData();
    } catch (error) {
      console.error('Error:', error);
      message.error('Gagal menyimpan data');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${port}${activeMenu}/${id}`);
      message.success('Data berhasil dihapus');
      fetchData();
    } catch (error) {
      message.error('Gagal menghapus data');
    }
  };

  const handleSearch = (value) => {
    setSearchText(value);
    const filtered = locations.filter(item => 
      item.name.toLowerCase().includes(value.toLowerCase()) ||
      item.address.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredLocations(filtered);
  };

  const handleSort = () => {
    const newSortOrder = sortOrder === 'desc' ? 'asc' : 'desc';
    setSortOrder(newSortOrder);
    
    const sorted = [...(filteredLocations.length > 0 ? filteredLocations : locations)].sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return newSortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
    
    setFilteredLocations(sorted);
  };

  useEffect(() => {
    if (searchText) {
      handleSearch(searchText);
    } else {
      setFilteredLocations([]);
    }
  }, [locations, searchText]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    message.success('Berhasil logout');
    navigate('/login');
  };

  const handleAbout = () => {
    navigate('/about');
  };

  const items = [
    {
      key: 'about',
      icon: <InfoCircleOutlined />,
      label: 'Tentang',
      onClick: handleAbout
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: handleLogout
    }
  ];

  const fetchUsers = async () => {
    setUserLoading(true);
    try {
      const res = await axios.get(`${port}users`);
      if (res.data && res.data.users) {
        setUsers(res.data.users);
        setFilteredUsers(res.data.users);
      }
    } catch (err) {
      message.error('Gagal mengambil data user');
    } finally {
      setUserLoading(false);
    }
  };

  useEffect(() => {
    if (activeMenu === 'users') {
      fetchUsers();
    }
  }, [activeMenu]);

  const showUserModal = (record = null) => {
    if (record) {
      userForm.setFieldsValue(record);
      setEditingUserId(record.id);
    } else {
      userForm.resetFields();
      setEditingUserId(null);
    }
    setIsUserModalVisible(true);
  };

  const handleUserCancel = () => {
    setIsUserModalVisible(false);
    userForm.resetFields();
    setEditingUserId(null);
  };

  const handleUserSubmit = async (values) => {
    setUserLoading(true);
    try {
      if (editingUserId) {
        await axios.put(`${port}users/${editingUserId}`, values);
        message.success('User berhasil diperbarui');
      } else {
        await axios.post(`${port}users`, values);
        message.success('User berhasil ditambahkan');
      }
      handleUserCancel();
      fetchUsers();
    } catch (err) {
      message.error('Gagal menyimpan user');
    } finally {
      setUserLoading(false);
    }
  };

  const handleUserDelete = async (id) => {
    setUserLoading(true);
    try {
      await axios.delete(`${port}users/${id}`);
      message.success('User berhasil dihapus');
      fetchUsers();
    } catch (err) {
      message.error('Gagal menghapus user');
    } finally {
      setUserLoading(false);
    }
  };

  const handleUserSearch = (value) => {
    setUserSearchText(value);
    const filtered = users.filter(
      (item) =>
        item.username.toLowerCase().includes(value.toLowerCase()) ||
        item.email.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredUsers(filtered);
  };

  useEffect(() => {
    if (userSearchText) {
      handleUserSearch(userSearchText);
    } else {
      setFilteredUsers(users);
    }
  }, [users, userSearchText]);

  const fetchAnomaliData = async () => {
    setAnomaliLoading(true);
    try {
      const res = await axios.get(`${port}anomali-sensor`); // Ganti endpoint jika perlu
      if (res.data) {
        setAnomaliData(res.data);
        // Ambil lokasi unik
        const locations = Array.from(new Set(res.data.map(item => item.location)));
        setAnomaliLocations(locations);
      }
    } catch (err) {
      message.error('Gagal mengambil data anomali sensor');
    } finally {
      setAnomaliLoading(false);
    }
  };

  useEffect(() => {
    if (activeMenu === 'anomali') {
      fetchAnomaliData();
    }
  }, [activeMenu]);

  useEffect(() => {
    let filtered = anomaliData.filter(item =>
      (item.turbidity > 100 || item.pH > 9 || item.temperature > 35)
    );
    if (selectedAnomaliLocation) {
      filtered = filtered.filter(item => item.location === selectedAnomaliLocation);
    }
    setFilteredAnomali(filtered);
  }, [anomaliData, selectedAnomaliLocation]);

  const renderContent = () => {
    switch (activeMenu) {
      case 'locations':
        return (
          <>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />} 
                  onClick={() => showModal()}
                  style={{ borderRadius: '100px' }}
                >
                  Tambah Lokasi
                </Button>
                <Button
                  onClick={handleSort}
                  style={{ 
                    borderRadius: '100px',
                    color: '#E62F2A',
                    borderColor: '#E62F2A'
                  }}
                >
                  <i className={`bi bi-sort-${sortOrder === 'desc' ? 'down' : 'up'}`} style={{ color: '#E62F2A' }}></i>
                  {sortOrder === 'desc' ? 'Terbaru' : 'Terlama'}
                </Button>
              </Space>
              <Search
                id="location-search"
                name="location-search"
                placeholder="Cari lokasi..."
                allowClear
                enterButton={<SearchOutlined />}
                onSearch={handleSearch}
                onChange={(e) => handleSearch(e.target.value)}
                style={{ width: 300, borderRadius:'100px' }}
                aria-label="Cari lokasi"
              />
            </div>
            <Row gutter={[16, 16]}>
              {(filteredLocations.length > 0 ? filteredLocations : locations).map((location) => (
                <Col xs={24} sm={12} md={8} lg={6} key={`location-${location.id}`}>
                  <Card
                    hoverable
                    style={{ 
                      borderRadius: '12px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                    bodyStyle={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      padding: '16px'
                    }}
                    actions={[
                      <Button 
                        key="edit"
                        icon={<EditOutlined />} 
                        onClick={() => showModal(location)}
                        style={{ 
                          color: '#E62F2A',
                          borderColor: '#E62F2A'
                        }}
                      />,
                      <Button 
                        key="delete"
                        icon={<DeleteOutlined />} 
                        danger 
                        onClick={() => handleDelete(location.id)}
                      />
                    ]}
                  >
                    <Card.Meta
                      title={location.name}
                      description={
                        <div style={{ 
                          display: 'flex', 
                          flexDirection: 'column',
                          gap: '8px',
                          flex: 1
                        }}>
                          <p style={{ margin: 0 }}><strong>ID:</strong> {location.id}</p>
                          <p style={{ margin: 0 }}><strong>Alamat:</strong> {location.address}</p>
                          <p style={{ margin: 0 }}><strong>Koordinat:</strong> {location.coordinates}</p>
                          <p style={{ margin: 0 }}><strong>Tanggal:</strong> {new Date(location.date).toLocaleString('id-ID', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}</p>
                        </div>
                      }
                    />
                  </Card>
                </Col>
              ))}
            </Row>
          </>
        );
      case 'users':
        return (
          <>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => showUserModal()}
                  style={{ borderRadius: '100px' }}
                >
                  Tambah User
                </Button>
              </Space>
              <Search
                id="user-search"
                name="user-search"
                placeholder="Cari user..."
                allowClear
                enterButton={<SearchOutlined />}
                onSearch={handleUserSearch}
                onChange={(e) => handleUserSearch(e.target.value)}
                style={{ width: 300, borderRadius: '100px' }}
                aria-label="Cari user"
              />
            </div>
            <Table
              dataSource={filteredUsers}
              rowKey="id"
              loading={userLoading}
              columns={[
                { title: 'ID', dataIndex: 'id', key: 'id' },
                { title: 'Username', dataIndex: 'username', key: 'username' },
                { title: 'Email', dataIndex: 'email', key: 'email' },
                { title: 'Role', dataIndex: 'role', key: 'role' },
                { title: 'Last Login', dataIndex: 'last_login', key: 'last_login' },
                {
                  title: 'Aksi',
                  key: 'aksi',
                  render: (_, record) => (
                    <Space>
                      <Button icon={<EditOutlined />} onClick={() => showUserModal(record)} style={{ color: '#E62F2A', borderColor: '#E62F2A' }} />
                      <Button icon={<DeleteOutlined />} danger onClick={() => handleUserDelete(record.id)} />
                    </Space>
                  ),
                },
              ]}
              pagination={{ pageSize: 8 }}
            />
            <Modal
              title={editingUserId ? 'Edit User' : 'Tambah User'}
              open={isUserModalVisible}
              onCancel={handleUserCancel}
              footer={null}
              id="modal-user-form"
            >
              <Form
                form={userForm}
                onFinish={handleUserSubmit}
                layout="vertical"
                id="form-user-container"
                name="form-user-container"
              >
                <Form.Item
                  name="username"
                  label={<label htmlFor="user-username-input">Username</label>}
                  rules={[{ required: true, message: 'Username harus diisi' }]}
                >
                  <Input id="user-username-input" name="user-username" autoComplete="off" />
                </Form.Item>
                <Form.Item
                  name="email"
                  label={<label htmlFor="user-email-input">Email</label>}
                  rules={[{ required: true, message: 'Email harus diisi' }]}
                >
                  <Input id="user-email-input" name="user-email" autoComplete="off" />
                </Form.Item>
                <Form.Item
                  name="role"
                  label={<label htmlFor="user-role-input">Role</label>}
                  rules={[{ required: true, message: 'Role harus diisi' }]}
                >
                  <Select id="user-role-input" name="user-role" options={[
                    { value: 'admin', label: 'Admin' },
                    { value: 'pengamat', label: 'Pengamat' },
                  ]} />
                </Form.Item>
                <Form.Item
                  name="password"
                  label={<label htmlFor="user-password-input">Password</label>}
                  rules={editingUserId ? [] : [{ required: true, message: 'Password harus diisi' }]}
                >
                  <Input.Password id="user-password-input" name="user-password" autoComplete="new-password" />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit" style={{ borderRadius: '100px' }} id="submit-user-button" name="submit-user-button">
                    {editingUserId ? 'Update' : 'Simpan'}
                  </Button>
                </Form.Item>
              </Form>
            </Modal>
          </>
        );
      case 'anomali':
        return (
          <Card title="Anomali Sensor">
            <div style={{ marginBottom: 16, maxWidth: 300 }}>
              <Select
                allowClear
                placeholder="Filter Lokasi"
                style={{ width: '100%' }}
                value={selectedAnomaliLocation || undefined}
                onChange={val => setSelectedAnomaliLocation(val || '')}
                options={anomaliLocations.map(loc => ({ value: loc, label: loc }))}
              />
            </div>
            {anomaliLoading ? (
              <Spin />
            ) : filteredAnomali.length === 0 ? (
              <p>Tidak ada data anomali yang ditemukan.</p>
            ) : (
              <Row gutter={[16, 16]}>
                {filteredAnomali.map((item, idx) => (
                  <Col xs={24} sm={12} md={8} lg={6} key={idx}>
                    <Card
                      style={{ borderLeft: '5px solid #E62F2A', borderRadius: 12 }}
                      bodyStyle={{ padding: 16 }}
                    >
                      <div><b>Lokasi:</b> {item.location}</div>
                      <div><b>Turbidity:</b> {item.turbidity}</div>
                      <div><b>pH:</b> {item.pH}</div>
                      <div><b>Temperature:</b> {item.temperature}°C</div>
                      <div><b>Waktu:</b> {item.timestamp}</div>
                    </Card>
                  </Col>
                ))}
              </Row>
            )}
          </Card>
        );
      case 'statistik-sensor':
        return (
          <Card title="Statistik Sensor">
            <p>Statistik sensor akan ditampilkan di sini.</p>
          </Card>
        );
      default:
        return null;
    }
  };

  const LoadingOverlay = () => (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{ 
        background: 'white', 
        padding: '20px', 
        borderRadius: '8px',
        textAlign: 'center',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <p style={{ 
          margin: '0 0 15px 0',
          color: '#333',
          fontSize: '16px',
          fontWeight: '500'
        }}>
          Memuat Data...
        </p>
        <div style={{
          width: '50px',
          height: '50px',
          border: '5px solid #f3f3f3',
          borderTop: '5px solid #E62F2A',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto'
        }}></div>
      </div>
    </div>
  );

  return (
    <div className="d-flex">
      {(initialLoading || loading) && <LoadingOverlay />}
      {!initialLoading && (
        <>
          <button 
            className="btn btn-light" 
            style={{ 
              position: 'absolute',
              top: '120px',
              left: showSidebar ? '270px' : '20px',
              zIndex: 1001,
              transition: 'all 0.3s',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              padding: '0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #e0e0e0',
              backgroundColor: '#fff'
            }}
            onClick={() => setShowSidebar(!showSidebar)}
          >
            <i className={`bi bi-chevron-${showSidebar ? 'left' : 'right'}`}></i>
          </button>

          <div 
            className={`offcanvas offcanvas-start ${showSidebar ? 'show' : ''}`} 
              style={{ 
              width: '250px',
              transform: showSidebar ? 'translateX(0)' : 'translateX(-100%)',
              transition: 'transform 0.3s ease-in-out',
              boxShadow: '2px 0 8px rgba(0,0,0,0.1)'
            }} 
            tabIndex="-1" 
            id="offcanvasScrolling" 
            aria-labelledby="offcanvasScrollingLabel"
          >
            <div className="offcanvas-header mb-3">
              <div className="offcanvas-title" id="offcanvasScrollingLabel">
                <img src="./logo.png" alt="Logo" className="logo" 
                  style={{ 
                    width: '190px', 
                    height: 'auto' 
                  }} 
                />
              </div>
            </div>
            <div className="offcanvas-body p-0">
              <div className="list-group list-group-flush">
                {menuItems.map(item => (
                  <button
                    key={`menu-item-${item.key}`}
                    className={`list-group-item list-group-item-action d-flex align-items-center ${activeMenu === item.key ? 'active' : ''}`}
                    onClick={() => handleMenuClick(item.key)}
                    style={{
                      border: 'none',
                      backgroundColor: activeMenu === item.key ? '#fff1f0' : 'transparent',
                      color: activeMenu === item.key ? '#E62F2A' : '#333',
                      padding: '12px 16px'
                    }}
                  >
                    {item.icon}
                    <span className="ms-2">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div 
            className="flex-grow-1" 
            style={{ 
              marginLeft: showSidebar ? '250px' : '0',
              marginTop:'50px',
              padding: '24px',
              transition: 'margin-left 0.3s ease-in-out'
            }}
          >
            <div className="bg-white rounded shadow-sm p-4">
              {renderContent()}
            </div>
          </div>

          <Modal
            title={editingId ? 'Edit Data' : 'Tambah Data'}
            open={isModalVisible}
            onCancel={handleCancel}
            footer={null}
            id="modal-form"
          >
            <Form
              form={form}
              onFinish={handleSubmit}
              layout="vertical"
              id="form-container"
              name="form-container"
            >
              <Form.Item
                name="name"
                label={<label htmlFor="river-name-input">Nama Sungai</label>}
                rules={[{ required: true, message: 'Nama sungai harus diisi' }]}
              >
                <Input 
                  id="river-name-input"
                  name="river-name"
                  autoComplete="off"
                  aria-describedby="river-name-help"
                />
              </Form.Item>
              <Form.Item
                name="address"
                label={<label htmlFor="river-address-input">Alamat</label>}
                rules={[{ required: true, message: 'Alamat harus diisi' }]}
              >
                <Input.TextArea 
                  id="river-address-input"
                  name="river-address"
                  rows={4}
                  autoComplete="off"
                  aria-describedby="river-address-help"
                />
              </Form.Item>
              <Form.Item
                name="lat"
                label={<label htmlFor="river-lat-input">Latitude</label>}
                rules={[{ required: true, message: 'Latitude harus diisi' }]}
              >
                <Input 
                  id="river-lat-input"
                  name="river-lat"
                  autoComplete="off"
                  aria-describedby="river-lat-help"
                />
              </Form.Item>
              <Form.Item
                name="lon"
                label={<label htmlFor="river-lon-input">Longitude</label>}
                rules={[{ required: true, message: 'Longitude harus diisi' }]}
              >
                <Input 
                  id="river-lon-input"
                  name="river-lon"
                  autoComplete="off"
                  aria-describedby="river-lon-help"
                />
              </Form.Item>
              <Form.Item
                name="date"
                label={<label htmlFor="river-date-input">Tanggal</label>}
              >
                <Input 
                  id="river-date-input"
                  name="river-date"
                  disabled
                  autoComplete="off"
                  aria-describedby="river-date-help"
                />
              </Form.Item>
              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit"
                  style={{ borderRadius: '100px' }}
                  id="submit-button"
                  name="submit-button"
                >
                  {editingId ? 'Update' : 'Simpan'}
                </Button>
              </Form.Item>
            </Form>
          </Modal>
        </>
      )}
    </div>
  );
};

const AppWrapper = () => {
  return (
    <ConfigProvider
      theme={{
        components: {
          Button: {
            colorPrimary: '#E62F2A',
            colorPrimaryHover: '#CD1B16',
            borderRadius: 100,
          },
          Input: {
            borderRadius: 8,
          },
        },
      }}
    >
      <App>
        <DashboardAdmin />
      </App>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </ConfigProvider>
  );
};

export default AppWrapper;