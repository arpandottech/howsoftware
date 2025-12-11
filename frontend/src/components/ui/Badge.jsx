import React from 'react';

const Badge = ({ children, variant = 'neutral', className = '' }) => {

    const variants = {
        success: "bg-success/10 text-success border-success/20",
        warning: "bg-warning/10 text-warning border-warning/20",
        danger: "bg-danger/10 text-danger border-danger/20",
        neutral: "bg-secondary/10 text-secondary border-secondary/20",
        primary: "bg-primary/10 text-primary border-primary/20",
        info: "bg-blue-100 text-blue-700 border-blue-200"
    };

    // Fallback if variant doesn't exist, generic styles shouldn't crash
    const selectedVariant = variants[variant] || variants.neutral;

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${selectedVariant} ${className}`}>
            {children}
        </span>
    );
};

export default Badge;
