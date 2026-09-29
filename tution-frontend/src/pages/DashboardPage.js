import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Alert, Button, ListGroup } from 'react-bootstrap';

// --- IMPORTS ---
import { Bar, Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';
import { BsPeopleFill, BsPersonCheckFill, BsClockHistory } from 'react-icons/bs';
import { FaHandHoldingUsd } from 'react-icons/fa';
import { LuCalendarRange, LuTrendingUp, LuWallet, LuCircleCheck, LuMapPin, LuUserPlus, LuCalendarCheck, LuQrCode } from 'react-icons/lu';
import { DashboardSkeleton } from '../components/ui/Skeleton';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

// Palette matching theme.css tokens, kept here since Chart.js can't read CSS variables directly
const CHART_COLORS = ['#0F6B5C', '#E2A83A', '#3D6E8C', '#C1443B', '#2F8558', '#8C9A95'];
const STATUS_COLORS = { Paid: '#2F8558', Pending: '#E2A83A', Overdue: '#C1443B' };

function DashboardPage() {
    const [dashboardData, setDashboardData] = useState(null);
    const [locationsCount, setLocationsCount] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const apiUrl = process.env.REACT_APP_API_URL;

    useEffect(() => {
        const fetchDashboardData = async () => {
            setError('');
            setLoading(true);
            try {
                if (!apiUrl) {
                    setError("API URL configuration error. Please check environment variables.");
                    setLoading(false);
                    return;
                }
                const [dashRes, locRes] = await Promise.all([
                    axios.get(`${apiUrl}/api/dashboard`),
                    // Used only for the "Add a location" onboarding step - failure here shouldn't break the dashboard.
                    axios.get(`${apiUrl}/api/locations`).catch(() => ({ data: [] }))
                ]);
                setDashboardData(dashRes.data);
                setLocationsCount(locRes.data.length);
            } catch (err) {
                console.error("Error fetching dashboard data:", err);
                setError('Error fetching dashboard data. Please check backend connection.');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [apiUrl]);

    // --- Chart Helpers ---
    const prepareGradeChartData = () => {
        if (!dashboardData || !dashboardData.totalStudentsByGrade) return {};
        const labels = dashboardData.totalStudentsByGrade.map(item => item._id);
        const data = dashboardData.totalStudentsByGrade.map(item => item.count);
        return {
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, grid: { color: '#EDEFEC' } }, x: { grid: { display: false } } }
            },
            data: {
                labels,
                datasets: [{
                    label: 'Students per Grade',
                    data,
                    backgroundColor: labels.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
                    borderRadius: 6,
                    maxBarThickness: 48
                }]
            }
        };
    };

    const preparePaymentDoughnutData = () => {
        if (!dashboardData || !dashboardData.paymentStatusThisMonth) return {};
        const labels = dashboardData.paymentStatusThisMonth.map(item => item._id);
        const data = dashboardData.paymentStatusThisMonth.map(item => item.count);
        return {
            options: { responsive: true, maintainAspectRatio: false, cutout: '68%', plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, padding: 16 } } } },
            data: {
                labels,
                datasets: [{
                    label: 'Payment Status',
                    data,
                    backgroundColor: labels.map(l => STATUS_COLORS[l] || '#8C9A95'),
                    borderColor: '#FFFFFF',
                    borderWidth: 2
                }]
            }
        };
    };

    if (loading) return <Container fluid="xl" className="mt-4 pb-5"><DashboardSkeleton /></Container>;
    if (error) return <Container className="mt-5"><Alert variant="danger">{error}</Alert></Container>;
    if (!dashboardData) return <Container className="mt-5"><Alert variant="warning">No dashboard data loaded.</Alert></Container>;

    const totalStudents = dashboardData.totalStudents ?? 0;
    const totalPending = dashboardData.paymentStatusThisMonth?.find(s => s._id === 'Pending')?.count || 0;
    const totalPaid = dashboardData.paymentStatusThisMonth?.find(s => s._id === 'Paid')?.count || 0;
    const gradeChart = prepareGradeChartData();
    const paymentChart = preparePaymentDoughnutData();

    // --- Derived "more detail" metrics - all computed client-side from data already fetched, no extra API load ---
    const attendanceRate = totalStudents > 0 ? Math.round((dashboardData.presentToday / totalStudents) * 100) : null;
    const collectionRate = totalStudents > 0 ? Math.round((totalPaid / totalStudents) * 100) : null;
    const avgRevenuePerStudent = totalStudents > 0 ? Math.round((dashboardData.incomeThisMonth?.gross ?? 0) / totalStudents) : null;

    // --- Onboarding checklist: shown for brand-new accounts with no students yet ---
    const showOnboarding = totalStudents === 0;

    return (
        <Container fluid="xl" className="mt-4 pb-5">
            <div className="tc-page-header">
                <div>
                    <span className="tc-eyebrow">Overview</span>
                    <h1>Dashboard</h1>
                    <p>Real-time stats for your classes, today.</p>
                </div>
            </div>

            {showOnboarding && (
                <Card className="mb-4 border-0 tc-muted-card">
                    <Card.Body>
                        <Card.Title className="mb-1">Welcome! Let's get your classes set up.</Card.Title>
                        <p className="text-muted mb-3">A few quick steps and you'll be ready to take attendance and track payments.</p>
                        <ListGroup variant="flush">
                            <ListGroup.Item className="d-flex justify-content-between align-items-center flex-wrap gap-2 bg-transparent">
                                <span><LuMapPin className="me-2" style={{ color: 'var(--tc-teal-700)' }} />Add a class location (and its hall fee %)</span>
                                <Button as={Link} to="/settings" size="sm" variant="outline-primary">Go to Settings</Button>
                            </ListGroup.Item>
                            <ListGroup.Item className="d-flex justify-content-between align-items-center flex-wrap gap-2 bg-transparent">
                                <span><LuUserPlus className="me-2" style={{ color: 'var(--tc-teal-700)' }} />Add your first student</span>
                                <Button as={Link} to="/students" size="sm" variant="outline-primary">Go to Students</Button>
                            </ListGroup.Item>
                            <ListGroup.Item className="d-flex justify-content-between align-items-center flex-wrap gap-2 bg-transparent">
                                <span><LuCalendarCheck className="me-2" style={{ color: 'var(--tc-teal-700)' }} />Take attendance for a class</span>
                                <Button as={Link} to="/attendance" size="sm" variant="outline-primary">Go to Attendance</Button>
                            </ListGroup.Item>
                            <ListGroup.Item className="d-flex justify-content-between align-items-center flex-wrap gap-2 bg-transparent">
                                <span><LuQrCode className="me-2" style={{ color: 'var(--tc-teal-700)' }} />Try QR scan check-in</span>
                                <Button as={Link} to="/scan" size="sm" variant="outline-primary">Go to Scan</Button>
                            </ListGroup.Item>
                        </ListGroup>
                    </Card.Body>
                </Card>
            )}

            {/* --- ROW 1: CORE STATS --- */}
            <Row className="mb-4 g-3">
                <Col xs={12} lg={4} md={6}>
                    <div className="tc-stat-card">
                        <div className="d-flex align-items-start justify-content-between">
                            <div>
                                <div className="tc-stat-label">Total Active Students</div>
                                <div className="tc-stat-value">{totalStudents}</div>
                            </div>
                            <BsPeopleFill size={26} style={{ color: 'var(--tc-teal-700)' }} />
                        </div>
                        {dashboardData.totalStudentsByGrade?.length > 0 && (
                            <div className="mt-3 pt-2 border-top">
                                {dashboardData.totalStudentsByGrade.map(item => (
                                    <div key={item._id} className="d-flex justify-content-between small py-1">
                                        <span className="text-muted">{item._id}</span>
                                        <span className="fw-semibold">{item.count}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </Col>
                <Col xs={12} lg={4} md={6}>
                    <div className="tc-stat-card tc-accent-green">
                        <div className="d-flex align-items-start justify-content-between">
                            <div>
                                <div className="tc-stat-label">Students Present Today</div>
                                <div className="tc-stat-value">{dashboardData.presentToday ?? '0'}</div>
                                {attendanceRate !== null && <div className="tc-stat-sub">{attendanceRate}% of active students</div>}
                            </div>
                            <BsPersonCheckFill size={26} style={{ color: 'var(--tc-green-500)' }} />
                        </div>
                        {dashboardData.presentTodayByGrade?.length > 0 && (
                            <div className="mt-3 pt-2 border-top">
                                {dashboardData.presentTodayByGrade.map(item => (
                                    <div key={item._id} className="d-flex justify-content-between small py-1">
                                        <span className="text-muted">{item._id}</span>
                                        <span className="fw-semibold">{item.count}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </Col>
                <Col xs={12} lg={4} md={6}>
                    <div className="tc-stat-card tc-accent-amber">
                        <div className="d-flex align-items-start justify-content-between">
                            <div>
                                <div className="tc-stat-label">Pending Payments</div>
                                <div className="tc-stat-value">{totalPending}</div>
                            </div>
                            <BsClockHistory size={26} style={{ color: 'var(--tc-amber-500)' }} />
                        </div>
                        {dashboardData.pendingPaymentsByGrade?.length > 0 && (
                            <div className="mt-3 pt-2 border-top">
                                {dashboardData.pendingPaymentsByGrade.map(item => (
                                    <div key={item._id} className="d-flex justify-content-between small py-1">
                                        <span className="text-muted">{item._id}</span>
                                        <span className="fw-semibold">{item.count}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </Col>
            </Row>

            {/* --- ROW 2: MORE DETAIL - derived rate/efficiency metrics --- */}
            <Row className="mb-4 g-3">
                <Col xs={12} lg={3} md={6}>
                    <div className="tc-stat-card tc-accent-slate h-100">
                        <div className="d-flex align-items-start justify-content-between">
                            <div>
                                <div className="tc-stat-label">Collection Rate</div>
                                <div className="tc-stat-value">{collectionRate !== null ? `${collectionRate}%` : '—'}</div>
                                <div className="tc-stat-sub">paid this month</div>
                            </div>
                            <LuCircleCheck size={24} style={{ color: 'var(--tc-slate-500)' }} />
                        </div>
                    </div>
                </Col>
                <Col xs={12} lg={3} md={6}>
                    <div className="tc-stat-card h-100">
                        <div className="d-flex align-items-start justify-content-between">
                            <div>
                                <div className="tc-stat-label">Avg. Revenue / Student</div>
                                <div className="tc-stat-value">{avgRevenuePerStudent !== null ? `${avgRevenuePerStudent.toLocaleString()}` : '—'}</div>
                                <div className="tc-stat-sub">LKR this month</div>
                            </div>
                            <LuWallet size={24} style={{ color: 'var(--tc-teal-700)' }} />
                        </div>
                    </div>
                </Col>
                <Col xs={12} lg={3} md={6}>
                    <div className="tc-stat-card tc-accent-green h-100">
                        <div className="d-flex align-items-start justify-content-between">
                            <div>
                                <div className="tc-stat-label">Paid This Month</div>
                                <div className="tc-stat-value">{totalPaid}</div>
                                <div className="tc-stat-sub">of {totalStudents} students</div>
                            </div>
                            <LuTrendingUp size={24} style={{ color: 'var(--tc-green-500)' }} />
                        </div>
                    </div>
                </Col>
                <Col xs={12} lg={3} md={6}>
                    <div className="tc-stat-card h-100">
                        <div className="d-flex align-items-start justify-content-between">
                            <div>
                                <div className="tc-stat-label">Locations</div>
                                <div className="tc-stat-value">{locationsCount ?? '—'}</div>
                                <div className="tc-stat-sub">active class locations</div>
                            </div>
                            <LuMapPin size={24} style={{ color: 'var(--tc-amber-500)' }} />
                        </div>
                    </div>
                </Col>
            </Row>

            {/* --- ROW 3: INCOME STATS WITH BREAKDOWN --- */}
            <Row className="mb-4 g-3">
                <Col xs={12} md={6}>
                    <Card className="h-100 overflow-hidden border-0">
                        <div className="p-3 text-white d-flex align-items-center" style={{ background: 'var(--tc-teal-700)' }}>
                            <FaHandHoldingUsd className="fs-4 me-3" />
                            <span className="fw-bold">Income This Month</span>
                        </div>
                        <Card.Body>
                            <div className="d-flex justify-content-between mb-2">
                                <span className="text-muted">Total Collected</span>
                                <span className="fw-semibold tc-figure">LKR {(dashboardData.incomeThisMonth?.gross ?? 0).toLocaleString()}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2" style={{ color: 'var(--tc-red-500)' }}>
                                <span className="text-muted">Hall Fees Paid</span>
                                <span className="fw-semibold tc-figure">- LKR {(dashboardData.incomeThisMonth?.fees ?? 0).toLocaleString()}</span>
                            </div>
                            <hr />
                            <div className="d-flex justify-content-between align-items-center">
                                <span className="fw-bold">Net Profit</span>
                                <span className="tc-figure" style={{ fontSize: '1.6rem', color: 'var(--tc-teal-700)' }}>
                                    LKR {(dashboardData.incomeThisMonth?.net ?? 0).toLocaleString()}
                                </span>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
                <Col xs={12} md={6}>
                    <Card className="h-100 overflow-hidden border-0">
                        <div className="p-3 text-white d-flex align-items-center" style={{ background: 'var(--tc-ink-900)' }}>
                            <LuCalendarRange className="fs-4 me-3" />
                            <span className="fw-bold">Income This Year</span>
                        </div>
                        <Card.Body>
                            <div className="d-flex justify-content-between mb-2">
                                <span className="text-muted">Yearly Collected</span>
                                <span className="fw-semibold tc-figure">LKR {(dashboardData.incomeThisYear?.gross ?? 0).toLocaleString()}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-2" style={{ color: 'var(--tc-red-500)' }}>
                                <span className="text-muted">Total Hall Fees</span>
                                <span className="fw-semibold tc-figure">- LKR {(dashboardData.incomeThisYear?.fees ?? 0).toLocaleString()}</span>
                            </div>
                            <hr />
                            <div className="d-flex justify-content-between align-items-center">
                                <span className="fw-bold">Yearly Net Profit</span>
                                <span className="tc-figure" style={{ fontSize: '1.6rem', color: 'var(--tc-green-500)' }}>
                                    LKR {(dashboardData.incomeThisYear?.net ?? 0).toLocaleString()}
                                </span>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* --- ROW 4: CHARTS --- */}
            <Row className="g-3">
                <Col xs={12} md={8}>
                    <Card className="h-100 border-0">
                        <Card.Body>
                            <Card.Title className="mb-4">Students by Grade</Card.Title>
                            {gradeChart.data?.datasets?.length > 0 ? (
                                <div style={{ height: '320px' }}>
                                    <Bar data={gradeChart.data} options={gradeChart.options} />
                                </div>
                            ) : (<p className="text-center mt-5 text-muted">No student data available for chart.</p>)}
                        </Card.Body>
                    </Card>
                </Col>
                <Col xs={12} md={4}>
                    <Card className="h-100 border-0">
                        <Card.Body>
                            <Card.Title className="mb-4">Payment Status (This Month)</Card.Title>
                            {paymentChart.data?.datasets?.length > 0 ? (
                                <div style={{ height: '320px' }}>
                                    <Doughnut data={paymentChart.data} options={paymentChart.options} />
                                </div>
                            ) : (<p className="text-center mt-5 text-muted">No payment data available for chart.</p>)}
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

export default DashboardPage;
