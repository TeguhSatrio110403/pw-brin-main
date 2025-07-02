import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import NavigationBar from "./components/navigationBar";
// import Footer from "./components/FooterBar";

import Login from "./components/login";
import Home from "./components/home";
import Dashboard from "./components/dashboard";
import DashboardAdmin from "./components/dashboardAdmin";
import DashboardObserver from "./components/dashboardObserver";
import Analisis from "./components/analisis";
import Feeds from "./components/feeds";
import About from "./components/about";

import ProtectedRoute from "./utils/ProtectedRoute";

function App() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

  // Redirect ke dashboard jika user sudah login dan mencoba mengakses halaman login
  if (isLoginPage && isLoggedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="app-container">
      {!isLoginPage && <NavigationBar />}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/about" element={<About />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={<ProtectedRoute component={Dashboard} />}
        />
        <Route
          path="/dashboardAdmin"
          element={<ProtectedRoute component={DashboardAdmin} />}
        />
        <Route
          path="/dashboardObserver"
          element={<ProtectedRoute component={DashboardObserver} />}
        />
        <Route
          path="/analisis"
          element={<ProtectedRoute component={Analisis} />}
        />
        <Route 
          path="/feeds" 
          element={<ProtectedRoute component={Feeds} />} 
        />
      </Routes>

      {/* <Footer /> */}
    </div>
  );
}

export default App;
