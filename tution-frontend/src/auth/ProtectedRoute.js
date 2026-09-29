import React from 'react';
import { Navigate } from 'react-router-dom';
import { isTeacherLoggedIn } from './authService';

function ProtectedRoute({ children }) {
    if (!isTeacherLoggedIn()) {
        return <Navigate to="/login" replace />;
    }
    return children;
}

export default ProtectedRoute;
