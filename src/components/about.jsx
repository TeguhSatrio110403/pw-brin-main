const about = () => {
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
    </div>
  );
}

export default about