import { Navbar, Container, Nav, Modal, Button } from "react-bootstrap";
import { useState } from "react";

const NavBar = () => {
  const [showModal, setShowModal] = useState(false); // State untuk mengontrol visibilitas modal
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true"; // Periksa status login dari localStorage

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn"); // Hapus status login
    setShowModal(false); // Tutup modal
    window.location.reload(); // Muat ulang halaman untuk memperbarui UI
  };

  return (
    <div>
      <Navbar expand="lg" className="navbar-box">
        <Container>
          {/* Logo BRIN - hanya bisa di-link jika belum login */}
          {isLoggedIn ? (
            <div className="navbar-brand">
              <img src="./logo.png" alt="Logo" className="logo" />
            </div>
          ) : (
            <Nav.Link href="/home" className="navbar-brand">
              <img src="./logo.png" alt="Logo" className="logo" />
            </Nav.Link>
          )}
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto">
              {isLoggedIn ? (
                <>
                  <Nav.Link href="/dashboard" className="item-list">Dashboard</Nav.Link>
                  <Nav.Link href="/feeds" className="item-list">Feeds</Nav.Link>
                  <Nav.Link href="/analisis" className="item-list">Analisis</Nav.Link>
                  <Nav.Link href="/about" className="item-list">Tentang</Nav.Link>
                  <Nav.Link onClick={() => setShowModal(true)} className="item-list">Logout</Nav.Link>
                </>
              ) : (
                <>
                  <Nav.Link href="/about" className="item-list">Tentang</Nav.Link>
                  <Nav className="right-section">
                    <Button
                      variant="danger"
                      href="/download" // Pastikan URL download benar
                      className="unduh-aplikasi-button"
                    >
                      <i className="bi bi-cloud-arrow-down"></i> Unduh Aplikasi
                    </Button>

                  </Nav>
                </>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Modal untuk konfirmasi logout */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Konfirmasi Logout</Modal.Title>
        </Modal.Header>
        <Modal.Body>Anda yakin ingin logout?</Modal.Body>
        <Modal.Footer>
          <Button variant="btn-sec" onClick={() => setShowModal(false)}>
            Batal
          </Button>
          <Button className="btn-red" onClick={handleLogout}>
            Logout
          </Button>
        </Modal.Footer>
      </Modal>

    </div>
  );
};

export default NavBar;
