import React, { useState, useEffect } from 'react';
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
  Dropdown
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
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  InfoCircleOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const { Header, Sider, Content } = Layout;
const { Search } = AntInput;

const DashboardAdmin = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeMenu, setActiveMenu] = useState('dashboard');
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
      key: 'statistics',
      icon: <BarChartOutlined />,
      label: 'Statistik',
    },
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
        address: record.address,
        coordinates: record.coordinates,
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
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
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
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
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

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        collapsible 
        collapsed={collapsed} 
        onCollapse={setCollapsed}
        style={{ 
          background: '#fff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          position: 'relative',
          height: '100vh'
        }}
        trigger={null}
      >
        <div style={{ 
          height: 'auto',
          margin: 16,
          padding: '12px 0',
          background: '#f0f2f5',
          borderRadius: '4px',
          textAlign: 'center'
        }}>
          <h2 style={{ 
            margin: 0,
            fontSize: collapsed ? '14px' : '18px',
            color: '#E62F2A',
            fontWeight: 'bold'
          }}>
            {collapsed ? 'Admin' : 'Dashboard Admin'}
          </h2>
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[activeMenu]}
          onClick={({ key }) => handleMenuClick(key)}
          style={{ borderRight: 'none' }}
          items={menuItems}
        />
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            width: collapsed ? '80px' : '200px',
            padding: '16px',
            background: '#fff',
            borderTop: '1px solid #f0f0f0',
            textAlign: 'center',
            cursor: 'pointer',
            color: '#E62F2A',
            transition: 'all 0.2s',
            zIndex: 1000
          }}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <MenuUnfoldOutlined style={{ fontSize: '18px' }} /> : <MenuFoldOutlined style={{ fontSize: '18px' }} />}
        </div>
      </Sider>
      <Layout>
        {/* <Header style={{ 
          padding: '0 24px', 
          background: '#fff',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end'
        }}>
          <Dropdown menu={{ items }} placement="bottomRight">
            <Button 
              type="text" 
              icon={<MenuUnfoldOutlined />}
              style={{ 
                fontSize: '16px',
                width: 64,
                height: 64,
                color: '#E62F2A'
              }}
            />
          </Dropdown>
        </Header> */}
        <Content style={{ margin: '24px 16px', padding: 24, background: '#fff', borderRadius: '8px' }}>
          {renderContent()}
        </Content>
      </Layout>

      <Modal
        title={editingId ? 'Edit Data' : 'Tambah Data'}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        <Form
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
        >
          {activeMenu === 'sensors' && (
            <>
              <Form.Item
                name="name"
                label="Nama Sensor"
                rules={[{ required: true, message: 'Nama sensor harus diisi' }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true, message: 'Status harus diisi' }]}
              >
                <Input />
              </Form.Item>
            </>
          )}
          {activeMenu === 'locations' && (
            <>
              <Form.Item
                name="name"
                label="Nama Sungai"
                rules={[{ required: true, message: 'Nama sungai harus diisi' }]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="address"
                label="Alamat"
                rules={[{ required: true, message: 'Alamat harus diisi' }]}
              >
                <Input.TextArea rows={4} />
              </Form.Item>
              <Form.Item
                name="coordinates"
                label="Koordinat"
              >
                <Input disabled />
              </Form.Item>
              <Form.Item
                name="date"
                label="Tanggal"
              >
                <Input disabled />
              </Form.Item>
            </>
          )}
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit"
              style={{ borderRadius: '100px' }}
            >
              {editingId ? 'Update' : 'Simpan'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

const App = () => {
  return (
    <ConfigProvider
      theme={{
        components: {
          Menu: {
            itemHeight: 40,
            itemSelectedBg: '#fff1f0',
            itemSelectedColor: '#E62F2A',
            itemHoverBg: '#fff1f0',
            itemHoverColor: '#E62F2A',
          },
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
      <DashboardAdmin />
    </ConfigProvider>
  );
};

export default App;