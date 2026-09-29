import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Form, Button, Alert, Spinner } from 'react-bootstrap';
import { adminLogin } from '../../auth/authService';
import logo from '../../assets/logo.svg';

function AdminLoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const apiUrl = process.env.REACT_APP_API_URL;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const response = await axios.post(`${apiUrl}/api/auth/admin/login`, { email, password });
            adminLogin(response.data.token, response.data.admin);
            navigate('/admin');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="tc-auth-shell">
            <div className="tc-auth-brand-panel" style={{ background: 'radial-gradient(circle at 20% 20%, var(--tc-ink-700), var(--tc-ink-900) 70%)' }}>
                <img src={logo} alt="Tution360" className="tc-auth-logo mb-4" />
                <h1>Platform Control Center</h1>
                <p>Add, support, and manage every teacher account running on the platform.</p>
            </div>
            <div className="tc-auth-form-panel">
                <div className="tc-auth-card">
                    <div className="tc-auth-mobile-brand tc-auth-mobile-brand--dark"><img src={logo} alt="Tution360" /></div>
                    <span className="tc-eyebrow">Admin access</span>
                    <h2 className="mb-4">Log in to the console</h2>

                    {error && <Alert variant="danger">{error}</Alert>}

                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>Email</Form.Label>
                            <Form.Control
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoFocus
                            />
                        </Form.Group>
                        <Form.Group className="mb-4">
                            <Form.Label>Password</Form.Label>
                            <Form.Control
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </Form.Group>
                        <div className="d-grid">
                            <Button variant="dark" type="submit" disabled={loading} size="lg">
                                {loading ? <Spinner as="span" size="sm" /> : 'Log In'}
                            </Button>
                        </div>
                    </Form>
                </div>
            </div>
        </div>
    );
}

export default AdminLoginPage;
