import { Routes, Route } from "react-router-dom";
import NavigationBar from "./components/navigationBar";
// import FooterBar from "./components/FooterBar";

import Login from "./components/login";
import Home from "./components/home";
import Dashboard from "./components/dashboard";
import Feeds from "./components/feeds";
import Analisis from "./components/analisis";
import About from "./components/about";

import ProtectedRoute from "./utils/ProtectedRoute";

function App() {
  return (
    <div>
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

      {/* <FooterBar /> */}
    </div>
  );
}

export default App;
