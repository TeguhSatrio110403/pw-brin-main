import { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";

export default function LokasiPenelitianModal({ isOpen, onClose, clickedLocation }) {
    const [formData, setFormData] = useState({
        sungai: "",
        kecamatan: "",
        kota: "",
        alamat: "",
        latitude: "",
        longitude: ""
    });

    // Update form ketika ada lokasi yang diklik
    useEffect(() => {
        if (clickedLocation) {
            const address = clickedLocation.address || "";
            // Mencoba memisahkan alamat menjadi bagian-bagian
            const addressParts = address.split(", ");
            const kota = addressParts.find(part => part.toLowerCase().includes("kota")) || "";
            const kecamatan = addressParts.find(part => part.toLowerCase().includes("kecamatan")) || "";
            
            setFormData({
                ...formData,
                alamat: clickedLocation.address || "",
                kecamatan: kecamatan.replace("Kecamatan ", ""),
                kota: kota.replace("Kota ", ""),
                latitude: clickedLocation.lat || "",
                longitude: clickedLocation.lng || ""
            });
        }
    }, [clickedLocation]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log(formData);
        onClose();
    };

    return (
        <Modal show={isOpen} onHide={onClose} centered>
            <Modal.Header closeButton>
                <Modal.Title className="text fw-bold">Lokasi Penelitian Baru</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label>Nama Sungai</Form.Label>
                        <Form.Control
                            type="text"
                            name="sungai"
                            placeholder="Masukan Nama Sungai"
                            value={formData.sungai}
                            onChange={handleChange}
                            required
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Nama Kecamatan</Form.Label>
                        <Form.Control
                            type="text"
                            name="kecamatan"
                            placeholder="Masukan Nama Kecamatan"
                            value={formData.kecamatan}
                            onChange={handleChange}
                            required
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Nama Kota</Form.Label>
                        <Form.Control
                            type="text"
                            name="kota"
                            placeholder="Masukan Nama Kota"
                            value={formData.kota}
                            onChange={handleChange}
                            required
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Alamat Lengkap</Form.Label>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            name="alamat"
                            placeholder="Masukan Alamat Lengkap Sungai"
                            value={formData.alamat}
                            onChange={handleChange}
                            required
                        />
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Koordinat</Form.Label>
                        <div className="d-flex gap-2">
                            <Form.Control
                                type="text"
                                name="latitude"
                                placeholder="Latitude"
                                value={formData.latitude}
                                onChange={handleChange}
                                readOnly
                            />
                            <Form.Control
                                type="text"
                                name="longitude"
                                placeholder="Longitude"
                                value={formData.longitude}
                                onChange={handleChange}
                                readOnly
                            />
                        </div>
                    </Form.Group>
                    <div className="button-container">
                        <Button type="submit" className="btn-simpan btn-danger">
                            Mulai
                        </Button>
                        <Button type="button" onClick={onClose} className="btn-batal btn-outline-danger">
                            Batal
                        </Button>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    );
}
