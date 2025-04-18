import React, { useState, useEffect } from "react";
import { Button, Container, Pagination } from "react-bootstrap";
import FeedModal from "../modalAnalisis/modaldata.jsx"; // Import modal

// Definisikan port (URL API)
const port = "https://server-water-sensors.onrender.com"; // URL server Anda

const Analisis = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [filteredFeeds, setFilteredFeeds] = useState([]);
  const [feeds, setFeeds] = useState([]); // State untuk menyimpan data dari API
  const [showModal, setShowModal] = useState(false);
  const [selectedFeed, setSelectedFeed] = useState(null);

  // Fetch data dari API
  useEffect(() => {
    fetch(`${port}/data_lokasi`) // Gunakan port yang sudah didefinisikan
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
          status: "Baik", // Anda bisa menyesuaikan status berdasarkan data dari API
        }));
        setFeeds(formattedData);
        setFilteredFeeds(formattedData);
      })
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  // Filter data berdasarkan search query
  useEffect(() => {
    const result = feeds.filter(
      (feed) =>
        feed.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        feed.address.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredFeeds(result);
    setCurrentPage(1);
  }, [searchQuery, feeds]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredFeeds.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredFeeds.length / itemsPerPage);

  // Handle Modal
  const handleShowModal = (feed) => {
    setSelectedFeed(feed);
    setShowModal(true);
  };

  return (
    <div className="feeds-container">
      <Container>
        <div className="controls-section">
          <div className="search-input-wrapper">
            <i className="bi bi-search search-icon"></i>
            <input
              type="text"
              placeholder="Cari sungai..."
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Feeds Grid atau Empty State */}
        {currentItems.length > 0 ? (
          <>
            <div className="feeds-grid">
              {currentItems.map((feed) => (
                <div key={feed.id} className="feed-card">
                  <h3>
                    <i className="bi bi-geo-alt-fill text-danger"></i>
                    <b> {feed.name}</b>
                  </h3>
                  <br />
                  <p className="feed-address">{feed.address}</p>
                  <p className="feed-date">
                    <i className="bi bi-calendar2-week-fill text-danger"></i> {feed.date}
                  </p>
                  <Button
                    className="learn-more-button btn-danger"
                    onClick={() => handleShowModal(feed)}
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
        <FeedModal
          show={showModal}
          onHide={() => setShowModal(false)}
          feed={selectedFeed}
        />
      </Container>
    </div>
  );
};

export default Analisis;