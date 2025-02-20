import React, { createContext, useEffect, useState } from 'react';
// import Connection from './Connection';
// import Publisher from './Publisher';
// import Subscriber from './Subscriber';
// import Receiver from './Receiver';
// import mqtt from 'mqtt';
import { Card, Modal } from 'react-bootstrap';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
// import axios from 'axios';

// export const QosOption = createContext([]);
// const qosOption = [
//   {
//     label: '0',
//     value: 0,
//   },
//   {
//     label: '1',
//     value: 1,
//   },
//   {
//     label: '2',
//     value: 2,
//   },
// ];

const HookMqtt = () => {
  const [client, setClient] = useState(null);
  // const [isSubed, setIsSub] = useState(false);
  const [payload, setPayload] = useState({});
  // const [connectStatus, setConnectStatus] = useState('Connect');
  
  const [accelX, setAccelX] = useState(0);
  const [accelY, setAccelY] = useState(0);
  const [accelZ, setAccelZ] = useState(0);
  const [ph, setPh] = useState(0);
  const [temp, setTemp] = useState(0);
  const [turbidity, setTurbidity] = useState(0);
  const [latitude, setLatitude] = useState(0);
  const [longitude, setLongitude] = useState(0);
  const [date, setDate] = useState('');
  
  const [showModal, setShowModal] = useState(false); // Modal state

  // const mqttConnect = (host, mqttOption) => {
  //   setConnectStatus('Connecting');
  //   setClient(mqtt.connect(host, mqttOption));
  // };

  useEffect(() => {
    if (client) {
      // client.on('connect', () => {
      //   setConnectStatus('Connected');
      //   console.log('connection successful');
      // });

      // client.on('error', (err) => {
      //   console.error('Connection error: ', err);
      //   client.end();
      // });

      // client.on('reconnect', () => {
      //   setConnectStatus('Reconnecting');
      // });

      client.on('message', (topic, message) => {
        const payload = JSON.parse(message.toString());
        
        setPayload(payload);
      
        // Update state with the received values or default to 0 if undefined
        setAccelX(payload.accelX || 0);
        setAccelY(payload.accelY || 0);
        setAccelZ(payload.accelZ || 0);
        setPh(payload.ph || 0);
        setTemp(payload.temp || 0);
        setTurbidity(payload.turbidity || 0);
        setLatitude(payload.latitude || 0);
        setLongitude(payload.longitude || 0);
        setDate(payload.date || new Date().toLocaleString());

        const dataToSend = {
          accelX: payload.accelX || 0,
          accelY: payload.accelY || 0,
          accelZ: payload.accelZ || 0,
          ph: payload.ph || 0,
          temperature: payload.temp || 0,
          turbidity: payload.turbidity || 0,
          latitude: payload.latitude || 0,
          longitude: payload.longitude || 0,
          timestamp: payload.date || new Date().toLocaleString(),
        };
      
      //   axios.post('http://localhost:3000/sensors', dataToSend)
      //     .then(response => {
      //       console.log('POST request successful:', response.data);
      //     })
      //     .catch(error => {
      //       console.error('Error sending POST request:', error);
      //     });
    
      //   console.log(`received message: ${message} from topic: ${topic}`);
      });
    }
  }, [client]);

  // const mqttDisconnect = () => {
  //   if (client) {
  //     try {
  //       client.end(false, () => {
  //         setConnectStatus('Connect');
  //         console.log('disconnected successfully');
  //       });
  //     } catch (error) {
  //       console.log('disconnect error:', error);
  //     }
  //   }
  // };

  // const mqttPublish = (context) => {
  //   if (client) {
  //     const { topic, qos, payload } = context;
  //     client.publish(topic, payload, { qos }, (error) => {
  //       if (error) {
  //         console.log('Publish error: ', error);
  //       }
  //     });
  //   }
  // };

  // const mqttSub = (subscription) => {
  //   if (client) {
  //     const { topic, qos } = subscription;
  //     client.subscribe(topic, { qos }, (error) => {
  //       if (error) {
  //         console.log('Subscribe to topics error', error);
  //         return;
  //       }
  //       console.log(`Subscribe to topics: ${topic}`);
  //       setIsSub(true);
  //     });
  //   }
  // };

  // const mqttUnSub = (subscription) => {
  //   if (client) {
  //     const { topic, qos } = subscription;
  //     client.unsubscribe(topic, { qos }, (error) => {
  //       if (error) {
  //         console.log('Unsubscribe error', error);
  //         return;
  //       }
  //       console.log(`unsubscribed topic: ${topic}`);
  //       setIsSub(false);
  //     });
  //   }
  // };

  const handleClose = () => setShowModal(false);
  const handleShow = () => setShowModal(true);

  return (
    <>
      {/* <Connection
        connect={mqttConnect}
        disconnect={mqttDisconnect}
        connectBtn={connectStatus}
      />
      <QosOption.Provider value={qosOption}>
        <Subscriber sub={mqttSub} unSub={mqttUnSub} showUnsub={isSubed} />
        <Publisher publish={mqttPublish} />
      </QosOption.Provider> */}

      <button className="btn-mulaibaru" onClick={handleShow}>
        Data Langsung <i className="bi bi-speedometer speedometer-icon"></i>
      </button>

      {/* Modal */}
      <Modal show={showModal} onHide={handleClose} size="lg" aria-labelledby="contained-modal-title-vcenter" centered>
        <Modal.Header closeButton>
          <Modal.Title>Data Langsung Sensor</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="box-feeds row d-flex justify-content-center mx-auto">
            <div className="col-12 col-md-6 col-lg-4 mx-auto">
              <h1 className="text-center">Accel X</h1>
              <Card className="card mx-auto">
                <Card.Body>
                  <Card.Text>
                    <div className="box-odometer">
                      <CircularProgressbar
                        value={accelX}
                        text={`${accelX} m/s²`}
                        styles={buildStyles({
                          textColor: 'black',
                          pathColor: 'red',
                          trailColor: 'black',
                        })}
                      />
                    </div><br />
                    <h5 className="text-center">{date}</h5>
                  </Card.Text>
                </Card.Body>
              </Card>
            </div>

            <div className="col-12 col-md-6 col-lg-4 mx-auto">
              <h1 className="text-center">Accel Y</h1>
              <Card className="card mx-auto">
                <Card.Body>
                  <Card.Text>
                    <div className="box-odometer">
                      <CircularProgressbar
                        value={accelY}
                        text={`${accelY} m/s²`}
                        styles={buildStyles({
                          textColor: 'black',
                          pathColor: 'red',
                          trailColor: 'black',
                        })}
                      />
                    </div><br />
                    <h5 className="text-center">{date}</h5>
                  </Card.Text>
                </Card.Body>
              </Card>
            </div>
          </div>

          <div className="box-feeds row d-flex justify-content-center mx-auto">
            <div className="col-12 col-md-6 col-lg-4 mx-auto">
              <h1 className="text-center">Accel Z</h1>
              <Card className="card mx-auto">
                <Card.Body>
                  <Card.Text>
                    <div className="box-odometer">
                      <CircularProgressbar
                        value={accelZ}
                        text={`${accelZ} m/s²`}
                        styles={buildStyles({
                          textColor: 'black',
                          pathColor: 'red',
                          trailColor: 'black',
                        })}
                      />
                    </div><br />
                    <h5 className="text-center">{date}</h5>
                  </Card.Text>
                </Card.Body>
              </Card>
            </div>

            <div className="col-12 col-md-6 col-lg-4 mx-auto">
              <h1 className="text-center">pH</h1>
              <Card className="card mx-auto">
                <Card.Body>
                  <Card.Text>
                    <div className="box-odometer">
                      <CircularProgressbar
                        value={ph}
                        text={`${ph} pH`}
                        styles={buildStyles({
                          textColor: 'black',
                          pathColor: 'red',
                          trailColor: 'black',
                        })}
                      />
                    </div><br />
                    <h5 className="text-center">{date}</h5>
                  </Card.Text>
                </Card.Body>
              </Card>
            </div>
          </div>

          <div className="box-feeds row d-flex justify-content-center mx-auto">
            <div className="col-12 col-md-6 col-lg-4 mx-auto">
              <h1 className="text-center">Temperature</h1>
              <Card className="card mx-auto">
                <Card.Body>
                  <Card.Text>
                    <div className="box-odometer">
                      <CircularProgressbar
                        value={temp}
                        text={`${temp} °C`}
                        styles={buildStyles({
                          textColor: 'black',
                          pathColor: 'red',
                          trailColor: 'black',
                        })}
                      />
                    </div><br />
                    <h5 className="text-center">{date}</h5>
                  </Card.Text>
                </Card.Body>
              </Card>
            </div>

            <div className="col-12 col-md-6 col-lg-4 mx-auto">
              <h1 className="text-center">Turbidity</h1>
              <Card className="card mx-auto">
                <Card.Body>
                  <Card.Text>
                    <div className="box-odometer">
                      <CircularProgressbar
                        value={turbidity}
                        text={`${turbidity} NTU`}
                        styles={buildStyles({
                          textColor: 'black',
                          pathColor: 'red',
                          trailColor: 'black',
                        })}
                      />
                    </div><br />
                    <h5 className="text-center">{date}</h5>
                  </Card.Text>
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
