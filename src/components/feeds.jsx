// import React, { useState, useEffect } from "react";

// // Data mock untuk contoh
// const mockFeeds = [
//   {
//     id: 1,
//     name: "Sungai Ciliwung",
//     address: "Jakarta, Indonesia",
//     date: "2023-10-01",
//   },
//   {
//     id: 2,
//     name: "Sungai Kapuas",
//     address: "Kalimantan Barat, Indonesia",
//     date: "2023-10-05",
//   },
//   {
//     id: 3,
//     name: "Sungai Bengawan Solo",
//     address: "Jawa Tengah, Indonesia",
//     date: "2023-10-10",
//   },
//   // ... tambahkan data lain sesuai kebutuhan
// ];

// const Feeds = () => {
//   const [searchQuery, setSearchQuery] = useState("");
//   const [sortBy, setSortBy] = useState("name"); // 'name' atau 'date'
//   const [sortOrder, setSortOrder] = useState("asc"); // 'asc' atau 'desc'
//   const [currentPage, setCurrentPage] = useState(1);
//   const [itemsPerPage] = useState(6);

//   // State untuk data yang difilter
//   const [filteredFeeds, setFilteredFeeds] = useState(mockFeeds);

//   useEffect(() => {
//     let result = mockFeeds.filter(
//       (feed) =>
//         feed.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//         feed.address.toLowerCase().includes(searchQuery.toLowerCase())
//     );

//     // Sorting
//     result = result.sort((a, b) => {
//       if (sortBy === "name") {
//         if (sortOrder === "asc") {
//           return a.name.localeCompare(b.name);
//         } else {
//           return b.name.localeCompare(a.name);
//         }
//       } else if (sortBy === "date") {
//         if (sortOrder === "asc") {
//           return new Date(a.date) - new Date(b.date);
//         } else {
//           return new Date(b.date) - new Date(a.date);
//         }
//       }
//       return 0;
//     });

//     setFilteredFeeds(result);
//     setCurrentPage(1); // Reset ke halaman pertama saat filter/sort berubah
//   }, [searchQuery, sortBy, sortOrder]);

//   // Pagination logic
//   const indexOfLastItem = currentPage * itemsPerPage;
//   const indexOfFirstItem = indexOfLastItem - itemsPerPage;
//   const currentItems = filteredFeeds.slice(indexOfFirstItem, indexOfLastItem);
//   const totalPages = Math.ceil(filteredFeeds.length / itemsPerPage);

//   return (
//     <div className="feeds-container">
//       {/* Search and Sort Section */}
//       <div className="controls-section">
//         <div className="search-input-wrapper">
//           <input
//             type="text"
//             placeholder="  Cari sungai..."
//             className="search-input"
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//           />
//           <i className="bi bi-search search-icon-feeds"></i> {/* Ikon pencarian */}
//         </div>

//         <div className="sort-controls">
//           {/* Dropdown untuk memilih kriteria sorting */}
//           <select
//             className="sort-select"
//             value={sortBy}
//             onChange={(e) => setSortBy(e.target.value)}
//           >
//             <option value="name">Nama</option>
//             <option value="date">Tanggal</option>
//           </select>

//           {/* Dropdown untuk memilih urutan sorting */}
//           <select
//             className="sort-select"
//             value={sortOrder}
//             onChange={(e) => setSortOrder(e.target.value)}
//           >
//             <option value="asc">Ascending</option>
//             <option value="desc">Descending</option>
//           </select>
//         </div>
//       </div>

//       {/* Feeds Grid */}
//       <div className="feeds-grid">
//         {currentItems.map((feed) => (
//           <div key={feed.id} className="feed-card">
//             <h3>{feed.name}</h3>
//             <p className="feed-address">{feed.address}</p>
//             <p className="feed-date">Diperbarui pada : {feed.date}</p>
//             <button className="learn-more-button button-style">
//               Selengkapnya
//             </button>
//           </div>
//         ))}
//       </div>

//       {/* Pagination */}
//       <div className="pagination">
//         <button
//           className="button-style"
//           disabled={currentPage === 1}
//           onClick={() => setCurrentPage((prev) => prev - 1)}
//         >
//           Sebelumnya
//         </button>

//         <span>
//           Halaman {currentPage} dari {totalPages}
//         </span>

//         <button
//           className="button-style"
//           disabled={currentPage === totalPages}
//           onClick={() => setCurrentPage((prev) => prev + 1)}
//         >
//           Selanjutnya
//         </button>
//       </div>
//     </div>
//   );
// };

// export default Feeds;

import React, { useState, useEffect } from "react";
import { Button } from "react-bootstrap";
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

const Feeds = () => {
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
      <div className="controls-section">
        <div className="search-input-wrapper">
          <input
            type="text"
            placeholder="  Cari sungai..."
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <i className="bi bi-search search-icon-feeds"></i>
        </div>

        <div className="sort-controls">
          <select
            className="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="name">Nama</option>
            <option value="date">Tanggal</option>
          </select>

          <select
            className="sort-select"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
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
              Lihat Detail
            </Button>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="pagination">
        <button
          className="button-style"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((prev) => prev - 1)}
        >
          Sebelumnya
        </button>

        <span>
          Halaman {currentPage} dari {totalPages}
        </span>

        <button
          className="button-style"
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((prev) => prev + 1)}
        >
          Selanjutnya
        </button>
      </div>

      {/* Modal Box */}
      <FeedModal show={showModal} onHide={() => setShowModal(false)} feed={selectedFeed} />
    </div>
  );
};

export default Feeds;
