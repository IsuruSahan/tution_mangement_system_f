import React, { useState, useEffect } from 'react'; // Added useEffect
import axios from 'axios';
import { Form, Button, Row, Col, Alert, Card } from 'react-bootstrap';
import { LuUserPlus } from 'react-icons/lu';

function AddStudent({ onStudentAdded }) {
    // --- Form Fields ---
    const [name, setName] = useState('');
    const [grade, setGrade] = useState(''); // Default is empty until grades load
    const [location, setLocation] = useState(''); // Default is empty until locations load
    const [contactPhone, setContactPhone] = useState('');
    const [parentName, setParentName] = useState('');

    // --- State for Locations Dropdown ---
    const [locations, setLocations] = useState([]);
    const [locationLoading, setLocationLoading] = useState(true);

    // --- State for Grades Dropdown (teacher-managed - "Grade 6", "Revision 2026", etc.) ---
    const [grades, setGrades] = useState([]);
    const [gradeLoading, setGradeLoading] = useState(true);

    // --- State for messages/errors ---
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    // --- Fetch locations and grades when component loads (Uses Environment Variable) ---
    useEffect(() => {
        const apiUrl = process.env.REACT_APP_API_URL;

        const fetchLocations = async () => {
             setLocationLoading(true); // Start loading
            try {
                if (!apiUrl) {
                    throw new Error("API URL is not configured. Check Vercel environment variables or local .env file.");
                }
                const res = await axios.get(`${apiUrl}/api/locations`);
                setLocations(res.data);
                // Set the default location state AFTER locations are loaded
                setLocation(res.data.length > 0 ? res.data[0].name : '');
            } catch (err) {
                console.error("Failed to fetch locations:", err);
                setError(`Failed to load locations list: ${err.message}`);
            } finally {
                setLocationLoading(false);
            }
        };

        const fetchGrades = async () => {
            setGradeLoading(true);
            try {
                if (!apiUrl) throw new Error("API URL is not configured.");
                const res = await axios.get(`${apiUrl}/api/grades`);
                setGrades(res.data);
                setGrade(res.data.length > 0 ? res.data[0].name : '');
            } catch (err) {
                console.error("Failed to fetch grades:", err);
                setError(prev => prev || `Failed to load grades list: ${err.message}`);
            } finally {
                setGradeLoading(false);
            }
        };

        fetchLocations();
        fetchGrades();
        // We only want this to run once on mount, so the dependency array is empty.
    }, []); // Empty array means runs once on mount

    // --- Handle Form Submit (Uses Environment Variable) ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(''); // Clear previous messages
        setError(''); // Clear previous errors

        if (!name || !grade || !location) {
            return setError('Name, Grade, and Location are required.');
        }

        const newStudent = { name, grade, location, contactPhone, parentName };

        try {
            // Get API URL from environment
            const apiUrl = process.env.REACT_APP_API_URL;
            if (!apiUrl) {
                throw new Error("API URL is not configured.");
            }

            // Use apiUrl in the request
            const response = await axios.post(`${apiUrl}/api/students`, newStudent);

            setMessage(`Success! Student "${response.data.name}" (${response.data.studentId}) added.`); // Show ID on success

            // Clear the form fields after successful submission
            setName('');
            // Reset grade/location to the first in the list, or empty if none configured
            setGrade(grades.length > 0 ? grades[0].name : '');
            setLocation(locations.length > 0 ? locations[0].name : '');
            setContactPhone('');
            setParentName('');

            // Notify the parent component (if prop is provided)
            if (onStudentAdded) {
                onStudentAdded();
            }

        } catch (err) {
             console.error("Error adding student:", err);
             // Show backend validation error or generic error
             setError(`Error adding student: ${err.response?.data?.message || err.message}`);
        }
    };

    // --- Render JSX ---
    return (
        <Card className="mb-4 border-0">
            <Card.Body>
                <Card.Title className="d-flex align-items-center mb-3">
                    <LuUserPlus className="me-2" style={{ color: 'var(--tc-teal-700)' }} /> Add New Student
                </Card.Title>

                {/* Show success or error messages */}
                {message && <Alert variant="success">{message}</Alert>}
                {error && <Alert variant="danger">{error}</Alert>}

                <Form onSubmit={handleSubmit}>
                    <Row>
                        <Col xs={12} md={6}>
                            <Form.Group className="mb-3" controlId="formStudentName">
                                <Form.Label>Student Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                            </Form.Group>
                        </Col>
                        <Col xs={12} md={6}>
                            <Form.Group className="mb-3" controlId="formGrade">
                                <Form.Label>Grade / Class</Form.Label>
                                <Form.Select
                                    value={grade}
                                    onChange={(e) => setGrade(e.target.value)}
                                    disabled={gradeLoading}
                                    required
                                >
                                    {gradeLoading ? (
                                        <option>Loading grades...</option>
                                    ) : (
                                        grades.length > 0 ? (
                                            <>
                                                <option value="">-- Select Grade/Class --</option>
                                                {grades.map(g => (
                                                    <option key={g._id} value={g.name}>{g.name}</option>
                                                ))}
                                            </>
                                        ) : (
                                            <option value="">No grades configured - add one in Settings</option>
                                        )
                                    )}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                        <Col xs={12} md={6}>
                            <Form.Group className="mb-3" controlId="formLocation">
                                <Form.Label>Location</Form.Label>
                                <Form.Select
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    disabled={locationLoading}
                                    required // Make location required
                                >
                                    {/* Handle loading and empty states */}
                                    {locationLoading ? (
                                        <option>Loading locations...</option>
                                    ) : (
                                        locations.length > 0 ? (
                                            // Add a default prompt option if needed, or rely on initial state
                                             <>
                                                 <option value="">-- Select Location --</option>
                                                 {locations.map(loc => (
                                                     <option key={loc._id} value={loc.name}>
                                                         {loc.name}
                                                     </option>
                                                 ))}
                                             </>
                                        ) : (
                                            <option value="">No locations configured</option>
                                        )
                                    )}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col xs={12} md={6}>
                            <Form.Group className="mb-3" controlId="formContactPhone">
                                <Form.Label>Contact Phone</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={contactPhone}
                                    onChange={(e) => setContactPhone(e.target.value)}
                                />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                        <Col xs={12} md={6}>
                            <Form.Group className="mb-3" controlId="formParentName">
                                <Form.Label>Parent's Name</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={parentName}
                                    onChange={(e) => setParentName(e.target.value)}
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Button variant="primary" type="submit" disabled={locationLoading || gradeLoading} className="px-4">
                        <LuUserPlus className="me-2" /> Add Student
                    </Button>
                </Form>
            </Card.Body>
        </Card>
    );
}

export default AddStudent;
