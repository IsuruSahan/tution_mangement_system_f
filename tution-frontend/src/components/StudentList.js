import React, { useState, useEffect, useRef } from 'react'; // --- ADDED useRef ---
import axios from 'axios';
import { Alert, Card, Table, Form, Row, Col, Badge, Button, Modal, Spinner } from 'react-bootstrap';
import { FaEdit, FaTrashAlt, FaQrcode } from 'react-icons/fa';
import { LuUsers, LuSearch, LuDownload, LuUpload } from 'react-icons/lu';
import QRCode from "react-qr-code";
import { toJpeg } from 'html-to-image'; // --- ADDED THIS IMPORT ---
import Papa from 'papaparse';
import { TableSkeleton } from './ui/Skeleton';
import { useToast } from './ui/ToastProvider';

function StudentList({ refreshKey, onListRefresh }) {
    // --- State ---
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [gradeFilter, setGradeFilter] = useState('All');
    const [locationFilter, setLocationFilter] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [locations, setLocations] = useState([]);
    const [locationLoading, setLocationLoading] = useState(true);
    const [grades, setGrades] = useState([]);
    const [gradeLoading, setGradeLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [showQrModal, setShowQrModal] = useState(false);
    const [qrStudent, setQrStudent] = useState(null);

    // --- NEW: Create a Ref for the download area ---
    const qrCodeRef = useRef(null);

    // --- CSV import state ---
    const [showImportModal, setShowImportModal] = useState(false);
    const [importRows, setImportRows] = useState([]);
    const [importFileName, setImportFileName] = useState('');
    const [importParseError, setImportParseError] = useState('');
    const [importing, setImporting] = useState(false);
    const [importProgress, setImportProgress] = useState({ done: 0, total: 0 });
    const csvFileInputRef = useRef(null);

    const showToast = useToast();

    // --- Fetch Students (Uses Env Var) ---
    useEffect(() => {
        const fetchStudents = async () => { /* ... unchanged ... */
            setLoading(true); setError(null); try { const apiUrl = process.env.REACT_APP_API_URL; if (!apiUrl) throw new Error("API URL not configured."); const response = await axios.get(`${apiUrl}/api/students`); setStudents(response.data); } catch (err) { console.error("Error fetching students:", err); setError(`Error fetching students: ${err.message}`); } finally { setLoading(false); }
        };
        fetchStudents();
    }, [refreshKey]);

    // --- Fetch Locations (Uses Env Var) ---
    useEffect(() => {
        const fetchLocations = async () => { /* ... unchanged ... */
            setLocationLoading(true); try { const apiUrl = process.env.REACT_APP_API_URL; if (!apiUrl) throw new Error("API URL not configured."); const res = await axios.get(`${apiUrl}/api/locations`); setLocations(res.data); } catch (err) { console.error("Failed locations:", err); setError(prev => prev ? `${prev} Failed locations.` : `Failed locations: ${err.message}`); } finally { setLocationLoading(false); }
        };
        fetchLocations();
    }, []);

    // --- Fetch Grades/Classes (teacher-managed - "Grade 6", "Revision 2026", etc.) ---
    useEffect(() => {
        const fetchGrades = async () => {
            setGradeLoading(true); try { const apiUrl = process.env.REACT_APP_API_URL; if (!apiUrl) throw new Error("API URL not configured."); const res = await axios.get(`${apiUrl}/api/grades`); setGrades(res.data); } catch (err) { console.error("Failed grades:", err); setError(prev => prev ? `${prev} Failed grades.` : `Failed grades: ${err.message}`); } finally { setGradeLoading(false); }
        };
        fetchGrades();
    }, []);

    // --- Filter logic (Unchanged) ---
    const filteredStudents = students.filter(student => { /* ... */ const gm = gradeFilter === 'All' || student.grade === gradeFilter; const lm = locationFilter === 'All' || student.location === locationFilter; const term = searchTerm.trim().toLowerCase(); const sm = !term || student.name.toLowerCase().includes(term) || (student.studentId || '').toLowerCase().includes(term); return gm && lm && sm; });

    // --- Modal Handlers (Unchanged) ---
    const handleEditClick = (student) => { setEditingStudent(student); setShowModal(true); };
    const handleCloseModal = () => { setShowModal(false); setEditingStudent(null); };
    const handleModalChange = (e) => { setEditingStudent({ ...editingStudent, [e.target.name]: e.target.value }); };
    const handleUpdateStudent = async (e) => { /* ... unchanged ... */ e.preventDefault(); if (!editingStudent) return; try { const apiUrl = process.env.REACT_APP_API_URL; if (!apiUrl) throw new Error("API URL not configured."); const { _id, studentId, __v, createdAt, updatedAt, ...updateData } = editingStudent; const res = await axios.patch(`${apiUrl}/api/students/${_id}`, updateData); setStudents(s => s.map(st => (st._id === editingStudent._id ? res.data : st))); handleCloseModal(); showToast(`${res.data.name}'s details were updated.`, 'success'); } catch (err) { console.error("Error updating:", err); showToast(`Failed to update student: ${err.response?.data?.message || err.message}`, 'danger'); } };
    const handleDeactivateClick = async (studentMongoId, studentName) => { /* ... unchanged ... */ if (window.confirm('Deactivate?')) { try { const apiUrl = process.env.REACT_APP_API_URL; if (!apiUrl) throw new Error("API URL not configured."); await axios.delete(`${apiUrl}/api/students/${studentMongoId}`); onListRefresh(); showToast(`${studentName || 'Student'} was deactivated.`, 'success'); } catch (err) { console.error("Error deactivate:", err); showToast(`Failed to deactivate: ${err.response?.data?.message || err.message}`, 'danger'); } } };
    const handleShowQrModal = (student) => { setQrStudent(student); setShowQrModal(true); };
    const handleCloseQrModal = () => { setShowQrModal(false); setQrStudent(null); };

    // --- NEW: Download Handler ---
    const handleDownload = () => {
        if (qrCodeRef.current === null) {
            return;
        }

        toJpeg(qrCodeRef.current, { cacheBust: true, quality: 0.98, backgroundColor: 'white' })
            .then((dataUrl) => {
                // Create a temporary link to trigger the download
                const link = document.createElement('a');
                link.download = `${qrStudent.name}-${qrStudent.studentId}-ID.jpg`;
                link.href = dataUrl;
                link.click(); // Trigger the download
            })
            .catch((err) => {
                console.error('oops, something went wrong!', err);
                showToast('Could not download the QR code image.', 'danger');
            });
    };

    // --- CSV EXPORT: downloads the currently filtered list as a .csv file ---
    const handleExportCsv = () => {
        const rows = filteredStudents.map(s => ({
            'Student ID': s.studentId || '',
            'Name': s.name || '',
            'Grade': s.grade || '',
            'Location': s.location || '',
            'Contact Phone': s.contactPhone || '',
            "Parent's Name": s.parentName || ''
        }));
        const csv = Papa.unparse(rows);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `students-${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        showToast(`Exported ${rows.length} student(s) to CSV.`, 'success');
    };

    // --- CSV IMPORT: template download, so teachers know the expected columns ---
    const handleDownloadTemplate = () => {
        const csv = Papa.unparse([{ Name: 'Jane Silva', Grade: 'Grade 7', Location: 'Main Hall', 'Contact Phone': '0771234567', "Parent's Name": 'Mr. Silva' }]);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'student-import-template.csv';
        link.click();
        URL.revokeObjectURL(url);
    };

    const openImportModal = () => {
        setImportRows([]);
        setImportFileName('');
        setImportParseError('');
        setImportProgress({ done: 0, total: 0 });
        setShowImportModal(true);
    };

    // Normalizes whatever header casing/spacing the teacher's spreadsheet used
    // (Name / name / Student Name -> name, etc.) so imports aren't brittle.
    const normalizeRow = (row) => {
        const find = (...keys) => {
            for (const k of Object.keys(row)) {
                if (keys.includes(k.trim().toLowerCase())) return row[k]?.trim();
            }
            return '';
        };
        return {
            name: find('name', 'student name'),
            grade: find('grade'),
            location: find('location'),
            contactPhone: find('contact phone', 'phone', 'contactphone'),
            parentName: find("parent's name", 'parent name', 'parentname')
        };
    };

    const handleFileSelected = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setImportFileName(file.name);
        setImportParseError('');
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const rows = results.data.map(normalizeRow).filter(r => r.name);
                if (rows.length === 0) {
                    setImportParseError('No valid rows found. Make sure the CSV has a "Name" column with at least one row filled in.');
                }
                setImportRows(rows);
            },
            error: (err) => setImportParseError(`Could not read file: ${err.message}`)
        });
    };

    const handleConfirmImport = async () => {
        const apiUrl = process.env.REACT_APP_API_URL;
        setImporting(true);
        setImportProgress({ done: 0, total: importRows.length });
        let successCount = 0;
        const failures = [];

        // Sequential, not Promise.all - each request generates a unique 4-digit
        // studentId server-side, so running them one at a time avoids any risk
        // of a duplicate-ID race between simultaneous inserts.
        for (const row of importRows) {
            try {
                await axios.post(`${apiUrl}/api/students`, row);
                successCount++;
            } catch (err) {
                failures.push({ name: row.name, message: err.response?.data?.message || err.message });
            }
            setImportProgress(prev => ({ ...prev, done: prev.done + 1 }));
        }

        setImporting(false);
        setShowImportModal(false);
        onListRefresh();

        if (failures.length === 0) {
            showToast(`Imported ${successCount} student(s) successfully.`, 'success');
        } else {
            showToast(`Imported ${successCount} student(s), ${failures.length} failed. Check console for details.`, 'danger');
            console.error('CSV import failures:', failures);
        }
    };

    // --- Render Logic ---
    if (error && students.length === 0 && !loading) { return <Alert className="mt-4" variant="danger">{error}</Alert>; }

    return (
        <>
            <Card className="mt-4 border-0">
                {/* ... (Card Header, Body, Filters, and Table are unchanged) ... */}
                <Card.Header className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                    <span className="d-flex align-items-center">
                        <LuUsers className="me-2" style={{ color: 'var(--tc-teal-700)' }} />
                        <Card.Title as="span" className="mb-0">Student List</Card.Title>
                    </span>
                    <span>
                        <Button variant="outline-secondary" size="sm" className="me-2" onClick={handleExportCsv} disabled={loading || filteredStudents.length === 0}>
                            <LuDownload className="me-1" style={{ verticalAlign: '-2px' }} /> Export CSV
                        </Button>
                        <Button variant="outline-secondary" size="sm" onClick={openImportModal}>
                            <LuUpload className="me-1" style={{ verticalAlign: '-2px' }} /> Import CSV
                        </Button>
                    </span>
                </Card.Header>
                <Card.Body>
                     {error && students.length > 0 && <Alert variant="warning">{error.includes("locations") ? "Failed locations." : error }</Alert>}
                    <Form className="mb-3"> <Row className="g-2"> <Col xs={12} md={4}> <Form.Group><Form.Label>Search</Form.Label> <div className="position-relative"> <LuSearch style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--tc-ink-300)' }} /> <Form.Control style={{ paddingLeft: '32px' }} type="text" placeholder="Name or student ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /> </div> </Form.Group> </Col> <Col xs={12} md={4}> <Form.Group><Form.Label>Grade</Form.Label> <Form.Select value={gradeFilter} onChange={(e) => setGradeFilter(e.target.value)} disabled={gradeLoading}> <option value="All">All Grades</option> {gradeLoading ? (<option>...</option>) : ( grades.map(g => (<option key={g._id} value={g.name}>{g.name}</option>)) )} </Form.Select> </Form.Group> </Col> <Col xs={12} md={4}> <Form.Group><Form.Label>Location</Form.Label> <Form.Select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)} disabled={locationLoading}> <option value="All">All Locations</option> {locationLoading ? (<option>...</option>) : ( locations.map(loc => (<option key={loc._id} value={loc.name}>{loc.name}</option>)) )} </Form.Select> </Form.Group> </Col> </Row> </Form>
                    <Table striped bordered hover responsive className="tc-stack-table">
                        <thead><tr><th>Student ID</th><th>Student Name</th><th>Grade</th><th>Location</th><th>Contact Phone</th><th>Parent's Name</th><th>Actions</th></tr></thead>
                        {loading ? <TableSkeleton rows={5} cols={7} /> : (
                        <tbody>
                            {filteredStudents.length > 0 ? (
                                filteredStudents.map(student => (
                                    <tr key={student._id}>
                                        <td data-label="Student ID">{student.studentId || 'N/A'}</td>
                                        <td data-label="Name" className="tc-card-title">{student.name}</td>
                                        <td data-label="Grade"><Badge bg="primary">{student.grade}</Badge></td>
                                        <td data-label="Location"><Badge bg="secondary">{student.location}</Badge></td>
                                        <td data-label="Phone">{student.contactPhone || '-'}</td>
                                        <td data-label="Parent">{student.parentName || '-'}</td>
                                        <td className="tc-actions-cell">
                                            <Button variant="outline-secondary" size="sm" className="me-2" onClick={() => handleShowQrModal(student)} title="Show QR Code"><FaQrcode /></Button>
                                            <Button variant="outline-primary" size="sm" className="me-2" onClick={() => handleEditClick(student)} title="Edit"><FaEdit /></Button>
                                            <Button variant="outline-danger" size="sm" onClick={() => handleDeactivateClick(student._id, student.name)} title="Deactivate"><FaTrashAlt /></Button>
                                        </td>
                                    </tr>
                                ))
                            ) : ( <tr> <td colSpan="7" className="text-center text-muted py-4">{students.length === 0 ? 'No students yet. Add your first student above.' : 'No students match your search/filters.'}</td> </tr> )}
                        </tbody>
                        )}
                    </Table>
                </Card.Body>
            </Card>

            {/* --- EDIT STUDENT MODAL (Unchanged) --- */}
            <Modal show={showModal} onHide={handleCloseModal} centered>
                 <Modal.Header closeButton> <Modal.Title>Edit Student</Modal.Title> </Modal.Header>
                 <Modal.Body>
                    {editingStudent && ( <Form onSubmit={handleUpdateStudent}> <Form.Group className="mb-3"><Form.Label>Student ID</Form.Label><Form.Control type="text" value={editingStudent.studentId || 'N/A'} readOnly disabled /></Form.Group> <Form.Group className="mb-3"><Form.Label>Name</Form.Label><Form.Control type="text" name="name" value={editingStudent.name} onChange={handleModalChange} required /></Form.Group> <Row> <Col xs={12} md={6}> <Form.Group className="mb-3"><Form.Label>Grade</Form.Label> <Form.Select name="grade" value={editingStudent.grade} onChange={handleModalChange} disabled={gradeLoading}> {gradeLoading ? (<option>...</option>) : ( <>{editingStudent.grade && !grades.some(g => g.name === editingStudent.grade) && (<option value={editingStudent.grade}>{editingStudent.grade} (no longer in your list)</option>)}{grades.map(g => (<option key={g._id} value={g.name}>{g.name}</option>))}</> )} </Form.Select> </Form.Group> </Col> <Col xs={12} md={6}> <Form.Group className="mb-3"><Form.Label>Location</Form.Label> <Form.Select name="location" value={editingStudent.location} onChange={handleModalChange} disabled={locationLoading}> {locationLoading ? (<option>...</option>) : ( locations.map(loc => (<option key={loc._id} value={loc.name}>{loc.name}</option>)) )} </Form.Select> </Form.Group> </Col> </Row> <Form.Group className="mb-3"><Form.Label>Phone</Form.Label><Form.Control type="text" name="contactPhone" value={editingStudent.contactPhone || ''} onChange={handleModalChange} /></Form.Group> <Form.Group className="mb-3"><Form.Label>Parent's Name</Form.Label><Form.Control type="text" name="parentName" value={editingStudent.parentName || ''} onChange={handleModalChange} /></Form.Group> <Button variant="primary" type="submit"> Save Changes </Button> </Form> )}
                 </Modal.Body>
            </Modal>

            {/* --- MODIFIED: QR CODE MODAL --- */}
            <Modal show={showQrModal} onHide={handleCloseQrModal} centered>
                <Modal.Header closeButton>
                    <Modal.Title>QR Code for {qrStudent?.name}</Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-center">
                    {qrStudent?.studentId ? (
                        <>
                            {/* --- THIS IS THE WRAPPER WE DOWNLOAD --- */}
                            <div ref={qrCodeRef} style={{ background: 'white', padding: '16px', display: 'inline-block', maxWidth: '100%', boxSizing: 'border-box' }}>
                                <QRCode
                                    value={qrStudent.studentId}
                                    size={256}
                                    viewBox={`0 0 256 256`}
                                    style={{ width: '100%', height: 'auto', maxWidth: '256px' }}
                                />
                                <h4 className="mt-3">{qrStudent.name}</h4>
                                <p className="fs-5 text-muted">ID: {qrStudent.studentId}</p>
                            </div>
                            {/* --- END WRAPPER --- */}
                            
                            <div className="mt-3"> {/* Moved buttons outside the download ref */}
                                <Button variant="primary" onClick={handleDownload} className="me-2">
                                    Download as JPG
                                </Button>
                           
                            </div>
                        </>
                    ) : (
                        <Alert variant="warning">This student does not have a 4-digit ID assigned yet. Please edit the student to ensure they have one.</Alert>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseQrModal}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* --- IMPORT STUDENTS FROM CSV MODAL --- */}
            <Modal show={showImportModal} onHide={() => !importing && setShowImportModal(false)} centered>
                <Modal.Header closeButton={!importing}>
                    <Modal.Title>Import Students from CSV</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p className="text-muted small mb-2">
                        Your CSV needs a <strong>Name</strong> column at minimum. Grade, Location, Contact Phone,
                        and Parent's Name columns are optional but recommended.
                    </p>
                    <Button variant="link" size="sm" className="p-0 mb-3" onClick={handleDownloadTemplate}>
                        <LuDownload className="me-1" style={{ verticalAlign: '-2px' }} /> Download a template
                    </Button>

                    <Form.Group className="mb-3">
                        <Form.Control
                            type="file"
                            accept=".csv"
                            ref={csvFileInputRef}
                            onChange={handleFileSelected}
                            disabled={importing}
                        />
                    </Form.Group>

                    {importParseError && <Alert variant="danger">{importParseError}</Alert>}

                    {importFileName && importRows.length > 0 && !importParseError && (
                        <Alert variant="info">
                            <strong>{importFileName}</strong> — found <strong>{importRows.length}</strong> student(s) ready to import.
                        </Alert>
                    )}

                    {importing && (
                        <div className="text-center">
                            <Spinner animation="border" size="sm" style={{ color: 'var(--tc-teal-700)' }} className="me-2" />
                            Importing {importProgress.done} / {importProgress.total}...
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowImportModal(false)} disabled={importing}>Cancel</Button>
                    <Button variant="primary" onClick={handleConfirmImport} disabled={importing || importRows.length === 0}>
                        {importing ? 'Importing...' : `Import ${importRows.length || ''} Student(s)`}
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

export default StudentList;