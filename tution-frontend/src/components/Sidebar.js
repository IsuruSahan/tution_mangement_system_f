import React, { useState } from 'react';
import { Nav, Button, Offcanvas } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaQrcode, FaSignOutAlt, FaBars } from 'react-icons/fa';
import {
  LuLayoutDashboard, LuUsers, LuWallet, LuCalendarCheck, LuChartBar, LuSettings
} from 'react-icons/lu';
import { teacherLogout, getTeacherInfo } from '../auth/authService';
import logo from '../assets/logo.svg';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LuLayoutDashboard, exact: true },
  { to: '/students', label: 'Students', icon: LuUsers },
  { to: '/payments', label: 'Payments', icon: LuWallet },
  { to: '/attendance', label: 'Attendance', icon: LuCalendarCheck },
  { to: '/finance-report', label: 'Finance Report', icon: LuChartBar },
  { to: '/settings', label: 'Settings', icon: LuSettings },
];

// Shared nav content rendered both in the permanent desktop sidebar and the
// mobile slide-out drawer, so the two never drift out of sync.
function SidebarContent({ onNavigate }) {
  const navigate = useNavigate();
  const location = useLocation();
  const teacherInfo = getTeacherInfo();

  const isActive = (item) => (item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to));

  const handleLogout = () => {
    teacherLogout();
    navigate('/login');
  };

  return (
    <>
      <span className="tc-sidebar-brand d-none d-xl-block">
        <img src={logo} alt="Tution360" className="tc-sidebar-logo" />
      </span>

      <Button
        as={Link}
        to="/scan"
        variant="warning"
        className="tc-sidebar-scan-btn w-100"
        onClick={onNavigate}
      >
        <FaQrcode className="me-2" /> Scan &amp; Check-in
      </Button>

      <Nav className="tc-sidebar-nav">
        {NAV_ITEMS.map(({ to, label, icon: Icon, exact }) => (
          <Nav.Link
            key={to}
            as={Link}
            to={to}
            onClick={onNavigate}
            className={isActive({ to, exact }) ? 'active' : ''}
          >
            <Icon className="me-2" size={17} />
            {label}
          </Nav.Link>
        ))}
      </Nav>

      <div className="tc-sidebar-footer">
        {teacherInfo && (
          <span className="tc-teacher-chip">{teacherInfo.businessName || teacherInfo.name}</span>
        )}
        <Button variant="outline-light" size="sm" className="w-100" onClick={() => { handleLogout(); if (onNavigate) onNavigate(); }}>
          <FaSignOutAlt className="me-2" /> Log Out
        </Button>
      </div>
    </>
  );
}

function Sidebar() {
  const [showDrawer, setShowDrawer] = useState(false);

  return (
    <>
      {/* --- Desktop: permanent sidebar --- */}
      <div className="tc-sidebar d-none d-xl-flex">
        <SidebarContent />
      </div>

      {/* --- Mobile/tablet: slim top bar + slide-out drawer --- */}
      <div className="tc-mobile-topbar d-xl-none">
        <span className="tc-sidebar-brand"><img src={logo} alt="Tution360" className="tc-sidebar-logo" /></span>
        <Button variant="outline-light" size="sm" onClick={() => setShowDrawer(true)} aria-label="Open menu">
          <FaBars />
        </Button>
      </div>

      <Offcanvas
        show={showDrawer}
        onHide={() => setShowDrawer(false)}
        placement="start"
        className="tc-offcanvas-nav d-xl-none"
        style={{ width: '270px', position: 'fixed' }}
      >
        <Offcanvas.Header closeButton closeVariant="white">
          <Offcanvas.Title className="tc-sidebar-brand mb-0"><img src={logo} alt="Tution360" className="tc-sidebar-logo" /></Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <SidebarContent onNavigate={() => setShowDrawer(false)} />
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
}

export default Sidebar;
