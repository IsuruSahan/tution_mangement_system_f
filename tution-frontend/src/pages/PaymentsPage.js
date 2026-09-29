import React, { useState, useEffect } from 'react'; // Added useEffect
import axios from 'axios';
import { Container, Row, Col, Form, Button, Card, Table, Spinner, Alert, Badge, InputGroup } from 'react-bootstrap';
import { LuWallet, LuSearch } from 'react-icons/lu';
import { useToast } from '../components/ui/ToastProvider';

// Helper array for month dropdown (unchanged)
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function PaymentsPage() {
    // --- State (unchanged) ---
    const [month, setMonth] = useState(new Date().toLocaleString('default', { month: 'long' }));
    const [year, setYear] = useState(new Date().getFullYear());
    const [grade, setGrade] = useState('All');
    const [location, setLocation] = useState('All');
    const [studentList, setStudentList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [amounts, setAmounts] = useState({});
    const [locations, setLocations] = useState([]);
    const [locationLoading, setLocationLoading] = useState(true);
    const [grades, setGrades] = useState([]);
    const [gradeLoading, setGradeLoading] = useState(true);
    const showToast = useToast();

    // --- Fetch locations (Uses Environment Variable) ---
    useEffect(() => {
        const fetchLocations = async () => {
            setLocationLoading(true);
            setError(''); // Clear page-specific errors on load
            try {
                // Get API URL from environment
                const apiUrl = process.env.REACT_APP_API_URL;
                if (!apiUrl) {
                    throw new Error("API URL is not configured. Check Vercel environment variables or local .env file.");
                }
                const res = await axios.get(`${apiUrl}/api/locations`); // Use apiUrl
                setLocations(res.data);
            } catch (err) {
                console.error("Failed to fetch locations:", err);
                setError(`Failed to load locations list: ${err.message}`); // Set specific error
            } finally {
                setLocationLoading(false);
            }
        };
        fetchLocations();
    }, []); // Runs once on mount

    // --- Fetch grades/classes (teacher-managed) ---
    useEffect(() => {
        const fetchGrades = async () => {
            setGradeLoading(true);
            try {
                const apiUrl = process.env.REACT_APP_API_URL;
                if (!apiUrl) throw new Error("API URL is not configured.");
                const res = await axios.get(`${apiUrl}/api/grades`);
                setGrades(res.data);
            } catch (err) {
                console.error("Failed to fetch grades:", err);
                setError(prev => prev || `Failed to load grades list: ${err.message}`);
            } finally {
                setGradeLoading(false);
            }
        };
        fetchGrades();
    }, []);

    // --- Updates the 'amounts' state (Unchanged) ---
    const handleAmountChange = (studentId, amount) => {
        setAmounts(prevAmounts => ({ ...prevAmounts, [studentId]: amount }));
    };

    // --- Load the Student List (Uses Environment Variable) ---
    const loadStudentPaymentList = async () => {
        setLoading(true);
        setError(''); // Clear previous errors
        setStudentList([]);
        setAmounts({});
        try {
            // Get API URL from environment
            const apiUrl = process.env.REACT_APP_API_URL;
            if (!apiUrl) {
                throw new Error("API URL is not configured.");
            }
            const response = await axios.get(`${apiUrl}/api/payments/statuslist`, { // Use apiUrl
                params: { month, year, grade, location }
            });
            setStudentList(response.data);
        } catch (err) {
            console.error("Error loading student payment list:", err);
            setError(`Error loading student list: ${err.response?.data?.message || err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // --- Mark a student as Paid or Pending (Uses Environment Variable) ---
    const handleMarkPayment = async (studentId, newStatus) => {
        try {
            // Get API URL from environment
            const apiUrl = process.env.REACT_APP_API_URL;
            if (!apiUrl) {
                throw new Error("API URL is not configured.");
            }

            let paymentData = { studentId, month, year, status: newStatus };
            if (newStatus === 'Paid') {
                const amountToSave = amounts[studentId];
                if (!amountToSave || Number(amountToSave) <= 0) {
                    showToast('Please enter a valid payment amount.', 'danger');
                    return;
                }
                paymentData.amount = Number(amountToSave);
            }

            const response = await axios.post(`${apiUrl}/api/payments/mark`, paymentData); // Use apiUrl
            const updatedPayment = response.data;
            const studentItem = studentList.find(item => item.student._id === studentId);
            // Update the state immutably
            setStudentList(currentList =>
                currentList.map(item => {
                    if (item.student._id === studentId) {
                        // Return a new object with updated status and amount
                        return { ...item, status: updatedPayment.status, amount: updatedPayment.amount };
                    }
                    return item; // Keep other items the same
                })
            );
            // Clear the amount input only if successfully marked as Paid
            if (newStatus === 'Paid') {
                setAmounts(prev => {
                    const next = { ...prev };
                    delete next[studentId]; // Remove the entry instead of setting to ''
                    return next;
                });
            }
            showToast(`${studentItem?.student?.name || 'Student'} marked ${newStatus}.`, newStatus === 'Paid' ? 'success' : 'info');
        } catch (err) {
            console.error("Error updating payment status:", err);
            // Show more specific error from backend if available
            showToast(`Failed to update status: ${err.response?.data?.message || err.message}`, 'danger');
        }
    };

    // --- Render JSX ---
    return (
        <Container fluid="xl" className="mt-4 pb-5">
            <div className="tc-page-header">
                <div>
                    <span className="tc-eyebrow">Payments</span>
                    <h1>Monthly Payments</h1>
                    <p>Track who's paid, and mark payments as they come in.</p>
                </div>
            </div>
            <Card className="mb-4 border-0">
                <Card.Body>
                    <Card.Title className="d-flex align-items-center mb-3">
                        <LuWallet className="me-2" style={{ color: 'var(--tc-teal-700)' }} /> Filter
                    </Card.Title>
                    {error && <Alert variant="danger">{error}</Alert>}
                    <Form>
                        <Row>
                            {/* --- Month Filter --- */}
                            <Col xs={6} md={3}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Month</Form.Label>
                                    <Form.Select value={month} onChange={(e) => setMonth(e.target.value)}>
                                        {months.map(m => <option key={m} value={m}>{m}</option>)}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            {/* --- Year Filter --- */}
                            <Col xs={6} md={2}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Year</Form.Label>
                                    <Form.Control type="number" value={year} onChange={(e) => setYear(e.target.value)} />
                                </Form.Group>
                            </Col>
                            {/* --- Grade Filter --- */}
                            <Col xs={12} md={3}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Grade</Form.Label>
                                    <Form.Select value={grade} onChange={(e) => setGrade(e.target.value)} disabled={gradeLoading}>
                                        <option value="All">All Grades</option>
                                        {gradeLoading ? (
                                            <option disabled>Loading...</option>
                                        ) : (
                                            grades.map(g => (
                                                <option key={g._id} value={g.name}>{g.name}</option>
                                            ))
                                        )}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            {/* --- Location Filter --- */}
                            <Col xs={12} md={2}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Location</Form.Label>
                                    <Form.Select
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        disabled={locationLoading}
                                    >
                                        <option value="All">All Locations</option>
                                        {locationLoading ? (
                                            <option disabled>Loading...</option>
                                        ) : (
                                            locations.map(loc => (
                                                <option key={loc._id} value={loc.name}>{loc.name}</option>
                                            ))
                                        )}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            {/* --- Load Button --- */}
                            <Col xs={12} md={2} className="d-flex align-items-end mb-3">
                                <Button onClick={loadStudentPaymentList} className="w-100" disabled={loading || locationLoading || gradeLoading}>
                                    {loading ? <Spinner as="span" size="sm" /> : (<><LuSearch className="me-2" />Load</>)}
                                </Button>
                            </Col>
                        </Row>
                    </Form>
                </Card.Body>
            </Card>

            {/* --- Student Payment List Table --- */}
            {loading && <div className="text-center"><Spinner animation="border" style={{ color: 'var(--tc-teal-700)' }} /></div>}
            {!loading && studentList.length > 0 && (
              <Card className="border-0">
                <Table striped bordered hover responsive className="mb-0 tc-stack-table">
                    <thead>
                        <tr>
                            <th>Student Name</th>
                            <th>Grade</th>
                            <th>Location</th>
                            <th>Amount (LKR)</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {studentList.map(item => (
                            <tr key={item.student._id}>
                                <td data-label="Student" className="tc-card-title">{item.student.name} ({item.student.studentId || 'No ID'})</td>
                                <td data-label="Grade">{item.student.grade}</td>
                                <td data-label="Location">{item.student.location}</td>
                                <td data-label="Amount (LKR)" className="tc-amount-cell" style={{ minWidth: '200px' }}> {/* Amount Cell */}
                                    {item.status === 'Paid' ? (
                                        `LKR ${item.amount != null ? item.amount.toLocaleString() : 'N/A'}`
                                    ) : (
                                        <InputGroup size="sm">
                                            <Form.Control
                                                type="number"
                                                placeholder="Amt"
                                                value={amounts[item.student._id] || ''}
                                                onChange={(e) => handleAmountChange(item.student._id, e.target.value)}
                                            />
                                            <Button 
                                                variant="outline-secondary" 
                                                onClick={() => handleAmountChange(item.student._id, '1000')}
                                            >
                                                1000
                                            </Button>
                                            <Button 
                                                variant="outline-secondary" 
                                                onClick={() => handleAmountChange(item.student._id, '1500')}
                                            >
                                                1500
                                            </Button>
                                            <Button 
                                                variant="outline-secondary" 
                                                onClick={() => handleAmountChange(item.student._id, '2000')}
                                            >
                                                2000
                                            </Button>
                                        </InputGroup>
                                    )}
                                </td>
                                <td data-label="Status"> {/* Status Badge */}
                                    <Badge bg={item.status === 'Paid' ? 'success' : 'warning'}>{item.status}</Badge>
                                </td>
                                <td className="tc-actions-cell tc-actions-full"> {/* Action Buttons */}
                                    {item.status === 'Pending' ? (
                                        <Button variant="success" size="sm" onClick={() => handleMarkPayment(item.student._id, 'Paid')}>
                                            Save Paid
                                        </Button>
                                    ) : (
                                        <Button variant="warning" size="sm" onClick={() => handleMarkPayment(item.student._id, 'Pending')}>
                                            Mark as Pending
                                        </Button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
              </Card>
            )}
            {/* Message if no students found */}
            {!loading && studentList.length === 0 && (
                <Alert variant="info">Select your filters and click "Load" to see the student payment list.</Alert>
            )}
        </Container>
    );
}

export default PaymentsPage;