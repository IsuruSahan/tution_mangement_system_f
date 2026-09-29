import React from 'react';

const ACCENT_MAP = {
    primary: 'var(--tc-teal-700)',
    success: 'var(--tc-green-500)',
    warning: 'var(--tc-amber-500)',
    danger: 'var(--tc-red-500)',
    info: 'var(--tc-slate-500)',
    secondary: 'var(--tc-ink-500)',
    dark: 'var(--tc-ink-900)',
};

/**
 * A reusable card that shows a total and a grade-wise breakdown.
 * props:
 * - title: The main title (e.g., "Total Active Students")
 * - total: The big number to show (e.g., 25)
 * - data: The array from the API (e.g., [{ _id: "Grade 6", count: 10 }, ...])
 * - variant: The card color (e.g., 'primary', 'success', 'warning')
 */
function GradeStatCard({ title, total, data, variant = 'primary' }) {
    const accent = ACCENT_MAP[variant] || ACCENT_MAP.primary;
    return (
        // h-100 makes all cards in a row the same height
        <div className="tc-stat-card h-100" style={{ borderLeftColor: accent }}>
            <div className="tc-stat-label">{title}</div>
            <div className="tc-stat-value">{total}</div>

            {/* Only show the list if there is data */}
            {data && data.length > 0 && (
                <div className="mt-3 pt-2 border-top">
                    {data.map(item => (
                        <div key={item._id} className="d-flex justify-content-between small py-1">
                            <span className="text-muted">{item._id || 'N/A'}</span>
                            <span className="fw-semibold">{item.count}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default GradeStatCard;
