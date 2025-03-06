import React, { useState, useEffect } from "react";
import { Button, Container, Dropdown, DropdownButton, Pagination } from "react-bootstrap";
import FeedModal from "../isifeeds/modaldata.jsx"; // Import modal

const mockFeeds = [
  {
    id: 1,
    name: "Sungai Ciliwung",
    address: "Jakarta, Indonesia",
    date: "2023-10-01",
    status: "Tercemar Sedang",
  },
  {
    id: 2,
    name: "Sungai Kapuas",
    address: "Kalimantan Barat, Indonesia",
    date: "2023-10-05",
    status: "Tercemar Berat",
  },
  {
    id: 3,
    name: "Sungai Bengawan Solo",
    address: "Jawa Tengah, Indonesia",
    date: "2023-10-10",
    status: "Baik",
  },
];

const Analisis = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [filteredFeeds, setFilteredFeeds] = useState(mockFeeds);
  const [showModal, setShowModal] = useState(false);
  const [selectedFeed, setSelectedFeed] = useState(null);

  useEffect(() => {
    let result = mockFeeds.filter(
      (feed) =>
        feed.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        feed.address.toLowerCase().includes(searchQuery.toLowerCase())
    );

    result = result.sort((a, b) => {
      if (sortBy === "name") {
        return sortOrder === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      } else if (sortBy === "date") {
        return sortOrder === "asc"
          ? new Date(a.date) - new Date(b.date)
          : new Date(b.date) - new Date(a.date);
      }
      return 0;
    });

    setFilteredFeeds(result);
    setCurrentPage(1);
  }, [searchQuery, sortBy, sortOrder]);

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
            <input
              type="text"
              placeholder="Cari sungai..."
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="sort-controls">
            <DropdownButton 
              id="sort-by-dropdown" 
              title={`${sortBy === 'name' ? 'Nama' : 'Tanggal'}`}
              className="me-2"
              variant="outline-danger"
              style={{
                borderRadius: '500px',
              }}
            >
              <Dropdown.Item 
                onClick={() => setSortBy('name')}
                active={sortBy === 'name'}
                className="dropdown-item-custom"
              >
                Nama
              </Dropdown.Item>
              <Dropdown.Item 
                onClick={() => setSortBy('date')}
                active={sortBy === 'date'}
                className="dropdown-item-custom"
              >
                Tanggal
              </Dropdown.Item>
            </DropdownButton>

            <DropdownButton 
              id="sort-order-dropdown" 
              title={`${sortOrder === 'asc' ? 'Terbaru' : 'Terlama'}`}
              variant="outline-danger"
              style={{
                borderRadius: '500px',
              }}
            >
              <Dropdown.Item 
                onClick={() => setSortOrder('asc')}
                active={sortOrder === 'asc'}
                className="dropdown-item-custom"
              >
                Terbaru
              </Dropdown.Item>
              <Dropdown.Item 
                onClick={() => setSortOrder('desc')}
                active={sortOrder === 'desc'}
                className="dropdown-item-custom"
              >
                Terlama
              </Dropdown.Item>
            </DropdownButton>
          </div>
        </div>

        {/* Feeds Grid */}
        <div className="feeds-grid">
          {currentItems.map((feed) => (
            <div key={feed.id} className="feed-card">
              <h3>{feed.name}</h3>
              <p className="feed-address">{feed.address}</p>
              <p className="feed-date">Diperbarui pada : {feed.date}</p>
              <Button className="learn-more-button btn-danger" onClick={() => handleShowModal(feed)}>
                Lihat Detail <i className="bi bi-box-arrow-right"></i>
              </Button>
            </div>
          ))}
        </div>

        {/* Pagination */}
        <div className="d-flex justify-content-center mt-4">
          <Pagination className="pagination-danger">
            <Pagination.First 
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            />
            <Pagination.Prev
              onClick={() => setCurrentPage(prev => prev - 1)}
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
              if (pageNumber === totalPages - 1 && currentPage < totalPages - 2) {
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
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={currentPage === totalPages}
            />
            <Pagination.Last
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            />
          </Pagination>
        </div>

        {/* Modal Box */}
        <FeedModal show={showModal} onHide={() => setShowModal(false)} feed={selectedFeed} />
      </Container>
    </div>
  );
};

export default Analisis;
