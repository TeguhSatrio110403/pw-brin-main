import React, { useState, useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  Polyline,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'react-circular-progressbar/dist/styles.css';
import DataOdometer from '../service/hook';
import LokasiPenelitian from "../service/hook/formdata";

const RecenterAutomatically = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 16);
  }, [lat, lng, map]);
  return null;
};

const Dashboard = () => {
  const [position, setPosition] = useState([-6.34605, 106.69156]);
  const [history, setHistory] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [mapKey, setMapKey] = useState(0); // State tambahan untuk reset map

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          const newLocation = [latitude, longitude];

          setPosition(newLocation);
          setHistory((prevHistory) => [...prevHistory, newLocation]);
        },
        (error) => {
          console.error("Error fetching geolocation: ", error);
        }
      );
    } else {
      console.error("Geolocation is not supported by this browser.");
    }
  };

  useEffect(() => {
    getUserLocation();
    const interval = setInterval(getUserLocation, 5000);
    return () => clearInterval(interval);
  }, []);

  const resetMapPosition = () => {
    setMapKey((prevKey) => prevKey + 1); // Ganti key agar MapContainer reload
  };

  return (
    <div>
      <section>
        <div className="maps-box" style={{ height: '98vh' }}>
          <div className="details" id="map" style={{ height: '100%' }}>
            <div className="search-container">
              <div className="search-input-wrapper">
                <i className="bi bi-search search-icon"></i>
                <input
                  type="text"
                  placeholder="Cari Lokasi..."
                  className="search-input"
                />
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
              key={mapKey} // Pakai key agar reset posisi berfungsi
              center={position}
              zoom={16}
              scrollWheelZoom={true}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={position}>
                <Popup>
                  Latitude: {position[0]}, Longitude: {position[1]}
                </Popup>
              </Marker>
              <RecenterAutomatically lat={position[0]} lng={position[1]} />
              {history.length > 1 && (
                <Polyline positions={history} color="blue" />
              )}
              {history.map((pos, idx) => (
                <Marker key={idx} position={pos}>
                  <Popup>
                    Latitude : {pos[0]}, Longitude : {pos[1]}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      </section>
      <LokasiPenelitian isOpen={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
};

export default Dashboard;
