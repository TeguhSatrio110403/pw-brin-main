import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
    Spin,
    Tag,
    Select as AntdSelect,
    Modal as AntdModal
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
    LogoutOutlined,
    UserOutlined,
    ExclamationCircleOutlined,
    ExperimentOutlined,
    FireOutlined,
    RocketOutlined,
    ArrowUpOutlined,
    ArrowDownOutlined,
    ArrowRightOutlined,
    FundOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Marker, Popup, MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import { useRef } from 'react';
import { port } from '../constant/https.jsx';
import AnomaliDetail from './AnomaliDetail';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    LineElement,
    PointElement,
    CategoryScale,
    LinearScale,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

const { Header, Sider, Content } = Layout;
const { Search } = AntInput;
const { Option } = Select; // Destructure Option from Select

const ANOMALY_THRESHOLDS = {
    nilai_turbidity: { min: -1.0, max: 200.0, label: "Turbidity" },
    nilai_ph: { min: 6.0, max: 9.0, label: "pH" },
    nilai_temperature: { min: 10.0, max: 35.0, label: "Temperature" }
};

const hasAnomaly = (data) => {
    const anomalyTypes = [];
    for (const [key, threshold] of Object.entries(ANOMALY_THRESHOLDS)) {
        if (data[key] === undefined) continue;
        const value = Number(data[key]);
        if (isNaN(value)) continue;
        if ((threshold.min !== null && value < threshold.min) ||
            (threshold.max !== null && value > threshold.max)) {
            anomalyTypes.push(threshold.label);
        }
    }
    return {
        isAnomaly: anomalyTypes.length > 0,
        anomalyTypes
    };
};

const getAnomalyDetail = (data, type) => {
    if (data[type] === undefined) {
        return { value: null, isAnomaly: false, message: "Data tidak tersedia" };
    }
    const value = Number(data[type]);
    if (isNaN(value)) {
        return { value: null, isAnomaly: false, message: "Data tidak valid" };
    }
    const threshold = ANOMALY_THRESHOLDS[type];
    if ((threshold.min !== null && value < threshold.min) ||
        (threshold.max !== null && value > threshold.max)) {
        return {
            value,
            isAnomaly: true,
            message:
                (threshold.min !== null && value < threshold.min)
                    ? `Terlalu rendah (${value} < ${threshold.min ?? '-'})`
                    : (threshold.max !== null && value > threshold.max)
                        ? `Terlalu tinggi (${value} > ${threshold.max ?? '-'})`
                        : 'Anomali'
        };
    }
    return { value, isAnomaly: false, message: "Normal" };
};

const markerIcon = new L.Icon({
    iconUrl: 'https://dlvmrafkpmwfitrvgpgc.supabase.co/storage/v1/object/public/marker/markerBaseLocation.png',
    iconSize: [40, 40],
});

const markerSelected = new L.Icon({
  iconUrl: 'https://dlvmrafkpmwfitrvgpgc.supabase.co/storage/v1/object/public/marker/waterSelected.png',
  iconSize: [40, 40],
});

// Komponen untuk handle klik pada peta
function LocationPicker({ position, setPosition, setAddress }) {
    useMapEvents({
        click: async (e) => {
            setPosition([e.latlng.lat, e.latlng.lng]);
            if (setAddress) {
                const alamat = await getAddress(e.latlng.lat, e.latlng.lng);
                setAddress(alamat);
            }
        },
    });
    return position ? <Marker position={position} icon={markerSelected} /> : null;
}

