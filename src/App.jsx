import { Routes, Route } from "react-router-dom";
import NavigationBar from "./components/navigationBar";
import Footer from "./components/FooterBar";

import Login from "./components/login";
import Home from "./components/home";
import Dashboard from "./components/dashboard";
import Analisis from "./components/analisis";
import Feeds from "./components/feeds";
import About from "./components/about";

import ProtectedRoute from "./utils/ProtectedRoute";

function App() {
  return (
    <div className="app-container">
      <NavigationBar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<Login />} />

        <Route
          path="/dashboard"
          element={<ProtectedRoute component={Dashboard} />}
        />
        <Route
          path="/analisis"
          element={<ProtectedRoute component={Analisis} />}
        />
        <Route path="/feeds" element={<ProtectedRoute component={Feeds} />} />

        <Route path="/about" element={<About />} />
      </Routes>

      {/* <Footer /> */}
    </div>
  );
}

export default App;
