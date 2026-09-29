import axios from 'axios';

// Keys used in localStorage
const TEACHER_TOKEN_KEY = 'tms_teacher_token';
const TEACHER_INFO_KEY = 'tms_teacher_info';
const ADMIN_TOKEN_KEY = 'tms_admin_token';
const ADMIN_INFO_KEY = 'tms_admin_info';

// --- Applies whichever token is currently stored as the axios Authorization header ---
// Called once at app startup, and again after every login/logout.
function applyStoredToken() {
    const teacherToken = localStorage.getItem(TEACHER_TOKEN_KEY);
    const adminToken = localStorage.getItem(ADMIN_TOKEN_KEY);
    const token = adminToken || teacherToken; // a browser tab is either a teacher session or an admin session
    if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
        delete axios.defaults.headers.common['Authorization'];
    }
}

// --- Teacher auth ---
function teacherLogin(token, teacher) {
    localStorage.setItem(TEACHER_TOKEN_KEY, token);
    localStorage.setItem(TEACHER_INFO_KEY, JSON.stringify(teacher));
    applyStoredToken();
}

function teacherLogout() {
    localStorage.removeItem(TEACHER_TOKEN_KEY);
    localStorage.removeItem(TEACHER_INFO_KEY);
    applyStoredToken();
}

function getTeacherToken() {
    return localStorage.getItem(TEACHER_TOKEN_KEY);
}

function getTeacherInfo() {
    const raw = localStorage.getItem(TEACHER_INFO_KEY);
    return raw ? JSON.parse(raw) : null;
}

function isTeacherLoggedIn() {
    return !!getTeacherToken();
}

// --- Admin auth ---
function adminLogin(token, admin) {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
    localStorage.setItem(ADMIN_INFO_KEY, JSON.stringify(admin));
    applyStoredToken();
}

function adminLogout() {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_INFO_KEY);
    applyStoredToken();
}

function getAdminToken() {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
}

function getAdminInfo() {
    const raw = localStorage.getItem(ADMIN_INFO_KEY);
    return raw ? JSON.parse(raw) : null;
}

function isAdminLoggedIn() {
    return !!getAdminToken();
}

// --- Global 401 handling: if any API call comes back unauthorized, the token is
// invalid/expired, so log out and bounce to the right login page. ---
function setupAxiosInterceptor() {
    axios.interceptors.response.use(
        (response) => response,
        (error) => {
            if (error.response && error.response.status === 401) {
                const onAdminSection = window.location.pathname.startsWith('/admin');
                if (onAdminSection) {
                    adminLogout();
                    if (window.location.pathname !== '/admin/login') {
                        window.location.href = '/admin/login';
                    }
                } else {
                    teacherLogout();
                    if (window.location.pathname !== '/login') {
                        window.location.href = '/login';
                    }
                }
            }
            return Promise.reject(error);
        }
    );
}

applyStoredToken();

export {
    teacherLogin, teacherLogout, getTeacherToken, getTeacherInfo, isTeacherLoggedIn,
    adminLogin, adminLogout, getAdminToken, getAdminInfo, isAdminLoggedIn,
    setupAxiosInterceptor
};
