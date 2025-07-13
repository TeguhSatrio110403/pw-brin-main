import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { Card, Tag, Button, Space, Divider, Modal, Input, message, Form, InputNumber } from 'antd';
import { ExclamationCircleOutlined, EnvironmentOutlined, SyncOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { port } from '../constant/https.jsx';
import { Modal as AntdModal } from 'antd';

const paramIcons = {
  Turbidity: <span style={{ color: '#E62F2A', fontSize: 20, marginRight: 8 }}>💧</span>,
  pH: <span style={{ color: '#E62F2A', fontSize: 20, marginRight: 8 }}>⚗️</span>,
  Temperature: <span style={{ color: '#E62F2A', fontSize: 20, marginRight: 8 }}>🌡️</span>,
};

const paramLabels = {
  Turbidity: 'Turbidity',
  pH: 'pH',
  Temperature: 'Temperature',
};

const paramRanges = {
  Turbidity: '> -1 dan < 25',
  pH: '> 6 dan < 9',
  Temperature: '> 10 dan < 35',
};

const paramThresholds = {
  Turbidity: '> 25',
  pH: '> 9',
  Temperature: '> 35',
};

// Validasi input ranges
const inputValidation = {
  ph: { min: 0, max: 14, step: 0.1 },
  temperature: { min: -50, max: 100, step: 0.1 },
  turbidity: { min: 0, max: 1000, step: 0.1 }
};

// Marker HTML warna biru (lokasi penelitian) dan ungu (sensor)
const blueIcon = L.divIcon({
  className: 'main-marker',
  html: '<div style="background-color: #3b82f6; width: 28px; height: 28px; border-radius: 50%; border: 4px solid white; box-shadow: 0 0 8px rgba(0,0,0,0.3);"></div>',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});
const purpleIcon = L.divIcon({
  className: 'sensor-marker',
  html: '<div style="background-color: #6366f1; width: 28px; height: 28px; border-radius: 50%; border: 4px solid white; box-shadow: 0 0 8px rgba(0,0,0,0.3);"></div>',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

// Komponen untuk auto-fit bounds dua marker
function FitBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions && positions.length === 2 && positions[0][0] && positions[0][1] && positions[1][0] && positions[1][1]) {
      map.fitBounds(positions, { padding: [40, 40] });
    }
  }, [positions, map]);
  return null;
}

