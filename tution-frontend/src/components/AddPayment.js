import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Form, Button, Row, Col, Alert, Card } from 'react-bootstrap';

function AddPayment({ onPaymentAdded }) {
    // --- State ---
    const [studentId, setStudentId] = useState(''); // Default to empty (no selection)
    const [month, setMonth] = useState(new Date().toLocaleString('default', { month: 'long' }));
    const [year, setYear] = useState(new Date().getFullYear());
    const [amount, setAmount] = useState('');
    const [students, setStudents] = useState([]);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    // --- Fetch Students ---
    useEffect(() => {
        const fetchStudents = async () => {
             setError(''); // Clear previous errors
             setStudents([]); // Clear previous list
            try {
                const apiUrl = process.env.REACT_APP_API_URL;
                if (!apiUrl) {
                    throw new Error("API URL is not configured. Check Vercel environment variables.");
                }
                // Fetch only active students (backend GET /api/students should handle this)
                const response = await axios.get(`${apiUrl}/api/students`);
                setStudents(response.data);
                // Removed default selection: setStudentId(response.data[0]._id);
            } catch (err) {
                console.error("Failed to fetch students:", err);
                setError(`Could not load students for the form: ${err.message}`);
            }
        };
        fetchStudents();
    }, []); // Runs once on mount

    // --- Handle Form Submit ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        if (!studentId || !month || !year || !amount) {
            return setError('All fields are required.');
        }

        try {
            const apiUrl = process.env.REACT_APP_API_URL;
             if (!apiUrl) {
                throw new Error("API URL is not configured.");
            }

            const newPayment = {
                studentId,
                month,
                year: Number(year),
                amount: Number(amount),
                status: 'Paid' // Logged payments are directly marked as Paid
            };

            await axios.post(`${apiUrl}/api/payments/mark`, newPayment); // Use apiUrl

            setMessage('Payment logged successfully.');
            setAmount('');
            setStudentId(''); // Clear student selection after success

            if (onPaymentAdded) {
                onPaymentAdded(); // Notify parent component if needed (e.g., to refresh another list)
            }

        } catch (err) {
             console.error("Error logging payment:", err);
            setError(`Error logging payment: ${err.response?.data?.message || err.message}`);
        }
    };

    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    return (
        <Card className="mb-4">
            <Card.Body>
                <Card.Title>Log a New Payment</Card.Title>

                {message && <Alert variant="success">{message}</Alert>}
                {error && <Alert variant="danger">{error}</Alert>}

                <Form onSubmit={handleSubmit}>
                    <Row>
                        <Col xs={12} md={6}>
                            <Form.Group className="mb-3" controlId="formPaymentStudent">
                                <Form.Label>Student</Form.Label>
                                <Form.Select value={studentId} onChange={(e) => setStudentId(e.target.value)} required>
                                    <option value="">-- Select a Student --</option> {/* Changed default text */}
                                    {students.map(student => (
                                        <option key={student._id} value={student._id}>
                                            {/* --- THIS LINE IS MODIFIED --- */}
                                            {student.name} ({student.studentId || 'No ID'})
                                            {/* --- END MODIFICATION --- */}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col xs={12} md={6}>
                            <Form.Group className="mb-3" controlId="formPaymentAmount">
                                <Form.Label>Amount (LKR)</Form.Label>
                                <Form.Control
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="e.g., 2000"
                                    required
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                        <Col xs={12} md={6}>
                            <Form.Group className="mb-3" controlId="formPaymentMonth">
                                <Form.Label>Month</Form.Label>
                                <Form.Select value={month} onChange={(e) => setMonth(e.target.value)}>
                                    {months.map(m => <option key={m} value={m}>{m}</option>)}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col xs={12} md={6}>
                            <Form.Group className="mb-3" controlId="formPaymentYear">
                                <Form.Label>Year</Form.Label>
                                <Form.Control
                                    type="number"
                                    value={year}
                                    onChange={(e) => setYear(e.target.value)} // Corrected typo here
                                    required
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Button variant="primary" type="submit">
                        Log Payment
                    </Button>
                </Form>
            </Card.Body>
        </Card>
    );
}

export default AddPayment;