const DashboardAdmin = () => {
    const { message } = App.useApp();
    const [activeMenu, setActiveMenu] = useState('anomali'); // Set default to 'anomali' for testing
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
    const [anomaliData, setAnomaliData] = useState([]);
    const [filteredAnomali, setFilteredAnomali] = useState([]);
    const [anomaliLocations, setAnomaliLocations] = useState(['Semua Lokasi']);
    const [selectedAnomaliLocation, setSelectedAnomaliLocation] = useState('Semua Lokasi');
    const [anomaliLoading, setAnomaliLoading] = useState(false);
    const [showDetailAnomali, setShowDetailAnomali] = useState(false);
    const [selectedAnomali, setSelectedAnomali] = useState(null);
    const [selectedLokasi, setSelectedLokasi] = useState(null);
    const navigate = useNavigate();
    const [filterKategori, setFilterKategori] = useState('all');
    const [selectedStatLocation, setSelectedStatLocation] = useState(null);
    const [statData, setStatData] = useState([]);
    const [statLoading, setStatLoading] = useState(false);
    const [allStatData, setAllStatData] = useState([]);
    const [allStatLoading, setAllStatLoading] = useState(false);
    // Tambahkan state alamat lokasi
    const [locationAddress, setLocationAddress] = useState('');
    // Tambahkan state pagination untuk anomali
    const [anomaliCurrentPage, setAnomaliCurrentPage] = useState(1);
    const anomaliPageSize = 10;
    // Tambahkan state untuk loading tambah lokasi
    const [isAddingLocation, setIsAddingLocation] = useState(false);
    // Tambahkan state untuk loading saat menyimpan data
    const [isSavingData, setIsSavingData] = useState(false);
    // Tambahkan state untuk pagination lokasi
    const [locationCurrentPage, setLocationCurrentPage] = useState(1);
    const locationPageSize = 10;

    const menuItems = [
        {
            key: 'anomali',
            icon: <ExclamationCircleOutlined />,
            label: 'Anomali Sensor',
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
            // console.log('Starting fetchData for:', activeMenu);
            setLoading(true);

            // Always fetch location data first
            console.log('Fetching locations data...');
            const locationsResponse = await axios.get(`${port}data_lokasi`);
            // console.log('Raw locations response:', locationsResponse);

            if (locationsResponse.data) {
                const formattedData = locationsResponse.data.map(item => ({
                    id: item.id_lokasi,
                    name: item.nama_sungai,
                    coordinates: `${item.lat}, ${item.lon}`,
                    address: item.alamat,
                    date: item.tanggal,
                    rawDate: new Date(item.tanggal)
                }));
                // console.log('Formatted locations:', formattedData);
                setLocations(formattedData);
                setFilteredLocations(formattedData);
            }

            switch (activeMenu) {
                case 'anomali':
                    await fetchAnomaliData();
                    break;
                case 'users':
                    await fetchUsers();
                    break;
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
                lon: record.coordinates ? record.coordinates.split(',')[1].trim() : '',
                date: record.date ? new Date(record.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
            };
            form.setFieldsValue(formData);
            setLocationAddress(formData.address || ''); // Set alamat jika edit
            setEditingId(record.id);
        } else {
            form.resetFields();
            setLocationAddress(''); // Reset alamat jika tambah baru
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
            setIsSavingData(true); // Aktifkan loading
            
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
        } finally {
            setIsSavingData(false); // Matikan loading
        }
    };

    const handleDelete = (id) => {
        AntdModal.confirm({
            title: 'Yakin hapus data lokasi?',
            icon: <ExclamationCircleOutlined />,
            content: 'Data lokasi yang dihapus tidak bisa dikembalikan.',
            okText: 'Hapus',
            okType: 'danger',
            cancelText: 'Batal',
            onOk: async () => {
        try {
            await axios.delete(`${port}${activeMenu}/${id}`);
            message.success('Data berhasil dihapus');
            fetchData();
        } catch (error) {
            message.error('Gagal menghapus data');
        }
            },
        });
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

    // Helper untuk sort data berdasarkan timestamp
    function sortByTimestamp(arr) {
        return [...arr].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    // Helper untuk mendapatkan summary statistik
    function getSummary(arr, key) {
        const values = arr.map(item => Number(item[key])).filter(v => !isNaN(v));
        if (values.length === 0) return { min: '-', max: '-', avg: '-' };
        const min = Math.min(...values);
        const max = Math.max(...values);
        const avg = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2);
        return { min, max, avg };
    }

    // Helper untuk format 1 angka di belakang koma
    function formatOneDecimal(val) {
        if (val === undefined || val === null || val === '-') return '-';
        const num = Number(val);
        if (isNaN(num)) return '-';
        return num.toFixed(1);
    }

    const fetchStatData = useCallback(async (id_lokasi) => {
        if (!id_lokasi) return;
        setStatLoading(true);
        try {
            const res = await axios.get(`${port}data_combined/${id_lokasi}`);
            if (res.data && res.data.data) {
                const sorted = sortByTimestamp(res.data.data);
                setStatData(sorted);
            } else {
                setStatData([]);
            }
        } catch (err) {
            setStatData([]);
        } finally {
            setStatLoading(false);
        }
    }, []);

    useEffect(() => {
        if (activeMenu === 'statistics' && selectedStatLocation) {
            fetchStatData(selectedStatLocation.id);
        }
    }, [activeMenu, selectedStatLocation, fetchStatData]);

    const fetchAllStatData = useCallback(async () => {
        setAllStatLoading(true);
        try {
            const res = await axios.get(`${port}data_combined`);
            if (res.data && res.data.data) {
                const sorted = sortByTimestamp(res.data.data);
                setAllStatData(sorted);
            } else {
                setAllStatData([]);
            }
        } catch (err) {
            setAllStatData([]);
        } finally {
            setAllStatLoading(false);
        }
    }, []);

    useEffect(() => {
        if (activeMenu === 'statistics' && !selectedStatLocation) {
            fetchAllStatData();
        }
    }, [activeMenu, selectedStatLocation, fetchAllStatData]);

    // Tambahkan useEffect untuk reset data statistik saat pilihan lokasi berubah
    useEffect(() => {
        if (activeMenu === 'statistics') {
            if (!selectedStatLocation) {
                setStatData([]); // clear statData jika semua lokasi
                fetchAllStatData();
            } else {
                setAllStatData([]); // clear allStatData jika lokasi tertentu
                fetchStatData(selectedStatLocation.id);
            }
        }
        // eslint-disable-next-line
    }, [activeMenu, selectedStatLocation]);

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

    const fetchAnomaliData = async () => {
        setAnomaliLoading(true);
        try {
            let allAnomali = [];
            // Ambil data dari endpoint klasifikasi/all
            const resPromise = axios.get(`${port}klasifikasi/all`);
            // Tambahkan delay minimal 3 detik
            const delayPromise = new Promise(res => setTimeout(res, 3000));
            const [res] = await Promise.all([resPromise, delayPromise]);
            if (res.data && res.data.success && Array.isArray(res.data.data)) {
                for (const item of res.data.data) {
                    // Struktur data mengikuti index.tsx
                    const data = {
                        id: item.id_klasifikasi, // id utama anomali
                        location: item.data_lokasi?.nama_sungai || '-',
                        date: new Date(item.tanggal).toLocaleDateString('id-ID'),
                        time: new Date(item.tanggal).toLocaleTimeString('id-ID'),
                        nilai_turbidity: item.data_turbidity?.nilai_turbidity,
                        nilai_ph: item.data_ph?.nilai_ph,
                        nilai_temperature: item.data_temperature?.nilai_temperature
                    };
                    // Ambil lat/lon sensor jika ada
                    const pH = {
                        ...getAnomalyDetail(data, 'nilai_ph'),
                        lat: item.data_ph?.lat,
                        lon: item.data_ph?.lon
                    };
                    const temperature = {
                        ...getAnomalyDetail(data, 'nilai_temperature'),
                        lat: item.data_temperature?.lat,
                        lon: item.data_temperature?.lon
                    };
                    const turbidity = {
                        ...getAnomalyDetail(data, 'nilai_turbidity'),
                        lat: item.data_turbidity?.lat,
                        lon: item.data_turbidity?.lon
                    };
                    const anomalyCheck = hasAnomaly(data);
                    if (anomalyCheck.isAnomaly) {
                        allAnomali.push({
                            ...data,
                            turbidity,
                            pH,
                            temperature,
                            anomalyTypes: anomalyCheck.anomalyTypes
                        });
                    }
                }
            }
            setAnomaliData(allAnomali);
        } catch (err) {
            message.error('Gagal mengambil data anomali sensor');
        } finally {
            setAnomaliLoading(false);
        }
    };

    useEffect(() => {
        if (activeMenu === 'anomali' && locations.length > 0) {
            fetchAnomaliData();
        }
    }, [activeMenu, locations]);

    useEffect(() => {
        let filtered = anomaliData;
        if (selectedAnomaliLocation && selectedAnomaliLocation !== 'Semua Lokasi') {
            filtered = filtered.filter(item => item.location === selectedAnomaliLocation);
        }
        setFilteredAnomali(filtered);
    }, [anomaliData, selectedAnomaliLocation]);

    useEffect(() => {
        if (locations.length > 0) {
            setAnomaliLocations(['Semua Lokasi', ...locations.map(loc => loc.name)]);
        }
    }, [locations]);

    const renderAnomalyDetail = (label, data) => {
        if (data.isAnomaly) {
            return (
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                    <ExclamationCircleOutlined style={{ color: '#E62F2A', marginRight: 8 }} />
                    <span style={{ color: '#E62F2A' }}>{label}</span>
                    <Tag
                        color={label === 'Turbidity' ? '#5a2283' : (label === 'pH' ? '#715099' : '#e6a72a')}
                        style={{ marginLeft: 'auto', borderRadius: '4px', padding: '4px 8px' }}
                    >
                        {data.message}
                    </Tag>
                </div>
            );
        }
        return null; // Don't show if not an anomaly
    };

    const handleLihatDetail = (anomali) => {
        setSelectedAnomali(anomali);
        const lokasi = locations.find(l => l.name === anomali.location);
        setSelectedLokasi(lokasi);
        setShowDetailAnomali(true);
    };

    const handleBackDetail = () => {
        setShowDetailAnomali(false);
        setSelectedAnomali(null);
        setSelectedLokasi(null);
    };

    const handleDeleteDetail = () => {
        // Dummy: close detail, bisa tambahkan konfirmasi/hapus data
        setShowDetailAnomali(false);
        setSelectedAnomali(null);
        setSelectedLokasi(null);
        // message.success('Data anomali dihapus (dummy)');
    };

    const handleUpdateDetail = () => {
        fetchAnomaliData();
    };

    // Fungsi untuk handle tambah lokasi dengan loading
    const handleAddLocation = () => {
        setIsAddingLocation(true);
        
        // Simulasi loading selama 5 detik
        setTimeout(() => {
            setIsAddingLocation(false);
            navigate('/dashboard');
        }, 5000);
    };

    // Filter lokasi saja untuk kebutuhan jumlah pada tombol filter
    const filteredByLocation = useMemo(() => {
        if (selectedAnomaliLocation && selectedAnomaliLocation !== 'Semua Lokasi') {
            return anomaliData.filter(item => item.location === selectedAnomaliLocation);
        }
        return anomaliData;
    }, [anomaliData, selectedAnomaliLocation]);

    // Jumlah pada tombol filter hanya berdasarkan lokasi
    const countAll = () => filteredByLocation.length;
    const countTurbidity = () => filteredByLocation.filter(item => item.turbidity.isAnomaly).length;
    const countPH = () => filteredByLocation.filter(item => item.pH.isAnomaly).length;
    const countTemperature = () => filteredByLocation.filter(item => item.temperature.isAnomaly).length;

    // Gabungan filter lokasi dan kategori untuk card dan info utama
    const filteredAndKategoriAnomali = useMemo(() => {
        let filtered = filteredByLocation;
        switch (filterKategori) {
            case 'turbidity':
                return filtered.filter(item => item.turbidity.isAnomaly);
            case 'ph':
                return filtered.filter(item => item.pH.isAnomaly);
            case 'temperature':
                return filtered.filter(item => item.temperature.isAnomaly);
            default:
                return filtered;
        }
    }, [filteredByLocation, filterKategori]);

    // Tambahkan pagination untuk anomali
    const paginatedAnomali = useMemo(() => {
        const startIndex = (anomaliCurrentPage - 1) * anomaliPageSize;
        const endIndex = startIndex + anomaliPageSize;
        return filteredAndKategoriAnomali.slice(startIndex, endIndex);
    }, [filteredAndKategoriAnomali, anomaliCurrentPage]);

    // Reset halaman saat filter berubah
    useEffect(() => {
        setAnomaliCurrentPage(1);
    }, [filterKategori, selectedAnomaliLocation]);

    // Tambahkan useMemo untuk data lokasi yang dipaginate
    const paginatedLocations = useMemo(() => {
        const data = filteredLocations.length > 0 ? filteredLocations : locations;
        const startIndex = (locationCurrentPage - 1) * locationPageSize;
        const endIndex = startIndex + locationPageSize;
        return data.slice(startIndex, endIndex);
    }, [filteredLocations, locations, locationCurrentPage]);

    // Reset halaman saat filter/search berubah
    useEffect(() => {
        setLocationCurrentPage(1);
    }, [filteredLocations, locations, searchText]);

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
                                    onClick={handleAddLocation}
                                    loading={isAddingLocation}
                                    disabled={isAddingLocation}
                                    style={{ borderRadius: '100px' }}
                                >
                                    {isAddingLocation ? 'Mengarahkan ke Peta...' : 'Tambah Lokasi'}
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
                                style={{ width: 300, borderRadius: '100px' }}
                                aria-label="Cari lokasi"
                            />
                        </div>
                        <Row gutter={[16, 16]}>
                            {paginatedLocations.map((location) => (
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
                                        styles={{
                                            body: {
                                            flex: 1,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            padding: '16px'
                                            }
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
                        {/* Pagination untuk lokasi */}
                        {(filteredLocations.length > 0 ? filteredLocations : locations).length > locationPageSize && (
                            <div style={{
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginTop: 24,
                                gap: 8
                            }}>
                                <Button
                                    size="small"
                                    style={{ borderRadius: 8 }}
                                    onClick={() => setLocationCurrentPage(1)}
                                    disabled={locationCurrentPage === 1}
                                >
                                    Awal
                                </Button>
                                <Button
                                    size="small"
                                    style={{ borderRadius: 8 }}
                                    onClick={() => setLocationCurrentPage(Math.max(1, locationCurrentPage - 1))}
                                    disabled={locationCurrentPage === 1}
                                >
                                    Sebelumnya
                                </Button>
                                <span style={{
                                    margin: '0 16px',
                                    alignSelf: 'center',
                                    color: '#666',
                                    fontWeight: '500'
                                }}>
                                    Halaman {locationCurrentPage} dari {Math.ceil((filteredLocations.length > 0 ? filteredLocations : locations).length / locationPageSize)}
                                </span>
                                <Button
                                    size="small"
                                    style={{ borderRadius: 8 }}
                                    onClick={() => setLocationCurrentPage(Math.min(Math.ceil((filteredLocations.length > 0 ? filteredLocations : locations).length / locationPageSize), locationCurrentPage + 1))}
                                    disabled={locationCurrentPage === Math.ceil((filteredLocations.length > 0 ? filteredLocations : locations).length / locationPageSize)}
                                >
                                    Berikutnya
                                </Button>
                                <Button
                                    size="small"
                                    style={{ borderRadius: 8 }}
                                    onClick={() => setLocationCurrentPage(Math.ceil((filteredLocations.length > 0 ? filteredLocations : locations).length / locationPageSize))}
                                    disabled={locationCurrentPage === Math.ceil((filteredLocations.length > 0 ? filteredLocations : locations).length / locationPageSize)}
                                >
                                    Akhir
                                </Button>
                            </div>
                        )}
                    </>
                );
            case 'anomali':
                return (
                    <div style={{ padding: '0px 0px 24px 0px' }}>
                        <div className="filter-lokasi-row" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ marginBottom: 8, color: '#666' }}>Filter Lokasi</div>
                                <Space>
                                    <Button
                                        type={filterKategori === 'all' ? 'primary' : 'default'}
                                        onClick={() => setFilterKategori('all')}
                                        style={{ borderRadius: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}
                                    >
                                        <ExclamationCircleOutlined style={{ marginRight: 6 }} /> Semua Anomali ({countAll()})
                                    </Button>
                                    <Button
                                        type={filterKategori === 'turbidity' ? 'primary' : 'default'}
                                        onClick={() => setFilterKategori('turbidity')}
                                        style={{ borderRadius: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}
                                    >
                                        <ExclamationCircleOutlined style={{ marginRight: 6 }} /> Turbidity ({countTurbidity()})
                                    </Button>
                                    <Button
                                        type={filterKategori === 'ph' ? 'primary' : 'default'}
                                        onClick={() => setFilterKategori('ph')}
                                        style={{ borderRadius: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}
                                    >
                                        <ExclamationCircleOutlined style={{ marginRight: 6 }} /> pH ({countPH()})
                                    </Button>
                                    <Button
                                        type={filterKategori === 'temperature' ? 'primary' : 'default'}
                                        onClick={() => setFilterKategori('temperature')}
                                        style={{ borderRadius: '8px', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}
                                    >
                                        <ExclamationCircleOutlined style={{ marginRight: 6 }} /> Temperature ({countTemperature()})
                                    </Button>
                                    <Select
                                        value={selectedAnomaliLocation}
                                        style={{ width: 200 }}
                                        onChange={setSelectedAnomaliLocation}
                                        dropdownRender={menu => (
                                            <div style={{ borderRadius: 8, overflow: 'hidden' }}>{menu}</div>
                                        )}
                                    >
                                        {anomaliLocations.map(loc => (
                                            <Option key={loc} value={loc}>{loc}</Option>
                                        ))}
                                    </Select>
                                </Space>
                            </div>
                        </div>

                        <div style={{ color: '#666', marginBottom: 16 }}>
                            {selectedAnomaliLocation === 'Semua Lokasi'
                                ? `Menampilkan ${filteredAndKategoriAnomali.length} anomali dari semua lokasi`
                                : `Menampilkan ${filteredAndKategoriAnomali.length} anomali dari ${selectedAnomaliLocation}`}
                        </div>

                        {anomaliLoading ? (
                            <Spin size="large" style={{ display: 'block', margin: 'auto' }} />
                        ) : filteredAndKategoriAnomali.length === 0 ? (
                            <p style={{ textAlign: 'center', marginTop: 50, color: '#888' }}>Tidak ada data anomali yang ditemukan.</p>
                        ) : (
                            <Row gutter={[16, 16]}>
                                {paginatedAnomali.map((item, idx) => (
                                    <Col xs={24} md={12} key={idx}>
                                        <Card
                                            style={{
                                                borderRadius: 12,
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                                borderLeft: '4px solid #E62F2A',
                                                marginBottom: 16,
                                            }}
                                            styles={{
                                                body: { padding: 20 }
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                                <div style={{ fontWeight: 'bold', fontSize: '1.1em' }}>ID: {item.id}</div>
                                                <div style={{ color: '#007bff', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}><EnvironmentOutlined style={{ marginRight: 8 }} />{item.location}</div>
                                            </div>
                                            <div style={{ color: '#222', marginBottom: 12, display: 'flex', alignItems: 'center' }}>
                                                {item.date} {item.time}
                                            </div>
                                            <Space wrap style={{ marginBottom: 16 }}>
                                                {/* Turbidity */}
                                                <Tag color={item.turbidity.isAnomaly ? '#F7E6EB' : '#E6F7E6'} style={{ color: item.turbidity.isAnomaly ? '#E62F2A' : '#52c41a', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <i className="bi bi-droplet-fill" style={{ fontSize: 18, marginRight: 4 }}></i>
                                                    Turbidity: {item.turbidity.value} {item.turbidity.isAnomaly ? (item.turbidity.threshold ? `(Anomali ${item.turbidity.threshold})` : '(Anomali)') : '(Normal)'}
                                                </Tag>
                                                {/* pH */}
                                                <Tag color={item.pH.isAnomaly ? '#F7E6EB' : '#E6F7E6'} style={{ color: item.pH.isAnomaly ? '#E62F2A' : '#52c41a', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <i className="material-symbols-outlined" style={{ fontSize: 22 }}>experiment</i>
                                                    pH: {item.pH.value} {item.pH.isAnomaly ? (item.pH.threshold ? `(Anomali ${item.pH.threshold})` : '(Anomali)') : '(Normal)'}
                                                </Tag>
                                                {/* Temperature */}
                                                <Tag color={item.temperature.isAnomaly ? '#F7E6EB' : '#E6F7E6'} style={{ color: item.temperature.isAnomaly ? '#E62F2A' : '#52c41a', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                    <i className="bi bi-thermometer-half" style={{ fontSize: 18, marginRight: 4 }}></i>
                                                    Temperature: {item.temperature.value} {item.temperature.isAnomaly ? (item.temperature.threshold ? `(Anomali ${item.temperature.threshold})` : '(Anomali)') : '(Normal)'}
                                                </Tag>
                                            </Space>
                                            <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
                                                {renderAnomalyDetail('Turbidity', item.turbidity)}
                                                {renderAnomalyDetail('pH', item.pH)}
                                                {renderAnomalyDetail('Temperature', item.temperature)}
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                                                <Button type="link" style={{ padding: 0, color: '#1890ff' }} onClick={() => handleLihatDetail(item)}>Lihat Detail</Button>
                                                <Button
                                                    icon={<DeleteOutlined />}
                                                    danger
                                                    onClick={() => handleDeleteAnomali(item.id)}
                                                />
                                            </div>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                        )}
                        
                        {/* Pagination untuk anomali */}
                        {filteredAndKategoriAnomali.length > 0 && (
                            <div style={{ 
                                display: 'flex', 
                                justifyContent: 'center', 
                                alignItems: 'center', 
                                marginTop: 24,
                                gap: 8
                            }}>
                                <Button 
                                    size="small" 
                                    style={{ borderRadius: 8 }} 
                                    onClick={() => setAnomaliCurrentPage(1)} 
                                    disabled={anomaliCurrentPage === 1}
                                >
                                    Awal
                                </Button>
                                <Button 
                                    size="small" 
                                    style={{ borderRadius: 8 }} 
                                    onClick={() => setAnomaliCurrentPage(Math.max(1, anomaliCurrentPage - 1))} 
                                    disabled={anomaliCurrentPage === 1}
                                >
                                    Sebelumnya
                                </Button>
                                <span style={{ 
                                    margin: '0 16px', 
                                    alignSelf: 'center',
                                    color: '#666',
                                    fontWeight: '500'
                                }}>
                                    Halaman {anomaliCurrentPage} dari {Math.ceil(filteredAndKategoriAnomali.length / anomaliPageSize)}
                                </span>
                                <Button 
                                    size="small" 
                                    style={{ borderRadius: 8 }} 
                                    onClick={() => setAnomaliCurrentPage(Math.min(Math.ceil(filteredAndKategoriAnomali.length / anomaliPageSize), anomaliCurrentPage + 1))} 
                                    disabled={anomaliCurrentPage === Math.ceil(filteredAndKategoriAnomali.length / anomaliPageSize)}
                                >
                                    Berikutnya
                                </Button>
                                <Button 
                                    size="small" 
                                    style={{ borderRadius: 8 }} 
                                    onClick={() => setAnomaliCurrentPage(Math.ceil(filteredAndKategoriAnomali.length / anomaliPageSize))} 
                                    disabled={anomaliCurrentPage === Math.ceil(filteredAndKategoriAnomali.length / anomaliPageSize)}
                                >
                                    Akhir
                                </Button>
                            </div>
                        )}
                    </div>
                );
            case 'statistics':
                return (
                    <Card title="Statistik">
                        <div style={{ marginBottom: 16 }}>
                            <Select
                                showSearch
                                placeholder="Pilih lokasi penelitian"
                                optionFilterProp="children"
                                style={{ width: 300 }}
                                value={selectedStatLocation ? selectedStatLocation.id : 'all'}
                                onChange={id => {
                                    if (id === 'all') {
                                        setSelectedStatLocation(null);
                                    } else {
                                        const loc = locations.find(l => l.id === id);
                                        setSelectedStatLocation(loc);
                                    }
                                }}
                                allowClear={false}
                                filterOption={(input, option) =>
                                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                }
                            >
                                <Select.Option key="all" value="all">Semua Lokasi</Select.Option>
                                {locations.map(loc => (
                                    <Select.Option key={loc.id} value={loc.id}>
                                        {loc.name}
                                    </Select.Option>
                                ))}
                            </Select>
                        </div>
                        {selectedStatLocation ? (
                            <div style={{ marginBottom: 16 }}>
                                <p><strong>Nama Sungai:</strong> {selectedStatLocation.name}</p>
                                <p><strong>Alamat:</strong> {selectedStatLocation.address}</p>
                                <p><strong>Tanggal:</strong> {new Date(selectedStatLocation.date).toLocaleDateString('id-ID', {
                                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                                })}</p>
                            </div>
                        ) : null}
                        {(selectedStatLocation ? statLoading : allStatLoading) && <Spin />}
                        {(selectedStatLocation ? statData.length > 0 : allStatData.length > 0) && !((selectedStatLocation ? statLoading : allStatLoading)) && (
                            <>
                                {selectedStatLocation && (
                            <Card style={{ marginBottom: 24, background: '#fffbe6', border: '1px solid #ffe58f' }}>
                                <h4>Data Terbaru</h4>
                                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                                            <div>Kekeruhan: <b>{formatOneDecimal(statData[0]?.nilai_turbidity)}</b></div>
                                            <div>pH: <b>{formatOneDecimal(statData[0]?.nilai_ph)}</b></div>
                                            <div>Suhu: <b>{formatOneDecimal(statData[0]?.nilai_temperature)}</b></div>
                                            <div>Kecepatan: <b>{statData[0]?.nilai_speed ?? '-'}</b></div>
                                            <div>Akselerasi X: <b>{statData[0]?.nilai_accel_x ?? '-'}</b></div>
                                            <div>Akselerasi Y: <b>{statData[0]?.nilai_accel_y ?? '-'}</b></div>
                                            <div>Akselerasi Z: <b>{statData[0]?.nilai_accel_z ?? '-'}</b></div>
                                </div>
                            </Card>
                        )}
                                <div style={{ fontWeight: 600, margin: '16px 0 8px 0' }}>Parameter Air</div>
                                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                                    <StatMiniCard
                                        icon={<i className="bi bi-droplet-fill"></i>}
                                        title="Kekeruhan (NTU)"
                                        value={formatOneDecimal((selectedStatLocation ? statData[0]?.nilai_turbidity : allStatData[0]?.nilai_turbidity))}
                                        avg={getSummary(selectedStatLocation ? statData : allStatData, 'nilai_turbidity').avg}
                                        min={getSummary(selectedStatLocation ? statData : allStatData, 'nilai_turbidity').min}
                                        max={getSummary(selectedStatLocation ? statData : allStatData, 'nilai_turbidity').max}
                                        color="#1890ff"
                                    />
                                    <StatMiniCard
                                        icon={<i className="material-symbols-outlined" style={{ fontSize: 22 }}>experiment</i>}
                                        title="pH"
                                        value={formatOneDecimal((selectedStatLocation ? statData[0]?.nilai_ph : allStatData[0]?.nilai_ph))}
                                        avg={getSummary(selectedStatLocation ? statData : allStatData, 'nilai_ph').avg}
                                        min={getSummary(selectedStatLocation ? statData : allStatData, 'nilai_ph').min}
                                        max={getSummary(selectedStatLocation ? statData : allStatData, 'nilai_ph').max}
                                        color="#faad14"
                                    />
                                    <StatMiniCard
                                        icon={<i className="bi bi-thermometer-half"></i>}
                                        title="Suhu (°C)"
                                        value={formatOneDecimal((selectedStatLocation ? statData[0]?.nilai_temperature : allStatData[0]?.nilai_temperature))}
                                        avg={getSummary(selectedStatLocation ? statData : allStatData, 'nilai_temperature').avg}
                                        min={getSummary(selectedStatLocation ? statData : allStatData, 'nilai_temperature').min}
                                        max={getSummary(selectedStatLocation ? statData : allStatData, 'nilai_temperature').max}
                                        color="#f5222d"
                                    />
                                </div>
                                <div style={{ fontWeight: 600, margin: '16px 0 8px 0' }}>Parameter Gerak</div>
                                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                                    <StatMiniCard
                                        icon={<i className="bi bi-speedometer2"></i>}
                                        title="Kecepatan (m/s)"
                                        value={selectedStatLocation ? statData[0]?.nilai_speed ?? '-' : allStatData[0]?.nilai_speed ?? '-'}
                                        avg={getSummary(selectedStatLocation ? statData : allStatData, 'nilai_speed').avg}
                                        min={getSummary(selectedStatLocation ? statData : allStatData, 'nilai_speed').min}
                                        max={getSummary(selectedStatLocation ? statData : allStatData, 'nilai_speed').max}
                                        color="#52c41a"
                                    />
                                    <StatMiniCard
                                        icon={<ArrowRightOutlined />}
                                        title="Akselerasi X"
                                        value={selectedStatLocation ? statData[0]?.nilai_accel_x ?? '-' : allStatData[0]?.nilai_accel_x ?? '-'}
                                        avg={getSummary(selectedStatLocation ? statData : allStatData, 'nilai_accel_x').avg}
                                        min={getSummary(selectedStatLocation ? statData : allStatData, 'nilai_accel_x').min}
                                        max={getSummary(selectedStatLocation ? statData : allStatData, 'nilai_accel_x').max}
                                        color="#722ed1"
                                    />
                                    <StatMiniCard
                                        icon={<ArrowUpOutlined />}
                                        title="Akselerasi Y"
                                        value={selectedStatLocation ? statData[0]?.nilai_accel_y ?? '-' : allStatData[0]?.nilai_accel_y ?? '-'}
                                        avg={getSummary(selectedStatLocation ? statData : allStatData, 'nilai_accel_y').avg}
                                        min={getSummary(selectedStatLocation ? statData : allStatData, 'nilai_accel_y').min}
                                        max={getSummary(selectedStatLocation ? statData : allStatData, 'nilai_accel_y').max}
                                        color="#eb2f96"
                                    />
                                    <StatMiniCard
                                        icon={<ArrowDownOutlined />}
                                        title="Akselerasi Z"
                                        value={selectedStatLocation ? statData[0]?.nilai_accel_z ?? '-' : allStatData[0]?.nilai_accel_z ?? '-'}
                                        avg={getSummary(selectedStatLocation ? statData : allStatData, 'nilai_accel_z').avg}
                                        min={getSummary(selectedStatLocation ? statData : allStatData, 'nilai_accel_z').min}
                                        max={getSummary(selectedStatLocation ? statData : allStatData, 'nilai_accel_z').max}
                                        color="#13c2c2"
                                    />
                                </div>
                                <div style={{ marginTop: 32 }}>
                                    <SensorTrendsChartWeb data={selectedStatLocation ? statData : allStatData} />
                                </div>
                                <div style={{ marginTop: 32 }}>
                                    <h3 style={{ marginBottom: 16 }}>Data Sensor</h3>
                                    <SensorDataTableWeb data={selectedStatLocation ? statData : allStatData} />
                                </div>
                            </>
                        )}
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
                padding: '30px',
                borderRadius: '12px',
                textAlign: 'center',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                minWidth: '200px',
                maxWidth: '300px'
            }}>
                <div style={{
                    width: '60px',
                    height: '60px',
                    border: '6px solid #f3f3f3',
                    borderTop: '6px solid #E62F2A',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 20px auto'
                }}></div>
                <p style={{
                    margin: '0',
                    color: '#333',
                    fontSize: '16px',
                    fontWeight: '600',
                    lineHeight: '1.4'
                }}>
                    Memuat Data...
                </p>
                <p style={{
                    margin: '8px 0 0 0',
                    color: '#666',
                    fontSize: '14px',
                    lineHeight: '1.4'
                }}>
                    Mohon tunggu sebentar
                </p>
            </div>
        </div>
    );

    // Gunakan useMemo untuk posisi marker dan center, pastikan selalu update
    const mapCenter = useMemo(() => {
        const lat = form.getFieldValue('lat');
        const lon = form.getFieldValue('lon');
        if (lat && lon) return [parseFloat(lat), parseFloat(lon)];
        return [-6.34605, 106.69156];
    }, [form.getFieldValue('lat'), form.getFieldValue('lon'), isModalVisible]);

    const markerPosition = useMemo(() => {
        const lat = form.getFieldValue('lat');
        const lon = form.getFieldValue('lon');
        if (lat && lon) return [parseFloat(lat), parseFloat(lon)];
        return null;
    }, [form.getFieldValue('lat'), form.getFieldValue('lon'), isModalVisible]);

    // Tambahkan fungsi hapus anomali dengan konfirmasi
    const handleDeleteAnomali = (anomaliId) => {
        AntdModal.confirm({
            title: 'Yakin hapus data?',
            icon: <ExclamationCircleOutlined />,
            content: 'Data yang dihapus tidak bisa dikembalikan.',
            okText: 'Hapus',
            okType: 'danger',
            cancelText: 'Batal',
            onOk: async () => {
                try {
                    await axios.delete(`${port}klasifikasi/${anomaliId}`);
                    message.success('Data anomali berhasil dihapus');
                    fetchAnomaliData();
                } catch (err) {
                    message.error('Gagal menghapus data anomali');
                }
            },
        });
    };

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
                                {/* Tulisan Beranda */}
                                <span style={{ fontWeight: 'bold', fontSize: 32, color: '#E62F2A', letterSpacing: 1 }}>Beranda</span>
                                {/* Hanya subteks deskripsi, tanpa garis animasi */}
                                <div style={{ marginTop: 8, marginBottom: 8 }}>
                                    <div style={{ color: '#888', fontSize: 14, textAlign: 'left', fontWeight: 300 }}>
                                        Kelola semua parameter kualitas air dalam satu tempat
                            </div>
                                    <div>
                                        <hr />
                        </div>
                                </div>
                            </div>
                        </div>
                        <style>{`
                        @keyframes slideBar {
                          0% { width: 40px; background: #E62F2A; }
                          100% { width: 80px; background: linear-gradient(90deg, #E62F2A 60%, #fff1f0 100%); }
                        }
                        `}</style>
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
                            marginTop: '50px',
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
                        width={800} // Lebarkan modal
                        styles={{
                            body: { paddingBottom: 0 }
                        }}
                    >
                        <Form
                            form={form}
                            onFinish={handleSubmit}
                            layout="vertical"
                            id="form-container"
                            name="form-container"
                        >
                            {/* {editingId && (
                              <div style={{ 
                                marginBottom: 16, 
                                padding: 12, 
                                backgroundColor: '#fff7e6', 
                                borderRadius: 6, 
                                border: '1px solid #ffd591',
                                fontSize: '13px',
                                color: '#666'
                              }}>
                                <i className="bi bi-pencil-square" style={{ marginRight: 6, color: '#fa8c16' }}></i>
                                Mode Edit: Semua data dapat diubah secara manual.
                              </div>
                            )} */}
                            {/* MAPS UNTUK PILIH TITIK LOKASI, hanya tampil saat tambah lokasi */}
                            {!editingId && (
                              <div style={{ marginBottom: 16 }}>
                                <label style={{ fontWeight: 'bold', marginBottom: 8, display: 'block' }}>
                                  Pilih Titik Lokasi di Peta
                                </label>
                                <div style={{ width: '100%', minHeight: 250, borderRadius: 12, overflow: 'hidden' }}>
                                  <MapContainer
                                    center={mapCenter}
                                    zoom={16}
                                    style={{ height: 300, width: '100%', borderRadius: 12, minHeight: 250 }}
                                    scrollWheelZoom={true}
                                  >
                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                    <LocationPicker
                                      position={markerPosition}
                                      setPosition={(pos) => {
                                        form.setFieldsValue({ lat: pos[0].toFixed(6), lon: pos[1].toFixed(6) });
                                      }}
                                      setAddress={(alamat) => {
                                        setLocationAddress(alamat);
                                        form.setFieldsValue({ address: alamat });
                                      }}
                                    />
                                  </MapContainer>
                                </div>
                                <div style={{ 
                                  marginTop: 8, 
                                  padding: 8, 
                                  backgroundColor: '#f0f8ff', 
                                  borderRadius: 6, 
                                  border: '1px solid #d6e4ff',
                                  fontSize: '13px',
                                  color: '#666'
                                }}>
                                  <i className="bi bi-info-circle" style={{ marginRight: 6, color: '#1890ff' }}></i>
                                  Koordinat dan alamat akan terisi otomatis saat Anda mengklik lokasi pada peta
                                </div>
                              </div>
                            )}
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
                                    placeholder="Masukkan alamat lokasi penelitian"
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
                                    placeholder="Contoh: -6.34605"
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
                                    placeholder="Contoh: 106.69156"
                                />
                            </Form.Item>
                            <Form.Item
                                name="date"
                                label={<label htmlFor="river-date-input">Tanggal</label>}
                                rules={[{ required: true, message: 'Tanggal harus diisi' }]}
                            >
                                <Input
                                    id="river-date-input"
                                    name="river-date"
                                    autoComplete="off"
                                    aria-describedby="river-date-help"
                                    placeholder="yyyy-mm-dd"
                                    type="date"
                                />
                            </Form.Item>
                            <Form.Item>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={isSavingData}
                                    disabled={isSavingData}
                                    style={{ borderRadius: '100px' }}
                                    id="submit-button"
                                    name="submit-button"
                                >
                                    {isSavingData ? 'Menyimpan...' : (editingId ? 'Update' : 'Simpan')}
                                </Button>
                            </Form.Item>
                        </Form>
                    </Modal>

                    <Modal
                        open={showDetailAnomali}
                        onCancel={handleBackDetail}
                        footer={null}
                        width={800}
                        styles={{
                            body: { padding: 0, borderRadius: 16 }
                        }}
                        centered
                        destroyOnClose
                    >
                        <AnomaliDetail
                            anomali={selectedAnomali}
                            lokasi={selectedLokasi}
                            lokasiPenelitian={locations && locations.length > 0 ? locations[0] : null}
                            onBack={handleBackDetail}
                            onDelete={handleDeleteDetail}
                            onUpdate={handleUpdateDetail}
                            hideBackButton
                        />
                    </Modal>

                    {/* Modal Loading untuk Tambah Lokasi */}
                    <Modal
                        open={isAddingLocation}
                        footer={null}
                        closable={false}
                        maskClosable={false}
                        width={400}
                        centered
                    >
                        <div style={{
                            textAlign: 'center',
                            padding: '40px 20px'
                        }}>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                border: '8px solid #f3f3f3',
                                borderTop: '8px solid #E62F2A',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite',
                                margin: '0 auto 30px auto'
                            }}></div>
                            
                            <h3 style={{
                                color: '#E62F2A',
                                marginBottom: '20px',
                                fontSize: '20px',
                                fontWeight: 'bold'
                            }}>
                                Mengarahkan ke Peta
                            </h3>
                            
                            <p style={{
                                color: '#666',
                                fontSize: '16px',
                                lineHeight: '1.6',
                                margin: 0,
                                padding: '0 20px'
                            }}>
                                Silahkan klik pada peta untuk memilih lokasi penelitian
                            </p>
                            
                            <div style={{
                                marginTop: '30px',
                                padding: '15px',
                                backgroundColor: '#f8f9fa',
                                borderRadius: '8px',
                                border: '1px solid #e9ecef'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px',
                                    color: '#495057',
                                    fontSize: '14px'
                                }}>
                                    <i className="bi bi-info-circle-fill" style={{ color: '#E62F2A' }}></i>
                                    <span>Anda akan diarahkan ke halaman dashboard dalam beberapa detik</span>
                                </div>
                            </div>
                        </div>
                    </Modal>
                </>
            )}
        </div>
    );
};

// Komponen Card Statistik Kecil
const StatMiniCard = ({ icon, title, value, avg, min, max, color }) => (
    <Card style={{ width: 200, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 22, color, marginRight: 12 }}>{icon}</span>
            <span style={{ fontWeight: 600 }}>{title}</span>
        </div>
        <Statistic value={value} style={{ marginBottom: 8 }} />
        <div style={{ fontSize: 13 }}>
            <div>Rata-rata: <b>{avg}</b></div>
            <div>Min: <b>{min}</b></div>
            <div>Max: <b>{max}</b></div>
        </div>
    </Card>
);

function SensorDataTableWeb({ data }) {
    // Urutkan data descending berdasarkan timestamp
    const sortedData = [...data].sort((a, b) => new Date(b.timestamp || b.tanggal) - new Date(a.timestamp || a.tanggal));
    // Pagination
    const [page, setPage] = React.useState(1);
    const pageSize = 25;
    const paginatedData = sortedData.slice((page - 1) * pageSize, page * pageSize);
    const total = sortedData.length;
    // Kolom tabel
    const columns = [
        {
            title: 'Waktu',
            dataIndex: 'timestamp',
            key: 'timestamp',
            render: (val, row) => {
                const t = row.timestamp || row.tanggal;
                if (!t) return '-';
                const d = new Date(t);
                return d.toLocaleString('id-ID', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
            },
        },
        {
            title: 'Kekeruhan',
            dataIndex: 'nilai_turbidity',
            key: 'nilai_turbidity',
            render: val => val !== undefined ? Number(val).toFixed(1) + ' NTU' : '-',
        },
        {
            title: 'pH',
            dataIndex: 'nilai_ph',
            key: 'nilai_ph',
            render: val => val !== undefined ? Number(val).toFixed(1) : '-',
        },
        {
            title: 'Suhu',
            dataIndex: 'nilai_temperature',
            key: 'nilai_temperature',
            render: val => val !== undefined ? Number(val).toFixed(1) + ' °C' : '-',
        },
    ];
    // Info pagination
    const start = (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, total);
    // Fungsi ekspor CSV
    function exportCSV() {
        const headers = ['Waktu', 'Kekeruhan', 'pH', 'Suhu'];
        const rows = paginatedData.map(row => [
            columns[0].render(null, row),
            row.nilai_turbidity !== undefined ? Number(row.nilai_turbidity).toFixed(1) : '',
            row.nilai_ph !== undefined ? Number(row.nilai_ph).toFixed(1) : '',
            row.nilai_temperature !== undefined ? Number(row.nilai_temperature).toFixed(1) : ''
        ]);
        const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', `data-sensor-${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ color: '#888' }}>
                    Menampilkan {start} - {end} data | Halaman {page} dari {Math.ceil(total / pageSize)}
                </span>
                <Button size="small" type="primary" style={{ borderRadius: 8 }} onClick={exportCSV}>
                    Ekspor CSV
                </Button>
            </div>
            <Table
                columns={columns}
                dataSource={paginatedData}
                rowKey={(row, idx) => row.id || row._id || idx}
                pagination={{
                    current: page,
                    pageSize,
                    total,
                    onChange: setPage,
                    showSizeChanger: false,
                }}
                bordered
                size="small"
            />
        </div>
    );
}

function SensorTrendsChartWeb({ data }) {
    const [selected, setSelected] = React.useState('turbidity');
    const [currentPage, setCurrentPage] = React.useState(1);
    const dataPerPage = 10;
    // Chart config
    const chartList = [
        { key: 'accel_x', label: 'Accelerometer X (m/s²)', color: '#FF6384' },
        { key: 'accel_y', label: 'Accelerometer Y (m/s²)', color: '#36A2EB' },
        { key: 'accel_z', label: 'Accelerometer Z (m/s²)', color: '#4BC0C0' },
        { key: 'ph', label: 'pH', color: '#FF9F40' },
        { key: 'temperature', label: 'Suhu Air (°C)', color: '#9966FF' },
        { key: 'turbidity', label: 'Tingkat Kekeruhan (NTU)', color: '#FF99CC' },
        { key: 'speed', label: 'Kecepatan Alat (m/s)', color: '#FF99CC' },
    ];
    // Format dan urutkan data terbaru ke terlama
    const formatted = (Array.isArray(data) ? data : []).map(item => {
        const t = item.timestamp || item.tanggal;
        const date = t ? new Date(t) : new Date();
        return {
            accel_x: parseFloat(item.nilai_accel_x ?? item.accel_x) || 0,
            accel_y: parseFloat(item.nilai_accel_y ?? item.accel_y) || 0,
            accel_z: parseFloat(item.nilai_accel_z ?? item.accel_z) || 0,
            ph: parseFloat(item.nilai_ph ?? item.ph) || 0,
            temperature: parseFloat(item.nilai_temperature ?? item.temperature) || 0,
            turbidity: parseFloat(item.nilai_turbidity ?? item.turbidity) || 0,
            speed: parseFloat(item.nilai_speed ?? item.speed) || 0,
            timestamp: t ? date.toLocaleString('id-ID', {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
            }) : '-',
            rawDate: t ? date : new Date(0)
        };
    }).sort((a, b) => b.rawDate - a.rawDate);
    // Helper ambil data per halaman
    function getPageData(arr, key, page) {
        const start = (page - 1) * dataPerPage;
        const end = start + dataPerPage;
        return {
            data: arr.slice(start, end).map(d => d[key]),
            labels: arr.slice(start, end).map(d => d.timestamp),
            total: arr.length
        };
    }
    // Chart options per parameter (mirip Feeds)
    function getOptions(key) {
        const baseOptions = {
            responsive: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        title: function (context) {
                            return context[0]?.label || '';
                        },
                        label: function(context) {
                            const value = context.raw;
                            if (key === 'ph') return `pH: ${value}`;
                            if (key === 'temperature') return `Suhu: ${value}°C`;
                            if (key === 'turbidity') return `Kekeruhan: ${value} NTU`;
                            if (key.startsWith('accel')) return `Nilai: ${value} m/s²`;
                            if (key === 'speed') return `Kecepatan: ${value} m/s`;
                            return `Nilai: ${value}`;
                        }
                    },
                },
            },
            scales: {
                x: {
                    title: { display: true, text: 'Waktu' },
                    ticks: {
                        autoSkip: true,
                        maxRotation: 0,
                        minRotation: 0,
                        callback: function(value, index, values) {
                            // Tampilkan label miring -45 derajat
                            return this.getLabelForValue(value);
                        },
                        color: '#555',
                        font: { size: 12 },
                        padding: 8,
                    },
                    grid: { display: false },
                },
                y: { title: { display: true, text: '' } }
            }
        };
        if (key === 'ph') {
            baseOptions.scales.y = { min: 0, max: 14, title: { display: true, text: 'pH Level' } };
        } else if (key === 'temperature') {
            baseOptions.scales.y = { min: -60, max: 100, title: { display: true, text: 'Suhu (°C)' } };
        } else if (key === 'turbidity') {
            baseOptions.scales.y = { min: 0, max: 550, title: { display: true, text: 'Kekeruhan (NTU)' } };
        } else if (key.startsWith('accel')) {
            baseOptions.scales.y = { min: -6, max: 10, title: { display: true, text: 'Percepatan (m/s²)' } };
        } else if (key === 'speed') {
            baseOptions.scales.y = { min: -12, max: 20, title: { display: true, text: 'Kecepatan (m/s)' } };
        }
        // Tambahkan style miring pada label tanggal
        baseOptions.scales.x.ticks.maxRotation = 45;
        baseOptions.scales.x.ticks.minRotation = 45;
        baseOptions.scales.x.ticks.padding = 12;
        return baseOptions;
    }
    // Pagination controls
    function PaginationControls() {
        const total = formatted.length;
        const totalPages = Math.max(1, Math.ceil(total / dataPerPage));
        return (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 8, gap: 8 }}>
                <Button size="small" style={{ borderRadius: 8 }} onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>Awal</Button>
                <Button size="small" style={{ borderRadius: 8 }} onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>Sebelumnya</Button>
                <span style={{ margin: '0 8px', alignSelf: 'center' }}>Halaman {currentPage} dari {totalPages}</span>
                <Button size="small" style={{ borderRadius: 8 }} onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}>Berikutnya</Button>
                <Button size="small" style={{ borderRadius: 8 }} onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>Akhir</Button>
            </div>
        );
    }
    // Pastikan parameter valid
    const param = chartList.find(c => c.key === selected) || chartList[0];
    const { data: chartData, labels } = getPageData(formatted, param.key, currentPage);
    const hasData = chartData.length > 0;
    return (
        <div style={{ marginBottom: 32 }}>
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <label htmlFor="param-select" style={{ marginRight: 8, minWidth: 110 }}>Pilih Parameter:</label>
                <AntdSelect
                    id="param-select"
                    value={selected}
                    style={{ minWidth: 220, borderRadius: 8 }}
                    onChange={val => { setSelected(val); setCurrentPage(1); }}
                    options={chartList.map(opt => ({ value: opt.key, label: opt.label }))}
                />
            </div>
            <h4>{param.label}</h4>
            <div style={{ width: '100%', overflowX: 'auto', minWidth: 0 }}>
                <div style={{ minWidth: 350, maxWidth: '100%', height: 'auto' }}>
                    <Line
                        data={{
                            labels,
                            datasets: [{
                                label: param.label,
                                data: chartData,
                                borderColor: param.color,
                                backgroundColor: param.color + '1A',
                                tension: 0.3,
                            }]
                        }}
                        options={getOptions(param.key)}
                    />
                </div>
            </div>
            {!hasData && <div style={{ textAlign: 'center', color: '#888', padding: 24 }}>Tidak ada data</div>}
            <PaginationControls />
            <style>{`
            @media (max-width: 600px) {
                .filter-lokasi-row {
                    flex-direction: column !important;
                    align-items: stretch !important;
                    gap: 12px !important;
                }
                .filter-lokasi-row > * {
                    width: 100% !important;
                    margin-bottom: 8px !important;
                }
                .chartjs-render-monitor {
                    max-width: 100% !important;
                    min-width: 350px !important;
                    height: auto !important;
                }
            }
            `}</style>
        </div>
    );
}

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
                    Tag: {
                        colorText: 'rgba(0, 0, 0, 0.88)',
                    },
                    Select: {
                        borderRadius: 8,
                        controlItemBgActive: '#fff1f0', // Active background for select options
                        optionSelectedBg: '#fff1f0',
                        optionSelectedColor: '#E62F2A'
                    }
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
                    @media (max-width: 600px) {
                        .ant-row, .ant-col, .flex-grow-1, .bg-white, .rounded, .shadow-sm, .p-4 {
                            width: 100% !important;
                            max-width: 100vw !important;
                            min-width: 0 !important;
                            overflow-x: hidden !important;
                            box-sizing: border-box !important;
                        }
                        .ant-card {
                            width: 100% !important;
                            max-width: 100vw !important;
                            min-width: 0 !important;
                            margin-bottom: 12px !important;
                            box-sizing: border-box !important;
                        }
                        .ant-card-body {
                            width: 100% !important;
                            max-width: 100vw !important;
                            min-width: 0 !important;
                            box-sizing: border-box !important;
                            padding: 10px !important;
                        }
                        .ant-card-meta-title, .ant-card-meta-description, .ant-card-head-title {
                            font-size: 15px !important;
                            word-break: break-word !important;
                        }
                        .ant-table-wrapper, .ant-table {
                            width: 100% !important;
                            min-width: 0 !important;
                            max-width: 100vw !important;
                            overflow-x: auto !important;
                        }
                        .ant-table-thead > tr > th, .ant-table-tbody > tr > td {
                            font-size: 13px !important;
                            padding: 6px 4px !important;
                            word-break: break-word !important;
                        }
                        .ant-btn {
                            font-size: 13px !important;
                            padding: 6px 12px !important;
                            border-radius: 8px !important;
                        }
                        .ant-select-selector {
                            min-width: 120px !important;
                            font-size: 13px !important;
                            border-radius: 8px !important;
                        }
                        .ant-card-head-title {
                            font-size: 17px !important;
                        }
                        .ant-spin {
                            font-size: 20px !important;
                        }
                        .ant-statistic {
                            margin-bottom: 8px !important;
                        }
                        .ant-card-meta {
                            flex-direction: column !important;
                            align-items: flex-start !important;
                        }
                        .ant-card-meta-detail {
                            width: 100% !important;
                        }
                        .ant-card-actions {
                            flex-direction: column !important;
                            gap: 4px !important;
                        }
                        .ant-table-pagination {
                            flex-direction: column !important;
                            gap: 4px !important;
                        }
                        body, html, #root {
                            overflow-x: hidden !important;
                            width: 100vw !important;
                            min-width: 0 !important;
                        }
                    }
                `}
            </style>
        </ConfigProvider>
    );
};

export default AppWrapper;