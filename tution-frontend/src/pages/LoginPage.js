import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Button, Alert, Spinner } from 'react-bootstrap';
import { teacherLogin } from '../auth/authService';
import logo from '../assets/logo.svg';

function LoginPage() {
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
            const response = await axios.post(`${apiUrl}/api/auth/teacher/login`, { email, password });
            teacherLogin(response.data.token, response.data.teacher);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="tc-auth-shell">
            <div className="tc-auth-brand-panel">
                <img src={logo} alt="Tution360" className="tc-auth-logo mb-4" />
                <h1>Run your tuition classes without the paperwork.</h1>
                <p>Students, attendance, and payments — all in one place, organized the way you already think about your classes.</p>
            </div>
            <div className="tc-auth-form-panel">
                <div className="tc-auth-card">
                    <div className="tc-auth-mobile-brand"><img src={logo} alt="Tution360" /></div>
                    <span className="tc-eyebrow">Welcome back</span>
                    <h2 className="mb-4">Log in to your classes</h2>

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
                                placeholder="you@example.com"
                            />
                        </Form.Group>
                        <Form.Group className="mb-4">
                            <Form.Label>Password</Form.Label>
                            <Form.Control
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                            />
                        </Form.Group>
                        <div className="d-grid">
                            <Button variant="primary" type="submit" disabled={loading} size="lg">
                                {loading ? <Spinner as="span" size="sm" /> : 'Log In'}
                            </Button>
                        </div>
                    </Form>

                    <div className="text-center mt-4">
                        <small className="text-muted">
                            <Link to="/admin/login">Admin login</Link>
                        </small>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;
