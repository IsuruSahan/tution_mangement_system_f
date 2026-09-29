import React, { createContext, useCallback, useContext, useState } from 'react';
import { ToastContainer, Toast } from 'react-bootstrap';
import { LuCircleCheck, LuCircleX, LuInfo } from 'react-icons/lu';

const ToastCtx = createContext(null);

const ICONS = {
    success: <LuCircleCheck className="me-2" style={{ color: 'var(--tc-green-500)' }} />,
    danger: <LuCircleX className="me-2" style={{ color: 'var(--tc-red-500)' }} />,
    info: <LuInfo className="me-2" style={{ color: 'var(--tc-slate-500)' }} />,
};

let idCounter = 0;

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const showToast = useCallback((message, variant = 'success') => {
        const id = ++idCounter;
        setToasts(current => [...current, { id, message, variant }]);
        // Auto-remove after the visible delay, as a fallback in case autohide's
        // onClose doesn't fire (e.g. rapid unmounts).
        setTimeout(() => {
            setToasts(current => current.filter(t => t.id !== id));
        }, 3500);
    }, []);

    const removeToast = (id) => setToasts(current => current.filter(t => t.id !== id));

    return (
        <ToastCtx.Provider value={showToast}>
            {children}
            <ToastContainer position="bottom-end" className="p-3" style={{ position: 'fixed', zIndex: 1080 }}>
                {toasts.map(t => (
                    <Toast key={t.id} onClose={() => removeToast(t.id)} autohide delay={3000} bg="white">
                        <Toast.Body className="d-flex align-items-center">
                            {ICONS[t.variant] || ICONS.info}
                            {t.message}
                        </Toast.Body>
                    </Toast>
                ))}
            </ToastContainer>
        </ToastCtx.Provider>
    );
}

// Usage: const showToast = useToast(); showToast('Marked present!', 'success');
export function useToast() {
    const ctx = useContext(ToastCtx);
    if (!ctx) {
        // Fail soft rather than crash a page if a component ever renders outside the provider.
        return () => {};
    }
    return ctx;
}
