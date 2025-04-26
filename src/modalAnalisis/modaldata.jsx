import React, { useState, useEffect } from "react";
import { Modal, Button, Table, Spinner, Alert, Form } from "react-bootstrap";
import {
  Download,
  Magic,
  X,
} from "react-bootstrap-icons";

const FeedModal = ({ show, onHide, feed }) => {
  const [waterData, setWaterData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // Fetch data from server when modal opens or page/itemsPerPage changes
  useEffect(() => {
    if (show && feed) {
      const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await fetch(
            `https://server-water-sensors.onrender.com/data_combined/paginated/${
              feed.id
            }?page=${currentPage + 1}&limit=${itemsPerPage}`
          );

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const result = await response.json();

          if (result.success) {
            setWaterData(result.data);
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
  }, [show, feed, currentPage, itemsPerPage]);

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
      `water_sensor_data_${feed?.name || "unknown"}_${new Date()
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

  return (
    <Modal show={show} onHide={onHide} centered size="xl">
      <Modal.Header closeButton>
        <Modal.Title>Detail Sungai</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {feed && (
          <>
            <h2><b>{feed.name}</b></h2>
            <br />
            <div className="mb-3">
              <h6 className="text-muted">
                <i className="bi bi-geo-alt-fill"></i> Alamat
              </h6>
              <p className="mb-0">{feed.address}</p>
            </div>

            <div className="mb-4">
              <h6 className="text-muted">
                <i className="bi bi-calendar2-week-fill"></i> Tanggal Penelitian
              </h6>
              <p className="mb-0">Terakhir diperbarui: {feed.date}</p>
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
                <Button
                  style={{ borderRadius: '50px' }}
                  variant="danger"
                  onClick={() => alert("Fitur prediksi belum tersedia.")}
                  disabled={loading}
                >
                  <Magic className="me-2 text-white" />
                  Prediksi
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
                                {new Date(data.tanggal).toLocaleString("id-ID")}
                              </td>
                              <td
                                style={{
                                  color: data.nilai_ph < 6 ? "#dc3545" : "#28a745",
                                  fontWeight: "bold",
                                }}
                              >
                                {data.nilai_ph.toFixed(2)}
                              </td>
                              <td
                                style={{
                                  color:
                                    data.nilai_temperature > 30
                                      ? "#dc3545"
                                      : "#007bff",
                                  fontWeight: "bold",
                                }}
                              >
                                {data.nilai_temperature.toFixed(2)}
                              </td>
                              <td
                                // style={{
                                //   color: "#1e293b",
                                //   fontWeight: "bold",
                                // }}
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
                        <span className="me-2">Baris per halaman :</span>
                        <Form.Select
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

export default FeedModal;