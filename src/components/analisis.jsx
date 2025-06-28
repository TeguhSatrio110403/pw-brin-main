import React, { useState, useEffect } from "react";
import { Button, Container, Pagination } from "react-bootstrap";
import AnalisisModal from "../modalAnalisis/modaldata.jsx"; // Import modal
import { port } from "../constant/https.jsx"; // Import port dari constant

// Definisikan port (URL API)
// const port = "https://server-water-sensors.onrender.com"; // URL server Anda

const Analisis = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [filteredAnalisis, setFilteredAnalisis] = useState([]);
  const [analisisList, setAnalisisList] = useState([]); // State untuk menyimpan data dari API
  const [showModal, setShowModal] = useState(false);
  const [selectedAnalisis, setSelectedAnalisis] = useState(null);
  const [sortOrder, setSortOrder] = useState('desc'); // Default: terbaru

  // Fetch data dari API
  useEffect(() => {
    fetch(`${port}data_lokasi`) // Gunakan port yang sudah didefinisikan
      .then((response) => response.json())
      .then((data) => {
        const formattedData = data.map((item) => ({
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
          rawDate: new Date(item.tanggal), // Tambahkan raw date untuk sorting
          status: "Baik", // Anda bisa menyesuaikan status berdasarkan data dari API
        }));
        
        // Sort data berdasarkan tanggal terbaru
        const sortedData = formattedData.sort((a, b) => b.rawDate - a.rawDate);
        setAnalisisList(sortedData);
        setFilteredAnalisis(sortedData);
      })
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  // Filter data berdasarkan search query dan sort order
  useEffect(() => {
    let result = analisisList.filter(
      (analisis) =>
        analisis.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        analisis.address.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort data berdasarkan sort order
    result = [...result].sort((a, b) => {
      return sortOrder === 'desc' 
        ? b.rawDate - a.rawDate   // Terbaru ke terlama
        : a.rawDate - b.rawDate;  // Terlama ke terbaru
    });

    setFilteredAnalisis(result);
    setCurrentPage(1);
  }, [searchQuery, analisisList, sortOrder]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAnalisis.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAnalisis.length / itemsPerPage);

  // Handle Modal
  const handleShowModal = (analisis) => {
    setSelectedAnalisis(analisis);
    setShowModal(true);
  };

  // Handler untuk tombol 'Lihat di Peta' di modal
  const handleFocusMarker = (coords) => {
    // Contoh: bisa dihubungkan ke dashboard/map, atau hanya log
    console.log('Fokus ke marker:', coords);
    // TODO: Integrasi dengan map/dashboard jika perlu
  };

  // Handle Sort
  const handleSort = () => {
    setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
  };

  return (
    <div className="feeds-container">
      <Container>
        <div className="controls-section" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="search-input-wrapper" style={{ 
              flex: 1,
              marginRight: '20px',
              position: 'relative'
            }}>
              <i className="bi bi-search search-icon" style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#666'
              }}></i>
              <label htmlFor="sungai-search" className="visually-hidden">Cari sungai</label>
              <input
                type="text"
                placeholder="Cari sungai..."
                className="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                id="sungai-search"
                style={{
                  width: '100%',
                  padding: '8px 720px 8px 50px',
                  borderRadius: '100px',
                  border: '1px solid #ddd',
                  fontSize: '16px',
                  Marginleft: '5px'
                }}
              />
            </div>
            
            <Button
              onClick={handleSort}
              style={{ 
                borderRadius: '100px',
                color: '#E62F2A',
                borderColor: '#E62F2A',
                backgroundColor: 'white',
                padding: '8px 16px',
                minWidth: '120px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              <i className={`bi bi-sort-${sortOrder === 'desc' ? 'down' : 'up'}`} style={{ color: '#E62F2A' }}></i>
              {sortOrder === 'desc' ? 'Terbaru' : 'Terlama'}
            </Button>
          </div>
        </div>

        {/* Feeds Grid atau Empty State */}
        {currentItems.length > 0 ? (
          <>
            <div className="feeds-grid">
              {currentItems.map((analisis) => (
                <div key={analisis.id} className="feed-card" style={{
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%'
                }}>
                  <div>
                    <h3>
                      <i className="bi bi-geo-alt-fill text-danger"></i>
                      <b> {analisis.name}</b>
                    </h3>
                    <br />
                    <p className="feed-address">{analisis.address}</p>
                    <p className="feed-date">
                      <i className="bi bi-calendar2-week-fill text-danger"></i> {analisis.date}
                    </p>
                  </div>
                  <Button
                    className="learn-more-button btn-danger"
                    onClick={() => handleShowModal(analisis)}
                    style={{ marginTop: 'auto' }}
                  >
                    Lihat Detail <i className="bi bi-box-arrow-right"></i>
                  </Button>
                </div>
              ))}
            </div>

            {/* Pagination hanya ditampilkan jika ada data */}
            {totalPages > 1 && (
              <div className="d-flex justify-content-center mt-4">
                <Pagination className="pagination-danger">
                  <Pagination.First
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                  />
                  <Pagination.Prev
                    onClick={() => setCurrentPage((prev) => prev - 1)}
                    disabled={currentPage === 1}
                  />

                  {[...Array(totalPages)].map((_, idx) => {
                    const pageNumber = idx + 1;

                    // Selalu tampilkan halaman pertama
                    if (pageNumber === 1) {
                      return (
                        <Pagination.Item
                          key={pageNumber}
                          active={pageNumber === currentPage}
                          onClick={() => setCurrentPage(pageNumber)}
                        >
                          {pageNumber}
                        </Pagination.Item>
                      );
                    }

                    // Tampilkan ellipsis setelah halaman pertama jika current page jauh
                    if (pageNumber === 2 && currentPage > 3) {
                      return <Pagination.Ellipsis key="ellipsis1" />;
                    }

                    // Tampilkan halaman di sekitar current page
                    if (
                      pageNumber === currentPage - 1 ||
                      pageNumber === currentPage ||
                      pageNumber === currentPage + 1
                    ) {
                      return (
                        <Pagination.Item
                          key={pageNumber}
                          active={pageNumber === currentPage}
                          onClick={() => setCurrentPage(pageNumber)}
                        >
                          {pageNumber}
                        </Pagination.Item>
                      );
                    }

                    // Tampilkan ellipsis sebelum halaman terakhir
                    if (
                      pageNumber === totalPages - 1 &&
                      currentPage < totalPages - 2
                    ) {
                      return <Pagination.Ellipsis key="ellipsis2" />;
                    }

                    // Selalu tampilkan halaman terakhir
                    if (pageNumber === totalPages) {
                      return (
                        <Pagination.Item
                          key={pageNumber}
                          active={pageNumber === currentPage}
                          onClick={() => setCurrentPage(pageNumber)}
                        >
                          {pageNumber}
                        </Pagination.Item>
                      );
                    }

                    return null;
                  })}

                  <Pagination.Next
                    onClick={() => setCurrentPage((prev) => prev + 1)}
                    disabled={currentPage === totalPages}
                  />
                  <Pagination.Last
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                  />
                </Pagination>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-5 empty-state">
            <i className="bi bi-database-x fs-1 text-muted"></i>
            <h4 className="mt-3">Tidak Ada Data yang Ditemukan</h4>
            <p className="text-muted">
              {searchQuery
                ? `Tidak ada hasil untuk pencarian "${searchQuery}". Coba dengan kata kunci lain.`
                : "Saat ini tidak ada data sungai yang tersedia."}
            </p>
            {searchQuery && (
              <Button 
                variant="outline-danger" 
                onClick={() => setSearchQuery("")}
                className="mt-2"
              >
                <i className="bi bi-arrow-counterclockwise me-2"></i>
                Reset Pencarian
              </Button>
            )}
          </div>
        )}

        {/* Modal Box */}
        <AnalisisModal
          show={showModal}
          onHide={() => setShowModal(false)}
          analisis={selectedAnalisis}
          onFocusMarker={handleFocusMarker}
        />
      </Container>
      <style>{`
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
        
        .feeds-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }
        
        .feed-card {
          background: white;
          border-radius: 8px;
          padding: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          transition: all 0.3s ease;
          height: 280px;
          display: flex;
          flex-direction: column;
        }
        
        .feed-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
        
        .feed-card h3 {
          font-size: 20px;
          margin-bottom: 15px;
          height: 60px;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          line-height: 1.3;
        }
        
        .feed-address {
          margin-bottom: 10px;
          color: #555;
          height: 60px;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          font-size: 14px;
          line-height: 1.4;
        }
        
        .feed-date {
          color: #777;
          font-size: 14px;
          margin-top: 20px;
          margin-bottom: 15px;
          height: 40px;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          line-height: 1.4;
        }
        
        .learn-more-button {
          width: 100%;
          border-radius: 100px;
          padding: 8px 16px;
          font-weight: 500;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          margin-top: auto;
        }
      `}</style>
    </div>
  );
};

export default Analisis;