import { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";

export default function LokasiPenelitianModal({ isOpen, onClose }) {
    const [formData, setFormData] = useState({
        sungai: "",
        kecamatan: "",
        kota: "",
        alamat: "",
    });

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
