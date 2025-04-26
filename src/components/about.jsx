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
        <img src="./IMG_20240325_140850.jpg" alt="Visi" />
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
              <img src="./hourglass-split.svg" alt="Icon 1" />
            </div>
            <p>Mengembangkan teknologi pemantauan air sungai berbasis real-time dengan sensor canggih.</p>
          </div>

          <div className="misi">
            <div className="icon">
              <img src="./clipboard2-data.svg" alt="Icon 2" />
            </div>
            <p>Menyediakan data kualitas air yang dapat diakses dengan mudah oleh para peneliti, pemerintah, dan masyarakat.</p>
          </div>

          <div className="misi">
            <div className="icon">
              <img src="./moisture.svg" alt="Icon 3" />
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
              Platform ini bertujuan untuk memfasilitasi pemantauan kualitas air sungai secara real-time dengan memanfaatkan teknologi sensor dan IoT (Internet of Things). Tujuannya adalah menyediakan data yang akurat, terkini, dan relevan untuk mendukung penelitian, analisis, serta pengambilan keputusan terkait pengelolaan sumber daya air.
            </Accordion.Body>
          </Accordion.Item>
          <Accordion.Item eventKey="1">
            <Accordion.Header>Bagaimana cara mengakses data kualitas air?</Accordion.Header>
            <Accordion.Body>
              Data kualitas air dapat diakses dengan mudah melalui platform ini. Pengguna dapat melihat berbagai parameter kualitas air, seperti tingkat kekeruhan (turbidity), pH, suhu, dan parameter lainnya yang ditampilkan secara real-time pada antarmuka platform. Data tersebut disajikan dalam bentuk grafik, tabel, atau peta digital untuk memudahkan interpretasi.
            </Accordion.Body>
          </Accordion.Item>
          <Accordion.Item eventKey="2">
            <Accordion.Header>Siapa yang dapat menggunakan platform ini?</Accordion.Header>
            <Accordion.Body>
              Platform ini dirancang untuk digunakan oleh berbagai pihak, termasuk peneliti, instansi pemerintah, organisasi lingkungan, dan masyarakat umum yang tertarik untuk memantau dan memahami kondisi kualitas air sungai. Dengan akses yang terbuka, platform ini mendukung kolaborasi dan transparansi dalam pengelolaan sumber daya air.
            </Accordion.Body>
          </Accordion.Item>
          <Accordion.Item eventKey="3">
            <Accordion.Header>Apa keunggulan platform ini?</Accordion.Header>
            <Accordion.Body>
              Keunggulan platform ini terletak pada kemampuannya menyajikan data secara real-time. Selain itu, platform ini dilengkapi dengan fitur prediksi kualitas air sungai untuk memberikan perkiraan kondisi air di masa mendatang. Fitur ini membantu pengguna dalam mengambil tindakan pencegahan atau mitigasi jika diprediksi akan terjadi penurunan kualitas air.
            </Accordion.Body>
          </Accordion.Item>
          <Accordion.Item eventKey="4">
            <Accordion.Header>Kekeruhan (Turbidity)</Accordion.Header>
            <Accordion.Body>
              Kekeruhan mengukur tingkat kejernihan air yang dipengaruhi oleh partikel tersuspensi seperti lumpur, plankton, atau bahan organik. Satuan yang umum digunakan adalah NTU (Nephelometric Turbidity Units).
              <br /><br />
              Batas ideal untuk air sungai:
              <ul>
                <li>0–5 NTU : Air jernih, ideal untuk ekosistem perairan.</li>
                <li>5–50 NTU : Air masih dapat ditoleransi oleh sebagian besar organisme air.</li>
                <li>&gt;50 NTU : Air keruh, dapat mengganggu ekosistem dan mengurangi penetrasi cahaya ke dalam air.</li>
              </ul>
            </Accordion.Body>
          </Accordion.Item>
          <Accordion.Item eventKey="5">
            <Accordion.Header>pH (Tingkat Keasaman atau Kebasaan)</Accordion.Header>
            <Accordion.Body>
              pH mengukur tingkat keasaman atau kebasaan air pada skala 0–14. Air sungai dengan pH netral (sekitar 7) dianggap ideal untuk mendukung kehidupan akuatik.
              <br /><br />
              Batas ideal untuk air sungai:
              <ul>
                <li>6.5–8.5 : Kisaran pH optimal untuk sebagian besar organisme air.</li>
                <li>&lt; 6.5 : Air bersifat asam, dapat merusak ekosistem dan mengganggu kehidupan ikan serta organisme lainnya.</li>
                <li>&gt; 8.5 : Air bersifat basa, dapat menyebabkan stres pada organisme air dan mengurangi ketersediaan nutrisi.</li>
              </ul>
            </Accordion.Body>
          </Accordion.Item>
          <Accordion.Item eventKey="6">
            <Accordion.Header>Temperature (Suhu)</Accordion.Header>
            <Accordion.Body>
              Suhu air memengaruhi metabolisme organisme air, kelarutan oksigen, dan keseimbangan ekosistem.
              <br /><br />
              Batas ideal untuk air sungai:
              <ul>
                <li>16 – 28°C : Kisaran suhu optimal untuk mendukung kehidupan organisme air di daerah tropis seperti Indonesia.</li>
                <li>&gt; 28°C : Suhu tinggi dapat mengurangi kadar oksigen terlarut dan menyebabkan stres pada organisme air.</li>
                <li>&lt; 16°C : Suhu rendah dapat memperlambat metabolisme organisme air.</li>
              </ul>
            </Accordion.Body>
          </Accordion.Item>
        </Accordion>
      </div>
    </div>
  );
}

export default About;