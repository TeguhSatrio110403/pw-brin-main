import React from 'react';
import Accordion from 'react-bootstrap/Accordion';
import 'bootstrap/dist/css/bootstrap.min.css'; // Pastikan Anda mengimpor CSS Bootstrap

const About = () => {
  return (
    <div className="About">
      <h1 className="heading">
        <center><b>Tentang</b></center>
      </h1>
      <div className="line"></div>
      <div className="about-image">
        <img src="public/IMG_20240325_140850.jpg" alt="Visi" />
      </div>
      <div className="content">
        Selamat datang di platform kami, sistem pengukuran dan deteksi kualitas air sungai berbasis real-time yang dikembangkan oleh Pusat Riset Fotonika, salah satu cabang penelitian di bawah naungan Badan Riset dan Inovasi Nasional (BRIN).
        <br /><br />
        Platform ini dirancang untuk memfasilitasi pemantauan kualitas air sungai secara akurat dan efisien, menggunakan teknologi mutakhir berbasis IoT dan sensor. Dengan data seperti turbidity (kekeruhan), pH, dan suhu air, kami menyediakan informasi yang relevan untuk mendukung pengambilan keputusan, penelitian lingkungan, dan pelaporan kepada masyarakat serta para pemangku kepentingan.
      </div>

      <div className="visi-section">
        <h1 className="heading">
          <center><b>Visi</b></center>
        </h1>
        <div className="visi-text">
          <p>
            Mewujudkan sistem pemantauan air sungai yang andal, inovatif, dan berkelanjutan guna mendukung penelitian ilmiah serta menjaga kelestarian lingkungan.
          </p>
        </div>
      </div>

      <div className="misi-section">
        <h1 className="heading">
          <center><b>Misi</b></center>
        </h1>

        <div className="misi-text">
          <div className="misi">
            <div className="icon">
              <img src="public/hourglass-split.svg" alt="Icon 1" />
            </div>
            <p>Mengembangkan teknologi pemantauan air sungai berbasis real-time dengan sensor canggih.</p>
          </div>

          <div className="misi">
            <div className="icon">
              <img src="public/clipboard2-data.svg" alt="Icon 2" />
            </div>
            <p>Menyediakan data kualitas air yang dapat diakses dengan mudah oleh para peneliti, pemerintah, dan masyarakat.</p>
          </div>

          <div className="misi">
            <div className="icon">
              <img src="public/moisture.svg" alt="Icon 3" />
            </div>
            <p>Berkontribusi pada solusi lingkungan berbasis sains untuk mengurangi dampak polusi air.</p>
          </div>
        </div>
      </div>

      {/* Section FAQ */}
      <div className="faq-section mb-4">
        <h1 className="heading">
          <center><b>FAQ</b></center>
        </h1>
        <Accordion defaultActiveKey="0">
          <Accordion.Item eventKey="0">
            <Accordion.Header>Apa tujuan dari platform ini?</Accordion.Header>
            <Accordion.Body>
              Platform ini bertujuan untuk memfasilitasi pemantauan kualitas air sungai secara real-time menggunakan teknologi IoT dan sensor, sehingga dapat memberikan data yang akurat dan relevan untuk penelitian dan pengambilan keputusan.
            </Accordion.Body>
          </Accordion.Item>
          <Accordion.Item eventKey="1">
            <Accordion.Header>Bagaimana cara mengakses data kualitas air?</Accordion.Header>
            <Accordion.Body>
              Data kualitas air dapat diakses melalui platform ini dengan mudah. Anda dapat melihat data seperti turbidity, pH, dan suhu air secara real-time.
            </Accordion.Body>
          </Accordion.Item>
          <Accordion.Item eventKey="2">
            <Accordion.Header>Siapa yang dapat menggunakan platform ini?</Accordion.Header>
            <Accordion.Body>
              Platform ini dapat digunakan oleh para peneliti, pemerintah, dan masyarakat umum yang tertarik untuk memantau kualitas air sungai.
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
      </div>
    </div>
  );
}

export default About;