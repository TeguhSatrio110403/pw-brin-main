import {Navbar, Container, Nav} from "react-bootstrap";


const home = () => {
  return (
    <div>
     <div>
      <section className="hero-container">
        <div>
          <div>
            <h1>SELAMAT DATANG</h1>
            <h3>PENGUKURAN DAN PREDIKSI KADAR AIR SUNGAI</h3>
            <p>Aplikasi untuk memantau dan memprediksi kadar air sungai</p>
            <br />
            <p><a href="login" className="tbl-mulai">LOGIN <i className="bi bi-box-arrow-in-right" style={{ marginRight: 6, fontSize: 22 }}></i></a></p>
          </div>
        </div>
        <img src="./HERO.svg" alt="hero" />
      </section>
      <div className="App">
   
    </div>
    </div>
   
    </div>
  );
}

export default home