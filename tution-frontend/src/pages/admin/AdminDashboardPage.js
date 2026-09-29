import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import {
    Container, Table, Button, Badge, Modal, Form, Alert, Spinner,
    Navbar, Nav, Row, Col
} from 'react-bootstrap';
import { LuUserPlus, LuUsers } from 'react-icons/lu';
import logo from '../../assets/logo.svg';
import { adminLogout, getAdminInfo } from '../../auth/authService';
import { useNavigate } from 'react-router-dom';

const STATUS_VARIANT = {
    trial: 'warning',
    active: 'success',
    suspended: 'secondary'
};

function AdminDashboardPage() {
    const apiUrl = process.env.REACT_APP_API_URL;
    const navigate = useNavigate();
    const adminInfo = getAdminInfo();

    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Add-teacher modal state
    const [showAddModal, setShowAddModal] = useState(false);
    const [addForm, setAddForm] = useState({ name: '', businessName: '', email: '', phone: '', password: '', subscriptionStatus: 'trial' });
    const [addError, setAddError] = useState('');
    const [addSaving, setAddSaving] = useState(false);

    // Edit-teacher modal state
    const [showEditModal, setShowEditModal] = useState(false);
    const [editTeacher, setEditTeacher] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', businessName: '', phone: '', subscriptionStatus: 'trial', notes: '', newPassword: '' });
    const [editError, setEditError] = useState('');
    const [editSaving, setEditSaving] = useState(false);

    const fetchTeachers = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await axios.get(`${apiUrl}/api/admin/teachers`);
            setTeachers(response.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load teachers.');
        } finally {
            setLoading(false);
        }
    }, [apiUrl]);

    useEffect(() => { fetchTeachers(); }, [fetchTeachers]);

    const handleLogout = () => {
        adminLogout();
        navigate('/admin/login');
    };

    // --- Add teacher ---
    const openAddModal = () => {
        setAddForm({ name: '', businessName: '', email: '', phone: '', password: '', subscriptionStatus: 'trial' });
        setAddError('');
        setShowAddModal(true);
    };

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        setAddError('');
        setAddSaving(true);
        try {
            await axios.post(`${apiUrl}/api/admin/teachers`, addForm);
            setShowAddModal(false);
            fetchTeachers();
        } catch (err) {
            setAddError(err.response?.data?.message || 'Failed to create teacher.');
        } finally {
            setAddSaving(false);
        }
    };

    // --- Edit teacher ---
    const openEditModal = (teacher) => {
        setEditTeacher(teacher);
        setEditForm({
            name: teacher.name || '',
            businessName: teacher.businessName || '',
            phone: teacher.phone || '',
            subscriptionStatus: teacher.subscriptionStatus,
            notes: teacher.notes || '',
            newPassword: ''
        });
        setEditError('');
        setShowEditModal(true);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setEditError('');
        setEditSaving(true);
        try {
            const payload = { ...editForm };
            if (!payload.newPassword) delete payload.newPassword;
            await axios.patch(`${apiUrl}/api/admin/teachers/${editTeacher._id}`, payload);
            setShowEditModal(false);
            fetchTeachers();
        } catch (err) {
            setEditError(err.response?.data?.message || 'Failed to update teacher.');
        } finally {
            setEditSaving(false);
        }
    };

    // --- Quick status toggle from the table ---
    const toggleStatus = async (teacher) => {
        const next = teacher.subscriptionStatus === 'suspended' ? 'active' : 'suspended';
        try {
            await axios.patch(`${apiUrl}/api/admin/teachers/${teacher._id}`, { subscriptionStatus: next });
            fetchTeachers();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update status.');
        }
    };

    const handleDelete = async (teacher) => {
        const confirmed = window.confirm(
            `Permanently delete "${teacher.name}" and ALL of their students, payments, and attendance records? This cannot be undone.`
        );
        if (!confirmed) return;
        try {
            await axios.delete(`${apiUrl}/api/admin/teachers/${teacher._id}`);
            fetchTeachers();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete teacher.');
        }
    };

    // Purely presentational counts derived from what's already loaded - no extra API calls.
    const activeCount = teachers.filter(t => t.subscriptionStatus === 'active').length;
    const trialCount = teachers.filter(t => t.subscriptionStatus === 'trial').length;
    const suspendedCount = teachers.filter(t => t.subscriptionStatus === 'suspended').length;

    return (
        <>
            <Navbar variant="dark" style={{ background: 'var(--tc-ink-900)' }}>
                <Container fluid="xl">
                    <Navbar.Brand className="d-flex align-items-center">
                        <img src={logo} alt="Tution360" style={{ height: '26px', width: 'auto' }} className="me-2" />
                        <span className="badge bg-light text-dark" style={{ fontSize: '0.7rem' }}>ADMIN</span>
                    </Navbar.Brand>
                    <Nav className="ms-auto align-items-center">
                        {adminInfo && <span className="text-light me-3 d-none d-sm-inline">{adminInfo.name}</span>}
                        <Button variant="outline-light" size="sm" onClick={handleLogout}>Log Out</Button>
                    </Nav>
                </Container>
            </Navbar>

            <Container fluid="xl" className="mt-4 mb-5">
                <div className="tc-page-header">
                    <div>
                        <span className="tc-eyebrow">Platform</span>
                        <h1>Teachers</h1>
                        <p>Every teacher account running on the platform.</p>
                    </div>
                    <Button variant="primary" onClick={openAddModal}>
                        <LuUserPlus className="me-2" style={{ verticalAlign: '-2px' }} /> Add Teacher
                    </Button>
                </div>

                {!loading && teachers.length > 0 && (
                    <Row className="g-3 mb-4">
                        <Col xs={12} sm={4}>
                            <div className="tc-stat-card">
                                <div className="tc-stat-label">Total Teachers</div>
                                <div className="tc-stat-value">{teachers.length}</div>
                            </div>
                        </Col>
                        <Col xs={12} sm={4}>
                            <div className="tc-stat-card tc-accent-green">
                                <div className="tc-stat-label">Active</div>
                                <div className="tc-stat-value">{activeCount}</div>
                                <div className="tc-stat-sub">{trialCount} on trial · {suspendedCount} suspended</div>
                            </div>
                        </Col>
                        <Col xs={12} sm={4}>
                            <div className="tc-stat-card tc-accent-amber">
                                <div className="tc-stat-label">Total Students Managed</div>
                                <div className="tc-stat-value">{teachers.reduce((sum, t) => sum + (t.studentCount || 0), 0)}</div>
                            </div>
                        </Col>
                    </Row>
                )}

                {error && <Alert variant="danger">{error}</Alert>}

                {loading ? (
                    <div className="text-center mt-5"><Spinner animation="border" style={{ color: 'var(--tc-teal-700)' }} /></div>
                ) : (
                    <div className="tc-section-card overflow-hidden">
                        <Table striped hover responsive className="mb-0 tc-stack-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Business</th>
                                    <th>Email</th>
                                    <th>Students</th>
                                    <th>Status</th>
                                    <th>Joined</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {teachers.length === 0 && (
                                    <tr><td colSpan={7} className="text-center text-muted py-4">
                                        <LuUsers size={22} className="mb-2 d-block mx-auto" />
                                        No teachers yet. Add your first one.
                                    </td></tr>
                                )}
                                {teachers.map((teacher) => (
                                    <tr key={teacher._id}>
                                        <td data-label="Name" className="fw-semibold tc-card-title">{teacher.name}</td>
                                        <td data-label="Business">{teacher.businessName || '—'}</td>
                                        <td data-label="Email" className="tc-wrap-anywhere">{teacher.email}</td>
                                        <td data-label="Students">{teacher.studentCount}</td>
                                        <td data-label="Status">
                                            <Badge bg={STATUS_VARIANT[teacher.subscriptionStatus]}>
                                                {teacher.subscriptionStatus}
                                            </Badge>
                                        </td>
                                        <td data-label="Joined">{new Date(teacher.createdAt).toLocaleDateString()}</td>
                                        <td className="tc-actions-cell">
                                            <Button size="sm" variant="outline-secondary" className="me-2" onClick={() => openEditModal(teacher)}>Edit</Button>
                                            <Button
                                                size="sm"
                                                variant={teacher.subscriptionStatus === 'suspended' ? 'outline-success' : 'outline-warning'}
                                                className="me-2"
                                                onClick={() => toggleStatus(teacher)}
                                            >
                                                {teacher.subscriptionStatus === 'suspended' ? 'Activate' : 'Suspend'}
                                            </Button>
                                            <Button size="sm" variant="outline-danger" onClick={() => handleDelete(teacher)}>Delete</Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                )}
            </Container>

            {/* --- Add Teacher Modal --- */}
            <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
                <Modal.Header closeButton><Modal.Title>Add Teacher</Modal.Title></Modal.Header>
                <Form onSubmit={handleAddSubmit}>
                    <Modal.Body>
                        {addError && <Alert variant="danger">{addError}</Alert>}
                        <Form.Group className="mb-2">
                            <Form.Label>Name</Form.Label>
                            <Form.Control required value={addForm.name} onChange={(e) => setAddForm({ ...addForm, name: e.target.value })} />
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>Business Name (optional)</Form.Label>
                            <Form.Control value={addForm.businessName} onChange={(e) => setAddForm({ ...addForm, businessName: e.target.value })} />
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>Email</Form.Label>
                            <Form.Control type="email" required value={addForm.email} onChange={(e) => setAddForm({ ...addForm, email: e.target.value })} />
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>Phone (optional)</Form.Label>
                            <Form.Control value={addForm.phone} onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })} />
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>Temporary Password</Form.Label>
                            <Form.Control type="text" required minLength={8} value={addForm.password} onChange={(e) => setAddForm({ ...addForm, password: e.target.value })} />
                            <Form.Text className="text-muted">At least 8 characters. Share this with the teacher so they can log in.</Form.Text>
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>Starting Status</Form.Label>
                            <Form.Select value={addForm.subscriptionStatus} onChange={(e) => setAddForm({ ...addForm, subscriptionStatus: e.target.value })}>
                                <option value="trial">Trial</option>
                                <option value="active">Active</option>
                            </Form.Select>
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
                        <Button variant="primary" type="submit" disabled={addSaving}>
                            {addSaving ? <Spinner as="span" size="sm" /> : 'Create Teacher'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>

            {/* --- Edit Teacher Modal --- */}
            <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
                <Modal.Header closeButton><Modal.Title>Edit {editTeacher?.name}</Modal.Title></Modal.Header>
                <Form onSubmit={handleEditSubmit}>
                    <Modal.Body>
                        {editError && <Alert variant="danger">{editError}</Alert>}
                        <Form.Group className="mb-2">
                            <Form.Label>Name</Form.Label>
                            <Form.Control required value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>Business Name</Form.Label>
                            <Form.Control value={editForm.businessName} onChange={(e) => setEditForm({ ...editForm, businessName: e.target.value })} />
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>Phone</Form.Label>
                            <Form.Control value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>Status</Form.Label>
                            <Form.Select value={editForm.subscriptionStatus} onChange={(e) => setEditForm({ ...editForm, subscriptionStatus: e.target.value })}>
                                <option value="trial">Trial</option>
                                <option value="active">Active</option>
                                <option value="suspended">Suspended</option>
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>Admin Notes</Form.Label>
                            <Form.Control as="textarea" rows={2} value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} placeholder="e.g. Paid until Dec 2026" />
                        </Form.Group>
                        <Form.Group className="mb-2">
                            <Form.Label>Reset Password (optional)</Form.Label>
                            <Form.Control type="text" minLength={8} value={editForm.newPassword} onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })} placeholder="Leave blank to keep current password" />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
                        <Button variant="primary" type="submit" disabled={editSaving}>
                            {editSaving ? <Spinner as="span" size="sm" /> : 'Save Changes'}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </>
    );
}

export default AdminDashboardPage;
