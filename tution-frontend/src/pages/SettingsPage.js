import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Row, Col, Card, Form, Button, ListGroup, Spinner, Alert, CloseButton, InputGroup } from 'react-bootstrap';

function SettingsPage() {
    // --- State for Locations ---
    const [locations, setLocations] = useState([]);
    const [loadingLocations, setLoadingLocations] = useState(true);
    const [locationError, setLocationError] = useState('');
    const [newLocationName, setNewLocationName] = useState('');
    const [newLocationCharge, setNewLocationCharge] = useState(0); // NEW
    const [formError, setFormError] = useState('');

    // --- NEW: State for Editing Locations ---
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [editCharge, setEditCharge] = useState(0);

    // --- State for Grades/Classes (e.g. "Grade 6", "Revision 2026", "Theory 2026") ---
    const [grades, setGrades] = useState([]);
    const [loadingGrades, setLoadingGrades] = useState(true);
    const [gradeError, setGradeError] = useState('');
    const [newGradeName, setNewGradeName] = useState('');
    const [gradeFormError, setGradeFormError] = useState('');
    const [editingGradeId, setEditingGradeId] = useState(null);
    const [editGradeName, setEditGradeName] = useState('');

    // --- State for Finance Reset (Existing) ---
    const [resettingFinance, setResettingFinance] = useState(false);
    const [resetFinanceMessage, setResetFinanceMessage] = useState('');
    const [resetFinanceError, setResetFinanceError] = useState('');

    // --- State for Attendance Reset (Existing) ---
    const [resettingAttendance, setResettingAttendance] = useState(false);
    const [resetAttendanceMessage, setResetAttendanceMessage] = useState('');
    const [resetAttendanceError, setResetAttendanceError] = useState('');

    // --- State for Student Reset (Existing) ---
    const [resettingStudents, setResettingStudents] = useState(false);
    const [resetStudentsMessage, setResetStudentsMessage] = useState('');
    const [resetStudentsError, setResetStudentsError] = useState('');

    // --- State for changing your own password ---
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordSaving, setPasswordSaving] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const apiUrl = process.env.REACT_APP_API_URL;

    const fetchLocations = async () => {
        setLoadingLocations(true);
        setLocationError('');
        try {
            if (!apiUrl) throw new Error("API URL is not configured.");
            const response = await axios.get(`${apiUrl}/api/locations`);
            setLocations(response.data);
        } catch (err) {
            console.error("Failed to fetch locations:", err);
            setLocationError(`Could not load locations: ${err.message}`);
        } finally {
            setLoadingLocations(false);
        }
    };

    const fetchGrades = async () => {
        setLoadingGrades(true);
        setGradeError('');
        try {
            if (!apiUrl) throw new Error("API URL is not configured.");
            const response = await axios.get(`${apiUrl}/api/grades`);
            setGrades(response.data);
        } catch (err) {
            console.error("Failed to fetch grades:", err);
            setGradeError(`Could not load grades: ${err.message}`);
        } finally {
            setLoadingGrades(false);
        }
    };

    useEffect(() => {
        if(apiUrl) {
            fetchLocations();
            fetchGrades();
        } else {
            setLocationError("API URL is not configured. Check Vercel/local .env file.");
            setGradeError("API URL is not configured. Check Vercel/local .env file.");
            setLoadingLocations(false);
            setLoadingGrades(false);
        }
    }, [apiUrl]);

    // --- Handle adding a location (Updated) ---
    const handleAddLocation = async (e) => {
        e.preventDefault();
        setFormError('');
        if (!newLocationName) { setFormError('Location name cannot be empty.'); return; }
        try {
            const response = await axios.post(`${apiUrl}/api/locations`, { 
                name: newLocationName,
                chargePercentage: newLocationCharge 
            });
            setLocations([...locations, response.data]);
            setNewLocationName('');
            setNewLocationCharge(0);
        } catch (err) {
             setFormError(`Error adding location: ${err.response?.data?.message || err.message}`);
         }
    };

    // --- NEW: Handle updating a location (One-by-One) ---
    const handleUpdateLocation = async (id) => {
        try {
            const response = await axios.put(`${apiUrl}/api/locations/${id}`, {
                name: editName,
                chargePercentage: editCharge
            });
            setLocations(locations.map(loc => loc._id === id ? response.data : loc));
            setEditingId(null); // Exit edit mode
        } catch (err) {
            alert(`Error updating location: ${err.message}`);
        }
    };

    const startEditing = (loc) => {
        setEditingId(loc._id);
        setEditName(loc.name);
        setEditCharge(loc.chargePercentage || 0);
    };

    // --- Handle deleting a location (Existing) ---
    const handleDeleteLocation = async (id) => {
        if (window.confirm('Are you sure you want to delete this location?')) {
            try {
                await axios.delete(`${apiUrl}/api/locations/${id}`);
                setLocations(locations.filter(loc => loc._id !== id));
            } catch (err) {
                 alert(`Error deleting location: ${err.response?.data?.message || err.message}`);
             }
        }
    };

    // --- Handle adding a grade/class ---
    const handleAddGrade = async (e) => {
        e.preventDefault();
        setGradeFormError('');
        if (!newGradeName.trim()) { setGradeFormError('Grade/class name cannot be empty.'); return; }
        try {
            const response = await axios.post(`${apiUrl}/api/grades`, { name: newGradeName.trim() });
            setGrades([...grades, response.data].sort((a, b) => a.name.localeCompare(b.name)));
            setNewGradeName('');
        } catch (err) {
            setGradeFormError(`Error adding grade: ${err.response?.data?.message || err.message}`);
        }
    };

    const startEditingGrade = (grade) => {
        setEditingGradeId(grade._id);
        setEditGradeName(grade.name);
    };

    const handleUpdateGrade = async (id) => {
        try {
            const response = await axios.put(`${apiUrl}/api/grades/${id}`, { name: editGradeName });
            setGrades(grades.map(g => g._id === id ? response.data : g));
            setEditingGradeId(null);
        } catch (err) {
            setGradeError(`Error updating grade: ${err.response?.data?.message || err.message}`);
        }
    };

    const handleDeleteGrade = async (id) => {
        if (window.confirm('Remove this grade/class from your list? Students already using it will keep their current grade text.')) {
            try {
                await axios.delete(`${apiUrl}/api/grades/${id}`);
                setGrades(grades.filter(g => g._id !== id));
            } catch (err) {
                setGradeError(`Error deleting grade: ${err.response?.data?.message || err.message}`);
            }
        }
    };

    // --- Reset Handlers (Existing logic preserved) ---
    const handleResetFinance = async () => {
        setResetFinanceMessage(''); setResetFinanceError('');
        if (window.confirm('🚨 DANGER! Are you ABSOLUTELY SURE...?') && window.confirm('🚨 FINAL WARNING!')) {
            setResettingFinance(true);
            try {
                const response = await axios.delete(`${apiUrl}/api/payments/reset`);
                setResetFinanceMessage(response.data.message || 'Finance data reset successfully.');
            } catch (err) {
                setResetFinanceError(`Failed: ${err.message}`);
            } finally { setResettingFinance(false); }
        }
    };

    const handleResetAttendance = async () => {
        setResetAttendanceMessage(''); setResetAttendanceError('');
        if (window.confirm('🚨 DANGER! Are you ABSOLUTELY SURE...?') && window.confirm('🚨 FINAL WARNING!')) {
            setResettingAttendance(true);
            try {
                const response = await axios.delete(`${apiUrl}/api/attendance/reset`);
                setResetAttendanceMessage(response.data.message || 'Attendance data reset successfully.');
            } catch (err) {
                setResetAttendanceError(`Failed: ${err.message}`);
            } finally { setResettingAttendance(false); }
        }
    };

    const handleResetStudents = async () => {
        setResetStudentsMessage(''); setResetStudentsError('');
        if (window.confirm('🚨 DANGER! Are you ABSOLUTELY SURE...?') && window.confirm('🚨 FINAL WARNING!')) {
            setResettingStudents(true);
            try {
                const response = await axios.delete(`${apiUrl}/api/students/reset`);
                setResetStudentsMessage(response.data.message || 'All students deactivated.');
            } catch (err) {
                setResetStudentsError(`Failed: ${err.message}`);
            } finally { setResettingStudents(false); }
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setPasswordMessage('');
        setPasswordError('');

        if (newPassword.length < 8) {
            setPasswordError('New password must be at least 8 characters.');
            return;
        }
        if (newPassword !== confirmPassword) {
            setPasswordError('New password and confirmation do not match.');
            return;
        }

        setPasswordSaving(true);
        try {
            const response = await axios.patch(`${apiUrl}/api/auth/teacher/change-password`, {
                currentPassword,
                newPassword
            });
            setPasswordMessage(response.data.message || 'Password updated successfully.');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            setPasswordError(err.response?.data?.message || 'Failed to change password.');
        } finally {
            setPasswordSaving(false);
        }
    };

    return (
        <Container fluid="xl" className="mt-4 pb-5">
            <div className="tc-page-header">
                <div>
                    <span className="tc-eyebrow">Settings</span>
                    <h1>Settings</h1>
                    <p>Manage your class locations, hall fees, and grades/batches.</p>
                </div>
            </div>
            <Row>
                <Col xs={12} md={12} lg={7} className="mb-4">
                    <Card className="border-0">
                        <Card.Header style={{ background: 'var(--tc-teal-700)', color: '#fff' }}>
                            <Card.Title as="span" className="mb-0 fs-5 fw-bold">Manage Locations & Charges</Card.Title>
                        </Card.Header>
                        <Card.Body>
                            <h5 className="mb-3">Add New Location</h5>
                            {formError && <Alert variant="danger">{formError}</Alert>}
                            <Form onSubmit={handleAddLocation} className="mb-4">
                                <Row className="g-2">
                                    <Col xs={12} md={7}>
                                        <Form.Control
                                            type="text"
                                            placeholder="Location Name (e.g. Nugegoda)"
                                            value={newLocationName}
                                            onChange={(e) => setNewLocationName(e.target.value)}
                                        />
                                    </Col>
                                    <Col xs={6} md={3}>
                                        <InputGroup>
                                            <Form.Control
                                                type="number"
                                                placeholder="Charge"
                                                value={newLocationCharge}
                                                onChange={(e) => setNewLocationCharge(e.target.value)}
                                            />
                                            <InputGroup.Text>%</InputGroup.Text>
                                        </InputGroup>
                                    </Col>
                                    <Col xs={6} md={2}>
                                        <Button type="submit" className="w-100" disabled={loadingLocations}>Add</Button>
                                    </Col>
                                </Row>
                            </Form>
                            <hr />
                            <h5 className="mb-3">Current Locations</h5>
                            {loadingLocations && <Spinner animation="border" size="sm" />}
                            {locationError && <Alert variant="danger">{locationError}</Alert>}
                            <ListGroup variant="flush">
                                {!loadingLocations && locations.map(loc => (
                                    <ListGroup.Item key={loc._id} className="py-3">
                                        {editingId === loc._id ? (
                                            /* Inline Edit Mode */
                                            <Row className="g-2 align-items-center">
                                                <Col xs={12} md={6}>
                                                    <Form.Control 
                                                        size="sm"
                                                        value={editName} 
                                                        onChange={(e) => setEditName(e.target.value)} 
                                                    />
                                                </Col>
                                                <Col xs={6} md={3}>
                                                    <InputGroup size="sm">
                                                        <Form.Control 
                                                            type="number" 
                                                            value={editCharge} 
                                                            onChange={(e) => setEditCharge(e.target.value)} 
                                                        />
                                                        <InputGroup.Text>%</InputGroup.Text>
                                                    </InputGroup>
                                                </Col>
                                                <Col xs={6} md={3} className="text-end">
                                                    <Button size="sm" variant="success" className="me-1" onClick={() => handleUpdateLocation(loc._id)}>Save</Button>
                                                    <Button size="sm" variant="secondary" onClick={() => setEditingId(null)}>X</Button>
                                                </Col>
                                            </Row>
                                        ) : (
                                            /* Normal View Mode */
                                            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                                                <div>
                                                    <span className="fw-bold">{loc.name}</span>
                                                    <span className="ms-2 badge bg-info text-white">{loc.chargePercentage || 0}% Hall Fee</span>
                                                </div>
                                                <div>
                                                    <Button variant="outline-primary" size="sm" className="me-2" onClick={() => startEditing(loc)}>Edit</Button>
                                                    <CloseButton onClick={() => handleDeleteLocation(loc._id)} />
                                                </div>
                                            </div>
                                        )}
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        </Card.Body>
                    </Card>

                    <Card className="border-0 mt-4">
                        <Card.Header style={{ background: 'var(--tc-ink-900)', color: '#fff' }}>
                            <Card.Title as="span" className="mb-0 fs-5 fw-bold">Manage Grades / Classes</Card.Title>
                        </Card.Header>
                        <Card.Body>
                            <p className="text-muted small mb-3">
                                Not just "Grade 1" through "Grade 11" - add whatever your classes are actually called,
                                e.g. <em>Revision 2026</em> or <em>Theory 2026</em>.
                            </p>
                            {gradeFormError && <Alert variant="danger">{gradeFormError}</Alert>}
                            <Form onSubmit={handleAddGrade} className="mb-4">
                                <Row className="g-2">
                                    <Col xs={8} md={9}>
                                        <Form.Control
                                            type="text"
                                            placeholder="Grade/Class Name (e.g. Revision 2026)"
                                            value={newGradeName}
                                            onChange={(e) => setNewGradeName(e.target.value)}
                                        />
                                    </Col>
                                    <Col xs={4} md={3}>
                                        <Button type="submit" className="w-100" disabled={loadingGrades}>Add</Button>
                                    </Col>
                                </Row>
                            </Form>
                            <hr />
                            <h5 className="mb-3">Current Grades / Classes</h5>
                            {loadingGrades && <Spinner animation="border" size="sm" />}
                            {gradeError && <Alert variant="danger">{gradeError}</Alert>}
                            {!loadingGrades && grades.length === 0 && !gradeError && (
                                <p className="text-muted small">No grades/classes yet. Add your first one above.</p>
                            )}
                            <ListGroup variant="flush">
                                {!loadingGrades && grades.map(grade => (
                                    <ListGroup.Item key={grade._id} className="py-2">
                                        {editingGradeId === grade._id ? (
                                            <Row className="g-2 align-items-center">
                                                <Col xs={12} md={8}>
                                                    <Form.Control
                                                        size="sm"
                                                        value={editGradeName}
                                                        onChange={(e) => setEditGradeName(e.target.value)}
                                                    />
                                                </Col>
                                                <Col xs={12} md={4} className="text-end">
                                                    <Button size="sm" variant="success" className="me-1" onClick={() => handleUpdateGrade(grade._id)}>Save</Button>
                                                    <Button size="sm" variant="secondary" onClick={() => setEditingGradeId(null)}>X</Button>
                                                </Col>
                                            </Row>
                                        ) : (
                                            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                                                <span className="fw-bold">{grade.name}</span>
                                                <div>
                                                    <Button variant="outline-primary" size="sm" className="me-2" onClick={() => startEditingGrade(grade)}>Edit</Button>
                                                    <CloseButton onClick={() => handleDeleteGrade(grade._id)} />
                                                </div>
                                            </div>
                                        )}
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        </Card.Body>
                    </Card>
                </Col>

                <Col xs={12} md={12} lg={5}>
                    {/* --- Account / Change Password --- */}
                    <span className="tc-eyebrow">Account</span>
                    <h2 className="mb-3" style={{ fontSize: '1.3rem' }}>Change Password</h2>
                    <Card className="mb-4 border-0">
                        <Card.Body>
                            {passwordMessage && <Alert variant="success">{passwordMessage}</Alert>}
                            {passwordError && <Alert variant="danger">{passwordError}</Alert>}
                            <Form onSubmit={handleChangePassword}>
                                <Form.Group className="mb-2">
                                    <Form.Label>Current Password</Form.Label>
                                    <Form.Control
                                        type="password"
                                        required
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                    />
                                </Form.Group>
                                <Form.Group className="mb-2">
                                    <Form.Label>New Password</Form.Label>
                                    <Form.Control
                                        type="password"
                                        required
                                        minLength={8}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Confirm New Password</Form.Label>
                                    <Form.Control
                                        type="password"
                                        required
                                        minLength={8}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                </Form.Group>
                                <Button type="submit" variant="primary" disabled={passwordSaving}>
                                    {passwordSaving ? <Spinner as="span" size="sm" /> : 'Update Password'}
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>

                    {/* --- Danger Zone --- */}
                    <span className="tc-eyebrow" style={{ color: 'var(--tc-red-500)' }}>Careful</span>
                    <h2 className="mb-3" style={{ color: 'var(--tc-red-500)', fontSize: '1.3rem' }}>Danger Zone</h2>
                    <Card border="danger" className="mb-3">
                        <Card.Body>
                            <h6>Reset Finance Data</h6>
                            {resetFinanceMessage && <Alert variant="success" size="sm">{resetFinanceMessage}</Alert>}
                            <Button size="sm" variant="danger" onClick={handleResetFinance} disabled={resettingFinance}>
                                {resettingFinance ? <Spinner size="sm" /> : 'Delete All Payments'}
                            </Button>
                        </Card.Body>
                    </Card>

                    <Card border="danger" className="mb-3">
                        <Card.Body>
                            <h6>Reset Attendance Data</h6>
                            {resetAttendanceMessage && <Alert variant="success" size="sm">{resetAttendanceMessage}</Alert>}
                            <Button size="sm" variant="danger" onClick={handleResetAttendance} disabled={resettingAttendance}>
                                {resettingAttendance ? <Spinner size="sm" /> : 'Delete All Attendance'}
                            </Button>
                        </Card.Body>
                    </Card>

                    <Card border="danger" className="mb-3">
                        <Card.Body>
                            <h6>Deactivate All Students</h6>
                            {resetStudentsMessage && <Alert variant="success" size="sm">{resetStudentsMessage}</Alert>}
                            <Button size="sm" variant="danger" onClick={handleResetStudents} disabled={resettingStudents}>
                                {resettingStudents ? <Spinner size="sm" /> : 'Clear Student List'}
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

export default SettingsPage;