const AnomaliDetail = ({ anomali, lokasi, lokasiPenelitian, onBack, onDelete, onUpdate }) => {
  const [lokasiDetail, setLokasiDetail] = useState(lokasi);
  const [form] = Form.useForm();
  
  // State untuk fitur update prediction
  const [showPredictionUpdateModal, setShowPredictionUpdateModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState(null);

  // Memoized initial values untuk form
  const initialValues = useMemo(() => ({
    ph: anomali?.pH?.value || 0,
    temperature: anomali?.temperature?.value || 0,
    turbidity: anomali?.turbidity?.value || 0
  }), [anomali]);

  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [tileCount, setTileCount] = useState(0);
  const [tileLoaded, setTileLoaded] = useState(0);

  useEffect(() => {
    // Debug: tampilkan data mentah
    // console.log('WEB - lokasiPenelitian:', lokasiPenelitian);
    // console.log('WEB - lokasiDetail:', lokasiDetail);
    // console.log('WEB - anomali:', anomali);
    // Hanya fetch jika lokasi tidak punya detail
    if (lokasi && (!lokasi.name || !lokasi.coordinates) && lokasi.id) {
      const fetchLocationData = async (id_lokasi) => {
        try {
          const apiUrl = port.endsWith('/')
            ? `${port}data_lokasi/${id_lokasi}`
            : `${port}/data_lokasi/${id_lokasi}`;
          const response = await fetch(apiUrl);
          if (!response.ok) return;
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            setLokasiDetail(data[0]);
          } else if (data && typeof data === 'object') {
            setLokasiDetail(data);
          }
        } catch (error) {
          // Biarkan lokasiDetail tetap default
        }
      };
      fetchLocationData(lokasi.id);
    } else {
      setLokasiDetail(lokasi);
    }
  }, [lokasi]);

  useEffect(() => {
    setIsMapLoaded(false);
    setTileCount(0);
    setTileLoaded(0);
  }, [anomali.id, lokasiDetail?.id]);

  // Reset form ketika modal dibuka/ditutup
  useEffect(() => {
    if (showPredictionUpdateModal) {
      form.setFieldsValue(initialValues);
      setUpdateError(null);
    }
  }, [showPredictionUpdateModal, initialValues, form]);

  if (!anomali || !lokasiDetail) return <div>Data tidak ditemukan.</div>;

  // Ambil parameter yang anomali
  const params = [
    { key: 'Turbidity', ...anomali.turbidity },
    { key: 'pH', ...anomali.pH },
    { key: 'Temperature', ...anomali.temperature },
  ];
  const vitalAnomali = params.filter(p => p.isAnomaly);

  // Koordinat lokasi penelitian utama (dari data_lokasi)
  const [mainLat, mainLon] = useMemo(() => {
    let lat = null, lon = null;
    if (lokasiPenelitian && lokasiPenelitian.lat && lokasiPenelitian.lon) {
      lat = parseFloat(lokasiPenelitian.lat);
      lon = parseFloat(lokasiPenelitian.lon);
    } else if (lokasiPenelitian && lokasiPenelitian.coordinates) {
      [lat, lon] = lokasiPenelitian.coordinates.split(',').map(s => parseFloat(s.trim()));
    }
    // console.log('WEB - Koordinat Lokasi Penelitian:', lat, lon);
    return [lat, lon];
  }, [lokasiPenelitian]);

  // Koordinat marker sensor (ambil dari data sensor, prioritas pH, lalu temperature, lalu turbidity)
  const [lat, lon] = useMemo(() => {
    let sensorLat = null, sensorLon = null;
    if (anomali.pH?.lat && anomali.pH?.lon) {
      // console.log('WEB - anomali.pH.lat:', anomali.pH.lat, typeof anomali.pH.lat);
      // console.log('WEB - anomali.pH.lon:', anomali.pH.lon, typeof anomali.pH.lon);
      sensorLat = parseFloat(anomali.pH.lat);
      sensorLon = parseFloat(anomali.pH.lon);
      // console.log('WEB - Parsed pH lat/lon:', sensorLat, sensorLon);
    } else if (anomali.temperature?.lat && anomali.temperature?.lon) {
      sensorLat = parseFloat(anomali.temperature.lat);
      sensorLon = parseFloat(anomali.temperature.lon);
      // console.log('WEB - Parsed temperature lat/lon:', sensorLat, sensorLon);
    } else if (anomali.turbidity?.lat && anomali.turbidity?.lon) {
      sensorLat = parseFloat(anomali.turbidity.lat);
      sensorLon = parseFloat(anomali.turbidity.lon);
      // console.log('WEB - Parsed turbidity lat/lon:', sensorLat, sensorLon);
    } else if (lokasiDetail && lokasiDetail.coordinates) {
      [sensorLat, sensorLon] = lokasiDetail.coordinates.split(',').map(s => parseFloat(s.trim()));
      // console.log('WEB - Fallback lokasiDetail.coordinates:', sensorLat, sensorLon);
    } else {
      sensorLat = mainLat;
      sensorLon = mainLon;
      // console.log('WEB - Fallback mainLat/mainLon:', sensorLat, sensorLon);
    }
    // console.log('WEB - Koordinat Data Sensor:', sensorLat, sensorLon);
    return [sensorLat, sensorLon];
  }, [anomali, lokasiDetail, mainLat, mainLon]);

  // Polyline dari lokasi utama ke marker sensor
  const polylinePositions = useMemo(() => (
    mainLat && mainLon ? [ [mainLat, mainLon], [lat, lon] ] : null
  ), [mainLat, mainLon, lat, lon]);

  // Center map ke tengah antara dua marker (agar dua marker selalu terlihat)
  const mapCenter = useMemo(() => {
    if (mainLat && mainLon) {
      return [
        (mainLat + lat) / 2,
        (mainLon + lon) / 2
      ];
    }
    return [lat, lon];
  }, [mainLat, mainLon, lat, lon]);

  // Data sensor untuk popup
  const sensorPopupContent = (
    <div>
      <b>Data Sensor</b>
      <ul style={{ margin: 0, padding: '4px 0 0 18px', fontSize: 14 }}>
        <li>pH: {anomali.pH?.value ?? '-'}</li>
        <li>Temperatur: {anomali.temperature?.value ?? '-'} °C</li>
        <li>Turbidity: {anomali.turbidity?.value ?? '-'} NTU</li>
      </ul>
      <div style={{ marginTop: 6, fontSize: 13, color: '#888' }}>
        Koordinat: {lat}, {lon}
      </div>
    </div>
  );

  // Function to handle updating all three vital parameters at once
  const handlePredictionUpdate = useCallback(async (values) => {
    try {
      setIsUpdating(true);
      setUpdateError(null);

      // Extract the klasifikasi ID from anomali
      const klasifikasiId = anomali.id;

      // Use klasifikasi endpoint to update sensor values and get new prediction
      const endpoint = `klasifikasi/${klasifikasiId}/prediction`;
      const apiUrl = port.endsWith('/')
        ? `${port}${endpoint}`
        : `${port}/${endpoint}`;

      // console.log(`PUT request to: ${apiUrl}`, values);

      const response = await fetch(apiUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ph: parseFloat(values.ph) || 0,
          temperature: parseFloat(values.temperature) || 0,
          turbidity: parseFloat(values.turbidity) || 0,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Failed to update prediction: ${response.status}`, errorText);
        throw new Error(`Server responded with status ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Failed to update prediction data');
      }

      message.success(`Data sensor berhasil diperbarui. Prediksi baru: ${result.prediction.klasifikasi}`);

      setShowPredictionUpdateModal(false);
      
      // Refresh data by calling onUpdate callback
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error updating prediction data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setUpdateError(errorMessage);
      message.error(`Error saat memperbarui prediksi: ${errorMessage}`);
    } finally {
      setIsUpdating(false);
    }
  }, [anomali.id, onUpdate]);

  // Handle form submission
  const handleFormSubmit = useCallback(async (values) => {
    await handlePredictionUpdate(values);
  }, [handlePredictionUpdate]);

  // Handle modal close
  const handleModalClose = useCallback(() => {
    setShowPredictionUpdateModal(false);
    setUpdateError(null);
    form.resetFields();
  }, [form]);

  const handleDeleteAnomali = () => {
    AntdModal.confirm({
      title: 'Yakin hapus data?',
      icon: <ExclamationCircleOutlined />,
      content: 'Data yang dihapus tidak bisa dikembalikan.',
      okText: 'Hapus',
      okType: 'danger',
      cancelText: 'Batal',
      onOk: async () => {
        try {
          await fetch(`${port}klasifikasi/${anomali.id}`, { method: 'DELETE' });
          message.success('Data anomali berhasil dihapus');
          if (onBack) onBack();
          if (onUpdate) onUpdate();
        } catch (err) {
          message.error('Gagal menghapus data anomali');
        }
      },
    });
  };

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: 16 }}>
      {/* Header Alert */}
      <div style={{ background: '#E62F2A', color: 'white', borderRadius: 16, padding: 20, marginBottom: 24 }}>
        <div style={{ fontWeight: 700, fontSize: 18, display: 'flex', alignItems: 'center' }}>
          <ExclamationCircleOutlined style={{ fontSize: 22, marginRight: 10 }} />
          Terdeteksi {vitalAnomali.length} Parameter Vital Anomali
        </div>
        <div style={{ background: '#fff0f0', color: '#E62F2A', borderRadius: 12, padding: 16, marginTop: 16 }}>
          <div style={{ fontWeight: 500, marginBottom: 8 }}>Parameter berikut melebihi ambang batas normal:</div>
          <Space>
            {vitalAnomali.map(p => (
              <Tag key={p.key} color="#F7E6EB" style={{ color: '#E62F2A', fontWeight: 600, fontSize: 16, borderRadius: 8, padding: '6px 18px' }}>
                {paramIcons[p.key]} {paramLabels[p.key]}
              </Tag>
            ))}
          </Space>
          <div style={{ color: '#333', marginTop: 12, fontSize: 14 }}>
            Parameter vital sangat penting untuk menentukan kualitas air. Nilai di luar batas normal memerlukan perhatian segera.
          </div>
        </div>
      </div>

      {/* Informasi Lokasi */}
      <Card title={<span><EnvironmentOutlined /> Informasi Lokasi</span>} style={{ marginBottom: 24, borderRadius: 16 }}>
        <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Nama Lokasi:</div>
        <div style={{ fontSize: 18, marginBottom: 12 }}>{lokasiDetail.name}</div>
        <div style={{ display: 'flex', gap: 32, marginBottom: 12 }}>
          <div>
            <div style={{ color: '#888' }}>ID Lokasi</div>
            <div style={{ fontWeight: 500 }}>{lokasiDetail.id}</div>
          </div>
          <div>
            <div style={{ color: '#888' }}>Tanggal</div>
            <div style={{ fontWeight: 500 }}>{anomali.date} {anomali.time}</div>
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <div style={{ color: '#888' }}>Alamat Lengkap:</div>
          <div style={{ background: '#f5f5f5', borderRadius: 8, padding: 8 }}>{lokasiDetail.address}</div>
        </div>
        <div>
          <div style={{ color: '#888' }}>Koordinat Lokasi:</div>
          <div style={{ background: '#f5f5f5', borderRadius: 8, padding: 8 }}>{lokasiDetail.coordinates}</div>
        </div>
      </Card>

      {/* Peta Lokasi & Sensor */}
      <Card title={<span>🗺️ Peta Lokasi & Sensor</span>} style={{ marginBottom: 24, borderRadius: 16 }}>
        <div style={{ height: 220, borderRadius: 12, overflow: 'hidden', marginBottom: 12, position: 'relative' }}>
          {!isMapLoaded && (
            <div style={{
              position: 'absolute', zIndex: 10, top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(255,255,255,0.85)', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center'
            }}>
              <SyncOutlined spin style={{ fontSize: 32, color: '#E62F2A', marginBottom: 12 }} />
              <div style={{ color: '#E62F2A', fontWeight: 600, fontSize: 16 }}>Memuat data peta...</div>
            </div>
          )}
          <MapContainer
            key={anomali.id || lokasiDetail.id || 'map-static'}
            center={mapCenter}
            zoom={14}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={false}
            attributionControl={false}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              eventHandlers={{
                load: () => setIsMapLoaded(true),
                tileloadstart: () => setTileCount((c) => c + 1),
                tileload: () => setTileLoaded((l) => {
                  const next = l + 1;
                  if (next === tileCount && tileCount > 0) setIsMapLoaded(true);
                  return next;
                }),
              }}
            />
            {/* Auto-fit bounds jika dua marker valid */}
            {polylinePositions && <FitBounds positions={polylinePositions} />}
            {/* Polyline antara lokasi penelitian utama dan sensor */}
            {polylinePositions && (
              <Polyline positions={polylinePositions} color="#2a5ad7" />
            )}
            {/* Marker lokasi penelitian utama */}
            {mainLat && mainLon && (
              <Marker position={[mainLat, mainLon]} icon={blueIcon}>
                <Popup>Lokasi Penelitian Utama</Popup>
              </Marker>
            )}
            {/* Marker sensor (titik data) */}
            <Marker position={[lat, lon]} icon={purpleIcon}>
              <Popup>{sensorPopupContent}</Popup>
            </Marker>
          </MapContainer>
        </div>
        <div style={{ marginBottom: 8 }}>
          <b>Keterangan:</b> <span style={{ color: '#2a5ad7' }}>● Lokasi Utama</span>
          <span style={{ color: '#6366f1', marginLeft: 16 }}>● Titik Data Sensor</span>
        </div>
        <div style={{ color: '#888', marginBottom: 4 }}>Koordinat Sensor:</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <EnvironmentOutlined style={{ color: '#2a5ad7' }} />
          <span style={{ fontWeight: 500 }}>{lat}, {lon}</span>
        </div>
        <div style={{ background: '#fff0f0', color: '#E62F2A', borderRadius: 8, padding: 8, fontWeight: 500 }}>
          <ExclamationCircleOutlined /> Lokasi ini memiliki parameter air yang anomali
        </div>
      </Card>

      {/* Data Sensor */}
      <Card title={<span>Data Sensor</span>} style={{ marginBottom: 24, borderRadius: 16 }}>
        {params.map(param => (
          <div key={param.key} style={{ background: param.isAnomaly ? '#fff0f0' : '#f5f5f5', borderRadius: 12, padding: 18, marginBottom: 18, position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
              {paramIcons[param.key]}
              <span style={{ fontWeight: 600, fontSize: 16 }}>{paramLabels[param.key]}</span>
              {param.isAnomaly && <Tag color="#E62F2A" style={{ position: 'absolute', right: 18, top: 18, fontWeight: 600 }}>Anomali</Tag>}
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#E62F2A', marginBottom: 8 }}>
              {param.value} {param.key === 'Temperature' ? '°C' : ''}
            </div>
            {param.isAnomaly && (
              <div style={{ background: '#fff', borderLeft: '4px solid #E62F2A', borderRadius: 8, padding: 12, marginBottom: 8 }}>
                <div style={{ color: '#E62F2A', fontWeight: 600 }}>
                  {param.message}
                </div>
                <div style={{ color: '#888' }}>Range normal: {paramRanges[param.key]}</div>
              </div>
            )}
          </div>
        ))}
      </Card>

      {/* Aksi */}
      <Card style={{ borderRadius: 16, marginBottom: 24 }}>
        <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Update Parameter & Prediksi</div>
        <div style={{ color: '#888', marginBottom: 16 }}>
          Update nilai pH, Temperatur, dan Kekeruhan untuk mendapatkan prediksi kualitas air terbaru
        </div>
        <Button 
          type="primary" 
          onClick={() => setShowPredictionUpdateModal(true)} 
          style={{ borderRadius: 8, marginBottom: 8 }} 
          block
          icon={<SyncOutlined />}
        >
          Update Parameter & Prediksi
        </Button>
      </Card>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <Button onClick={onBack} style={{ borderRadius: 8, flex: 1 }}>Kembali</Button>
        <Button danger onClick={handleDeleteAnomali} style={{ borderRadius: 8, flex: 1 }}>Hapus Data</Button>
      </div>

      {/* Prediction Update Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <SyncOutlined style={{ color: '#E62F2A' }} />
            Update Parameter Vital
          </div>
        }
        open={showPredictionUpdateModal}
        onCancel={handleModalClose}
        footer={null}
        width={500}
        centered
        destroyOnClose
        bodyStyle={{ padding: '16px 16px 12px 16px' }} // padding lebih kecil
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFormSubmit}
          initialValues={initialValues}
          style={{ gap: 12, display: 'flex', flexDirection: 'column' }} // jarak antar form item lebih kecil
        >
          <div style={{ marginBottom: 16 }}>
            <div style={{ 
              background: '#f0f9ff', 
              border: '1px solid #bae6fd', 
              borderRadius: 8, 
              padding: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <InfoCircleOutlined style={{ color: '#0ea5e9' }} />
              <span style={{ color: '#0c4a6e', fontSize: 14 }}>
                Update nilai parameter vital untuk mendapatkan prediksi kualitas air terbaru
              </span>
            </div>
          </div>

          {/* Error Display */}
          {updateError && (
            <div style={{ 
              background: '#fef2f2', 
              border: '1px solid #fecaca', 
              borderRadius: 8, 
              padding: 10,
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}>
              <ExclamationCircleOutlined style={{ color: '#dc2626' }} />
              <span style={{ color: '#dc2626', fontSize: 14 }}>{updateError}</span>
            </div>
          )}

          {/* pH Input */}
          <Form.Item
            label={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#3b82f6' }}>⚗️</span>
                <span>Nilai pH</span>
              </div>
            }
            name="ph"
            rules={[
              { required: true, message: 'Nilai pH harus diisi' },
              { type: 'number', min: inputValidation.ph.min, max: inputValidation.ph.max, message: `pH harus antara ${inputValidation.ph.min} - ${inputValidation.ph.max}` }
            ]}
            style={{ marginBottom: 12 }}
          >
            <InputNumber
              style={{ width: '100%', borderRadius: 8 }}
              placeholder="Masukkan nilai pH"
              min={inputValidation.ph.min}
              max={inputValidation.ph.max}
              step={inputValidation.ph.step}
              precision={1}
            />
          </Form.Item>

          {/* Temperature Input */}
          <Form.Item
            label={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#3b82f6' }}>🌡️</span>
                <span>Temperatur (°C)</span>
              </div>
            }
            name="temperature"
            rules={[
              { required: true, message: 'Nilai temperatur harus diisi' },
              { type: 'number', min: inputValidation.temperature.min, max: inputValidation.temperature.max, message: `Temperatur harus antara ${inputValidation.temperature.min} - ${inputValidation.temperature.max}°C` }
            ]}
            style={{ marginBottom: 12 }}
          >
            <InputNumber
              style={{ width: '100%', borderRadius: 8 }}
              placeholder="Masukkan nilai temperatur"
              min={inputValidation.temperature.min}
              max={inputValidation.temperature.max}
              step={inputValidation.temperature.step}
              precision={1}
            />
          </Form.Item>

          {/* Turbidity Input */}
          <Form.Item
            label={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: '#3b82f6' }}>💧</span>
                <span>Kekeruhan (NTU)</span>
              </div>
            }
            name="turbidity"
            rules={[
              { required: true, message: 'Nilai kekeruhan harus diisi' },
              { type: 'number', min: inputValidation.turbidity.min, max: inputValidation.turbidity.max, message: `Kekeruhan harus antara ${inputValidation.turbidity.min} - ${inputValidation.turbidity.max} NTU` }
            ]}
            style={{ marginBottom: 12 }}
          >
            <InputNumber
              style={{ width: '100%', borderRadius: 8 }}
              placeholder="Masukkan nilai kekeruhan"
              min={inputValidation.turbidity.min}
              max={inputValidation.turbidity.max}
              step={inputValidation.turbidity.step}
              precision={1}
            />
          </Form.Item>

          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <Button 
              onClick={handleModalClose} 
              style={{ flex: 1, borderRadius: 8 }}
              disabled={isUpdating}
            >
              Batal
            </Button>
            <Button 
              type="primary" 
              htmlType="submit"
              loading={isUpdating}
              style={{ flex: 1, borderRadius: 8 }}
              icon={<SyncOutlined />}
            >
              {isUpdating ? 'Memperbarui...' : 'Update & Dapatkan Prediksi'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default AnomaliDetail; 