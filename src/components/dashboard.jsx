// import React, { useState, useEffect, useMemo } from 'react';
// import L from 'leaflet';
// import {
//   MapContainer,
//   TileLayer,
//   Marker,
//   Popup,
//   useMap,
//   Polyline,
// } from 'react-leaflet';
// import 'leaflet/dist/leaflet.css';
// import 'react-circular-progressbar/dist/styles.css';
// import DataOdometer from '../service/hook/index';
// import LokasiPenelitian from "../service/hook/formdata";

// // Tambahkan custom icon
// const customIcon = new L.Icon({
//   iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
//   shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
//   iconSize: [25, 41],
//   iconAnchor: [12, 41],
//   popupAnchor: [1, -34],
//   shadowSize: [41, 41]
// });

// const sensorIcon = new L.Icon({
//   iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
//   shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
//   iconSize: [25, 41],
//   iconAnchor: [12, 41],
//   popupAnchor: [1, -34],
//   shadowSize: [41, 41]
// });

// const RecenterAutomatically = ({ lat, lng }) => {
//   const map = useMap();
//   useEffect(() => {
//     map.setView([lat, lng], 16);
//   }, [lat, lng, map]);
//   return null;
// };

// const Dashboard = () => {
//   const [position, setPosition] = useState(null);
//   const [previousPosition, setPreviousPosition] = useState(null);
//   const [sensorData, setSensorData] = useState([]);
//   const [showModal, setShowModal] = useState(false);
//   const [mapKey, setMapKey] = useState(0);
//   const [searchQuery, setSearchQuery] = useState('');
//   const [searchResults, setSearchResults] = useState([]);
//   const [showSearchResults, setShowSearchResults] = useState(false);
//   const [watchId, setWatchId] = useState(null);
//   const [locationAddress, setLocationAddress] = useState('');
//   const [sensorAddresses, setSensorAddresses] = useState({});

//   const fetchSensorData = async () => {
//     try {
//       const response = await fetch('http://localhost:3000/data_combined');
//       const result = await response.json();
//       if (result.success) {
//         const optimizedData = result.data.filter((_, index) => index % 10 === 0);
//         setSensorData(optimizedData);
//       }
//     } catch (error) {
//       console.error("Error fetching sensor data:", error);
//     }
//   };

//   const getAddress = async (lat, lon) => {
//     try {
//       const response = await fetch(
//         `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
//       );
//       const data = await response.json();
//       return data.display_name;
//     } catch (error) {
//       console.error("Error fetching address:", error);
//       return "Alamat tidak ditemukan";
//     }
//   };

//   useEffect(() => {
//     if (position) {
//       getAddress(position[0], position[1]).then(address => {
//         setLocationAddress(address);
//       });
//     }
//   }, [position]);

//   const sensorMarkers = useMemo(() => {
//     return sensorData.map((data, idx) => {
//       const cleanLat = data.lat.split('.').slice(0, 2).join('.');
//       const cleanLon = data.lon.split('.').slice(0, 2).join('.');
      
//       if (!sensorAddresses[idx]) {
//         getAddress(cleanLat, cleanLon).then(address => {
//           setSensorAddresses(prev => ({...prev, [idx]: address}));
//         });
//       }
      
//       return (
//         <Marker 
//           key={`sensor-${idx}`} 
//           position={[parseFloat(cleanLat), parseFloat(cleanLon)]}
//           icon={sensorIcon}
//         >
//           <Popup>
//             <div className="custom-popup">
//               <h4 style={{ margin: '0 0 8px 0', color: '#2c3e50' }}>Data Sensor</h4>
//               <div style={{ fontSize: '14px' }}>
//                 <p style={{ margin: '4px 0' }}>
//                   <strong>Lokasi:</strong> {sensorAddresses[idx] || 'Memuat alamat...'}
//                 </p>
//                 <p style={{ margin: '4px 0' }}>
//                   <strong>Tanggal:</strong> {new Date(data.tanggal).toLocaleString()}
//                 </p>
//                 <p style={{ margin: '4px 0' }}>
//                   <strong>pH:</strong> <span style={{ color: '#e74c3c' }}>{data.nilai_ph}</span>
//                 </p>
//                 <p style={{ margin: '4px 0' }}>
//                   <strong>Suhu:</strong> <span style={{ color: '#e67e22' }}>{data.nilai_temperature}°C</span>
//                 </p>
//                 <p style={{ margin: '4px 0' }}>
//                   <strong>Kekeruhan:</strong> <span style={{ color: '#3498db' }}>{data.nilai_turbidity}</span>
//                 </p>
//               </div>
//             </div>
//           </Popup>
//         </Marker>
//       );
//     });
//   }, [sensorData, sensorAddresses]);

