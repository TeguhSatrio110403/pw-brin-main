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
  App
} from 'antd';
import {
  DashboardOutlined,
  DatabaseOutlined,
  EnvironmentOutlined,
  BarChartOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  InfoCircleOutlined,
  LogoutOutlined,
  UserOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Marker, Popup } from 'react-leaflet';
import { useRef } from 'react';

const { Header, Sider, Content } = Layout;
const { Search } = AntInput;

const DashboardAdmin = () => {
  const { message } = App.useApp();
  const [activeMenu, setActiveMenu] = useState('dashboard');
  const [showSidebar, setShowSidebar] = useState(true);
  const [sensors, setSensors] = useState([]);
  const [filteredSensors, setFilteredSensors] = useState([]);
  const [locations, setLocations] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchText, setSearchText] = useState('');
  const navigate = useNavigate();
  const socketRef = useRef(null);
  const [sensorData, setSensorData] = useState({});
  const [historicalData, setHistoricalData] = useState([]);
  const [iotPosition, setIotPosition] = useState([0, 0]);
  const [waterLocations, setWaterLocations] = useState([]);
  const [markerWaterWays, setMarkerWaterWays] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);

  const API_URL = 'https://server-water-sensors.onrender.com';

  const menuItems = [
    {
      key: 'dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: 'sensors',
      icon: <DatabaseOutlined />,
      label: 'Data Sensor',
    },
    {
      key: 'locations',
      icon: <EnvironmentOutlined />,
      label: 'Lokasi Penelitian',
    },
    {
      key: 'users',
      icon: <UserOutlined />,
      label: 'Management User',
    },
    {
      key: 'statistics',
      icon: <BarChartOutlined />,
      label: 'Statistik',
    }
  ];

  useEffect(() => {
    fetchData();
  }, [activeMenu]);

  const fetchData = async () => {
    try {
      setLoading(true);
      switch (activeMenu) {
        case 'sensors':
          const sensorsResponse = await axios.get(`${API_URL}/data_combined`);
          if (sensorsResponse.data.success) {
            setSensors(sensorsResponse.data.data);
          }
          break;
        case 'locations':
          const locationsResponse = await axios.get(`${API_URL}/data_lokasi`);
          if (locationsResponse.data) {
            const formattedData = locationsResponse.data.map(item => ({
              id: item.id_lokasi,
              name: item.nama_sungai,
              coordinates: `${item.lat}, ${item.lon}`,
              address: item.alamat,
              date: item.tanggal
            }));
            setLocations(formattedData);
          }
          break;
        case 'users':
          const usersResponse = await axios.get(`${API_URL}/users`);
          if (usersResponse.data && usersResponse.data.success) {
            const userData = usersResponse.data.users || [];
            const formattedData = userData.map(item => ({
              id: item.id,
              name: item.username,
              email: item.email,
              role: item.role,
              date: item.last_login
            }));
            setUsers(formattedData);
          }
          break;
        default:
          // Fetch both data for dashboard
          const [sensorsRes, locationsRes] = await Promise.all([
            axios.get(`${API_URL}/data_combined`),
            axios.get(`${API_URL}/data_lokasi`)
          ]);
          
          if (sensorsRes.data.success) {
            setSensors(sensorsRes.data.data);
          }
          if (locationsRes.data) {
            const formattedData = locationsRes.data.map(item => ({
              id: item.id_lokasi,
              name: item.nama_sungai,
              coordinates: `${item.lat}, ${item.lon}`,
              address: item.alamat,
              date: item.tanggal
            }));
            setLocations(formattedData);
          }
          break;
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      message.error('Gagal mengambil data');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuClick = (key) => {
    setActiveMenu(key);
  };

  const showModal = (record = null) => {
    if (record) {
      // Format data untuk ditampilkan di form
      const formData = {
        id: record.id,
        name: record.name,
        email: record.email,
        role: record.role,
        date: record.date
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
          lat: values.coordinates ? values.coordinates.split(',')[0].trim() : '',
          lon: values.coordinates ? values.coordinates.split(',')[1].trim() : '',
          tanggal: values.date
        };
        
        await axios.put(`${API_URL}/data_lokasi/${editingId}`, updateData);
        message.success('Data berhasil diperbarui');
      } else {
        // Format data untuk tambah lokasi baru
        const newData = {
          nama_sungai: values.name,
          alamat: values.address,
          lat: '',
          lon: '',
          tanggal: new Date().toISOString()
        };
        
        await axios.post(`${API_URL}/data_lokasi`, newData);
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
      await axios.delete(`${API_URL}/${activeMenu}/${id}`);
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

  const handleLocationChange = (value) => {
    setSelectedLocation(value);
    if (value) {
      const filtered = sensors.filter(sensor => sensor.id_lokasi === value);
      setFilteredSensors(filtered);
    } else {
      setFilteredSensors([]);
    }
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

  const handleUserSearch = (value) => {
    setSearchText(value);
    const filtered = users.filter(item => 
      item.name.toLowerCase().includes(value.toLowerCase()) ||
      item.email.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredUsers(filtered);
  };

  const handleUserDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/users/${id}`);
      message.success('User berhasil dihapus');
      fetchData();
    } catch (error) {
      message.error('Gagal menghapus user');
    }
  };

  const handleUserSubmit = async (values) => {
    try {
      if (editingId) {
        // Format data untuk update user
        const updateData = {
          username: values.name,
          email: values.email,
          role: values.role
        };
        
        await axios.put(`${API_URL}/users/${editingId}`, updateData);
        message.success('User berhasil diperbarui');
      } else {
        // Format data untuk tambah user baru
        const newData = {
          username: values.name,
          email: values.email,
          role: values.role,
          password: values.password
        };
        
        await axios.post(`${API_URL}/users`, newData);
        message.success('User berhasil ditambahkan');
      }
      handleCancel();
      fetchData(); // Refresh data setelah update
    } catch (error) {
      console.error('Error:', error);
      message.error('Gagal menyimpan data user');
    }
  };

  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard':
        return (
          <Row gutter={16}>
            <Col span={8}>
              <Card>
                <Statistic title="Total Data Sensor" value={sensors.length} />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic title="Total Data Lokasi Penelitian" value={locations.length} />
              </Card>
            </Col>
          </Row>
        );
      case 'sensors':
        return (
          <>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Space>
                <Select
                  style={{ width: 300 }}
                  placeholder="Pilih Lokasi"
                  onChange={handleLocationChange}
                  allowClear
                >
                  {locations.map(location => (
                    <Select.Option key={location.id} value={location.id}>
                      {location.name}
                    </Select.Option>
                  ))}
                </Select>
              </Space>
            </div>
            <Table 
              dataSource={filteredSensors} 
              rowKey="id"
              columns={[
                {
                  title: 'ID',
                  dataIndex: 'id',
                  key: 'id',
                },
                {
                  title: 'Nama Sensor',
                  dataIndex: 'name',
                  key: 'name',
                },
                {
                  title: 'Status',
                  dataIndex: 'status',
                  key: 'status',
                },
                {
                  title: 'Tanggal',
                  dataIndex: 'tanggal',
                  key: 'tanggal',
                  render: (text) => text ? new Date(text).toLocaleString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : '-'
                },
                {
                  title: 'pH',
                  dataIndex: 'nilai_ph',
                  key: 'nilai_ph',
                },
                {
                  title: 'Suhu',
                  dataIndex: 'nilai_temperature',
                  key: 'nilai_temperature',
                  render: (text) => `${text}°C`
                },
                {
                  title: 'Kekeruhan',
                  dataIndex: 'nilai_turbidity',
                  key: 'nilai_turbidity',
                  render: (text) => `${text} NTU`
                },
                {
                  title: 'Kecepatan',
                  dataIndex: 'nilai_speed',
                  key: 'nilai_speed',
                  render: (text) => `${text} m/s`
                }
              ]}
            />
          </>
        );
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
                placeholder="Cari lokasi..."
                allowClear
                enterButton={<SearchOutlined />}
                onSearch={handleSearch}
                onChange={(e) => handleSearch(e.target.value)}
                style={{ width: 300, borderRadius:'100px' }}
              />
            </div>
            <Table 
              dataSource={filteredLocations.length > 0 ? filteredLocations : locations} 
              rowKey="id"
              columns={[
                {
                  title: 'ID',
                  dataIndex: 'id',
                  key: 'id',
                },
                {
                  title: 'Nama Lokasi',
                  dataIndex: 'name',
                  key: 'name',
                },
                {
                  title: 'Alamat',
                  dataIndex: 'address',
                  key: 'address',
                  ellipsis: true,
                },
                {
                  title: 'Koordinat',
                  dataIndex: 'coordinates',
                  key: 'coordinates',
                },
                {
                  title: 'Tanggal',
                  dataIndex: 'date',
                  key: 'date',
                  render: (text) => text ? new Date(text).toLocaleString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : '-'
                },
                {
                  title: 'Aksi',
                  key: 'action',
                  render: (_, record) => (
                    <>
                      <Button 
                        icon={<EditOutlined />} 
                        onClick={() => showModal(record)}
                        style={{ 
                          marginRight: 8,
                          borderRadius: '100px',
                          color: '#E62F2A',
                          borderColor: '#E62F2A'
                        }}
                      />
                      <Button 
                        icon={<DeleteOutlined />} 
                        danger 
                        onClick={() => handleDelete(record.id)}
                        style={{ borderRadius: '100px' }}
                      />
                    </>
                  ),
                },
              ]}
            />
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
                  onClick={() => showModal()}
                  style={{ borderRadius: '100px' }}
                >
                  Tambah User
                </Button>
              </Space>
              <Search
                placeholder="Cari user..."
                allowClear
                enterButton={<SearchOutlined />}
                onSearch={handleUserSearch}
                onChange={(e) => handleUserSearch(e.target.value)}
                style={{ width: 300, borderRadius:'100px' }}
              />
            </div>
            <Table 
              dataSource={filteredUsers.length > 0 ? filteredUsers : users} 
              rowKey="id"
              columns={[
                {
                  title: 'ID',
                  dataIndex: 'id',
                  key: 'id',
                },
                {
                  title: 'Nama',
                  dataIndex: 'name',
                  key: 'name',
                },
                {
                  title: 'Email',
                  dataIndex: 'email',
                  key: 'email',
                },
                {
                  title: 'Role',
                  dataIndex: 'role',
                  key: 'role',
                },
                {
                  title: 'Terakhir Login',
                  dataIndex: 'date',
                  key: 'date',
                  render: (text) => text ? new Date(text).toLocaleString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : '-'
                },
                {
                  title: 'Aksi',
                  key: 'action',
                  render: (_, record) => (
                    <>
                      <Button 
                        icon={<EditOutlined />} 
                        onClick={() => showModal(record)}
                        style={{ 
                          marginRight: 8,
                          borderRadius: '100px',
                          color: '#E62F2A',
                          borderColor: '#E62F2A'
                        }}
                      />
                      <Button 
                        icon={<DeleteOutlined />} 
                        danger 
                        onClick={() => handleUserDelete(record.id)}
                        style={{ borderRadius: '100px' }}
                      />
                    </>
                  ),
                },
              ]}
            />
          </>
        );
      case 'statistics':
        return (
          <Card title="Statistik">
            {/* Implementasi grafik statistik akan ditambahkan di sini */}
            <p>Statistik akan ditampilkan di sini</p>
          </Card>
        );
      default:
        return null;
    }
  };

  // Fetch water locations from backend
  const fetchWaterLocations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/data_lokasi`);
      const data = await response.json();
      
      const formattedData = data.map(item => ({
        id: item.id_lokasi,
        name: item.nama_sungai,
        position: [parseFloat(item.lat), parseFloat(item.lon)],
        address: item.alamat,
        date: new Date(item.tanggal).toLocaleString()
      }));
      
      setWaterLocations(formattedData);
    } catch (error) {
      console.error('Error fetching water locations:', error);
      message.error('Gagal mengambil data lokasi');
    } finally {
      setLoading(false);
    }
  };

  // Fetch sensor data from backend
  const fetchSensorData = async () => {
    try {
      const response = await fetch(`${API_URL}/data_combined`);
      const data = await response.json();
      
      if (data.success) {
        // Kelompokkan data sensor berdasarkan id_lokasi
        const groupedData = data.data.reduce((acc, sensor) => {
          if (!acc[sensor.id_lokasi]) {
            acc[sensor.id_lokasi] = [];
          }
          acc[sensor.id_lokasi].push(sensor);
          return acc;
        }, {});
        
        setSensorData(groupedData);
      }
    } catch (error) {
      console.error('Error fetching sensor data:', error);
      message.error('Gagal mengambil data sensor');
    }
  };

  // Fetch historical data
  const fetchHistoricalData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/data_lokasi`);
      const data = await response.json();
      
      if (data) {
        const formattedData = data.map(item => ({
          id: item.id_lokasi,
          name: item.nama_sungai,
          address: item.alamat,
          date: new Date(item.tanggal).toLocaleString("id-ID", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
          }),
          lat: item.lat,
          lon: item.lon,
          status: "Baik"
        }));
        setHistoricalData(formattedData);
      } else {
        setHistoricalData([]);
      }
    } catch (error) {
      console.error('Error fetching historical data:', error);
      setHistoricalData([]);
      message.error('Gagal mengambil data historis');
    } finally {
      setLoading(false);
    }
  };

  // Update sensor data when new data comes from socket
  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.on('sensorData', (data) => {
        setSensorData(prev => {
          const newData = { ...prev };
          if (!newData[data.id_lokasi]) {
            newData[data.id_lokasi] = [];
          }
          newData[data.id_lokasi].push(data);
          return newData;
        });
        
        // Update posisi IoT jika ada data lokasi
        if (data.lat && data.lon) {
          const cleanLat = data.lat.split('.').slice(0, 2).join('.');
          const cleanLon = data.lon.split('.').slice(0, 2).join('.');
          setIotPosition([parseFloat(cleanLat), parseFloat(cleanLon)]);
        }
      });
    }
  }, []);

  // Sensor data markers
  const sensorMarkers = useMemo(() => {
    return Object.entries(sensorData).map(([id_lokasi, sensors]) => {
      // Ambil data sensor terbaru untuk lokasi ini
      const latestSensor = sensors[sensors.length - 1];
      const cleanLat = latestSensor.lat.split('.').slice(0, 2).join('.');
      const cleanLon = latestSensor.lon.split('.').slice(0, 2).join('.');
      
      return (
        <Marker 
          key={`sensor-${id_lokasi}`} 
          position={[parseFloat(cleanLat), parseFloat(cleanLon)]}
          icon={markerWaterWays}
        >
          <Popup>
            <div className="custom-popup">
              <h4 style={{ margin: '0 0 8px 0', color: '#2c3e50' }}>Data Sensor</h4>
              <div style={{ fontSize: '14px' }}>
                <p style={{ margin: '4px 0' }}>
                  <strong>Tanggal:</strong> {new Date(latestSensor.tanggal).toLocaleString()}
                </p>
                <p style={{ margin: '4px 0' }}>
                  <strong>pH:</strong> <span style={{ color: latestSensor.nilai_ph < 6 ? '#e74c3c' : '#2ecc71' }}>
                    {latestSensor.nilai_ph}
                  </span>
                </p>
                <p style={{ margin: '4px 0' }}>
                  <strong>Suhu:</strong> <span style={{ color: latestSensor.nilai_temperature > 30 ? '#e74c3c' : '#3498db' }}>
                    {latestSensor.nilai_temperature}°C
                  </span>
                </p>
                <p style={{ margin: '4px 0' }}>
                  <strong>Kekeruhan:</strong> {latestSensor.nilai_turbidity} NTU
                </p>
                <p style={{ margin: '4px 0' }}>
                  <strong>Kecepatan:</strong> {latestSensor.nilai_speed} m/s
                </p>
                <p style={{ margin: '4px 0' }}>
                  <strong>Accelerometer X:</strong> {latestSensor.nilai_accel_x} m/s2
                </p>
                <p style={{ margin: '4px 0' }}>
                  <strong>Accelerometer Y:</strong> {latestSensor.nilai_accel_y} m/s2
                </p>
                <p style={{ margin: '4px 0' }}>
                  <strong>Accelerometer Z:</strong> {latestSensor.nilai_accel_z} m/s2
                </p>
              </div>
            </div>
          </Popup>
        </Marker>
      );
    });
  }, [sensorData]);

  const handleSearchInputChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const searchLocation = (query) => {
    // Implementasi pencarian lokasi
    console.log('Mencari lokasi:', query);
  };

  return (
    <div className="d-flex">
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
                key={item.key}
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
          onFinish={activeMenu === 'users' ? handleUserSubmit : handleSubmit}
          layout="vertical"
          id="form-container"
          name="form-container"
        >
          {activeMenu === 'users' && (
            <>
              <Form.Item
                name="name"
                label="Nama"
                rules={[{ required: true, message: 'Nama harus diisi' }]}
                id="form-item-name"
              >
                <Input 
                  id="user-name" 
                  name="user-name" 
                  aria-label="Nama"
                  autoComplete="name"
                />
              </Form.Item>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Email harus diisi' },
                  { 
                    type: 'email',
                    message: 'Format email tidak valid',
                    pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
                  }
                ]}
                id="form-item-email"
              >
                <Input 
                  id="user-email" 
                  name="user-email" 
                  aria-label="Email"
                  autoComplete="email"
                />
              </Form.Item>
              <Form.Item
                name="role"
                label="Role"
                rules={[{ required: true, message: 'Role harus diisi' }]}
                id="form-item-role"
              >
                <Select 
                  id="user-role" 
                  name="user-role"
                  aria-label="Role"
                >
                  <Select.Option id="role-admin" name="role-admin" value="admin">Admin</Select.Option>
                  <Select.Option id="role-pengamat" name="role-pengamat" value="pengamat">Pengamat</Select.Option>
                </Select>
              </Form.Item>
              {!editingId && (
                <Form.Item
                  name="password"
                  label="Password"
                  rules={[{ required: true, message: 'Password harus diisi' }]}
                  id="form-item-password"
                >
                  <Input.Password 
                    id="user-password" 
                    name="user-password" 
                    aria-label="Password"
                    autoComplete="new-password"
                  />
                </Form.Item>
              )}
            </>
          )}
          {activeMenu === 'sensors' && (
            <>
              <Form.Item
                name="name"
                label="Nama Sensor"
                rules={[{ required: true, message: 'Nama sensor harus diisi' }]}
                id="form-item-sensor-name"
              >
                <Input 
                  id="sensor-name" 
                  name="sensor-name" 
                  aria-label="Nama Sensor"
                  autoComplete="off"
                />
              </Form.Item>
              <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true, message: 'Status harus diisi' }]}
                id="form-item-sensor-status"
              >
                <Input 
                  id="sensor-status" 
                  name="sensor-status" 
                  aria-label="Status"
                  autoComplete="off"
                />
              </Form.Item>
            </>
          )}
          {activeMenu === 'locations' && (
            <>
              <Form.Item
                name="name"
                label="Nama Sungai"
                rules={[{ required: true, message: 'Nama sungai harus diisi' }]}
                id="form-item-river-name"
              >
                <Input 
                  id="river-name" 
                  name="river-name" 
                  aria-label="Nama Sungai"
                  autoComplete="off"
                />
              </Form.Item>
              <Form.Item
                name="address"
                label="Alamat"
                rules={[{ required: true, message: 'Alamat harus diisi' }]}
                id="form-item-river-address"
              >
                <Input.TextArea 
                  id="river-address" 
                  name="river-address" 
                  rows={4} 
                  aria-label="Alamat"
                  autoComplete="off"
                />
              </Form.Item>
              <Form.Item
                name="coordinates"
                label="Koordinat"
                id="form-item-river-coordinates"
              >
                <Input 
                  id="river-coordinates" 
                  name="river-coordinates" 
                  disabled 
                  aria-label="Koordinat"
                  autoComplete="off"
                />
              </Form.Item>
              <Form.Item
                name="date"
                label="Tanggal"
                id="form-item-river-date"
              >
                <Input 
                  id="river-date" 
                  name="river-date" 
                  disabled 
                  aria-label="Tanggal"
                  autoComplete="off"
                />
              </Form.Item>
            </>
          )}
          <Form.Item id="form-item-submit">
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
    </ConfigProvider>
  );
};

export default AppWrapper;