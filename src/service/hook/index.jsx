import React, { createContext, useEffect, useState, useRef } from 'react';
import { Card, Modal } from 'react-bootstrap';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import { port } from '../../constant/https.jsx';
import { io } from 'socket.io-client';

const HookMqtt = ({ latestData, onIotPositionChange }) => {
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

  const socketRef = useRef(null);

  // Setup Socket.IO connection seperti di mobile
  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io(port, {
        transports: ['websocket'],
        reconnectionAttempts: 5,
        timeout: 10000,
      });

      // Listener untuk data MQTT dari server (sama seperti di mobile Home.tsx)
      socketRef.current.on('mqttData', (data) => {
        // console.log('📩 Data MQTT diterima di odometer:', data);
        if (data?.message) {
          setPayload(data.message);
          
          // Update state sensor data - konversi ke number dulu
          setNilaiAccelX(Number(data.message.accel_x || 0).toFixed(2));
          setNilaiAccelY(Number(data.message.accel_y || 0).toFixed(2));
          setNilaiAccelZ(Number(data.message.accel_z || 0).toFixed(2));
          setPh(Number(data.message.ph || 7).toFixed(2));
          setTemp(Number(data.message.temperature || 0).toFixed(2));
          setTurbidity(Number(data.message.turbidity || 0).toFixed(2));
          setSpeed(Number(data.message.speed || 0).toFixed(2));
          
          // Update latitude dan longitude
          const newLat = data.message.latitude || 0;
          const newLon = data.message.longitude || 0;
          setLatitude(newLat);
          setLongitude(newLon);
          
          // Kirim posisi IoT ke parent component jika ada callback
          if (onIotPositionChange && newLat && newLon && 
              !isNaN(parseFloat(newLat)) && !isNaN(parseFloat(newLon)) &&
              parseFloat(newLat) !== 0 && parseFloat(newLon) !== 0) {
            onIotPositionChange([parseFloat(newLat), parseFloat(newLon)]);
          } else if (onIotPositionChange) {
            // Jika tidak ada data valid, set null
            onIotPositionChange(null);
          }
        }
      });

      socketRef.current.on('connect', () => {
        console.log('Odometer connected to WebSocket server');
      });

      socketRef.current.on('disconnect', () => {
        console.log('Odometer disconnected from WebSocket server');
        // Set IoT position ke null saat disconnect
        if (onIotPositionChange) {
          onIotPositionChange(null);
        }
      });

      // socketRef.current.on('connect_error', (error) => {
      //   console.error('Odometer WebSocket connection error:', error);
      //   // Fallback ke data statis jika koneksi gagal
      //   setNilaiAccelX(0);
      //   setNilaiAccelY(0);
      //   setNilaiAccelZ(0);
      //   setPh(7);
      //   setTemp(25);
      //   setTurbidity(0);
      //   setSpeed(0);
      // });
    }

    return () => {
    //   if (socketRef.current) {
    //     socketRef.current.disconnect();
    //     socketRef.current = null;
    //   }
    };
  }, [onIotPositionChange]);

  // Fallback: update dari prop latestData jika tidak ada data real-time
  // useEffect(() => {
  //   if (latestData) {
  //     setNilaiAccelX(latestData.accel_x || latestData.nilai_accel_x || 0);
  //     setNilaiAccelY(latestData.accel_y || latestData.nilai_accel_y || 0);
  //     setNilaiAccelZ(latestData.accel_z || latestData.nilai_accel_z || 0);
  //     setPh(latestData.ph || parseFloat(latestData.nilai_ph) || 7);
  //     setTemp(latestData.temperature || latestData.nilai_temperature || 0);
  //     setTurbidity(latestData.turbidity || latestData.nilai_turbidity || 0);
  //     setSpeed(latestData.speed || latestData.nilai_speed || 0);
  //     setLatitude(latestData.latitude || 0);
  //     setLongitude(latestData.longitude || 0);
  //   }
  // }, [latestData]);

  // Tambahkan logic untuk mengambil data dari endpoint getCurrentData seperti di dashboard
  // useEffect(() => {
  //   const fetchLatestData = async () => {
  //     try {
  //       const response = await fetch(`${port}getCurrentData`);
  //       const result = await response.json();
  //       if (result.success && result.data) {
  //         // Update state sensor data dari endpoint
  //         setNilaiAccelX(result.data.nilai_accel_x || 0);
  //         setNilaiAccelY(result.data.nilai_accel_y || 0);
  //         setNilaiAccelZ(result.data.nilai_accel_z || 0);
  //         setPh(parseFloat(result.data.nilai_ph) || 0);
  //         setTemp(result.data.nilai_temperature || 0);
  //         setTurbidity(result.data.nilai_turbidity || 0);
  //         setSpeed(result.data.nilai_speed || 0);
  //         setLatitude(result.data.latitude || 0);
  //         setLongitude(result.data.longitude || 0);
  //       }
  //     } catch (error) {
  //       console.error('Error fetching latest data for odometer:', error);
  //     }
  //   };

  //   //    
  // }, []);

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
        {/* Data Langsung <i className="bi bi-speedometer speedometer-icon"></i> */}
        <i className="bi bi-speedometer speedometer-icon"></i>
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