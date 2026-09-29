import React from 'react';

// A single shimmering placeholder block. Pass width/height like plain CSS values.
export function Skeleton({ width = '100%', height = '1rem', className = '', style = {} }) {
    return <span className={`tc-skeleton ${className}`} style={{ width, height, ...style }} />;
}

// Placeholder for the whole Dashboard while /api/dashboard is loading -
// mirrors the real layout so the page doesn't "jump" once data arrives.
export function DashboardSkeleton() {
    return (
        <div>
            <div className="mb-4">
                <Skeleton width="120px" height="0.9rem" className="mb-2" />
                <Skeleton width="220px" height="2rem" />
            </div>
            <div className="row g-3 mb-4">
                {[0, 1, 2].map(i => (
                    <div className="col-lg-4 col-md-6" key={i}>
                        <div className="tc-stat-card">
                            <Skeleton width="60%" height="0.8rem" className="mb-3" />
                            <Skeleton width="40%" height="2rem" />
                        </div>
                    </div>
                ))}
            </div>
            <div className="row g-3 mb-4">
                {[0, 1].map(i => (
                    <div className="col-md-6" key={i}>
                        <div className="tc-section-card p-3" style={{ height: '150px' }}>
                            <Skeleton width="50%" height="1rem" className="mb-3" />
                            <Skeleton width="80%" height="1.5rem" />
                        </div>
                    </div>
                ))}
            </div>
            <div className="row g-3">
                <div className="col-md-8">
                    <div className="tc-section-card p-3" style={{ height: '360px' }}>
                        <Skeleton width="40%" height="1rem" className="mb-4" />
                        <Skeleton width="100%" height="280px" />
                    </div>
                </div>
                <div className="col-md-4">
                    <div className="tc-section-card p-3" style={{ height: '360px' }}>
                        <Skeleton width="60%" height="1rem" className="mb-4" />
                        <Skeleton width="100%" height="280px" style={{ borderRadius: '50%', maxWidth: '260px', margin: '0 auto', display: 'block' }} />
                    </div>
                </div>
            </div>
        </div>
    );
}

// Placeholder for a table of rows (used by the Students list while loading).
export function TableSkeleton({ rows = 5, cols = 6 }) {
    return (
        <tbody>
            {Array.from({ length: rows }).map((_, r) => (
                <tr key={r}>
                    {Array.from({ length: cols }).map((__, c) => (
                        <td key={c}><Skeleton height="0.9rem" width={c === 0 ? '40%' : '70%'} /></td>
                    ))}
                </tr>
            ))}
        </tbody>
    );
}
