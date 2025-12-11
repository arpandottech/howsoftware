import React from 'react';

const Card = ({ children, title, className = '' }) => {
    return (
        <div className={`bg-surface rounded-[20px] shadow-card p-6 ${className}`}>
            {title && (
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-text-main tracking-tight">{title}</h3>
                    <button className="bg-background text-primary rounded-lg px-3 py-1 text-xs font-bold hover:bg-primary hover:text-white transition-colors">
                        See all
                    </button>
                </div>
            )}
            {children}
        </div>
    );
};

export default Card;