//   useEffect(() => {
//     fetchSensorData();
//     const interval = setInterval(fetchSensorData, 300000);
//     return () => clearInterval(interval);
//   }, []);

//   const getUserLocation = () => {
//     if (navigator.geolocation) {
//       const id = navigator.geolocation.watchPosition(
//         (pos) => {
//           const { latitude, longitude } = pos.coords;
//           const newLocation = [latitude, longitude];
//           setPosition(newLocation);
//         },
//         (error) => {
//           console.error("Error fetching geolocation: ", error);
//         },
//         {
//           enableHighAccuracy: true,
//           timeout: 5000,
//           maximumAge: 0
//         }
//       );
//       setWatchId(id);
//     } else {
//       console.error("Geolocation is not supported by this browser.");
//     }
//   };

//   useEffect(() => {
//     getUserLocation();
//     return () => {
//       if (watchId) {
//         navigator.geolocation.clearWatch(watchId);
//       }
//     };
//   }, []);

//   const resetMapPosition = () => {
//     setMapKey((prevKey) => prevKey + 1);
//   };

//   const searchLocation = async (query) => {
//     if (!query) return;
    
//     try {
//       const response = await fetch(
//         `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`
//       );
//       const data = await response.json();
//       setSearchResults(data);
//       setShowSearchResults(true);
//     } catch (error) {
//       console.error("Error searching location:", error);
//     }
//   };

//   const handleLocationSelect = (location) => {
//     setPreviousPosition(position);
//     const newPosition = [parseFloat(location.lat), parseFloat(location.lon)];
//     setPosition(newPosition);
//     setShowSearchResults(false);
//     setSearchQuery(location.display_name);
//   };

//   const handleSearchInputChange = (e) => {
//     const value = e.target.value;
//     setSearchQuery(value);
    
//     if (!value && previousPosition) {
//       setPosition(previousPosition);
//       setPreviousPosition(null);
//     }
//   };

//   return (
//     <div>
//       <section>
//         <div className="maps-box" style={{ height: '98vh' }}>
//           <div className="details" id="map" style={{ height: '100%' }}>
//             <div className="search-container">
//               <div className="search-input-wrapper" style={{ position: 'relative' }}>
//                 <input
//                   type="text"
//                   placeholder="Cari Lokasi..."
//                   className="search-input"
//                   value={searchQuery}
//                   onChange={handleSearchInputChange}
//                   onKeyPress={(e) => {
//                     if (e.key === 'Enter') {
//                       searchLocation(searchQuery);
//                     }
//                   }}
//                 />
//                 {showSearchResults && searchResults.length > 0 && (
//                   <div style={{
//                     position: 'absolute',
//                     top: '100%',
//                     left: 0,
//                     right: 0,
//                     backgroundColor: 'white',
//                     border: '1px solid #ddd',
//                     borderRadius: '4px',
//                     maxHeight: '200px',
//                     overflowY: 'auto',
//                     zIndex: 1000
//                   }}>
//                     {searchResults.map((result, index) => (
//                       <div
//                         key={index}
//                         onClick={() => handleLocationSelect(result)}
//                         style={{
//                           padding: '8px',
//                           cursor: 'pointer',
//                           borderBottom: '1px solid #eee',
//                           fontSize: '14px'
//                         }}
//                         onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f0f0'}
//                         onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
//                       >
//                         {result.display_name}
//                       </div>
//                     ))}
//                   </div>
//                 )}
//               </div>

