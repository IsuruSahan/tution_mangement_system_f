import React from 'react';
import { Navigate } from 'react-router-dom';
import { isAdminLoggedIn } from './authService';

function AdminProtectedRoute({ children }) {
    if (!isAdminLoggedIn()) {
        return <Navigate to="/admin/login" replace />;
    }
    return children;
}

export default AdminProtectedRoute;
