import React, { useState, useEffect } from "react";
import { Modal, Button, Table, Spinner, Alert, Form } from "react-bootstrap";
import {
  Download,
  Magic,
  X,
} from "react-bootstrap-icons";
import { port, ml } from '../constant/https.jsx';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const AnalisisModal = ({ show, onHide, analisis, onFocusMarker }) => {
  const [waterData, setWaterData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [sortConfig, setSortConfig] = useState({
    key: 'tanggal',
    direction: 'desc' // 'desc' untuk terbaru, 'asc' untuk terlama
  });
  const [lokasiPenelitian, setLokasiPenelitian] = useState(null);
  const [loadingLokasi, setLoadingLokasi] = useState(false);
  const [errorLokasi, setErrorLokasi] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loadingPrediction, setLoadingPrediction] = useState(false);
  const [errorPrediction, setErrorPrediction] = useState(null);
  const [nStep, setNStep] = useState(12);

  // Ambil koordinat dari analisis
  let latitude = null;
  let longitude = null;
  if (analisis) {
    if (analisis.latitude && analisis.longitude) {
      latitude = parseFloat(analisis.latitude);
      longitude = parseFloat(analisis.longitude);
    } else if (analisis.lat && analisis.lon) {
      latitude = parseFloat(analisis.lat);
      longitude = parseFloat(analisis.lon);
    } else if (analisis.coordinates) {
      const coords = analisis.coordinates.split(',');
      if (coords.length === 2) {
        latitude = parseFloat(coords[0]);
        longitude = parseFloat(coords[1]);
      }
    }
  }

  // Fungsi untuk mengurutkan data
  const sortData = (data) => {
    return [...data].sort((a, b) => {
      const dateA = new Date(a.tanggal);
      const dateB = new Date(b.tanggal);
      
      if (sortConfig.direction === 'asc') {
        return dateA - dateB;
      } else {
        return dateB - dateA;
      }
    });
  };

  // Fungsi untuk mengubah pengurutan
  const handleSort = () => {
    setSortConfig(prevConfig => ({
      key: 'tanggal',
      direction: prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Fetch data from server when modal opens or page/itemsPerPage changes
  useEffect(() => {
    if (show && analisis) {
      const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
          console.log('Analisis ID:', analisis.id);
          const response = await fetch(
            `${port}data_combined/paginated/${analisis.id}?page=${currentPage + 1}&limit=${itemsPerPage}`
          );

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const result = await response.json();
          console.log('WaterData:', result.data);

          if (result.success) {
            // Urutkan data setelah fetch
            const sortedData = sortData(result.data);
            setWaterData(sortedData);
            setTotalItems(result.total);
          } else {
            throw new Error(result.message || "Failed to fetch data");
          }
        } catch (err) {
          console.error("Error fetching water data:", err);
          setError(err.message || "An unknown error occurred");
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }
  }, [show, analisis, currentPage, itemsPerPage, sortConfig]);

  // Fetch lokasi penelitian by id_lokasi
  useEffect(() => {
    if (analisis && analisis.id) {
      setLoadingLokasi(true);
      setErrorLokasi(null);
      fetch(`${port}data_lokasi/${analisis.id}`)
        .then(res => res.json())
        .then(data => {
          // Data bisa array atau object
          if (Array.isArray(data) && data.length > 0) {
            setLokasiPenelitian(data[0]);
          } else if (data && typeof data === 'object') {
            setLokasiPenelitian(data);
          } else {
            setLokasiPenelitian(null);
          }
        })
        .catch(err => setErrorLokasi('Gagal memuat lokasi'))
        .finally(() => setLoadingLokasi(false));
    } else {
      setLokasiPenelitian(null);
    }
  }, [analisis]);

  // Fungsi prediksi kualitas air
  const handlePredict = async () => {
    if (!waterData.length) return;
    setLoadingPrediction(true);
    setErrorPrediction(null);
    setPrediction(null);
    try {
      // Ambil data sensor terbaru (paling akhir setelah sort)
      const latest = [...waterData].sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))[0];
      const requestData = {
        pH_t: latest.nilai_ph,
        temperature_t: latest.nilai_temperature,
        turbidity_t: latest.nilai_turbidity,
        n_step: nStep
      };
      console.log('RequestData ke ML:', requestData);
      // Panggil endpoint ML langsung (tanpa proxy)
      const response = await fetch(`${ml}predict_regresi_class`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(requestData)
      });
      if (!response.ok) throw new Error('Gagal memuat prediksi');
      const result = await response.json();
      setPrediction(result);
    } catch (err) {
      setErrorPrediction(err.message || 'Gagal memuat prediksi');
    } finally {
      setLoadingPrediction(false);
    }
  };

  // Function to download data as CSV
  const downloadCSV = () => {
    if (waterData.length === 0) return;

    const headers =
      "Tanggal,pH,Suhu (°C),Turbidity (NTU),Kecepatan (m/s),Accel X,Accel Y,Accel Z";
    const csvRows = waterData.map(
      (item) =>
        `"${new Date(item.tanggal).toLocaleString()}",${item.nilai_ph},${
          item.nilai_temperature
        },${item.nilai_turbidity},${item.nilai_speed ?? "null"},${
          item.nilai_accel_x
        },${item.nilai_accel_y},${item.nilai_accel_z}`
    );

    const csvContent = `data:text/csv;charset=utf-8,${headers}\n${csvRows.join(
      "\n"
    )}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `water_sensor_data_${analisis?.name || "unknown"}_${new Date()
        .toISOString()
        .slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(0);
  };

  // Custom marker icon (merah)
  const markerSelected = L.divIcon({
    className: 'marker-selected',
    html: '<div style="background:#E62F2A;width:28px;height:28px;border-radius:50%;border:4px solid white;box-shadow:0 0 8px rgba(0,0,0,0.3);"></div>',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });

  // Reset prediksi saat lokasi/modal berubah
  useEffect(() => {
    setPrediction(null);
    setErrorPrediction(null);
  }, [analisis, show]);

  // Auto-prediksi setiap kali data sensor berubah dan tidak kosong
  useEffect(() => {
    if (waterData.length > 0) {
      handlePredict();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waterData, nStep]);

  return (
    <Modal show={show} onHide={onHide} centered size="xl">
      <Modal.Header closeButton>
        <Modal.Title>Detail Sungai</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {analisis && (
          <>
            <h2><b>{analisis.name}</b></h2>
            <br />
            <div className="mb-3">
              <h6 className="text-muted">
                <i className="bi bi-geo-alt-fill"></i> Alamat
              </h6>
              <p className="mb-0">{analisis.address}</p>
            </div>

            <div className="mb-4">
              <h6 className="text-muted">
                <i className="bi bi-calendar2-week-fill"></i> Tanggal Penelitian
              </h6>
              <p className="mb-0">Terakhir diperbarui: {analisis.date}</p>
            </div>

            {/* CARD PREDIKSI */}
            <div className="mb-4 p-4 rounded" style={{ background: '#fff', border: '1.2px solid #e0e7ef', maxWidth: 520, minHeight: 260, margin: '0 auto', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <h2>Prediksi Kualitas Air</h2>
              <div className="d-flex flex-column align-items-center mb-3" style={{ gap: 16 }}>
                <div style={{ fontSize: 36, color: '#E62F2A', background: '#fff0f0', borderRadius: 16, padding: 10 }}>
                  <Magic />
                </div>
                {/* <div>
                  <h5 className="mb-1" style={{ fontWeight: 700, color: '#1e293b' }}>Prediksi Kualitas Air</h5>
                  <div style={{ color: '#64748b', fontSize: 15 }}>Dapatkan prediksi kualitas air berdasarkan data sensor terbaru</div>
                </div> */}
              </div>
              <Form.Group className="mb-3" controlId="select-n-step">
                <Form.Label style={{ fontWeight: 500 }}>Pilih Rentang Waktu Prediksi</Form.Label>
                <Form.Select
                  value={nStep}
                  onChange={e => setNStep(Number(e.target.value))}
                  disabled={loadingPrediction}
                  style={{ borderRadius: 12, fontWeight: 500, maxWidth: 260, margin: '0 auto', display: 'inline-block' }}
                >
                  <option value={12}>1 jam</option>
                  <option value={36}>3 jam</option>
                  <option value={72}>6 jam</option>
                  <option value={144}>12 jam</option>
                  <option value={288}>1 hari</option>
                  <option value={864}>3 hari</option>
                  <option value={2016}>1 minggu</option>
                </Form.Select>
              </Form.Group>
              <Button
                style={{ borderRadius: '50px', minWidth: 160, fontWeight: 600, fontSize: 16, margin: '0 auto', display: 'block' }}
                variant="danger"
                onClick={handlePredict}
                disabled={loading || loadingPrediction || waterData.length === 0}
                className="mb-3 prediksi-btn"
              >
                {loadingPrediction ? (
                  <span className="d-flex align-items-center justify-content-center gap-2">
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Memuat Prediksi...
                  </span>
                ) : (
                  <>
                    <Magic className="me-2 text-white" />Prediksi
                  </>
                )}
              </Button>
              {errorPrediction && (
                <Alert variant="danger" className="mb-2">{errorPrediction}</Alert>
              )}
              {prediction && (
                <div className="mt-3">
                  <div className="mb-3 d-flex flex-column align-items-center gap-3 flex-wrap">
                    <span style={{
                      background: prediction.quality === 'Sangat Layak' ? 'linear-gradient(90deg,#10b981,#34d399)' : prediction.quality === 'Layak' ? 'linear-gradient(90deg,#3b82f6,#60a5fa)' : prediction.quality === 'Kurang Layak' ? 'linear-gradient(90deg,#f59e0b,#fbbf24)' : 'linear-gradient(90deg,#ef4444,#f87171)',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: 18,
                      borderRadius: 20,
                      padding: '8px 22px',
                      letterSpacing: 0.5,
                      display: 'inline-block',
                      margin: '0 auto',
                    }}>
                      {prediction.quality}
                    </span>
                  </div>
                  <div className="row justify-content-center text-center mb-2" style={{ fontWeight: 600, fontSize: 16 }}>
                    <div className="col-4">
                      <div style={{ color: '#6366f1', fontSize: 15 }}>pH</div>
                      <div style={{ fontSize: 22 }}>{prediction.pH_pred?.toFixed(2)}</div>
                    </div>
                    <div className="col-4">
                      <div style={{ color: '#f59e0b', fontSize: 15 }}>Suhu</div>
                      <div style={{ fontSize: 22 }}>{prediction.temperature_pred?.toFixed(2)} °C</div>
                    </div>
                    <div className="col-4">
                      <div style={{ color: '#ef4444', fontSize: 15 }}>Turbidity</div>
                      <div style={{ fontSize: 22 }}>{prediction.turbidity_pred < 0 ? 23.26 : prediction.turbidity_pred?.toFixed(2)} NTU</div>
                    </div>
                  </div>
                  <div className="mt-2" style={{ background: '#f8fafc', borderRadius: 10, padding: 12, color: '#334155', fontSize: 15, border: '1px solid #e0e7ef', maxWidth: 400, margin: '0 auto' }}>
                    {prediction.reason}
                  </div>
                </div>
              )}
            </div>

            {/* MAPS: Lokasi Penelitian */}
            <div className="mb-4">
              <h6 className="text-muted mb-2"><i className="bi bi-map"></i> Peta Lokasi Penelitian</h6>
              {loadingLokasi ? (
                <div className="text-center py-3">Memuat peta lokasi...</div>
              ) : errorLokasi ? (
                <div className="text-danger py-3">{errorLokasi}</div>
              ) : lokasiPenelitian && lokasiPenelitian.lat && lokasiPenelitian.lon ? (
                <MapContainer
                  center={[parseFloat(lokasiPenelitian.lat), parseFloat(lokasiPenelitian.lon)]}
                  zoom={15}
                  style={{ height: 220, width: '100%', borderRadius: 12 }}
                  scrollWheelZoom={false}
                  attributionControl={false}
                  key={lokasiPenelitian.id}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker 
                    position={[parseFloat(lokasiPenelitian.lat), parseFloat(lokasiPenelitian.lon)]}
                    icon={markerSelected}
                  >
                    <Popup>
                      <b>{lokasiPenelitian.nama_sungai}</b><br />
                      {lokasiPenelitian.alamat}
                    </Popup>
                  </Marker>
                </MapContainer>
              ) : (
                <div className="text-muted py-3">Koordinat lokasi tidak tersedia</div>
              )}
            </div>

            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <Button
                  style={{ borderRadius: '50px' }}
                  variant="primary"
                  onClick={downloadCSV}
                  disabled={waterData.length === 0 || loading}
                  className="me-2"
                >
                  <Download className="me-2 text-white" />
                  {loading ? "Memuat..." : "Unduh Data"}
                </Button>
              </div>
              <div>
                <Button
                  style={{ borderRadius: '50px' }}
                  variant={sortConfig.direction === 'desc' ? 'primary' : 'outline-primary'}
                  onClick={handleSort}
                  disabled={loading}
                  className="me-2"
                >
                  <i className={`bi bi-sort-down${sortConfig.direction === 'asc' ? '-alt' : ''} me-2`}></i>
                  {sortConfig.direction === 'desc' ? 'Terbaru' : 'Terlama'}
                </Button>
              </div>
            </div>

            {loading && (
              <div className="text-center my-4">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2">Memuat data sensor...</p>
              </div>
            )}

            {error && (
              <Alert variant="danger" className="mt-3">
                Gagal memuat data: {error}
              </Alert>
            )}

            {!loading && !error && (
              <>
                {waterData.length > 0 ? (
                  <>
                    <div
                      className="table-responsive"
                      style={{ maxHeight: "500px", overflowY: "auto" }}
                    >
                      <Table striped bordered hover className="mb-0">
                        <thead
                          style={{
                            position: "sticky",
                            top: 0,
                            backgroundColor: "white",
                            zIndex: 1,
                          }}
                        >
                          <tr>
                            <th>No</th>
                            <th>Tanggal</th>
                            <th>pH</th>
                            <th>Suhu (°C)</th>
                            <th>Turbidity (NTU)</th>
                            <th>Kecepatan (m/s)</th>
                            <th>Accel X</th>
                            <th>Accel Y</th>
                            <th>Accel Z</th>
                          </tr>
                        </thead>
                        <tbody>
                          {waterData.map((data, index) => (
                            <tr key={index}>
                              <td>{currentPage * itemsPerPage + index + 1}</td>
                              <td>
                                {new Date(data.tanggal).toLocaleString("id-ID", {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                  hour12: false
                                })}
                              </td>
                              <td
                                style={{
                                  color:
                                    data.nilai_ph > 6 && data.nilai_ph < 8
                                      ? '#28a745' // hijau
                                      : data.nilai_ph > 8 && data.nilai_ph < 9
                                      ? '#ffc107' // kuning
                                      : '#dc3545', // merah
                                  fontWeight: 'bold',
                                }}
                              >
                                {data.nilai_ph.toFixed(2)}
                              </td>
                              <td
                                style={{
                                  color:
                                    data.nilai_temperature > 20 && data.nilai_temperature < 28
                                      ? '#28a745' // hijau
                                      : data.nilai_temperature > 28 && data.nilai_temperature < 33
                                      ? '#ffc107' // kuning
                                      : '#dc3545', // merah
                                  fontWeight: 'bold',
                                }}
                              >
                                {data.nilai_temperature.toFixed(2)}
                              </td>
                              <td
                                style={{
                                  color:
                                    data.nilai_turbidity === 0
                                      ? '#28a745' // hijau jika 0
                                      : data.nilai_turbidity > 0 && data.nilai_turbidity < 15
                                        ? '#28a745' // hijau
                                        : data.nilai_turbidity > 15 && data.nilai_turbidity < 100
                                          ? '#ffc107' // kuning
                                          : '#dc3545', // merah
                                  fontWeight: 'bold',
                                }}
                              >
                                {data.nilai_turbidity.toFixed(2)}
                              </td>
                              <td>{data.nilai_speed?.toFixed(2) ?? "N/A"}</td>
                              <td>{data.nilai_accel_x.toFixed(2)}</td>
                              <td>{data.nilai_accel_y.toFixed(2)}</td>
                              <td>{data.nilai_accel_z.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>

                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mt-3 gap-2">
                      <div className="d-flex align-items-center" >
                        <Form.Group className="d-flex align-items-center">
                          <Form.Label htmlFor="rows-per-page" className="me-2 mb-0">Baris per halaman :</Form.Label>
                          <Form.Select
                            id="rows-per-page"
                            value={itemsPerPage}
                            onChange={handleItemsPerPageChange}
                            size="sm"
                            style={{ width: "80px" }}
                            disabled={loading}
                          >
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                          </Form.Select>
                        </Form.Group>
                      </div>

                      <div className="d-flex align-items-center">
                        <span className="me-3">
                          {currentPage * itemsPerPage + 1}-
                          {Math.min((currentPage + 1) * itemsPerPage, totalItems)}{" "}
                          dari {totalItems}
                        </span>

                        <Button
                          style={{ borderRadius: '50px' }}
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 0 || loading}
                          className="me-2"
                        >
                          &laquo; Sebelumnya
                        </Button>
                        <Button
                          style={{ borderRadius: '50px' }}
                          variant="outline-primary"
                          size="sm"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={
                            (currentPage + 1) * itemsPerPage >= totalItems ||
                            loading
                          }
                        >
                          Selanjutnya &raquo;
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center mt-3">
                    <i className="bi bi-info-circle me-2"></i>
                    Tidak ada data sensor yang tersedia untuk ditampilkan
                  </div>
                )}
              </>
            )}
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button 
          variant="secondary" 
          onClick={onHide} 
          disabled={loading}
          style={{ borderRadius: '50px' }}
        >
          Tutup
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AnalisisModal;