//               <button
//                 onClick={() => setShowModal(true)}
//                 className="btn-mulaibaru"
//               >
//                 Mulai Baru <i className="bi bi-plus plus-icon"></i>
//               </button>

//               <div className="app">
//                 <DataOdometer />
//               </div>

//               <button
//                 onClick={resetMapPosition}
//                 className="btn-mulaibaru"
//               ><i className="bi bi-arrow-repeat"></i>
//               </button>
//             </div>

//             <MapContainer
//               key={mapKey}
//               center={position || [-6.34605, 106.69156]}
//               zoom={16}
//               scrollWheelZoom={true}
//               style={{ height: '100%', width: '100%' }}
//             >
//               <TileLayer
//                 attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//                 url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//               />
//               {position && (
//                 <Marker position={position} icon={customIcon}>
//                   <Popup>
//                     <div className="custom-popup">
//                       <h4 style={{ margin: '0 0 8px 0', color: '#2c3e50' }}>Posisi Saat Ini</h4>
//                       <p style={{ margin: '4px 0' }}>
//                         <strong>Alamat :</strong> {locationAddress || 'Memuat alamat...'}<br />
//                         <strong>Latitude :</strong> {position[0]}<br />
//                         <strong>Longitude :</strong> {position[1]}
//                       </p>
//                     </div>
//                   </Popup>
//                 </Marker>
//               )}
//               {position && <RecenterAutomatically lat={position[0]} lng={position[1]} />}
//               {sensorMarkers}
//             </MapContainer>
//           </div>
//         </div>
//       </section>
//       <LokasiPenelitian isOpen={showModal} onClose={() => setShowModal(false)} />
//     </div>
//   );
// };

// export default Dashboard;

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
import { io } from 'socket.io-client'; // Import Socket.IO
import 'leaflet/dist/leaflet.css';
import 'react-circular-progressbar/dist/styles.css';
import DataOdometer from '../service/hook/index';
import LokasiPenelitian from "../service/hook/formdata";

// Tambahkan custom icon
const customIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const sensorIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const RecenterAutomatically = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 16);
  }, [lat, lng, map]);
  return null;
};

