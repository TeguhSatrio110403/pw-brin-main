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

const { Header, Sider, Content } = Layout;
const { Search } = AntInput;

const DashboardObserver = () => {
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
  const navigate = useNavigate();

  const API_URL = 'https://server-water-sensors.onrender.com';

  const menuItems = [
    {
      key: 'locations',
      icon: <EnvironmentOutlined />,
      label: 'Lokasi Penelitian',
    },
    {
      key: 'statistics',
      icon: <BarChartOutlined />,
      label: 'Statistik',
    }
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
      const locationsResponse = await axios.get(`${API_URL}/data_lokasi`);
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
        
        await axios.put(`${API_URL}/data_lokasi/${editingId}`, updateData);
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
        <DashboardObserver />
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