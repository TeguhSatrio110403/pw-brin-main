import React, { useState, useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import { io } from 'socket.io-client';
import 'leaflet/dist/leaflet.css';
import 'react-circular-progressbar/dist/styles.css';
import DataOdometer from '../service/hook/index';
import LokasiPenelitian from "../service/hook/formdata";
import MarkerClusterGroup from 'react-leaflet-cluster';

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
  iconAnchor: [20, 40],
  popupAnchor: [0, -40]
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
  const [showHistory, setShowHistory] = useState(false);
  const [historicalData, setHistoricalData] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  
  const socketRef = useRef(null);
  const API_URL = 'https://server-water-sensors.onrender.com';

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
        setSensorData(data.data);
      }
    } catch (error) {
      console.error('Error fetching sensor data:', error);
    }
  };

  // Fetch historical data
  const fetchHistoricalData = async (locationId) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/data_lokasi/${locationId}`);
      const data = await response.json();
      setHistoricalData(data);
      setShowHistory(true);
    } catch (error) {
      console.error('Error fetching historical data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initialize socket connection
  useEffect(() => {
    socketRef.current = io(API_URL);

    socketRef.current.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    socketRef.current.on('sensorData', (data) => {
      setSensorData(prev => [...prev, data]);
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
    getUserLocation();
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
              'User-Agent': 'WaterSensorApp/1.0 (your-contact-email@example.com)'
          }
      }
      );
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
          <div className="custom-popup">
            <h4 style={{ margin: '0 0 8px 0', color: '#2c3e50' }}>{location.name}</h4>
            <div style={{ fontSize: '14px' }}>
              <p style={{ margin: '4px 0' }}>
                <strong>Alamat:</strong> {location.address}
              </p>
              <p style={{ margin: '4px 0' }}>
                <strong>Tanggal:</strong> {location.date}
              </p>
              <button 
                onClick={() => fetchHistoricalData(location.id)}
                style={{
                  background: '#1a73e8',
                  color: 'white',
                  border: 'none',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginTop: '8px'
                }}
              >
                Lihat Data Historis
              </button>
            </div>
          </div>
        </Popup>
      </Marker>
    ));
  }, [waterLocations]);

  // Sensor data markers
  const sensorMarkers = useMemo(() => {
    return sensorData.map((data, idx) => {
      const cleanLat = data.lat.split('.').slice(0, 2).join('.');
      const cleanLon = data.lon.split('.').slice(0, 2).join('.');
      
      
      return (
        <Marker 
          key={`sensor-${idx}`} 
          position={[parseFloat(cleanLat), parseFloat(cleanLon)]}
          icon={markerWaterWays}
        >
          <Popup>
            <div className="custom-popup">
              <h4 style={{ margin: '0 0 8px 0', color: '#2c3e50' }}>Data Sensor</h4>
              <div style={{ fontSize: '14px' }}>
                <p style={{ margin: '4px 0' }}>
                  <strong>Tanggal:</strong> {new Date(data.tanggal).toLocaleString()}
                </p>
                <p style={{ margin: '4px 0' }}>
                  <strong>pH:</strong> <span style={{ color: data.nilai_ph < 6 ? '#e74c3c' : '#2ecc71' }}>
                    {data.nilai_ph}
                  </span>
                </p>
                <p style={{ margin: '4px 0' }}>
                  <strong>Suhu:</strong> <span style={{ color: data.nilai_temperature > 30 ? '#e74c3c' : '#3498db' }}>
                    {data.nilai_temperature}°C
                  </span>
                </p>
                <p style={{ margin: '4px 0' }}>
                  <strong>Kekeruhan:</strong> {data.nilai_turbidity} NTU
                </p>
                <p style={{ margin: '4px 0' }}>
                  <strong>Kecepatan:</strong> {data.nilai_speed} m/s
                </p><p style={{ margin: '4px 0' }}>
                  <strong>Accelerometer X:</strong> {data.nilai_accel_x} m/s2
                </p><p style={{ margin: '4px 0' }}>
                  <strong>Accelerometer Y:</strong> {data.nilai_accel_y} m/s2
                </p>
                <p style={{ margin: '4px 0' }}>
                  <strong>Accelerometer Z:</strong> {data.nilai_accel_z} m/s2
                </p>
              </div>
            </div>
          </Popup>
        </Marker>
      );
    });
  }, [sensorData, sensorAddresses]);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      const id = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const newLocation = [latitude, longitude];
          setPosition(newLocation);
        },
        (error) => {
          console.error("Error getting location:", error);
          setPosition([-6.34605, 106.69156]); // Default to Jakarta if error
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
      setWatchId(id);
    } else {
      console.error("Geolocation is not supported by this browser.");
      setPosition([-6.34605, 106.69156]); // Default to Jakarta if geolocation not supported
    }
  };

  const resetMapPosition = () => {
    setMapKey(prevKey => prevKey + 1);
  };

  // Search location handler
  const searchLocation = async (query) => {
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

  const handleLocationSelect = (location) => {
    setPreviousPosition(position);
    setPosition([parseFloat(location.lat), parseFloat(location.lon)]);
    setShowSearchResults(false);
    setSearchQuery(location.display_name);
  };

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (!value && previousPosition) {
      setPosition(previousPosition);
      setPreviousPosition(null);
    }
  };

  const handleMapClick = async (e) => {
    const { lat, lng } = e.latlng;
    const address = await getAddress(lat, lng);
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

  return (
    <div>
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
            padding: '20px', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <p>Memuat data lokasi...</p>
          </div>
        </div>
      )}
      
      <div className="maps-box" style={{ height: '98vh' }}>
        <div className="details" id="map" style={{ height: '100%' }}>
          <div className="search-container">
            <div className="search-input-wrapper" style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Cari Lokasi..."
                className="search-input"
                value={searchQuery}
                onChange={handleSearchInputChange}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') searchLocation(searchQuery);
                }}
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
              <DataOdometer />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowHistory(true)}
                className="btn-mulaibaru"
                style={{ 
                  // display: 'flex',
                  alignItems: 'center',
                  gap: '15px',
                  // padding: '8px 12px'
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
                <i className="bi bi-arrow-repeat"></i>
              </button>
            </div>
          </div>

          <MapContainer
            key={mapKey}
            center={position || [-6.34605, 106.69156]}
            zoom={16}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%' }}
          >
            <MapEventHandler onMapClick={handleMapClick} />
            <TileLayer
              attribution='BRIN Water Sensors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            
            {/* Current position marker */}
            {position && (
              <Marker position={position} icon={markerLocation}>
                <Popup>
                  <div className="custom-popup">
                    <h4 style={{ margin: '0 0 8px 0', color: '#2c3e50' }}>Posisi Saat Ini</h4>
                    <p style={{ margin: '4px 0' }}>
                      <strong>Alamat:</strong> {locationAddress || 'Memuat alamat...'}
                    </p>
                    <p style={{ margin: '4px 0' }}>
                      <strong>Latitude:</strong> {position[0]}
                    </p>
                    <p style={{ margin: '4px 0' }}>
                      <strong>Longitude:</strong> {position[1]}
                    </p>
                  </div>
                </Popup>
              </Marker>
            )}
            
            {/* Water location markers with clustering */}
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
              {waterLocationMarkers}
            </MarkerClusterGroup>
            
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
      {showHistory && (
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
            width: '80%',
            maxWidth: '800px',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h2 style={{ margin: 0 }}>Data Historis</h2>
              <button 
                onClick={() => setShowHistory(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#64748b'
                }}
              >
                ×
              </button>
            </div>
            
            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <div style={{
                  display: 'inline-block',
                  width: '40px',
                  height: '40px',
                  border: '3px solid #e2e8f0',
                  borderTop: '3px solid #3498db',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                <p style={{ marginTop: '10px', color: '#64748b' }}>Memuat data...</p>
              </div>
            ) : (
              <div className="box-feeds row d-flex justify-content-center mx-auto">
                {historicalData.length > 0 ? (
                  <div className="col-12">
                    <div className="table-responsive">
                      <table style={{ 
                        width: '100%', 
                        borderCollapse: 'collapse',
                        marginTop: '20px'
                      }}>
                        <thead>
                          <tr style={{ 
                            background: '#f8fafc',
                            borderBottom: '2px solid #e2e8f0'
                          }}>
                            <th style={{ 
                              padding: '12px',
                              textAlign: 'left',
                              color: '#1e293b',
                              fontWeight: '600'
                            }}>Tanggal</th>
                            <th style={{ 
                              padding: '12px',
                              textAlign: 'left',
                              color: '#1e293b',
                              fontWeight: '600'
                            }}>pH</th>
                            <th style={{ 
                              padding: '12px',
                              textAlign: 'left',
                              color: '#1e293b',
                              fontWeight: '600'
                            }}>Suhu</th>
                            <th style={{ 
                              padding: '12px',
                              textAlign: 'left',
                              color: '#1e293b',
                              fontWeight: '600'
                            }}>Kekeruhan</th>
                          </tr>
                        </thead>
                        <tbody>
                          {historicalData.map((data, index) => (
                            <tr key={index} style={{
                              borderBottom: '1px solid #e2e8f0',
                              transition: 'all 0.2s ease'
                            }}>
                              <td style={{ 
                                padding: '12px',
                                color: '#1e293b'
                              }}>
                                {new Date(data.tanggal).toLocaleString()}
                              </td>
                              <td style={{ 
                                padding: '12px',
                                color: data.nilai_ph < 6 ? '#e74c3c' : '#2ecc71',
                                fontWeight: '500'
                              }}>
                                {data.nilai_ph}
                              </td>
                              <td style={{ 
                                padding: '12px',
                                color: data.nilai_temperature > 30 ? '#e74c3c' : '#3498db',
                                fontWeight: '500'
                              }}>
                                {data.nilai_temperature}°C
                              </td>
                              <td style={{ 
                                padding: '12px',
                                color: '#1e293b',
                                fontWeight: '500'
                              }}>
                                {data.nilai_turbidity} NTU
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
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
            )}
          </div>
        </div>
      )}

      <style>{`
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
      `}</style>
    </div>
  );
};

export default Dashboard;