// Buat komponen baru untuk menangani event
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
  
  // Socket.IO setup
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io('https://server-water-sensors-production.up.railway.app'); // Update the URL

    socketRef.current.on('sensorData', (data) => {
      setSensorData(data);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  const fetchSensorData = async () => {
    try {
      // const response = await fetch('http://localhost:3000/getCurrentData');
      const response = await fetch('https://server-water-sensors-production.up.railway.app'); 
      const result = await response.json();
      if (result.success) {
        const optimizedData = result.data.filter((_, index) => index % 10 === 0);
        setSensorData(optimizedData);
      }
    } catch (error) {
      console.error("Error fetching sensor data:", error);
    }
  };

  const getAddress = async (lat, lon) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
      );
      const data = await response.json();
      return data.display_name;
    } catch (error) {
      console.error("Error fetching address:", error);
      return "Alamat tidak ditemukan";
    }
  };

  useEffect(() => {
    if (position) {
      getAddress(position[0], position[1]).then(address => {
        setLocationAddress(address);
      });
    }
  }, [position]);

  const sensorMarkers = useMemo(() => {
    return sensorData.map((data, idx) => {
      const cleanLat = data.lat.split('.').slice(0, 2).join('.');
      const cleanLon = data.lon.split('.').slice(0, 2).join('.');
      
      if (!sensorAddresses[idx]) {
        getAddress(cleanLat, cleanLon).then(address => {
          setSensorAddresses(prev => ({...prev, [idx]: address}));
        });
      }
      
      return (
        <Marker 
          key={`sensor-${idx}`} 
          position={[parseFloat(cleanLat), parseFloat(cleanLon)]}
          icon={sensorIcon}
        >
          <Popup>
            <div className="custom-popup">
              <h4 style={{ margin: '0 0 8px 0', color: '#2c3e50' }}>Data Sensor</h4>
              <div style={{ fontSize: '14px' }}>
                <p style={{ margin: '4px 0' }}>
                  <strong>Lokasi:</strong> {sensorAddresses[idx] || 'Memuat alamat...'}
                </p>
                <p style={{ margin: '4px 0' }}>
                  <strong>Tanggal:</strong> {new Date(data.tanggal).toLocaleString()}
                </p>
                <p style={{ margin: '4px 0' }}>
                  <strong>pH:</strong> <span style={{ color: '#e74c3c' }}>{data.nilai_ph}</span>
                </p>
                <p style={{ margin: '4px 0' }}>
                  <strong>Suhu:</strong> <span style={{ color: '#e67e22' }}>{data.nilai_temperature}°C</span>
                </p>
                <p style={{ margin: '4px 0' }}>
                  <strong>Kekeruhan:</strong> <span style={{ color: '#3498db' }}>{data.nilai_turbidity}</span>
                </p>
              </div>
            </div>
          </Popup>
        </Marker>
      );
    });
  }, [sensorData, sensorAddresses]);

  useEffect(() => {
    fetchSensorData();
    const interval = setInterval(fetchSensorData, 300000);
    return () => clearInterval(interval);
  }, []);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      const id = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const newLocation = [latitude, longitude];
          setPosition(newLocation);
        },
        (error) => {
          console.error("Error fetching geolocation: ", error);
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
    }
  };

  useEffect(() => {
    getUserLocation();
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  const resetMapPosition = () => {
    setMapKey((prevKey) => prevKey + 1);
  };

  const searchLocation = async (query) => {
    if (!query) return;
    
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
    const newPosition = [parseFloat(location.lat), parseFloat(location.lon)];
    setPosition(newPosition);
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
    try {
      const address = await getAddress(lat, lng);
      setClickedLocation({
        lat: lat,
        lng: lng,
        address: address
      });
      setShowModal(true);
    } catch (error) {
      console.error("Error getting address:", error);
    }
  };

  return (
    <div>
      <section>
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
                    if (e.key === 'Enter') {
                      searchLocation(searchQuery);
                    }
                  }}
                />
                {showSearchResults && searchResults.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: 'white',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    zIndex: 1000
                  }}>
                    {searchResults.map((result, index) => (
                      <div
                        key={index}
                        onClick={() => handleLocationSelect(result)}
                        style={{
                          padding: '8px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #eee',
                          fontSize: '14px'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f0f0f0'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                      >
                        {result.display_name}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => setShowModal(true)}
                className="btn-mulaibaru"
              >
                Mulai Baru <i className="bi bi-plus plus-icon"></i>
              </button>

              <div className="app">
                <DataOdometer />
              </div>

              <button
                onClick={resetMapPosition}
                className="btn-mulaibaru"
              ><i className="bi bi-arrow-repeat"></i>
              </button>
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
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {position && (
                <Marker position={position} icon={customIcon}>
                  <Popup>
                    <div className="custom-popup">
                      <h4 style={{ margin: '0 0 8px 0', color: '#2c3e50' }}>Posisi Saat Ini</h4>
                      <p style={{ margin: '4px 0' }}>
                        <strong>Alamat :</strong> {locationAddress || 'Memuat alamat...'}<br />
                        <strong>Latitude :</strong> {position[0]}<br />
                        <strong>Longitude :</strong> {position[1]}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              )}
              {position && <RecenterAutomatically lat={position[0]} lng={position[1]} />}
              {sensorMarkers}
            </MapContainer>
          </div>
        </div>
      </section>
      <LokasiPenelitian 
        isOpen={showModal} 
        onClose={() => {
          setShowModal(false);
          setClickedLocation(null);
        }}
        clickedLocation={clickedLocation}
      />
    </div>
  );
};

export default Dashboard;