import React from 'react';

const StatCard = ({ label, value, trend, icon, trendUp = true }) => {
    return (
        <div className="bg-surface rounded-[20px] p-5 flex items-center justify-between shadow-card hover:shadow-lg transition-all duration-300">
            <div>
                <p className="text-text-secondary text-sm font-medium mb-1">
                    {label}
                </p>
                <h4 className="text-2xl font-bold text-text-main font-sans tracking-tight">
                    {value}
                </h4>
                {trend && (
                    <div className="flex items-center text-xs font-bold mt-1">
                        <span className={`flex items-center mr-2 ${trendUp ? 'text-success' : 'text-danger'}`}>
                            {trendUp ? '↑' : '↓'} {trend}
                        </span>
                        <span className="text-text-secondary font-medium">since last month</span>
                    </div>
                )}
            </div>

            {icon && (
                <div className="h-12 w-12 rounded-full bg-lightPrimary flex items-center justify-center text-primary text-xl">
                    {/* Note: In real setup, define 'lightPrimary' in tailwind or use opacity */}
                    <div className="bg-primary/10 w-full h-full rounded-full flex items-center justify-center text-primary">
                        {icon}
                    </div>
                </div>
            )}
        </div>
    );
};

export default StatCard;
