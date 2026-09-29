import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Container, Row, Col, Form, Button, Card, Table, Spinner, Alert, Badge } from 'react-bootstrap';
import { FaWhatsapp } from 'react-icons/fa';
import { LuDownload } from 'react-icons/lu';
import Papa from 'papaparse';
import { buildPaymentReminderLink } from '../utils/whatsapp';
import { useToast } from '../components/ui/ToastProvider';

const months = ["All", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const years = ["All", new Date().getFullYear(), new Date().getFullYear() - 1];

function FinanceReportPage() {
    const [month, setMonth] = useState('All');
    const [year, setYear] = useState(new Date().getFullYear());
    const [grade, setGrade] = useState('All');
    const [location, setLocation] = useState('All');

    const showToast = useToast();
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [locations, setLocations] = useState([]);
    const [locationLoading, setLocationLoading] = useState(true);
    const [grades, setGrades] = useState([]);
    const [gradeLoading, setGradeLoading] = useState(true);

    const apiUrl = process.env.REACT_APP_API_URL;

    useEffect(() => {
        const fetchLocations = async () => {
            setLocationLoading(true);
            setError('');
            try {
                if (!apiUrl) throw new Error("API URL is not configured.");
                const res = await axios.get(`${apiUrl}/api/locations`);
                setLocations(res.data);
            } catch (err) {
                console.error("Failed to fetch locations:", err);
                setError(`Failed to load locations list: ${err.message}`);
            } finally {
                setLocationLoading(false);
            }
        };
        fetchLocations();
    }, [apiUrl]);

    useEffect(() => {
        const fetchGrades = async () => {
            setGradeLoading(true);
            try {
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
    }, [apiUrl]);

    const loadFinanceReport = async () => {
        setLoading(true);
        setError('');
        setReportData(null);
        try {
            if (!apiUrl) throw new Error("API URL is not configured.");
            const response = await axios.get(`${apiUrl}/api/reports/finance`, {
                params: { month, year, grade, location }
            });
            setReportData(response.data);
        } catch (err) {
            console.error("Error loading finance report:", err);
            setError(`Error loading finance report: ${err.response?.data?.message || err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const downloadCsv = (rows, filename) => {
        const csv = Papa.unparse(rows);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleExportBreakdown = () => {
        if (!reportData?.breakdown?.length) return;
        const rows = reportData.breakdown.map(item => ({
            Period: `${item._id.month} ${item._id.year}`,
            Grade: item._id.grade,
            Location: item._id.location,
            'Students Paid': item.studentsPaid,
            'Gross (LKR)': item.grossIncome || 0,
            'Hall Fee (LKR)': item.totalFees || 0,
            'Net Income (LKR)': item.netIncome || 0
        }));
        downloadCsv(rows, `finance-breakdown-${month}-${year}.csv`);
        showToast(`Exported ${rows.length} row(s) to CSV.`, 'success');
    };

    const handleExportUnpaid = () => {
        if (!reportData?.unpaidStudents?.length) return;
        const rows = reportData.unpaidStudents.map(st => ({
            'Student ID': st.studentId,
            Name: st.name,
            Grade: st.grade,
            Location: st.location,
            'Contact Phone': st.contactPhone || ''
        }));
        downloadCsv(rows, `unpaid-students-${month}-${year}.csv`);
        showToast(`Exported ${rows.length} unpaid student(s) to CSV.`, 'success');
    };

    return (
        <Container fluid="xl" className="mt-4 pb-5">
            <div className="tc-page-header">
                <div>
                    <span className="tc-eyebrow">Reports</span>
                    <h1>Finance Report</h1>
                    <p>See income, hall fees, and who still owes for the period you choose.</p>
                </div>
            </div>
            <Card className="mb-4 border-0">
                <Card.Body>
                    <Card.Title className="fw-bold mb-3">Filter</Card.Title>
                    {error && <Alert variant="danger">{error}</Alert>}
                    <Form>
                        <Row className="g-2">
                            <Col xs={6} md={3}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted">Month</Form.Label>
                                    <Form.Select value={month} onChange={(e) => setMonth(e.target.value)}>
                                        {months.map(m => <option key={m} value={m}>{m}</option>)}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col xs={6} md={2}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted">Year</Form.Label>
                                    <Form.Select value={year} onChange={(e) => setYear(e.target.value)}>
                                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col xs={12} md={2}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted">Grade</Form.Label>
                                    <Form.Select value={grade} onChange={(e) => setGrade(e.target.value)} disabled={gradeLoading}>
                                        <option value="All">All Grades</option>
                                        {!gradeLoading && grades.map(g => <option key={g._id} value={g.name}>{g.name}</option>)}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col xs={12} md={3}>
                                <Form.Group>
                                    <Form.Label className="small fw-bold text-muted">Location</Form.Label>
                                    <Form.Select value={location} onChange={(e) => setLocation(e.target.value)} disabled={locationLoading}>
                                        <option value="All">All Locations</option>
                                        {!locationLoading && locations.map(loc => <option key={loc._id} value={loc.name}>{loc.name}</option>)}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col xs={12} md={2} className="d-flex align-items-end">
                                <Button onClick={loadFinanceReport} className="w-100 fw-bold" variant="primary" disabled={loading || locationLoading || gradeLoading}>
                                    {loading ? <Spinner as="span" size="sm" animation="border" /> : 'Get Report'}
                                </Button>
                            </Col>
                        </Row>
                    </Form>
                </Card.Body>
            </Card>

            {loading && <div className="text-center my-5"><Spinner animation="grow" variant="primary" /></div>}

            {reportData && (
                <>
                    {/* --- ROW 1: SUMMARY CARDS (5 Equal Size Cards) --- */}
<Row className="mb-4 g-3 row-cols-2 row-cols-md-3 row-cols-lg-5">
    
    {/* 1. Gross Income */}
    <Col>
        <Card className="text-center border-0 h-100">
            <Card.Header className="bg-dark text-white py-1 small fw-bold">Gross Income</Card.Header>
            <Card.Body className="d-flex flex-column align-items-center justify-content-center">
                <h5 className="mb-0">{(reportData.grandTotal?.totalGross || 0).toLocaleString()}</h5>
            </Card.Body>
        </Card>
    </Col>

    {/* 2. Hall Fees */}
    <Col>
        <Card className="text-center border-0 h-100">
            <Card.Header className="bg-danger text-white py-1 small fw-bold">Hall Fees</Card.Header>
            <Card.Body className="d-flex flex-column align-items-center justify-content-center text-danger">
                <h5 className="mb-0">-{(reportData.grandTotal?.totalFees || 0).toLocaleString()}</h5>
            </Card.Body>
        </Card>
    </Col>

    {/* 3. Net Profit */}
    <Col>
        <Card className="text-center border-0 h-100 border-bottom border-success border-4">
            <Card.Header className="bg-success text-white py-1 small fw-bold">Net Profit</Card.Header>
            <Card.Body className="d-flex flex-column align-items-center justify-content-center text-success">
                <h5 className="mb-0 fw-bold">{(reportData.grandTotal?.totalNet || 0).toLocaleString()}</h5>
            </Card.Body>
        </Card>
    </Col>

    {/* 4. Paid Count */}
    <Col>
        <Card className="text-center border-0 h-100">
            <Card.Header className="bg-primary text-white py-1 small fw-bold">Paid Count</Card.Header>
            <Card.Body className="d-flex flex-column align-items-center justify-content-center">
                <h5 className="mb-0">{reportData.grandTotal?.totalStudentsPaid || 0}</h5>
            </Card.Body>
        </Card>
    </Col>

    {/* 5. Unpaid Count */}
    <Col>
        <Card className="text-center border-0 h-100 border-bottom border-danger border-4">
            <Card.Header className="bg-white text-danger py-1 small fw-bold">Unpaid Count</Card.Header>
            <Card.Body className="d-flex flex-column align-items-center justify-content-center text-danger">
                <h5 className="mb-0 fw-bold">{reportData.unpaidCount || 0}</h5>
            </Card.Body>
        </Card>
    </Col>
</Row>

                    {/* --- ROW 2: DETAILED BREAKDOWN TABLE --- */}
                    <Card className="mb-4 border-0">
                        <Card.Header className="bg-light fw-bold d-flex justify-content-between align-items-center flex-wrap gap-2">
                            Class-wise Income Breakdown
                            <Button size="sm" variant="outline-secondary" onClick={handleExportBreakdown} disabled={!reportData.breakdown?.length}>
                                <LuDownload className="me-1" style={{ verticalAlign: '-2px' }} /> Export CSV
                            </Button>
                        </Card.Header>
                        <Card.Body className="p-0">
                            <Table striped hover responsive className="mb-0 align-middle tc-stack-table">
                                <thead>
                                    <tr>
                                        <th>Period</th>
                                        <th>Class / Location</th>
                                        <th className="text-center">Paid</th>
                                        <th>Gross (LKR)</th>
                                        <th className="text-danger">Hall Fee</th>
                                        <th className="fw-bold text-success">Net Income</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {reportData.breakdown?.length > 0 ? reportData.breakdown.map((item, index) => (
                                        <tr key={index}>
                                            <td data-label="Period" className="small">{item._id.month} {item._id.year}</td>
                                            <td data-label="Class">
                                                <Badge bg="primary" className="me-1">{item._id.grade}</Badge>
                                                <Badge bg="secondary" pill>{item._id.location}</Badge>
                                            </td>
                                            <td data-label="Students paid" className="text-center">{item.studentsPaid}</td>
                                            <td data-label="Gross (LKR)">{(item.grossIncome || 0).toLocaleString()}</td>
                                            <td data-label="Hall fee" className="text-danger">-{(item.totalFees || 0).toLocaleString()}</td>
                                            <td data-label="Net income" className="fw-bold text-success">{(item.netIncome || 0).toLocaleString()}</td>
                                        </tr>
                                    )) : <tr><td colSpan="6" className="text-center p-4 text-muted">No financial records found for the selected filters.</td></tr>}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>

                    {/* --- ROW 3: UNPAID STUDENTS DETAILED TABLE --- */}
                    {reportData.unpaidStudents?.length > 0 && (
                        <Card className="border-0">
                            <Card.Header className="bg-danger text-white d-flex justify-content-between align-items-center flex-wrap gap-2">
                                <span className="fw-bold">Pending Payments</span>
                                <span className="d-flex align-items-center gap-2">
                                    <Badge bg="light" text="dark">{reportData.unpaidCount} Students</Badge>
                                    <Button size="sm" variant="outline-light" onClick={handleExportUnpaid}>
                                        <LuDownload className="me-1" style={{ verticalAlign: '-2px' }} /> Export CSV
                                    </Button>
                                </span>
                            </Card.Header>
                            <Card.Body className="p-0">
                                <Table striped hover responsive className="mb-0 tc-stack-table">
                                    <thead className="table-danger small">
                                        <tr>
                                            <th>ID</th>
                                            <th>Student Name</th>
                                            <th>Grade</th>
                                            <th>Location</th>
                                            <th>Contact Number</th>
                                            <th>Remind</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.unpaidStudents.map((st) => {
                                            const reminderLink = buildPaymentReminderLink(st, {
                                                month: month !== 'All' ? month : undefined,
                                                year: year !== 'All' ? year : undefined
                                            });
                                            return (
                                                <tr key={st._id}>
                                                    <td data-label="ID" className="fw-bold text-muted">{st.studentId}</td>
                                                    <td data-label="Name" className="tc-card-title">{st.name}</td>
                                                    <td data-label="Grade">{st.grade}</td>
                                                    <td data-label="Location">{st.location}</td>
                                                    <td data-label="Phone">{st.contactPhone || 'N/A'}</td>
                                                    <td className="tc-actions-cell tc-actions-full">
                                                        {reminderLink ? (
                                                            <Button
                                                                as="a"
                                                                href={reminderLink}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                size="sm"
                                                                variant="outline-success"
                                                            >
                                                                <FaWhatsapp className="me-1" /> Remind
                                                            </Button>
                                                        ) : (
                                                            <span className="text-muted small">No number</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </Table>
                            </Card.Body>
                        </Card>
                    )}
                </>
            )}

            {!loading && !reportData && !error && (
                <div className="text-center mt-5">
                    <Alert variant="info" className="d-inline-block">
                        Please select your filters above and click <strong>Get Report</strong> to view the financial breakdown.
                    </Alert>
                </div>
            )}
        </Container>
    );
}

export default FinanceReportPage;