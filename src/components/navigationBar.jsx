import { Navbar, Container, Nav, Modal, Button } from "react-bootstrap";
import { useState } from "react";

const NavBar = () => {
  const [showModal, setShowModal] = useState(false); // State untuk mengontrol visibilitas modal
  const [showNavModal, setShowNavModal] = useState(false); // State baru untuk modal navigasi
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
              <img src="./LOGOBRIN.png" alt="Logo" className="logo" />
            </div>
          ) : (
            <Nav.Link href="/home" className="navbar-brand">
              <img src="./LOGOBRIN.png" alt="Logo" className="logo" />
            </Nav.Link>
          )}
          
          {/* Ganti Navbar.Toggle dengan button custom */}
          <Button 
            className="d-lg-none" 
            onClick={() => setShowNavModal(true)}
            variant="outline-dark"
          >
            <i className="bi bi-list"></i>
          </Button>

          {/* Desktop navigation */}
          <div className="d-none d-lg-block">
            <Nav className="ms-auto">
              {isLoggedIn ? (
                <>
                  <Nav.Link href="/dashboard" className="item-list">Dashboard</Nav.Link>
                  <Nav.Link href="/analisis" className="item-list">Analisis</Nav.Link>
                  <Nav.Link href="/feeds" className="item-list">Feeds</Nav.Link>
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
          </div>
        </Container>
      </Navbar>

      {/* Modal Navigation untuk tampilan mobile */}
      <Modal 
        show={showNavModal} 
        onHide={() => setShowNavModal(false)}
        fullscreen="lg-down"
      >
        <Modal.Header closeButton>
          {/* <Modal.Title>Menu</Modal.Title> */}
        </Modal.Header>
        <Modal.Body>
          <Nav className="flex-column">
            {isLoggedIn ? (
              <>
                <Nav.Link href="/dashboard" className="item-list py-3">Dashboard</Nav.Link>
                <Nav.Link href="/analisis" className="item-list py-3">Analisis</Nav.Link>
                <Nav.Link href="/feeds" className="item-list py-3">Feeds</Nav.Link>
                <Nav.Link href="/about" className="item-list py-3">Tentang</Nav.Link>
                <Nav.Link onClick={() => {
                  setShowNavModal(false);
                  setShowModal(true);
                }} className="item-list py-3">Logout</Nav.Link>
              </>
            ) : (
              <>
                <Nav.Link href="/about" className="item-list py-3">Tentang</Nav.Link>
                <div className="mt-3">
                  <Button
                    variant="danger"
                    href="/download"
                    className="unduh-aplikasi-button w-100"
                  >
                    <i className="bi bi-cloud-arrow-down"></i> Unduh Aplikasi
                  </Button>
                </div>
              </>
            )}
          </Nav>
        </Modal.Body>
      </Modal>

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
