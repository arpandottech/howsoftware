import React from 'react';

const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    disabled = false,
    onClick,
    type = 'button',
    className = ''
}) => {

    const baseStyles = "inline-flex items-center justify-center font-medium rounded transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
        primary: "bg-primary text-surface hover:opacity-90 active:scale-95 shadow-sm",
        secondary: "bg-secondary text-surface hover:bg-gray-600 shadow-sm",
        outline: "border border-border text-text-main hover:bg-gray-50",
        ghost: "bg-transparent text-text-secondary hover:bg-gray-100 hover:text-text-main",
        danger: "bg-danger text-surface hover:bg-red-600 shadow-sm"
    };

    const sizes = {
        sm: "px-3 py-1.5 text-xs",
        md: "px-4 py-2 text-sm",
        lg: "px-6 py-3 text-base"
    };

    return (
        <button
            type={type}
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
            onClick={onClick}
            disabled={disabled}
        >
            {children}
        </button>
    );
};

export default Button;
