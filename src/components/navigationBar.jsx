import { Navbar, Container, Nav, Modal, Button, Dropdown } from "react-bootstrap";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const NavBar = () => {
  const [showModal, setShowModal] = useState(false); // State untuk mengontrol visibilitas modal
  const [showNavModal, setShowNavModal] = useState(false); // State baru untuk modal navigasi
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true"; // Periksa status login dari localStorage
  const [userInfo, setUserInfo] = useState({
    username: "",
    email: "",
    role: "",
  });
  const [isAdmin, setIsAdmin] = useState(false);

  // Ambil data user dari localStorage saat komponen di-mount
  useEffect(() => {
    if (isLoggedIn) {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      // Periksa juga userInfo untuk kompatibilitas
      const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
      
      setUserInfo({
        username: user.username || userInfo.username || "N/A",
        email: user.email || userInfo.email || "N/A",
        role: user.role || userInfo.role || "guest",
      });
      
      // Set state admin berdasarkan role
      setIsAdmin(
        (user.role && user.role.toLowerCase() === "admin") || 
        (userInfo.role && userInfo.role.toLowerCase() === "admin")
      );
    }
  }, [isLoggedIn]);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn"); // Hapus status login
    localStorage.removeItem("token"); // Hapus token
    localStorage.removeItem("user"); // Hapus data user
    localStorage.removeItem("userInfo"); // Hapus userInfo juga
    setShowModal(false); // Tutup modal
    window.location.reload(); // Muat ulang halaman untuk memperbarui UI
  };

  // Fungsi untuk mendapatkan label role dalam Bahasa Indonesia
  const getRoleLabel = (role) => {
    switch (role.toLowerCase()) {
      case "admin":
        return "Admin";
      case "observer":
        return "Pengamat";
      default:
        return "Tamu";
    }
  };

  // Fungsi untuk mendapatkan kelas warna badge berdasarkan role
  const getRoleBadgeClass = (role) => {
    switch (role.toLowerCase()) {
      case "admin":
        return "bg-danger"; // Merah untuk admin
      case "observer":
        return "bg-primary"; // Biru untuk pengamat
      default:
        return "bg-secondary"; // Abu-abu untuk tamu
    }
  };

  return (
    <div>
      <Navbar expand="lg" className="navbar-box" style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <Container>
          {/* Logo BRIN - hanya bisa di-link jika belum login */}
          {isLoggedIn ? (
            <div className="navbar-brand">
              <img src="./logo.png" alt="Logo" className="logo" 
              style={{ 
                width: '190px', 
                height: 'auto' 
              }} />
            </div>
          ) : (
            <Link to="/home" className="navbar-brand">
              <img src="./LOGOBRIN.png" alt="Logo" className="logo" 
              style={{ 
                width: '190px', 
                height: 'auto' 
              }} />
            </Link>
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
                  <Nav.Item>
                    <Link to="/dashboard" className="nav-link item-list">Dashboard</Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Link to="/analisis" className="nav-link item-list">Analisis</Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Link to="/feeds" className="nav-link item-list">Feeds</Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Link to="/about" className="nav-link item-list">Tentang</Link>
                  </Nav.Item>
                  
                  {/* Dropdown profil menggantikan tombol logout */}
                  <Dropdown align="end">
                    <Dropdown.Toggle variant="light" id="profile-dropdown" className="item-list">
                      <i className="bi bi-person-circle me-1"></i> Profil
                    </Dropdown.Toggle>
                    <Dropdown.Menu className="shadow-sm">
                      <div className="px-3 py-2">
                        <h6 className="mb-1 fw-bold">{userInfo.username}</h6>
                        <p className="text-muted mb-1 small">{userInfo.email}</p>
                        <div className={`badge ${getRoleBadgeClass(userInfo.role)} mb-2`}>{getRoleLabel(userInfo.role)}</div>
                      </div>
                      <Dropdown.Divider />
                      
                      {/* Tambahkan link ke Admin Dashboard jika user adalah admin */}
                      {isAdmin && (
                        <Dropdown.Item 
                          as={Link} 
                          to="/dashboardAdmin" 
                          className="text-danger"
                        >
                          <i className="bi bi-gear-fill me-2"></i>Admin Dashboard
                        </Dropdown.Item>
                      )}
                      
                      <Dropdown.Item onClick={() => setShowModal(true)} className="text-danger">
                        <i className="bi bi-box-arrow-right me-2"></i>Logout
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </>
              ) : (
                <>
                  <Nav.Item>
                    <Link to="/about" className="nav-link item-list">Tentang</Link>
                  </Nav.Item>
                  <Nav className="right-section">
                    <Button
                      variant="danger"
                      href="/download"
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
                {/* Menampilkan info profil di bagian atas modal mobile */}
                <div className="border-bottom pb-3 mb-3">
                  <h6 className="fw-bold">{userInfo.username}</h6>
                  <p className="text-muted mb-1 small">{userInfo.email}</p>
                  <div className={`badge ${getRoleBadgeClass(userInfo.role)}`}>{getRoleLabel(userInfo.role)}</div>
                </div>
                
                <Nav.Item>
                  <Link to="/dashboard" className="nav-link item-list py-3">Dashboard</Link>
                </Nav.Item>
                <Nav.Item>
                  <Link to="/analisis" className="nav-link item-list py-3">Analisis</Link>
                </Nav.Item>
                <Nav.Item>
                  <Link to="/feeds" className="nav-link item-list py-3">Feeds</Link>
                </Nav.Item>
                <Nav.Item>
                  <Link to="/about" className="nav-link item-list py-3">Tentang</Link>
                </Nav.Item>
                
                {/* Tambahkan link ke Admin Dashboard jika user adalah admin */}
                {isAdmin && (
                  <Nav.Item>
                    <Link to="/dashboardAdmin" className="nav-link item-list py-3 text-danger">
                      <i className="bi bi-gear-fill me-2"></i>Admin Dashboard
                    </Link>
                  </Nav.Item>
                )}
                
                <Nav.Item>
                  <div 
                    onClick={() => {
                  setShowNavModal(false);
                  setShowModal(true);
                    }} 
                    className="nav-link item-list py-3 text-danger" 
                    style={{ cursor: 'pointer' }}
                  >
                    <i className="bi bi-box-arrow-right me-2"></i>Logout
                  </div>
                </Nav.Item>
              </>
            ) : (
              <>
                <Nav.Item>
                  <Link to="/about" className="nav-link item-list py-3">Tentang</Link>
                </Nav.Item>
                <div className="mt-3">
                  <Button
                    variant="danger"
                    href="/download"
                    className="btn btn-danger unduh-aplikasi-button w-100"
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
