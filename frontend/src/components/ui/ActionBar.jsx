import React from 'react';

const ActionBar = ({ onAddNew }) => {
    return (
        <div className="flex flex-col sm:flex-row items-center justify-between py-6 px-1 gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                {/* Add New Button */}
                <button
                    onClick={onAddNew}
                    className="flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-full px-6 py-2.5 text-sm font-medium text-text-main shadow-sm hover:bg-gray-50 transition-colors w-full sm:w-auto"
                >
                    <PlusIcon className="w-5 h-5 text-secondary" />
                    Add new
                </button>
            </div>
        </div>
    );
};

// --- Icons ---

const PlusIcon = ({ className }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="12" y1="5" x2="12" y2="19"></line>
        <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
);

const CalendarIcon = ({ className }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
        <line x1="8" y1="14" x2="8.01" y2="14"></line>
        <line x1="12" y1="14" x2="12.01" y2="14"></line>
        <line x1="16" y1="14" x2="16.01" y2="14"></line>
        <line x1="8" y1="18" x2="8.01" y2="18"></line>
        <line x1="12" y1="18" x2="12.01" y2="18"></line>
        <line x1="16" y1="18" x2="16.01" y2="18"></line>
    </svg>
);

const ChevronDownIcon = ({ className }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
);

export default ActionBar;
