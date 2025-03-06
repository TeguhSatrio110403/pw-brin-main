// import React, { useState } from "react";
// import { Modal, Button } from "react-bootstrap";
// import { ExclamationTriangleFill } from "react-bootstrap-icons";
// // import "./ModalBox.css"; // Import file CSS

// const ModalBox = () => {
//   const [show, setShow] = useState(false);

//   const handleClose = () => setShow(false);
//   const handleShow = () => setShow(true);

//   return (
//     <>
//       {/* Tombol untuk membuka modal */}
//       <Button className="btn-danger modal-button" onClick={handleShow}>
//         Prediksi <span className="check-icon">✔</span>
//       </Button>

//       {/* Modal Bootstrap */}
//       <Modal show={show} onHide={handleClose} centered>
//         <Modal.Header closeButton>
//           <Modal.Title>
//             <ExclamationTriangleFill className="warning-icon" /> Peringatan!
//           </Modal.Title>
//         </Modal.Header>
//         <Modal.Body>
//           Kualitas air sungai menunjukkan tingkat pencemaran tinggi.
//           Harap segera lakukan tindakan pencegahan.
//         </Modal.Body>
//         <Modal.Footer>
//           <Button variant="secondary" onClick={handleClose}>
//             Tutup
//           </Button>
//           <Button variant="danger" onClick={handleClose}>
//             Mengerti
//           </Button>
//         </Modal.Footer>
//       </Modal>
//     </>
//   );
// };

// export default ModalBox;

// import React from "react";
// import { Modal, Button } from "react-bootstrap";

// const FeedModal = ({ show, onHide, feed }) => {
//   return (
//     <Modal show={show} onHide={onHide} centered>
//       <Modal.Header closeButton>
//         <Modal.Title>Detail Sungai</Modal.Title>
//       </Modal.Header>
//       <Modal.Body>
//         {feed && (
//           <>
//             <h4>{feed.name}</h4>
//             <p>Alamat : {feed.address}</p>
//             <p>Tanggal Update : {feed.date}</p>
//             <p>Status : <strong>{feed.status}</strong></p>
//           </>
//         )}
//       </Modal.Body>
//       <Modal.Footer>
//         <Button variant="secondary" onClick={onHide}>
//           Tutup
//         </Button>
//       </Modal.Footer>
//     </Modal>
//   );
// };

// export default FeedModal;

import React, { useState } from "react";
import { Modal, Button, Table } from "react-bootstrap";
import { ExclamationTriangleFill } from "react-bootstrap-icons";

const FeedModal = ({ show, onHide, feed }) => {
  const [showWarning, setShowWarning] = useState(false);

  const waterData = [
    {
      accelX: 0.98,
      accelY: 1.02,
      accelZ: 0.95,
      pH: 7.1,
      temp: 25,
      turbidity: 3.2,
    },
    {
      accelX: 1.02,
      accelY: 0.98,
      accelZ: 1.01,
      pH: 6.9,
      temp: 24.5,
      turbidity: 3.5,
    },
    {
      accelX: 0.95,
      accelY: 1.05,
      accelZ: 1.0,
      pH: 7.2,
      temp: 26,
      turbidity: 2.9,
    },
  ];

  const downloadCSV = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      ["Accel X, Accel Y, Accel Z, pH, Temperature, Turbidity"]
        .concat(
          waterData.map(
            (d) =>
              `${d.accelX},${d.accelY},${d.accelZ},${d.pH},${d.temp},${d.turbidity}`
          )
        )
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `data_kadar_air_${feed?.name || "unknown"}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <Modal show={show} onHide={onHide} centered>
        <Modal.Header closeButton>
          <Modal.Title>Detail Sungai</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {feed && (
            <>
              <h4>{feed.name}</h4>
              <p>{feed.address}</p>
              <p>{feed.date}</p>
              {/* <p>
                Status: <strong>{feed.status}</strong>
              </p> */}
              <br />

              {/* Section Data Kadar Air */}
              <h5 className="mt-4">Data Kadar Air</h5>
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Accel X</th>
                    <th>Accel Y</th>
                    <th>Accel Z</th>
                    <th>pH</th>
                    <th>Temperature (°C)</th>
                    <th>Turbidity (NTU)</th>
                  </tr>
                </thead>
                <tbody>
                  {waterData.map((data, index) => (
                    <tr key={index}>
                      <td>{data.accelX}</td>
                      <td>{data.accelY}</td>
                      <td>{data.accelZ}</td>
                      <td>{data.pH}</td>
                      <td>{data.temp}</td>
                      <td>{data.turbidity}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              <Button variant="primary" onClick={downloadCSV} className="me-2">
                Unduh Data
              </Button>
              <Button variant="danger" onClick={() => setShowWarning(true)}>
                Prediksi <span className="check-icon">✔</span>
              </Button>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Tutup
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal Peringatan Kualitas Air */}
      <Modal show={showWarning} onHide={() => setShowWarning(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <ExclamationTriangleFill className="warning-icon" /> Peringatan!
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Kualitas air sungai menunjukkan tingkat pencemaran tinggi. Harap
          segera lakukan tindakan pencegahan.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowWarning(false)}>
            Tutup
          </Button>
          <Button variant="danger" onClick={() => setShowWarning(false)}>
            Mengerti
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default FeedModal;
