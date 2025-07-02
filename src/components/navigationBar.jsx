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
  const [isObserver, setIsObserver] = useState(false);

  // Ambil data user dari localStorage saat komponen di-mount
  useEffect(() => {
    if (isLoggedIn) {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      // console.log("User data from localStorage:", user); // Debug log
      
      // Set userInfo berdasarkan data user yang login
      if (user && user.role) {
        const role = user.role.toLowerCase();
        // console.log("User role:", role); // Debug log
        
        setUserInfo({
          username: user.username || "Guest User",
          email: user.email || "guest@gmail.com",
          role: role
        });
        
        // Set state admin dan observer berdasarkan role
        setIsAdmin(role === "admin");
        setIsObserver(role === "observer" || role === "pengamat");
        
        // console.log("Is Admin:", role === "admin"); // Debug log
        // console.log("Is Observer:", role === "observer" || role === "pengamat"); // Debug log
      } else {
        // Jika tidak ada data user atau role, set sebagai guest
        setUserInfo({
          username: "Guest",
          email: "N/A",
          role: "guest"
        });
        setIsAdmin(false);
        setIsObserver(false);
      }
    }
  }, [isLoggedIn]);

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn"); // Hapus status login
    localStorage.removeItem("token"); // Hapus token
    localStorage.removeItem("user"); // Hapus data user
    setShowModal(false); // Tutup modal
    window.location.reload(); // Muat ulang halaman untuk memperbarui UI
  };

  // Fungsi untuk mendapatkan label role dalam Bahasa Indonesia
  const getRoleLabel = (role) => {
    if (!role) return "Tamu";
    
    switch (role.toLowerCase()) {
      case "admin":
        return "Admin";
      case "observer":
      case "pengamat":
        return "Pengamat";
      case "guest":
        return "Guest";
      default:
        return "Tamu";
    }
  };

  // Fungsi untuk mendapatkan kelas warna badge berdasarkan role
  const getRoleBadgeClass = (role) => {
    if (!role) return "bg-secondary";
    
    switch (role.toLowerCase()) {
      case "admin":
        return "bg-danger"; // Merah untuk admin
      case "observer":
      case "pengamat":
        return "bg-primary"; // Biru untuk pengamat
      case "guest":
        return "bg-secondary"; // Abu-abu untuk guest
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
              <img src="./fluvix_nama.png" alt="Logo" className="logo" 
              style={{ 
                width: '190px', 
                height: 'auto' 
              }} />
            </div>
          ) : (
            <Link to="/home" className="navbar-brand">
              <img src="./fluvix_nama.png" alt="Logo" className="logo" 
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
                    <Link to="/feeds" className="nav-link item-list">Feeds</Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Link to="/analisis" className="nav-link item-list">Analisis</Link>
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
                        >
                          <i className="bi bi-gear-fill me-2"></i>Beranda
                        </Dropdown.Item>
                      )}

                      {/* Link ke Observer Dashboard jika user adalah observer */}
                      {isObserver && (
                        <Dropdown.Item 
                          as={Link} 
                          to="/dashboardObserver" 
                        >
                          <i className="bi bi-eye-fill me-2"></i>Beranda
                        </Dropdown.Item>
                      )}
                      
                      <Dropdown.Item onClick={() => setShowModal(true)} className="">
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
                      <i className="bi bi-cloud-arrow-down" style={{ marginRight: 6, fontSize: 22 }}></i> Unduh Aplikasi
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
                  <Link to="/feeds" className="nav-link item-list py-3">Feeds</Link>
                </Nav.Item>
                <Nav.Item>
                  <Link to="/analisis" className="nav-link item-list py-3">Analisis</Link>
                </Nav.Item>
                <Nav.Item>
                  <Link to="/about" className="nav-link item-list py-3">Tentang</Link>
                </Nav.Item>
                
                {/* Tambahkan link ke Admin Dashboard jika user adalah admin */}
                {isAdmin && (
                  <Nav.Item>
                    <Link to="/dashboardAdmin" className="nav-link item-list py-3">
                      <i className="bi bi-gear-fill me-2"></i>Beranda
                    </Link>
                  </Nav.Item>
                )}

                {/* Link ke Observer Dashboard jika user adalah observer */}
                {isObserver && (
                  <Nav.Item>
                    <Link to="/dashboardObserver" className="nav-link item-list py-3">
                      <i className="bi bi-eye-fill me-2"></i>Beranda
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
