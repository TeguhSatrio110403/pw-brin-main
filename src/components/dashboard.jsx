import React, { useState, useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
  Circle
} from 'react-leaflet';
import { io } from 'socket.io-client';
import 'leaflet/dist/leaflet.css';
import 'react-circular-progressbar/dist/styles.css';
import DataOdometer from '../service/hook/index';
import LokasiPenelitian from "../service/hook/formdata";
import MarkerClusterGroup from 'react-leaflet-cluster';
import { Link, useNavigate } from 'react-router-dom';
import { Alert } from 'antd';
import { port } from '../constant/https.jsx'; // Import port dari constant

// Custom icons from the HTML code
const markerLocation = new L.Icon({
  iconUrl: 'https://dlvmrafkpmwfitrvgpgc.supabase.co/storage/v1/object/public/marker/markerBaseLocation.png',
  iconSize: [40, 40],
});

const markerSelected = new L.Icon({
  iconUrl: 'https://dlvmrafkpmwfitrvgpgc.supabase.co/storage/v1/object/public/marker/waterSelected.png',
  iconSize: [40, 40],
});

const markerWaterWays = new L.Icon({
  iconUrl: 'https://dlvmrafkpmwfitrvgpgc.supabase.co/storage/v1/object/public/marker/waterways.png',
  iconSize: [40, 40],
});

const waterMarkerLocation = new L.Icon({
  iconUrl: 'https://dlvmrafkpmwfitrvgpgc.supabase.co/storage/v1/object/public/marker/water_marker_location.png',
  iconSize: [40, 40],
});

const IOTDeviceMarker = new L.Icon({
  iconUrl: 'https://dlvmrafkpmwfitrvgpgc.supabase.co/storage/v1/object/public/marker/target.png',
  iconSize: [40, 40],
  iconAnchor: [20, 40]
});

const RecenterAutomatically = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 16);
  }, [lat, lng, map]);
  return null;
};

