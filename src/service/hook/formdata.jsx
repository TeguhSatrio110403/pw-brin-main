import { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { port } from "../../constant/https.jsx";

export default function LokasiPenelitianModal({ isOpen, onClose, clickedLocation, onSaveSuccess }) {
    const [formData, setFormData] = useState({
        nama_sungai: "",
        alamat: "",
        latitude: "",
        longitude: ""
    });
    const [isLoading, setIsLoading] = useState(false);

    // Update form ketika ada lokasi yang diklik
    useEffect(() => {
        if (clickedLocation) {
            setFormData({
                nama_sungai: "",
                alamat: clickedLocation.address || "",
                latitude: clickedLocation.lat || "",
                longitude: clickedLocation.lng || ""
            });
        }
    }, [clickedLocation]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Fungsi generate ID untuk lokasi
    const generateLocationId = () => {
        return Math.floor(1000000 + Math.random() * 9000000); // 7-digit random number
    };

    // Fungsi untuk menampilkan custom notification
    const showNotification = (message, type = "success") => {
        const notification = document.createElement('div');
        
        // Set style berdasarkan type
        let backgroundColor, icon;
        if (type === "success") {
            backgroundColor = '#27ae60';
            icon = 'bi-check-circle-fill';
        } else if (type === "error") {
            backgroundColor = '#e74c3c';
            icon = 'bi-exclamation-triangle-fill';
        } else {
            backgroundColor = '#f39c12';
            icon = 'bi-info-circle-fill';
        }
        
        notification.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background-color: ${backgroundColor};
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            z-index: 1000;
            box-shadow: 0 4px 8px rgba(0,0,0,0.2);
            animation: fadeInOut 5s ease-in-out;
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 500;
            max-width: 400px;
            text-align: center;
        `;
        
        notification.innerHTML = `
            <i class="${icon}" style="font-size: 18px;"></i>
            ${message}
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 5000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validasi nama sungai
        if (!formData.nama_sungai.trim()) {
            showNotification("Nama sungai harus diisi!", "error");
            return;
        }

        setIsLoading(true);
        
        try {
            const postData = {
                id_lokasi: generateLocationId(),
                nama_sungai: formData.nama_sungai,
                alamat: formData.alamat,
                lat: parseFloat(formData.latitude),
                lon: parseFloat(formData.longitude),
                tanggal: new Date().toISOString()
            };

            const response = await fetch(`${port}data_lokasi`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(postData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Gagal menyimpan lokasi');
            }

            const responseData = await response.json();
            console.log('Lokasi berhasil disimpan:', responseData);
            
            // Reset form
            setFormData({
                nama_sungai: "",
                alamat: "",
                latitude: "",
                longitude: ""
            });
            
            // Tutup modal
            onClose();
            
            // Panggil callback untuk refresh data di parent
            if (onSaveSuccess) {
                onSaveSuccess();
            }
            
            // Tampilkan notifikasi sukses
            showNotification('Lokasi berhasil disimpan!', 'success');
            
        } catch (error) {
            console.error('Error menyimpan lokasi:', error);
            showNotification(`Gagal menyimpan lokasi: ${error.message}`, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Modal show={isOpen} onHide={onClose} centered size="lg">
                <Modal.Header closeButton>
                    <Modal.Title className="text fw-bold">Lokasi Penelitian Baru</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>Nama Sungai <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                                type="text"
                                name="nama_sungai"
                                placeholder="Masukan Nama Sungai"
                                value={formData.nama_sungai}
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
                            <div className="mt-2">
                                <small className="text-muted">
                                    <i className="bi bi-info-circle me-1"></i>
                                    Koordinat akan terisi otomatis saat Anda mengklik lokasi pada peta
                                </small>
                            </div>
                        </Form.Group>
                        <div className="button-container d-flex gap-2">
                            <Button 
                                type="submit" 
                                className="btn-simpan btn-danger flex-fill"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Menyimpan...' : 'Simpan'}
                            </Button>
                            <Button 
                                type="button" 
                                onClick={onClose} 
                                className="btn-batal btn-outline-danger flex-fill"
                                disabled={isLoading}
                            >
                                Batal
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
            <style>{`
                @keyframes fadeInOut {
                    0% { opacity: 0; transform: translate(-50%, 20px); }
                    10% { opacity: 1; transform: translate(-50%, 0); }
                    90% { opacity: 1; transform: translate(-50%, 0); }
                    100% { opacity: 0; transform: translate(-50%, 20px); }
                }
            `}</style>
        </>
    );
}
