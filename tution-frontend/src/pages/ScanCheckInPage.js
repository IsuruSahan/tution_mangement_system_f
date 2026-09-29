import React, { useState } from 'react';
import axios from 'axios';
import { QrReader } from 'react-qr-reader';
import { Container, Card, Button, Spinner, Alert, ListGroup, Form, Row, Col } from 'react-bootstrap';
import { FaCheckCircle, FaTimesCircle, FaUser } from 'react-icons/fa';
import { LuScanLine } from 'react-icons/lu';

function ScanCheckInPage() {
    const [scannedStudent, setScannedStudent] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const apiUrl = process.env.REACT_APP_API_URL;

    const handleScanResult = async (result, error) => {
        if (!!result && !loading && !scannedStudent) {
            const studentId = result?.text;
            if (studentId) {
                setLoading(true);
                setError('');
                setSuccess('');
                console.log(`Scanned ID: ${studentId}`);

                try {
                    const response = await axios.get(`${apiUrl}/api/students/by-id/${studentId}`);
                    setScannedStudent(response.data);
                } catch (err) {
                    console.error("Error fetching student by ID:", err);
                    setError(`Failed to find student with ID: ${studentId}. ${err.response?.data?.message || ''}`);
                    setTimeout(resetScanner, 3000);
                } finally {
                    setLoading(false);
                }
            }
        }
        if (!!error) {
            // console.info(error);
        }
    };

    // --- Action Handlers (Unchanged) ---
    const handleMarkPresent = async () => { /* ... unchanged ... */
        setLoading(true); setError(''); setSuccess('');
        try { const today = new Date().toISOString().split('T')[0]; await axios.post(`${apiUrl}/api/attendance/mark`, { studentId: scannedStudent._id, date: today, status: 'Present', classGrade: scannedStudent.grade, location: scannedStudent.location }); setSuccess(`${scannedStudent.name} marked as PRESENT for today.`); } catch (err) { console.error("Error marking present:", err); setError(`Failed to mark present: ${err.response?.data?.message || err.message}`); } finally { setLoading(false); }
    };
    const handleMarkPaid = async () => { /* ... unchanged ... */
        const amount = window.prompt(`Enter payment amount for ${scannedStudent.name}:`, '2000'); if (amount === null || isNaN(Number(amount)) || Number(amount) <= 0) { setError("Payment cancelled or invalid amount."); return; } setLoading(true); setError(''); setSuccess(''); try { const today = new Date(); const month = today.toLocaleString('default', { month: 'long' }); const year = today.getFullYear(); await axios.post(`${apiUrl}/api/payments/mark`, { studentId: scannedStudent._id, month, year, status: 'Paid', amount: Number(amount) }); setSuccess(`${scannedStudent.name} marked as PAID (LKR ${amount}) for ${month} ${year}.`); } catch (err) { console.error("Error marking paid:", err); setError(`Failed to mark paid: ${err.response?.data?.message || err.message}`); } finally { setLoading(false); }
    };
    const resetScanner = () => { /* ... unchanged ... */
        setScannedStudent(null); setError(''); setSuccess(''); setLoading(false);
    };
    // --- End Action Handlers ---


    // --- Render Logic ---

    // View 1: Show the QR Scanner
    if (!scannedStudent) {
        return (
            <Container fluid="xl" className="mt-4 pb-5">
                <Row className="justify-content-center">
                    <Col xs={12} md={8} lg={6}>
                        <Card className="border-0">
                            <Card.Header className="text-center text-white" style={{ background: 'var(--tc-teal-700)' }}>
                                <span className="fw-bold fs-5"><LuScanLine className="me-2" style={{ verticalAlign: '-3px' }} />Student Check-in</span>
                            </Card.Header>
                            <Card.Body>
                                {error && <Alert variant="danger">{error}</Alert>}
                                {loading && <div className="text-center"><Spinner animation="border" style={{ color: 'var(--tc-teal-700)' }} /></div>}

                                {/* --- THIS IS THE FIX --- */}
                                <div className="qr-scanner-container">
                                    <QrReader
                                        onResult={handleScanResult}
                                        constraints={{ facingMode: 'environment' }}
                                        containerStyle={{ width: '100%', height: '100%' }} // Let section handle size
                                        // Removed videoStyle prop
                                    />
                                </div>
                                {/* --- END OF FIX --- */}

                                <p className="text-center text-muted mt-3">Point camera at the student's QR code</p>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        );
    }

    // View 2: Show the Check-in Actions
    return (
        <Container fluid="xl" className="mt-4 pb-5">
            <Row className="justify-content-center">
                <Col xs={12} md={8} lg={6}>
                    <Card className="border-0">
                        <Card.Header className="text-center text-white" style={{ background: 'var(--tc-teal-900)' }}>
                            <span className="fw-bold fs-5"><FaUser className="me-2" /> {scannedStudent.name}</span>
                        </Card.Header>
                        <Card.Body>
                            <ListGroup variant="flush" className="mb-3">
                                <ListGroup.Item><strong>ID:</strong> {scannedStudent.studentId}</ListGroup.Item>
                                <ListGroup.Item><strong>Grade:</strong> {scannedStudent.grade}</ListGroup.Item>
                                <ListGroup.Item><strong>Location:</strong> {scannedStudent.location}</ListGroup.Item>
                            </ListGroup>
                            {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
                            {success && <Alert variant="success" className="mt-3">{success}</Alert>}
                            <div className="d-grid gap-2">
                                <Button variant="success" size="lg" onClick={handleMarkPresent} disabled={loading || success.includes('PRESENT')}>
                                    {loading ? <Spinner as="span" size="sm" /> : 'Mark PRESENT'}
                                </Button>
                                <Button variant="primary" size="lg" onClick={handleMarkPaid} disabled={loading || success.includes('PAID')}>
                                    {loading ? <Spinner as="span" size="sm" /> : 'Mark PAID'}
                                </Button>
                                <hr />
                                <Button variant="outline-secondary" onClick={resetScanner} disabled={loading}>
                                    <FaTimesCircle className="me-2" /> Scan Next Student
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

export default ScanCheckInPage;