const MapEventHandler = ({ onMapClick }) => {
  useMapEvents({
    click: (e) => {
      onMapClick(e);
    },
  });
  return null;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [position, setPosition] = useState(null);
  const [previousPosition, setPreviousPosition] = useState(null);
  const [waterLocations, setWaterLocations] = useState([]);
  const [sensorData, setSensorData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [mapKey, setMapKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [watchId, setWatchId] = useState(null);
  const [locationAddress, setLocationAddress] = useState('');
  const [sensorAddresses, setSensorAddresses] = useState({});
  const [clickedLocation, setClickedLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [clickedMarker, setClickedMarker] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historicalData, setHistoricalData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [latitude, setLatitude] = useState(0);
  const [longitude, setLongitude] = useState(0);
  const [iotPosition, setIotPosition] = useState();
  const [latestSensorData, setLatestSensorData] = useState(null);
  const [serverStatus, setServerStatus] = useState('checking');
  const [showStatus, setShowStatus] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [searchLocation, setSearchLocation] = useState(null);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  // Tambahkan state terpisah untuk search query modal histori
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  // Tambahkan state monitoringLocation
  const [monitoringLocation, setMonitoringLocation] = useState(() => {
    const saved = localStorage.getItem('monitoringLocation');
    return saved ? JSON.parse(saved) : null;
  });
  
  const socketRef = useRef(null);
  const mapRef = useRef(null);

  // Cek status admin dan guest dari localStorage saat komponen dimount
  useEffect(() => {
    const checkUserStatus = () => {
      const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      
      if (userInfo.role === 'admin' || user.role === 'admin') {
        setIsAdmin(true);
        setIsGuest(false);
      } else if (userInfo.role === 'guest' || user.role === 'guest') {
        setIsGuest(true);
        setIsAdmin(false);
      } else {
        setIsAdmin(false);
        setIsGuest(false);
      }
    };
    
    checkUserStatus();
  }, []);

  // Cek status login saat komponen dimount
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (isLoggedIn !== 'true') {
      navigate('/login');
    }
  }, [navigate]);

  // Fungsi untuk logout
  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Fungsi untuk mengecek status server
  const checkServerStatus = async () => {
    try {
      const response = await fetch(port);
      if (response.ok) {
        setServerStatus('connected');
      } else {
        setServerStatus('disconnected');
      }
      // Tampilkan status selama 5 detik
      setShowStatus(true);
      setTimeout(() => setShowStatus(false), 5000);
    } catch (error) {
      console.error('Error checking server status:', error);
      setServerStatus('disconnected');
      setShowStatus(true);
      setTimeout(() => setShowStatus(false), 5000);
    }
  };

  // Cek status server setiap 30 detik
  useEffect(() => {
    checkServerStatus();
    const interval = setInterval(checkServerStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fetch water locations from backend
  const fetchWaterLocations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${port}data_lokasi`);
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
    } finally {
      setLoading(false);
    }
  };

  // Fetch sensor data from backend
  const fetchSensorData = async () => {
    try {
      const response = await fetch(`${port}data_combined`);
      const data = await response.json();
      
      if (data.success) {
        setSensorData(data.data);
      }
    } catch (error) {
      console.error('Error fetching sensor data:', error);
    }
  };

  // Fetch historical data
  const fetchHistoricalData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${port}data_lokasi`);
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
    } finally {
      setLoading(false);
    }
  };

  // Filter data berdasarkan search query
  const filteredHistoricalData = useMemo(() => {
    return historicalData.filter(
      (item) =>
        item.name.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
        item.address.toLowerCase().includes(historySearchQuery.toLowerCase())
    );
  }, [historicalData, historySearchQuery]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredHistoricalData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredHistoricalData.length / itemsPerPage);

  // Initialize socket connection
  useEffect(() => {
    socketRef.current = io(port);

    socketRef.current.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    socketRef.current.on('mqttData', (data) => {
      // console.log('📩 Data MQTT diterima di dashboard:', data);
      if (data?.message) {
        setSensorData(prev => [...prev, data.message]);
        setLatestSensorData(data.message); // Tambahkan ini agar odometer dan marker IoT sinkron
      
      // Update posisi IoT jika ada data lokasi
        if (data.message.latitude && data.message.longitude) {
          const cleanLat = data.message.latitude;
          const cleanLon = data.message.longitude;
        setIotPosition([parseFloat(cleanLat), parseFloat(cleanLon)]);
        }
      }
    });

    socketRef.current.on('new-location', fetchWaterLocations);
    socketRef.current.on('update-location', fetchWaterLocations);
    socketRef.current.on('delete-location', fetchWaterLocations);

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchWaterLocations();
    fetchSensorData();
    getCurrentPosition();
  }, []);

  // Clean up geolocation watch
  useEffect(() => {
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  // Get address for a location
  const getAddress = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
        {
          headers: {
              'User-Agent': 'WaterSensorApp/1.0 (water-sensor@example.com)',
              'Accept': 'application/json'
          }
      }
      );
      
      // Check if response is ok
      if (!response.ok) {
        console.warn(`Nominatim API error: ${response.status} ${response.statusText}`);
        return "Alamat tidak ditemukan";
      }
      
      // Check content type to ensure we get JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('Nominatim API returned non-JSON response');
        return "Alamat tidak ditemukan";
      }
      
      const data = await response.json();
      return data.display_name || "Alamat tidak ditemukan";
    } catch (error) {
      console.error("Error fetching address:", error);
      return "Alamat tidak ditemukan";
    }
  };

  // Update address when position changes
  useEffect(() => {
    if (position) {
      getAddress(position[0], position[1]).then(setLocationAddress);
    }
  }, [position]);

  // Water location markers
  const waterLocationMarkers = useMemo(() => {
    return waterLocations.map(location => (
      <Marker 
        key={`water-${location.id}`} 
        position={location.position}
        icon={waterMarkerLocation}
        eventHandlers={{
          click: () => {
            setClickedLocation({
              lat: location.position[0],
              lng: location.position[1],
              address: location.address,
              name: location.name,
              id: location.id
            });
          }
        }}
      >
        <Popup>
          <div style={{ 
            fontFamily: 'Arial, sans-serif',
            borderRadius: '8px',
            overflow: 'hidden',
            width: '300px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            border: '1px solid #e2e8f0'
          }}>
            {/* Header */}
            <div style={{ 
              padding: '12px 15px',
              background: '#27ae60',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderBottom: '1px solid #e2e8f0'
            }}>
              <div>
                <i className="bi bi-geo-alt-fill" style={{ marginRight: '8px' }}></i>
                {location.name}
              </div>
              <div style={{ 
                fontSize: '12px', 
                backgroundColor: 'rgba(255,255,255,0.3)',
                padding: '2px 6px',
                borderRadius: '10px'
              }}>
                Lokasi
              </div>
            </div>
            
            {/* Content */}
            <div style={{ padding: '15px' }}>
              {/* Alamat */}
              <div style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                  <i className="bi bi-pin-map-fill" style={{ color: '#e74c3c', marginRight: '8px', fontSize: '18px' }}></i>
                  <span style={{ fontWeight: 'bold', color: '#333' }}>Alamat Lokasi</span>
                </div>
                <div style={{ 
                  backgroundColor: '#f8f9fa',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  fontSize: '13px',
                  color: '#333',
                  lineHeight: '1.5'
                }}>
                  {location.address}
                </div>
              </div>
              
              {/* Koordinat */}
              <div style={{ marginBottom: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                  <i className="bi bi-geo" style={{ color: '#3498db', marginRight: '8px', fontSize: '18px' }}></i>
                  <span style={{ fontWeight: 'bold', color: '#333' }}>Koordinat</span>
                </div>
                
                {/* Tampilan yang lebih responsif untuk koordinat */}
                <div style={{ 
                  backgroundColor: '#f8f9fa',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}>
                    <div style={{ 
                      minWidth: '70px', 
                      fontSize: '13px', 
                      color: '#666',
                      fontWeight: 'bold'
                    }}>
                      Latitude:
                    </div>
                    <div style={{ 
                      flex: '1',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      color: '#2980b9',
                      padding: '4px 8px',
                      backgroundColor: 'rgba(52, 152, 219, 0.1)',
                      borderRadius: '4px',
                      wordBreak: 'break-all',
                      textAlign: 'right'
                    }}>
                      {location.position[0].toFixed(6)}
                    </div>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <div style={{ 
                      minWidth: '70px', 
                      fontSize: '13px', 
                      color: '#666',
                      fontWeight: 'bold'
                    }}>
                      Longitude:
                    </div>
                    <div style={{ 
                      flex: '1',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      color: '#2980b9',
                      padding: '4px 8px',
                      backgroundColor: 'rgba(52, 152, 219, 0.1)',
                      borderRadius: '4px',
                      wordBreak: 'break-all',
                      textAlign: 'right'
                    }}>
                      {location.position[1].toFixed(6)}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Info Tambahan */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                  <i className="bi bi-info-circle-fill" style={{ color: '#f39c12', marginRight: '8px', fontSize: '18px' }}></i>
                  <span style={{ fontWeight: 'bold', color: '#333' }}>Informasi</span>
                </div>
                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: '#f8f9fa',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0'
                }}>
                  <i className="bi bi-calendar-event" style={{ color: '#7f8c8d', marginRight: '8px' }}></i>
                  <div>
                    <div style={{ fontSize: '12px', color: '#666' }}>Tanggal Pencatatan</div>
                    <div style={{ fontWeight: 'bold', color: '#333' }}>{location.date}</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div style={{ 
              padding: '12px 15px',
              backgroundColor: '#f8f9fa',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              justifyContent: 'center',
              gap: '10px'
            }}>
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Mencegah event bubbling
                  if (mapRef.current) {
                    mapRef.current.setView(location.position, 18);
                  }
                }}
                style={{
                  backgroundColor: '#27ae60',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  transition: 'all 0.2s ease'
                }}
              >
                <i className="bi bi-zoom-in"></i>
                Perbesar Lokasi
              </button>
            </div>
          </div>
        </Popup>
      </Marker>
    ));
  }, [waterLocations, mapRef, position]);

  // Sensor data markers
  const sensorMarkers = useMemo(() => {
    return sensorData
      .map((data, idx) => {
        // Validasi data koordinat dan gunakan format yang konsisten
        const lat = data.latitude || data.lat;
        const lon = data.longitude || data.lon;
        
        // Skip jika tidak ada koordinat valid
        if (!lat || !lon) {
          console.warn('Data sensor tidak memiliki koordinat valid:', data);
          return null;
        }
        
        const cleanLat = lat.toString().split('.').slice(0, 2).join('.');
        const cleanLon = lon.toString().split('.').slice(0, 2).join('.');
      
      // Menentukan status pH
      const getPHStatus = (value) => {
        if (value < 6) return { color: '#e74c3c', text: 'Asam' };
        if (value > 8) return { color: '#e67e22', text: 'Basa' };
        return { color: '#2ecc71', text: 'Normal' };
      };
      
      // Menentukan status suhu
      const getTempStatus = (value) => {
        if (value > 30) return { color: '#e74c3c', text: 'Tinggi' };
        if (value < 20) return { color: '#3498db', text: 'Rendah' };
        return { color: '#2ecc71', text: 'Normal' };
      };
      
      // Menentukan status kekeruhan
      const getTurbidityStatus = (value) => {
        if (value > 50) return { color: '#e74c3c', text: 'Keruh' };
        if (value > 25) return { color: '#e67e22', text: 'Sedang' };
        return { color: '#2ecc71', text: 'Jernih' };
      };
      
        // Gunakan format field yang konsisten
        const phValue = data.nilai_ph || data.ph || 0;
        const tempValue = data.nilai_temperature || data.temperature || 0;
        const turbidityValue = data.nilai_turbidity || data.turbidity || 0;
        const speedValue = data.nilai_speed || data.speed || 0;
        const accelX = data.nilai_accel_x || data.accel_x || 0;
        const accelY = data.nilai_accel_y || data.accel_y || 0;
        const accelZ = data.nilai_accel_z || data.accel_z || 0;
        
        const phStatus = getPHStatus(phValue);
        const tempStatus = getTempStatus(tempValue);
        const turbidityStatus = getTurbidityStatus(turbidityValue);
      
      return (
        <Marker 
          key={`sensor-${idx}`} 
          position={[parseFloat(cleanLat), parseFloat(cleanLon)]}
          icon={markerWaterWays}
        >
          <Popup>
            <div style={{ 
              fontFamily: 'Arial, sans-serif',
              borderRadius: '8px',
              overflow: 'hidden',
              width: '300px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              border: '1px solid #e2e8f0'
            }}>
              {/* Header */}
              <div style={{ 
                padding: '12px 15px',
                background: '#3498db',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid #e2e8f0'
              }}>
                <span><i className="bi bi-water" style={{ marginRight: '8px' }}></i>Data Sensor</span>
                <span style={{ fontSize: '12px', opacity: '0.9' }}>{new Date(data.tanggal).toLocaleString()}</span>
              </div>
              
              {/* Content */}
              <div style={{ padding: '15px' }}>
                {/* pH Value */}
                <div style={{ marginBottom: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ fontWeight: 'bold', color: '#333' }}>pH</span>
                    <span style={{ 
                      fontSize: '13px', 
                      backgroundColor: phStatus.color, 
                      color: 'white', 
                      padding: '2px 8px', 
                      borderRadius: '10px' 
                    }}>
                      {phStatus.text}
                  </span>
                  </div>
                  <div style={{ 
                    height: '10px', 
                    backgroundColor: '#e0e0e0', 
                    borderRadius: '5px',
                    overflow: 'hidden',
                    marginBottom: '3px'
                  }}>
                    <div style={{ 
                      height: '100%', 
                        width: `${(phValue / 14) * 100}%`,
                      backgroundColor: phStatus.color, 
                      borderRadius: '5px'
                    }}></div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#666' }}>
                    <span>0</span>
                      <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#333' }}>{phValue}</span>
                    <span>14</span>
                  </div>
                </div>
                
                {/* Temperature */}
                <div style={{ marginBottom: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ fontWeight: 'bold', color: '#333' }}>Suhu</span>
                    <span style={{ 
                      fontSize: '13px', 
                      backgroundColor: tempStatus.color, 
                      color: 'white', 
                      padding: '2px 8px', 
                      borderRadius: '10px' 
                    }}>
                      {tempStatus.text}
                  </span>
                  </div>
                  <div style={{ 
                    height: '10px', 
                    backgroundColor: '#e0e0e0', 
                    borderRadius: '5px',
                    overflow: 'hidden',
                    marginBottom: '3px'
                  }}>
                    <div style={{ 
                      height: '100%', 
                        width: `${(tempValue / 40) * 100}%`,
                      backgroundColor: tempStatus.color, 
                      borderRadius: '5px'
                    }}></div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#666' }}>
                    <span>0°C</span>
                      <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#333' }}>{tempValue}°C</span>
                    <span>40°C</span>
                  </div>
                </div>
                
                {/* Turbidity */}
                <div style={{ marginBottom: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ fontWeight: 'bold', color: '#333' }}>Kekeruhan</span>
                    <span style={{ 
                      fontSize: '13px', 
                      backgroundColor: turbidityStatus.color, 
                      color: 'white', 
                      padding: '2px 8px', 
                      borderRadius: '10px' 
                    }}>
                      {turbidityStatus.text}
                    </span>
                  </div>
                  <div style={{ 
                    height: '10px', 
                    backgroundColor: '#e0e0e0', 
                    borderRadius: '5px',
                    overflow: 'hidden',
                    marginBottom: '3px'
                  }}>
                    <div style={{ 
                      height: '100%', 
                        width: `${Math.min((turbidityValue / 100) * 100, 100)}%`,
                      backgroundColor: turbidityStatus.color, 
                      borderRadius: '5px'
                    }}></div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#666' }}>
                    <span>0 NTU</span>
                      <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#333' }}>{turbidityValue} NTU</span>
                    <span>100+ NTU</span>
                  </div>
                </div>
                
                {/* Speed */}
                <div style={{ marginBottom: '15px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ fontWeight: 'bold', color: '#333' }}>Kecepatan</span>
                  </div>
                  <div style={{ 
                    height: '10px', 
                    backgroundColor: '#e0e0e0', 
                    borderRadius: '5px',
                    overflow: 'hidden',
                    marginBottom: '3px'
                  }}>
                    <div style={{ 
                      height: '100%', 
                        width: `${Math.min((speedValue / 5) * 100, 100)}%`,
                      backgroundColor: '#2980b9', 
                      borderRadius: '5px'
                    }}></div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#666' }}>
                    <span>0 m/s</span>
                      <span style={{ fontWeight: 'bold', fontSize: '14px', color: '#333' }}>{speedValue} m/s</span>
                    <span>5+ m/s</span>
                  </div>
                </div>
                
                {/* Accelerometer Data in Grid */}
                <div style={{ marginTop: '10px' }}>
                  <div style={{ fontWeight: 'bold', color: '#333', marginBottom: '8px' }}>Data Accelerometer</div>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '8px',
                    textAlign: 'center'
                  }}>
                    <div style={{ 
                      padding: '8px', 
                      backgroundColor: '#f8f9fa', 
                      borderRadius: '5px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{ fontSize: '12px', color: '#666' }}>X-Axis</div>
                        <div style={{ fontWeight: 'bold', color: '#e74c3c' }}>{accelX} m/s²</div>
                    </div>
                    <div style={{ 
                      padding: '8px', 
                      backgroundColor: '#f8f9fa', 
                      borderRadius: '5px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{ fontSize: '12px', color: '#666' }}>Y-Axis</div>
                        <div style={{ fontWeight: 'bold', color: '#2ecc71' }}>{accelY} m/s²</div>
                    </div>
                    <div style={{ 
                      padding: '8px', 
                      backgroundColor: '#f8f9fa', 
                      borderRadius: '5px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{ fontSize: '12px', color: '#666' }}>Z-Axis</div>
                        <div style={{ fontWeight: 'bold', color: '#3498db' }}>{accelZ} m/s²</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Footer */}
              <div style={{ 
                padding: '10px 15px',
                backgroundColor: '#f8f9fa',
                borderTop: '1px solid #e2e8f0',
                fontSize: '12px',
                color: '#666',
                textAlign: 'center'
              }}>
                <i className="bi bi-geo-alt-fill" style={{ color: '#e74c3c', marginRight: '5px' }}></i>
                {cleanLat}, {cleanLon}
              </div>
            </div>
          </Popup>
        </Marker>
      );
      })
      .filter(marker => marker !== null); // Filter out null markers
  }, [sensorData, sensorAddresses]);

  const getAddressFromCoordinates = async (lat, lng) => {
    try {
      const response = await fetch(`${port}api/geocode?lat=${lat}&lon=${lng}`);
      
      if (!response.ok) {
        console.warn(`Geocode API error: ${response.status} ${response.statusText}`);
        return 'Alamat tidak tersedia';
      }
      
      // Check content type to ensure we get JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('Geocode API returned non-JSON response');
        return 'Alamat tidak tersedia';
      }
      
      const data = await response.json();
      return data.display_name || 'Alamat tidak tersedia';
    } catch (error) {
      console.error('Error getting address:', error);
      return 'Alamat tidak tersedia';
    }
  };

  const getCurrentPosition = () => {
    if (!navigator.geolocation) {
      console.error("Geolocation tidak didukung oleh browser Anda");
      setError("Geolocation tidak didukung oleh browser Anda");
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    const successCallback = (position) => {
      const { latitude, longitude } = position.coords;
      setPosition([latitude, longitude]);
      setError(null);
      setRetryCount(0);
    };

    const errorCallback = (error) => {
      console.error("Error getting location:", error);
      let errorMessage = "";
      
      switch(error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = "Akses lokasi ditolak. Mohon izinkan akses lokasi di pengaturan browser Anda.";
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = "Informasi lokasi tidak tersedia. Pastikan GPS Anda aktif.";
          break;
        case error.TIMEOUT:
          errorMessage = "Permintaan lokasi timeout. Mohon coba lagi.";
          break;
        default:
          errorMessage = "Terjadi kesalahan saat mendapatkan lokasi.";
      }
      
      setError(errorMessage);
      
      if (retryCount < 3) {
        // console.log(`Retrying location fetch... Attempt ${retryCount + 1}`);
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          getCurrentPosition();
        }, 2000);
      } else {
        console.error("Maksimum percobaan mendapatkan lokasi tercapai");
        setError("Gagal mendapatkan lokasi setelah beberapa percobaan. Mohon periksa pengaturan GPS dan koneksi internet Anda.");
      }
    };

    navigator.geolocation.getCurrentPosition(successCallback, errorCallback, options);
  };

  const resetMapPosition = () => {
    setMapKey(prevKey => prevKey + 1);
  };

  // Fungsi pencarian: ganti nama menjadi searchLocationByQuery
  const searchLocationByQuery = async (query) => {
    if (!query.trim()) return;
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      setSearchResults(data);
      setShowSearchResults(true);
    } catch (error) {
      console.error("Error searching location:", error);
    }
  };

  // Modifikasi fungsi handleLocationSelect
  const handleLocationSelect = (location) => {
    setPreviousPosition(position);
    setSearchLocation(location);
    setShowSearchResults(false); // hide search result setelah klik

    // Fokus ke marker hasil search
    if (mapRef.current) {
      mapRef.current.flyTo([parseFloat(location.lat), parseFloat(location.lon)], 16, {
        duration: 1.5,
        easeLinearity: 0.25
      });
    }
  };

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Jika input pencarian kosong, hapus marker hasil pencarian
    if (!value) {
      setSearchLocation(null);
      
      if (previousPosition) {
      setPosition(previousPosition);
      setPreviousPosition(null);
      }
    }
  };

  const handleMapClick = async (e) => {
    // Jika user adalah guest, tampilkan pesan dan return
    if (isGuest) {
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: #f44336;
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        z-index: 1000;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        animation: fadeInOut 5s ease-in-out;
      `;
      notification.textContent = "Maaf, akun guest tidak memiliki akses untuk menambah data lokasi.";
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.remove();
      }, 5000);
      return;
    }

    const { lat, lng } = e.latlng;
    const address = await getAddress(lat, lng);
    
    // Set posisi marker yang diklik
    setClickedMarker([lat, lng]);
    
    setClickedLocation({
      lat,
      lng,
      address,
      name: 'Lokasi Baru'
    });
    setShowModal(true);
  };

  // Custom cluster icon
  const createClusterCustomIcon = (cluster) => {
    return L.divIcon({
      html: `<div class="cluster-marker">${cluster.getChildCount()}</div>`,
      className: 'marker-cluster-custom',
      iconSize: L.point(40, 40, true)
    });
  };

  const handlePageChange = async (newPage) => {
    setIsPageLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setCurrentPage(newPage);
    setIsPageLoading(false);
  };

  // Callback untuk menerima data IoT position dari HookMqtt
  const handleIotPositionChange = (newPosition) => {
    // console.log('🔄 IoT Position updated:', newPosition);
    setIotPosition(newPosition);
  };

  // Fokus ke alat IoT: logika mirip mobile
  const focusToIot = () => {
    // Ambil data posisi IoT dari latestSensorData (hasil event mqttData)
    const lat = latestSensorData?.latitude || latestSensorData?.lat;
    const lon = latestSensorData?.longitude || latestSensorData?.lon;

    if (!lat || !lon || isNaN(parseFloat(lat)) || isNaN(parseFloat(lon)) || parseFloat(lat) === 0 || parseFloat(lon) === 0) {
      // Jika tidak ada data posisi, tampilkan alert
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: #f39c12;
        color: white;
        padding: 12px 24px;
        border-radius: 8px;
        z-index: 1000;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        animation: fadeInOut 5s ease-in-out;
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 500;
      `;
      notification.innerHTML = `
        <i class=\"bi bi-exclamation-triangle-fill\" style=\"font-size: 18px;\"></i>
        Perangkat IOT belum aktif. Silakan tunggu data GPS dari perangkat
      `;
      document.body.appendChild(notification);
      setTimeout(() => {
        notification.remove();
      }, 5000);
      return;
    }
    // Jika ada data, fokus ke marker IoT
    if (mapRef.current) {
      mapRef.current.setView([parseFloat(lat), parseFloat(lon)], 16);
    }
  };

  // Fungsi untuk mereset pencarian
  const handleResetSearch = () => {
    setSearchQuery('');
    setSearchLocation(null);
    setSearchResults([]);
    setShowSearchResults(false);
    
    if (previousPosition) {
      setPosition(previousPosition);
      setPreviousPosition(null);
    }
  };

  // Fungsi untuk mereset search query modal histori
  const handleResetHistorySearch = () => {
    setHistorySearchQuery('');
  };

  // Fungsi untuk mendapatkan status alert
  const getServerStatusAlert = () => {
    switch (serverStatus) {
      case 'connected':
        return {
          type: 'success',
          message: 'Server Terhubung'
        };
      case 'disconnected':
        return {
          type: 'error',
          message: 'Server Terputus'
        };
      default:
        return {
          type: 'info',
          message: 'Memeriksa Status Server'
        };
    }
  };

  // Tambahkan handler untuk set monitoring
  const handleSetMonitoring = (item) => {
    setMonitoringLocation(item);
    localStorage.setItem('monitoringLocation', JSON.stringify(item));
    // Notifikasi sederhana
    alert(`Lokasi "${item.name}" telah dijadikan lokasi monitoring utama!`);
  };

  // Fungsi cek apakah item adalah monitoring
  const isMonitoring = (item) => {
    return monitoringLocation && monitoringLocation.id === item.id;
  };

  // useEffect(() => {
  //   const fetchLatestData = async () => {
  //       try {
  //           const response = await fetch(`${port}getCurrentData`);
  //           const result = await response.json();
  //           if (result.success && result.data) {
  //               setLatestSensorData(result.data); 

  //               const { latitude, longitude } = result.data;
  //               if (
  //                   latitude && longitude &&
  //                   !isNaN(parseFloat(latitude)) &&
  //                   !isNaN(parseFloat(longitude)) &&
  //                   parseFloat(latitude) !== 0 &&
  //                   parseFloat(longitude) !== 0
  //               ) {
  //                   setIotPosition([parseFloat(latitude), parseFloat(longitude)]);
  //               } else {
  //                   setIotPosition(null);
  //               }
  //           } else {
  //               setLatestSensorData(null);
  //               setIotPosition(null);
  //           }
  //       } catch (e) {
  //           setLatestSensorData(null);
  //           setIotPosition(null);
  //       }
  //   };

  //   fetchLatestData();
  //   const interval = setInterval(fetchLatestData, 3000);
  //   return () => clearInterval(interval);
  // }, []);

  return (
    <div>
      {/* Status Server Alert */}
      {showStatus && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          width: '90%',
          maxWidth: '500px'
        }}>
          <Alert
            message={getServerStatusAlert().message}
            type={getServerStatusAlert().type}
            showIcon
            closable
            onClose={() => setShowStatus(false)}
            style={{
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              borderRadius: '8px'
            }}
          />
        </div>
      )}

      <style>{`
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translate(-50%, 20px); }
          10% { opacity: 1; transform: translate(-50%, 0); }
          90% { opacity: 1; transform: translate(-50%, 0); }
          100% { opacity: 0; transform: translate(-50%, 20px); }
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .marker-cluster-custom {
          background: rgba(26, 115, 232, 0.6);
          border-radius: 50%;
          text-align: center;
          font-weight: bold;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px !important;
          height: 40px !important;
          margin-left: -20px !important;
          margin-top: -20px !important;
        }
        
        .cluster-marker {
          font-size: 14px;
          font-family: Arial, sans-serif;
        }
        
        .leaflet-marker-icon {
          filter: drop-shadow(1px 1px 1px rgba(0,0,0,0.3));
        }
        
        .leaflet-marker-shadow {
          opacity: 0.5 !important;
        }

        .feed-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
        
        .visually-hidden {
          position: absolute;
          width: 1px;
          height: 1px;
          margin: -1px;
          padding: 0;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          border: 0;
        }

        .leaflet-control-attribution {
          display: none !important;
        }
      `}</style>

      {loading && (
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
              Memuat data lokasi...
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
      )}
      
      <div className="maps-box" style={{ height: '98vh' }}>
        <div className="details" id="map" style={{ height: '100%' }}>
          <div className="search-container">
            <div className="search-input-wrapper" style={{ position: 'relative' }}>
              <label htmlFor="location-search" className="visually-hidden">Cari Lokasi</label>
              <input
                type="text"
                placeholder="Cari Lokasi..."
                className="search-input"
                value={searchQuery}
                onChange={handleSearchInputChange}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') searchLocationByQuery(searchQuery);
                }}
                id="location-search"
                name="location-search"
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 35px',
                  border: '1px solid #e2e8f0',
                  fontSize: '14px',
                  // backgroundColor: '#f8fafc',
                  transition: 'all 0.3s ease',
                  outline: 'none'
                }}
              />
              <i 
                className="bi bi-search" 
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#64748b',
                  fontSize: '18px'
                }}
              />
              {searchQuery && (
                <i 
                  className="bi bi-x-circle-fill" 
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#64748b',
                    fontSize: '18px',
                    cursor: 'pointer',
                    zIndex: 10,
                    padding: '5px', // Memperbesar area klik
                    transition: 'all 0.2s ease', // Efek transisi untuk hover
                    borderRadius: '50%', // Membuat area hover berbentuk lingkaran
                  }}
                  onClick={handleResetSearch}
                  onMouseOver={(e) => e.currentTarget.style.color = '#e62f2a'} // Berubah warna saat hover
                  onMouseOut={(e) => e.currentTarget.style.color = '#64748b'} // Kembali ke warna asli
                  onMouseDown={(e) => e.currentTarget.style.transform = 'translateY(-50%) scale(0.9)'} // Efek tekan
                  onMouseUp={(e) => e.currentTarget.style.transform = 'translateY(-50%) scale(1)'} // Kembali normal
                  onTouchStart={(e) => e.currentTarget.style.transform = 'translateY(-50%) scale(0.9)'} // Efek tekan untuk mobile
                  onTouchEnd={(e) => e.currentTarget.style.transform = 'translateY(-50%) scale(1)'} // Kembali normal untuk mobile
                  aria-label="Reset pencarian"
                  title="Hapus pencarian"
                />
              )}
              {showSearchResults && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '4px',
                  marginTop: '4px',
                  maxHeight: '300px',
                  overflowY: 'auto',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  zIndex: 1000
                }}>
                  {searchResults.map((result, index) => (
                    <div
                      key={index}
                      onClick={() => handleLocationSelect(result)}
                      style={{
                        padding: '10px 12px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #e2e8f0',
                        fontSize: '14px',
                        color: '#1e293b',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#f1f5f9'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      {result.display_name}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="app">
              <DataOdometer latestData={latestSensorData} />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              {/* Tombol Admin Dashboard sudah dipindahkan ke navbar dropdown profil */}
              <button
                onClick={() => {
                  setShowHistoryModal(true);
                  fetchHistoricalData();
                  handleResetHistorySearch(); // Reset search query saat modal dibuka
                }}
                className="btn-mulaibaru"
                style={{ 
                  alignItems: 'center',
                  gap: '15px',
                }}
              >
                Histori Lokasi <i 
                className="bi bi-clock-history"
                style={{
                  fontSize: '20px',
                }}></i>
              </button>

              <button
                onClick={resetMapPosition}
                className="btn-mulaibaru"
              >
                <i className="bi bi-people-fill"></i>
              </button>

              {/* Tombol fokus ke IoT */}
              <button
                onClick={focusToIot}
                className="btn-mulaibaru"
                style={{ 
                  alignItems: 'center',
                  gap: '15px',
                }}
                title="Fokus ke perangkat IoT aktif"
              >
                <i 
                className="bi bi-rocket-takeoff"
                style={{
                  fontSize: '20px',
                }}></i>
              </button>
            </div>
          </div>

          <MapContainer
            key={mapKey}
            center={position || [-6.34605, 106.69156]}
            zoom={16}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%' }}
            zoomControl={true}
            doubleClickZoom={true}
            closePopupOnClick={true}
            dragging={true}
            animate={false}
            easeLinearity={0.35}
            updateWhenZooming={false}
            updateWhenIdle={false}
            ref={mapRef}
            attributionControl={false}
          >
            <MapEventHandler onMapClick={handleMapClick} />
            <TileLayer
              attribution='BRIN Water Sensors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* Current position marker */}
            {position && (
              <>
                <Marker position={position} icon={markerLocation}>
                  <Popup>
                    <div style={{ 
                      fontFamily: 'Arial, sans-serif',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      width: '300px',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                      border: '1px solid #e2e8f0'
                    }}>
                      {/* Header */}
                      <div style={{ 
                        padding: '12px 15px',
                        background: '#3498db',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderBottom: '1px solid #e2e8f0'
                      }}>
                        <div>
                          <i className="bi bi-person-pin" style={{ marginRight: '8px' }}></i>
                          Posisi Saat Ini
                      </div>
                        <div style={{ 
                          fontSize: '12px', 
                          backgroundColor: 'rgba(255,255,255,0.3)',
                          padding: '2px 6px',
                          borderRadius: '10px'
                        }}>
                          Anda
                        </div>
                      </div>
                      
                      {/* Content */}
                      <div style={{ padding: '15px' }}>
                        {/* Alamat */}
                        <div style={{ marginBottom: '15px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                            <i className="bi bi-pin-map-fill" style={{ color: '#e74c3c', marginRight: '8px', fontSize: '18px' }}></i>
                            <span style={{ fontWeight: 'bold', color: '#333' }}>Alamat Lokasi</span>
                          </div>
                          <div style={{ 
                            backgroundColor: '#f8f9fa',
                            padding: '10px 12px',
                            borderRadius: '6px',
                            border: '1px solid #e2e8f0',
                            fontSize: '13px',
                            color: '#333',
                            lineHeight: '1.5'
                          }}>
                            {locationAddress || 'Memuat alamat...'}
                          </div>
                        </div>
                        
                        {/* Koordinat */}
                        <div style={{ marginBottom: '15px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                            <i className="bi bi-geo" style={{ color: '#3498db', marginRight: '8px', fontSize: '18px' }}></i>
                            <span style={{ fontWeight: 'bold', color: '#333' }}>Koordinat</span>
                          </div>
                          
                          {/* Tampilan yang lebih responsif untuk koordinat */}
                          <div style={{ 
                            backgroundColor: '#f8f9fa',
                            padding: '10px 12px',
                            borderRadius: '6px',
                            border: '1px solid #e2e8f0'
                          }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              marginBottom: '8px'
                            }}>
                              <div style={{ 
                                minWidth: '70px', 
                                fontSize: '13px', 
                                color: '#666',
                                fontWeight: 'bold'
                              }}>
                                Latitude:
                              </div>
                              <div style={{ 
                                flex: '1',
                                fontSize: '13px',
                                fontWeight: 'bold',
                                color: '#2980b9',
                                padding: '4px 8px',
                                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                                borderRadius: '4px',
                                wordBreak: 'break-all',
                                textAlign: 'right'
                              }}>
                                {position[0].toFixed(6)}
                              </div>
                            </div>
                            
                            <div style={{
                              display: 'flex',
                              alignItems: 'center'
                            }}>
                              <div style={{ 
                                minWidth: '70px', 
                                fontSize: '13px', 
                                color: '#666',
                                fontWeight: 'bold'
                              }}>
                                Longitude:
                              </div>
                              <div style={{ 
                                flex: '1',
                                fontSize: '13px',
                                fontWeight: 'bold',
                                color: '#2980b9',
                                padding: '4px 8px',
                                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                                borderRadius: '4px',
                                wordBreak: 'break-all',
                                textAlign: 'right'
                              }}>
                                {position[1].toFixed(6)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
                {/* Lingkaran biru untuk marker pengguna */}
                <Circle
                  center={position}
                  radius={50}
                  pathOptions={{
                    color: '#3498db',
                    fillColor: '#3498db',
                    fillOpacity: 0.2,
                    weight: 2
                  }}
                />
              </>
            )}
            
            {/* IoT Device Marker */}
            {iotPosition && (
              <Marker position={iotPosition} icon={IOTDeviceMarker}>
                <Popup>
                  <div style={{ 
                    fontFamily: 'Arial, sans-serif',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    width: '300px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    border: '1px solid #e2e8f0'
                  }}>
                    {/* Header */}
                    <div style={{ 
                      padding: '12px 15px',
                      background: '#e74c3c',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: '1px solid #e2e8f0'
                    }}>
                      <div>
                        <i className="bi bi-broadcast" style={{ marginRight: '8px' }}></i>
                        Perangkat IoT
                    </div>
                      <div style={{ 
                        fontSize: '12px', 
                        backgroundColor: 'rgba(255,255,255,0.3)',
                        padding: '2px 6px',
                        borderRadius: '10px'
                      }}>
                        Aktif
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div style={{ padding: '15px' }}>
                      {/* Status */}
                      <div style={{ marginBottom: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                          <i className="bi bi-activity" style={{ color: '#2ecc71', marginRight: '8px', fontSize: '18px' }}></i>
                          <span style={{ fontWeight: 'bold', color: '#333' }}>Status Perangkat</span>
                        </div>
                        <div style={{ 
                          backgroundColor: '#f8f9fa',
                          padding: '10px 12px',
                          borderRadius: '6px',
                          border: '1px solid #e2e8f0',
                          fontSize: '13px',
                          color: '#2ecc71',
                          fontWeight: 'bold',
                          textAlign: 'center'
                        }}>
                          <i className="bi bi-check-circle-fill" style={{ marginRight: '5px' }}></i> Terhubung dan Aktif
                        </div>
                      </div>
                      
                      {/* Koordinat */}
                      <div style={{ marginBottom: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                          <i className="bi bi-geo" style={{ color: '#3498db', marginRight: '8px', fontSize: '18px' }}></i>
                          <span style={{ fontWeight: 'bold', color: '#333' }}>Koordinat</span>
                        </div>
                        
                        {/* Tampilan yang lebih responsif untuk koordinat */}
                        <div style={{ 
                          backgroundColor: '#f8f9fa',
                          padding: '10px 12px',
                          borderRadius: '6px',
                          border: '1px solid #e2e8f0'
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            marginBottom: '8px'
                          }}>
                            <div style={{ 
                              minWidth: '70px', 
                              fontSize: '13px', 
                              color: '#666',
                              fontWeight: 'bold'
                            }}>
                              Latitude:
                            </div>
                            <div style={{ 
                              flex: '1',
                              fontSize: '13px',
                              fontWeight: 'bold',
                              color: '#2980b9',
                              padding: '4px 8px',
                              backgroundColor: 'rgba(52, 152, 219, 0.1)',
                              borderRadius: '4px',
                              wordBreak: 'break-all',
                              textAlign: 'right'
                            }}>
                              {iotPosition[0].toFixed(6)}
                            </div>
                          </div>
                          
                          <div style={{
                            display: 'flex',
                            alignItems: 'center'
                          }}>
                            <div style={{ 
                              minWidth: '70px', 
                              fontSize: '13px', 
                              color: '#666',
                              fontWeight: 'bold'
                            }}>
                              Longitude:
                            </div>
                            <div style={{ 
                              flex: '1',
                              fontSize: '13px',
                              fontWeight: 'bold',
                              color: '#2980b9',
                              padding: '4px 8px',
                              backgroundColor: 'rgba(52, 152, 219, 0.1)',
                              borderRadius: '4px',
                              wordBreak: 'break-all',
                              textAlign: 'right'
                            }}>
                              {iotPosition[1].toFixed(6)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            )}
            
            {/* Marker untuk lokasi yang diklik */}
            {clickedMarker && (
              <Marker position={clickedMarker} icon={markerSelected}>
                <Popup>
                  <div style={{ 
                    fontFamily: 'Arial, sans-serif',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    width: '300px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    border: '1px solid #e2e8f0'
                  }}>
                    {/* Header */}
                    <div style={{ 
                      padding: '12px 15px',
                      background: '#9b59b6',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: '1px solid #e2e8f0'
                    }}>
                      <div>
                        <i className="bi bi-cursor-fill" style={{ marginRight: '8px' }}></i>
                        Lokasi Terpilih
                    </div>
                      <div style={{ 
                        fontSize: '12px', 
                        backgroundColor: 'rgba(255,255,255,0.3)',
                        padding: '2px 6px',
                        borderRadius: '10px'
                      }}>
                        Terpilih
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div style={{ padding: '15px' }}>
                      {/* Koordinat */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                          <i className="bi bi-geo" style={{ color: '#3498db', marginRight: '8px', fontSize: '18px' }}></i>
                          <span style={{ fontWeight: 'bold', color: '#333' }}>Koordinat</span>
                        </div>
                        
                        {/* Tampilan yang lebih responsif untuk koordinat */}
                        <div style={{ 
                          backgroundColor: '#f8f9fa',
                          padding: '10px 12px',
                          borderRadius: '6px',
                          border: '1px solid #e2e8f0'
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            marginBottom: '8px'
                          }}>
                            <div style={{ 
                              minWidth: '70px', 
                              fontSize: '13px', 
                              color: '#666',
                              fontWeight: 'bold'
                            }}>
                              Latitude:
                            </div>
                            <div style={{ 
                              flex: '1',
                              fontSize: '13px',
                              fontWeight: 'bold',
                              color: '#2980b9',
                              padding: '4px 8px',
                              backgroundColor: 'rgba(52, 152, 219, 0.1)',
                              borderRadius: '4px',
                              wordBreak: 'break-all',
                              textAlign: 'right'
                            }}>
                              {clickedMarker[0].toFixed(6)}
                            </div>
                          </div>
                          
                          <div style={{
                            display: 'flex',
                            alignItems: 'center'
                          }}>
                            <div style={{ 
                              minWidth: '70px', 
                              fontSize: '13px', 
                              color: '#666',
                              fontWeight: 'bold'
                            }}>
                              Longitude:
                            </div>
                            <div style={{ 
                              flex: '1',
                              fontSize: '13px',
                              fontWeight: 'bold',
                              color: '#2980b9',
                              padding: '4px 8px',
                              backgroundColor: 'rgba(52, 152, 219, 0.1)',
                              borderRadius: '4px',
                              wordBreak: 'break-all',
                              textAlign: 'right'
                            }}>
                              {clickedMarker[1].toFixed(6)}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Footer */}
                      <div style={{ 
                        marginTop: '15px',
                        display: 'flex',
                        justifyContent: 'center'
                      }}>
                        <button
                          onClick={() => setShowModal(true)}
                          style={{
                            backgroundColor: '#9b59b6',
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <i className="bi bi-plus-circle"></i>
                          Tambah Lokasi
                        </button>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            )}
            
            {/* Water location markers without clustering */}
              {waterLocationMarkers}
            
            {/* Sensor data markers with clustering */}
            <MarkerClusterGroup
              chunkedLoading
              chunkDelay={100}
              maxClusterRadius={60}
              spiderfyOnMaxZoom={true}
              showCoverageOnHover={false}
              zoomToBoundsOnClick={true}
              disableClusteringAtZoom={18}
              iconCreateFunction={createClusterCustomIcon}
            >
              {sensorMarkers}
            </MarkerClusterGroup>
            
            {position && <RecenterAutomatically lat={position[0]} lng={position[1]} />}
            
            {/* Marker untuk hasil pencarian lokasi */}
            {searchLocation && (
              <Marker 
                position={[parseFloat(searchLocation.lat), parseFloat(searchLocation.lon)]}
              >
                <Popup>
                  <div style={{ 
                    fontFamily: 'Arial, sans-serif',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    width: '300px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    border: '1px solid #e2e8f0'
                  }}>
                    {/* Header */}
                    <div style={{ 
                      padding: '12px 15px',
                      background: '#1e88e5',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderBottom: '1px solid #e2e8f0'
                    }}>
                      <div>
                        <i className="bi bi-search" style={{ marginRight: '8px' }}></i>
                        Hasil Pencarian
                      </div>
                      <div style={{ 
                        fontSize: '12px', 
                        backgroundColor: 'rgba(255,255,255,0.3)',
                        padding: '2px 6px',
                        borderRadius: '10px'
                      }}>
                        Lokasi
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div style={{ padding: '15px' }}>
                      {/* Alamat */}
                      <div style={{ marginBottom: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                          <i className="bi bi-pin-map-fill" style={{ color: '#e74c3c', marginRight: '8px', fontSize: '18px' }}></i>
                          <span style={{ fontWeight: 'bold', color: '#333' }}>Alamat Lokasi</span>
                        </div>
                        <div style={{ 
                          backgroundColor: '#f8f9fa',
                          padding: '10px 12px',
                          borderRadius: '6px',
                          border: '1px solid #e2e8f0',
                          fontSize: '13px',
                          color: '#333',
                          lineHeight: '1.5'
                        }}>
                          {searchLocation.display_name}
                        </div>
                      </div>
                      
                      {/* Koordinat */}
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                          <i className="bi bi-geo" style={{ color: '#3498db', marginRight: '8px', fontSize: '18px' }}></i>
                          <span style={{ fontWeight: 'bold', color: '#333' }}>Koordinat</span>
                        </div>
                        
                        {/* Tampilan yang lebih responsif untuk koordinat */}
                        <div style={{ 
                          backgroundColor: '#f8f9fa',
                          padding: '10px 12px',
                          borderRadius: '6px',
                          border: '1px solid #e2e8f0'
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            marginBottom: '8px'
                          }}>
                            <div style={{ 
                              minWidth: '70px', 
                              fontSize: '13px', 
                              color: '#666',
                              fontWeight: 'bold'
                            }}>
                              Latitude:
                            </div>
                            <div style={{ 
                              flex: '1',
                              fontSize: '13px',
                              fontWeight: 'bold',
                              color: '#2980b9',
                              padding: '4px 8px',
                              backgroundColor: 'rgba(52, 152, 219, 0.1)',
                              borderRadius: '4px',
                              wordBreak: 'break-all',
                              textAlign: 'right'
                            }}>
                              {parseFloat(searchLocation.lat).toFixed(6)}
                            </div>
                          </div>
                          
                          <div style={{
                            display: 'flex',
                            alignItems: 'center'
                          }}>
                            <div style={{ 
                              minWidth: '70px', 
                              fontSize: '13px', 
                              color: '#666',
                              fontWeight: 'bold'
                            }}>
                              Longitude:
                            </div>
                            <div style={{ 
                              flex: '1',
                              fontSize: '13px',
                              fontWeight: 'bold',
                              color: '#2980b9',
                              padding: '4px 8px',
                              backgroundColor: 'rgba(52, 152, 219, 0.1)',
                              borderRadius: '4px',
                              wordBreak: 'break-all',
                              textAlign: 'right'
                            }}>
                              {parseFloat(searchLocation.lon).toFixed(6)}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Buttons */}
                      <div style={{ 
                        marginTop: '15px',
                        display: 'flex',
                        justifyContent: 'center',
                        gap: '10px'
                      }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // Mencegah event bubbling
                            if (mapRef.current) {
                              mapRef.current.flyTo([parseFloat(searchLocation.lat), parseFloat(searchLocation.lon)], 18, {
                                duration: 1.5,
                                easeLinearity: 0.25
                              });
                            }
                          }}
                          style={{
                            backgroundColor: '#1e88e5',
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <i className="bi bi-zoom-in"></i>
                          Perbesar Lokasi
                        </button>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>
        </div>
      </div>

      <LokasiPenelitian 
        isOpen={showModal} 
        onClose={() => {
          setShowModal(false);
          setClickedLocation(null);
        }}
        clickedLocation={clickedLocation}
        onSaveSuccess={fetchWaterLocations}
      />

      {/* Historical Data Modal */}
      {showHistoryModal && (
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
            width: '90%',
            maxWidth: '1200px',
            maxHeight: '90vh',
            overflow: 'auto',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
              position: 'relative'
            }}>
              <h2 style={{ 
                margin: 0,
                color: '#E62F2A',
                textAlign: 'center',
                width: '100%',
                fontWeight: 'bold'
              }}>Histori Lokasi Penelitian</h2>
              <button 
                onClick={() => {
                  setShowHistoryModal(false);
                  setHistoricalData([]);
                  handleResetHistorySearch(); // Reset search query modal histori
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  fontSize: '24px',
                  cursor: 'pointer',
                  position: 'absolute',
                  right: '20px',
                }}
              >
                ×
              </button>
            </div>

            <div style={{ flex: 1, overflow: 'auto' }}>
              <div className="controls-section" style={{ marginBottom: '20px' }}>
                <div className="search-input-wrapper" style={{ position: 'relative' }}>
                  <label htmlFor="history-search" className="visually-hidden">Cari lokasi</label>
                  <input
                    type="text"
                    placeholder="Cari lokasi..."
                    className="search-input"
                    value={historySearchQuery}
                    onChange={(e) => setHistorySearchQuery(e.target.value)}
                    id="history-search"
                    name="history-search"
                    style={{
                      width: '100%',
                      padding: '10px 12px 10px 35px',
                      border: '1px solid #e2e8f0',
                      fontSize: '14px',
                      transition: 'all 0.3s ease',
                      outline: 'none'
                    }}
                  />
                  <i 
                    className="bi bi-search" 
                    style={{
                      position: 'absolute',
                      left: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#64748b',
                      fontSize: '18px'
                    }}
                  />
                  {historySearchQuery && (
                    <i 
                      className="bi bi-x-circle-fill" 
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#64748b',
                        fontSize: '18px',
                        cursor: 'pointer',
                        zIndex: 10,
                        padding: '5px',
                        transition: 'all 0.2s ease',
                        borderRadius: '50%',
                      }}
                      onClick={handleResetHistorySearch}
                      onMouseOver={(e) => e.currentTarget.style.color = '#e62f2a'}
                      onMouseOut={(e) => e.currentTarget.style.color = '#64748b'}
                      onMouseDown={(e) => e.currentTarget.style.transform = 'translateY(-50%) scale(0.9)'}
                      onMouseUp={(e) => e.currentTarget.style.transform = 'translateY(-50%) scale(1)'}
                      onTouchStart={(e) => e.currentTarget.style.transform = 'translateY(-50%) scale(0.9)'}
                      onTouchEnd={(e) => e.currentTarget.style.transform = 'translateY(-50%) scale(1)'}
                      aria-label="Reset pencarian histori"
                      title="Hapus pencarian histori"
                    />
                  )}
                </div>
            </div>
            
            {loading ? (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '200px'
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
                  Memuat data...
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
            ) : (
                <div className="feeds-grid" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: '20px',
                  padding: '20px 0',
                  position: 'relative',
                  minHeight: '200px'
                }}>
                  {isPageLoading ? (
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '15px',
                      width: '100%', 
                      textAlign: 'center'
                    }}>
                      <div style={{
                        width: '50px',
                        height: '50px',
                        border: '5px solid #f3f3f3',
                        borderTop: '5px solid #E62F2A',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto'
                      }}></div>
                      <p style={{ 
                        margin: 0,
                        color: '#333',
                        fontSize: '16px',
                        fontWeight: '600',
                        textAlign: 'center',
                        width: '100%'
                      }}>
                        Memuat halaman...
                      </p>
                      <p style={{
                        margin: 0,
                        color: '#666',
                        fontSize: '14px',
                        lineHeight: '1.4'
                      }}>
                        Mohon tunggu sebentar
                      </p>
                    </div>
                  ) : (
                    currentItems.map((item) => (
                      <div key={item.id} className="feed-card" style={{
                        background: isMonitoring(item) ? '#e3f2fd' : 'white',
                        border: isMonitoring(item) ? '2px solid #1e88e5' : '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '20px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        transition: 'all 0.3s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        height: '100%'
                      }}>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ marginBottom: '15px' }}>
                            <i className="bi bi-geo-alt-fill" style={{ color: '#E62F2A' }}></i>
                            <b> {item.name}</b>
                            {isMonitoring(item) && (
                              <span style={{
                                marginLeft: '10px',
                                color: '#1e88e5',
                                fontWeight: 'bold',
                                fontSize: '13px',
                                background: '#bbdefb',
                                borderRadius: '8px',
                                padding: '2px 8px',
                              }}>
                                Monitoring Aktif <i className="bi bi-star-fill"></i>
                              </span>
                            )}
                          </h3>
                          <p className="feed-address" style={{ marginBottom: '10px' }}>
                            {item.address}
                          </p>
                          <p className="feed-date" style={{ color: '#64748b' }}>
                            <i className="bi bi-calendar2-week-fill" style={{ color: '#E62F2A' }}></i> {item.date}
                          </p>
                        </div>
                        <button
                          className="btn btn-danger"
                          onClick={() => {
                            const selectedLocation = [parseFloat(item.lat), parseFloat(item.lon)];
                            setShowHistoryModal(false);
                            if (mapRef.current) {
                              mapRef.current.flyTo(selectedLocation, 16, {
                                duration: 1.5,
                                easeLinearity: 0.25
                              });
                            }
                          }}
                          style={{
                            width: '100%',
                            marginTop: '15px',
                            borderRadius: '100px',
                            backgroundColor: '#E62F2A',
                            padding: '10px',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                          }}
                        >
                          Lihat di Peta <i className="bi bi-box-arrow-right"></i>
                        </button>
                        <button
                          className="btn btn-route"
                          onClick={() => {
                            const url = `https://www.google.com/maps/search/?api=1&query=${item.lat},${item.lon}`;
                            window.open(url, '_blank');
                          }}
                          style={{
                            width: '100%',
                            marginTop: '10px',
                            borderRadius: '100px',
                            backgroundColor: '#27ae60',
                            padding: '10px',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'all 0.3s ease',
                          }}
                        >
                          Rute ke Lokasi
                          <i className="bi bi-geo-alt"></i>
                        </button>
                        <button
                          className="btn btn-primary"
                          onClick={() => handleSetMonitoring(item)}
                          disabled={isMonitoring(item)}
                          style={{
                            width: '100%',
                            marginTop: '10px',
                            borderRadius: '100px',
                            backgroundColor: isMonitoring(item) ? '#bdbdbd' : '#1e88e5',
                            padding: '10px',
                            color: 'white',
                            border: 'none',
                            cursor: isMonitoring(item) ? 'not-allowed' : 'pointer',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'all 0.3s ease',
                          }}
                        >
                          {isMonitoring(item) ? 'Monitoring Aktif' : 'Set sebagai Monitoring'}
                          <i className={isMonitoring(item) ? 'bi bi-star-fill' : 'bi bi-star'}></i>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {!loading && currentItems.length === 0 && (
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '40px',
                    color: '#64748b'
                  }}>
                    <i className="bi bi-inbox" style={{ fontSize: '48px' }}></i>
                    <p style={{ marginTop: '16px' }}>Tidak ada data historis tersedia</p>
                  </div>
                )}
            </div>

            {!loading && totalPages > 1 && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                marginTop: '20px',
                gap: '10px',
                padding: '20px 0',
                borderTop: '1px solid #e2e8f0',
                position: 'relative'
              }}>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || isPageLoading}
                  style={{
                    borderColor: '#E62F2A',
                    color: '#E62F2A',
                    background: 'none',
                    border: '1px solid #E62F2A',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    opacity: isPageLoading ? 0.5 : 1,
                    transition: 'all 0.3s ease',
                    // ':hover': {
                    //   backgroundColor: '#CD1B16',
                    //   color: 'white',
                    //   borderColor: '#CD1B16'
                    // }
                  }}
                >
                  Sebelumnya
                </button>
                <span style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  color: '#64748b'
                }}>
                  Halaman {currentPage} dari {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || isPageLoading}
                  style={{
                    borderColor: '#E62F2A',
                    color: '#E62F2A',
                    background: 'none',
                    border: '1px solid #E62F2A',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    opacity: isPageLoading ? 0.5 : 1,
                    transition: 'all 0.3s ease',
                    // ':hover': {
                    //   backgroundColor: '#CD1B16',
                    //   color: 'white',
                    //   borderColor: '#CD1B16'
                    // }
                  }}
                >
                  Selanjutnya
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;