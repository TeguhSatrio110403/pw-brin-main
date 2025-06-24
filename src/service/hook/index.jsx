import React, { createContext, useEffect, useState } from 'react';
import { Card, Modal } from 'react-bootstrap';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import { port } from '../../constant/https.jsx';

const HookMqtt = () => {
  const [client, setClient] = useState(null);
  const [payload, setPayload] = useState({});
  
  const [nilai_accel_x, setNilaiAccelX] = useState(0);
  const [nilai_accel_y, setNilaiAccelY] = useState(0);
  const [nilai_accel_z, setNilaiAccelZ] = useState(0);
  const [ph, setPh] = useState(0);
  const [temp, setTemp] = useState(0);
  const [turbidity, setTurbidity] = useState(0);
  const [latitude, setLatitude] = useState(0);
  const [longitude, setLongitude] = useState(0);
  const [date, setDate] = useState(new Date().toLocaleString());
  
  const [showModal, setShowModal] = useState(false);
  const [speed, setSpeed] = useState(0);

  useEffect(() => {
    if (client) {
      client.on('message', (topic, message) => {
        const payload = JSON.parse(message.toString());
        setPayload(payload);
      
        setNilaiAccelX(payload.nilai_accel_x || 0);
        setNilaiAccelY(payload.nilai_accel_y || 0);
        setNilaiAccelZ(payload.nilai_accel_z || 0);
        setPh(payload.ph || 0);
        setTemp(payload.temp || 0);
        setTurbidity(payload.turbidity || 0);
        setLatitude(payload.latitude || 0);
        setLongitude(payload.longitude || 0);
        setSpeed(payload.speed || 0);
      });
    }
  }, [client]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // const response = await fetch('http://localhost:3000/getCurrentData');
        const response = await fetch(`${port}getCurrentData`); //ubah URL endpoint untuk mendapatkan data sensor
        
        // Periksa status respons
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          console.warn("Response bukan JSON, menggunakan default value");
          return; // Keluar dari fungsi jika bukan JSON
        }
        
        const result = await response.json();
        
        if (result.success && result.data) {
          const sensorData = result.data;
          setNilaiAccelX(sensorData.nilai_accel_x || 0);
          setNilaiAccelY(sensorData.nilai_accel_y || 0);
          setNilaiAccelZ(sensorData.nilai_accel_z || 0);
          setPh(parseFloat(sensorData.ph) || 0);
          setTemp(sensorData.temperature || 0);
          setTurbidity(sensorData.turbidity || 0);
          setSpeed(sensorData.speed || 0);
          setLatitude(sensorData.latitude || 0);
          setLongitude(sensorData.longitude || 0);
        } else {
          console.warn("Data tidak valid atau tidak lengkap:", result);
          setNilaiAccelX(0);
          setNilaiAccelY(0);
          setNilaiAccelZ(0);
          setPh(0);
          setTemp(0);
          setTurbidity(0);
          setSpeed(0);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setNilaiAccelX(0);
        setNilaiAccelY(0);
        setNilaiAccelZ(0);
        setPh(0);
        setTemp(0);
        setTurbidity(0);
        setSpeed(0);
      }
    };

    // Menghapus interval, hanya fetch data satu kali
    fetchData();
    
    // Mengembalikan fungsi kosong untuk cleanup
    return () => {};
  }, []);

  // Update timestamp every second
  useEffect(() => {
    const interval = setInterval(() => {
      setDate(new Date().toLocaleString());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleClose = () => setShowModal(false);
  const handleShow = () => setShowModal(true);

  return (
    <>
      <button className="btn-mulaibaru" onClick={handleShow}>
        Data Langsung <i className="bi bi-speedometer speedometer-icon"></i>
      </button>

      <Modal show={showModal} onHide={handleClose} size="lg" aria-labelledby="contained-modal-title-vcenter" centered>
        <Modal.Header closeButton>
          <Modal.Title>Data Langsung Sensor</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="box-feeds row d-flex justify-content-center mx-auto">
            <div className="col-12 col-md-6 col-lg-4 mx-auto">
              <h1 className="text-center" style={{ fontSize: '24px' }}>Accelerometer X</h1>
              <Card className="card mx-auto">
                <Card.Body>
                  <div className="box-odometer">
                    <CircularProgressbar
                      value={nilai_accel_x}
                      text={`${nilai_accel_x} m/s²`}
                      styles={buildStyles({
                        textColor: 'black',
                        pathColor: 'red',
                        trailColor: 'black',
                        textSize: '16px'
                      })}
                    />
                  </div>
                  <br />
                  <h6 className="text-center text-muted" style={{ fontSize: '14px' }}>{date}</h6>
                </Card.Body>
              </Card>
            </div>

            <div className="col-12 col-md-6 col-lg-4 mx-auto">
              <h1 className="text-center" style={{ fontSize: '24px' }}>Accelerometer Y</h1>
              <Card className="card mx-auto">
                <Card.Body>
                  <div className="box-odometer">
                    <CircularProgressbar
                      value={nilai_accel_y}
                      text={`${nilai_accel_y} m/s²`}
                      styles={buildStyles({
                        textColor: 'black',
                        pathColor: 'red',
                        trailColor: 'black',
                        textSize: '16px'
                      })}
                    />
                  </div>
                  <br />
                  <h6 className="text-center text-muted" style={{ fontSize: '14px' }}>{date}</h6>
                </Card.Body>
              </Card>
            </div>
          </div>

          <div className="box-feeds row d-flex justify-content-center mx-auto">
            <div className="col-12 col-md-6 col-lg-4 mx-auto">
              <h1 className="text-center" style={{ fontSize: '24px' }}>Accelerometer Z</h1>
              <Card className="card mx-auto">
                <Card.Body>
                  <div className="box-odometer">
                    <CircularProgressbar
                      value={nilai_accel_z}
                      text={`${nilai_accel_z} m/s²`}
                      styles={buildStyles({
                        textColor: 'black',
                        pathColor: 'red',
                        trailColor: 'black',
                        textSize: '16px'
                      })}
                    />
                  </div>
                  <br />
                  <h6 className="text-center text-muted" style={{ fontSize: '14px' }}>{date}</h6>
                </Card.Body>
              </Card>
            </div>

            <div className="col-12 col-md-6 col-lg-4 mx-auto">
              <h1 className="text-center" style={{ fontSize: '24px' }}>Tingkat pH</h1>
              <Card className="card mx-auto">
                <Card.Body>
                  <div className="box-odometer">
                    <CircularProgressbar
                      value={ph}
                      text={`${ph} pH`}
                      styles={buildStyles({
                        textColor: 'black',
                        pathColor: 'red',
                        trailColor: 'black',
                        textSize: '16px'
                      })}
                    />
                  </div>
                  <br />
                  <h6 className="text-center text-muted" style={{ fontSize: '14px' }}>{date}</h6>
                </Card.Body>
              </Card>
            </div>
          </div>

          <div className="box-feeds row d-flex justify-content-center mx-auto">
            <div className="col-12 col-md-6 col-lg-4 mx-auto">
              <h1 className="text-center" style={{ fontSize: '24px' }}>Suhu Air</h1>
              <Card className="card mx-auto">
                <Card.Body>
                  <div className="box-odometer">
                    <CircularProgressbar
                      value={temp}
                      text={`${temp} °C`}
                      styles={buildStyles({
                        textColor: 'black',
                        pathColor: 'red',
                        trailColor: 'black',
                        textSize: '16px'
                      })}
                    />
                  </div>
                  <br />
                  <h6 className="text-center text-muted" style={{ fontSize: '14px' }}>{date}</h6>
                </Card.Body>
              </Card>
            </div>

            <div className="col-12 col-md-6 col-lg-4 mx-auto">
              <h1 className="text-center" style={{ fontSize: '24px' }}>Tingkat Kekeruhan</h1>
              <Card className="card mx-auto">
                <Card.Body>
                  <div className="box-odometer">
                    <CircularProgressbar
                      value={turbidity}
                      text={`${turbidity} NTU`}
                      styles={buildStyles({
                        textColor: 'black',
                        pathColor: 'red',
                        trailColor: 'black',
                        textSize: '16px'
                      })}
                    />
                  </div>
                  <br />
                  <h6 className="text-center text-muted" style={{ fontSize: '14px' }}>{date}</h6>
                </Card.Body>
              </Card>
            </div>
          </div>

          <div className="box-feeds row d-flex justify-content-center mx-auto">
            <div className="col-12 col-md-6 col-lg-4 mx-auto">
              <h1 className="text-center" style={{ fontSize: '24px' }}>Kecepatan Alat</h1>
              <Card className="card mx-auto">
                <Card.Body>
                  <div className="box-odometer">
                    <CircularProgressbar
                      value={speed}
                      text={`${speed} m/s`}
                      styles={buildStyles({
                        textColor: 'black',
                        pathColor: '#2ecc71',
                        trailColor: 'black',
                        textSize: '16px'
                      })}
                    />
                  </div>
                  <br />
                  <h6 className="text-center text-muted" style={{ fontSize: '14px' }}>{date}</h6>
                </Card.Body>
              </Card>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default HookMqtt;