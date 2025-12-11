import React, { useContext, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import AuthContext from '../../context/AuthContext';
import { FiLogOut, FiMenu, FiX, FiDownload } from 'react-icons/fi';

const LayoutShell = ({ children, title }) => {
    const { user, logout } = useContext(AuthContext);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();

    // Close sidebar on route change
    React.useEffect(() => {
        setIsSidebarOpen(false);
    }, [location.pathname]);

    // PWA Install Logic
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showInstallHelp, setShowInstallHelp] = useState(false);

    React.useEffect(() => {
        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) {
            setShowInstallHelp(true);
            return;
        }
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
        }
    };

    const hasPermission = (module) => {
        // ... existing
        if (!user || !user.role) return false;
        return user.role.permissions?.includes(module);
    };

    // Google Translate Logic (omitted for brevity, assume unchanged or kept)
    // ... (Keeping previous useEffect for sync if it exists, or assuming it's fine)
    // Re-adding the Sync Google Translate Cookie logic just in case I replaced the whole file block, 
    // but the instruction says Replace lines 1-146. 
    // I need to be careful not to delete the Google Translate Effect if it was there.
    // The previous file view showed it at lines 18-44. I should preserve it.

    // Sync Google Translate Cookie with User Language
    React.useEffect(() => {
        if (user && user.language) {
            const targetLang = user.language;
            const cookieValue = `/en/${targetLang}`;
            const currentCookie = document.cookie.split('; ').find(row => row.startsWith('googtrans='));
            if (!currentCookie || currentCookie.split('=')[1] !== cookieValue) {
                document.cookie = `googtrans=/en/${targetLang}; path=/; domain=${window.location.hostname}`;
                document.cookie = `googtrans=/en/${targetLang}; path=/`;
            }
        }
    }, [user?.language]);

    return (
        <div className="flex h-screen bg-background overflow-hidden font-sans text-text-main">

            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar - Responsive */}
            <aside
                className={`
                    fixed lg:static inset-y-0 left-0 z-30
                    w-[280px] bg-white flex flex-col h-full border-r border-border/40 font-sans
                    transform transition-transform duration-300 ease-in-out
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                `}
            >
                {/* Logo Area */}
                <div className="h-24 flex items-center justify-between px-8">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 flex items-center justify-center rounded-full overflow-hidden shadow-lg shadow-black/10 transition-transform hover:scale-105 cursor-pointer">
                            <img src="/logo-new.jpg" alt="House of Wedding" className="w-full h-full object-cover" />
                        </div>
                    </div>
                    {/* Close Button Mobile */}
                    <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-gray-500">
                        <FiX size={24} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto custom-scrollbar">
                    {hasPermission('MODULE_DASHBOARD') && <NavItem to="/dashboard" icon={<GridIcon className="w-5 h-5" />} label="Dashboard" />}
                    {hasPermission('MODULE_BOOKINGS') && <NavItem to="/bookings/new" icon={<CalendarPlusIcon className="w-5 h-5" />} label="Add Booking" />}
                    {hasPermission('MODULE_BOOKINGS') && <NavItem to="/bookings" icon={<BookIcon className="w-5 h-5" />} label="Bookings" />}
                    {hasPermission('MODULE_EXPENSES') && <NavItem to="/expenses" icon={<DollarIcon className="w-5 h-5" />} label="Expenses" />}
                    {hasPermission('MODULE_FINANCE') && <NavItem to="/finance" icon={<HistoryIcon className="w-5 h-5" />} label="Finance" />}

                    <NavItem to="/profile" icon={<UserIcon className="w-5 h-5" />} label="Profile" />

                    {hasPermission('MODULE_SETTINGS') && <NavItem to="/settings" icon={<SettingsIcon className="w-5 h-5" />} label="Settings" />}

                    <button
                        onClick={logout}
                        className="w-full flex items-center px-5 py-3.5 text-sm font-medium rounded-2xl transition-all duration-200 group relative text-text-secondary hover:text-red-600 hover:bg-red-50 mt-2"
                    >
                        <span className="mr-4 text-xl"><FiLogOut className="w-5 h-5" /></span>
                        Logout
                    </button>
                </nav>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">

                {/* Topbar */}
                <header className="px-4 lg:px-8 pt-4 lg:pt-8 pb-4 z-20">
                    <div className="bg-white rounded-[20px] px-4 lg:px-8 py-3 flex items-center justify-between shadow-sm min-h-[70px] lg:min-h-[80px]">

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="lg:hidden mr-4 text-gray-600 p-2 hover:bg-gray-100 rounded-lg"
                        >
                            <FiMenu size={24} />
                        </button>

                        <div className="flex items-center gap-4">
                            {/* Mobile Finance Logo */}
                            <div className="lg:hidden flex items-center gap-2">
                                <div className="w-10 h-10 flex items-center justify-center rounded-full overflow-hidden shadow-md shadow-black/10">
                                    <img src="/logo-new.jpg" alt="House of Wedding" className="w-full h-full object-cover" />
                                </div>
                            </div>

                            {/* Desktop Profile Image & Welcome */}
                            <div className="hidden lg:block w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-gray-300 overflow-hidden border-2 border-white shadow-sm">
                                <img src={`https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=random`} alt="User" />
                            </div>
                            <div className="hidden lg:block">
                                <p className="text-xs text-text-secondary font-medium uppercase tracking-wide">Welcome Back!</p>
                                <h1 className="text-sm lg:text-xl font-bold text-text-main">{user?.name || 'John Doe'}</h1>
                            </div>
                        </div>

                        {/* Right actions */}
                        <div className="flex items-center gap-2 lg:gap-4">
                            {/* Install App Button (Mobile Only) */}
                            <button
                                onClick={handleInstallClick}
                                className="lg:hidden w-10 h-10 rounded-full border border-primary/20 bg-primary/5 text-primary flex items-center justify-center hover:bg-primary/10 transition-colors"
                                title="Install App"
                            >
                                <FiDownload size={20} />
                            </button>

                            <button onClick={logout} className="w-10 h-10 lg:w-12 lg:h-12 rounded-full border border-gray-100 flex items-center justify-center text-text-main hover:bg-red-50 hover:text-red-600 transition-colors relative group" title="Logout">
                                <FiLogOut className="w-5 h-5 lg:w-6 lg:h-6" />
                            </button>
                            {/* Settings Icon (Desktop Only) */}
                            <button className="hidden lg:flex w-10 h-10 lg:w-12 lg:h-12 rounded-full border border-gray-100 items-center justify-center text-text-main hover:bg-gray-50 transition-colors group">
                                <GearIcon className="w-5 h-5 lg:w-6 lg:h-6" />
                            </button>
                        </div>
                    </div>
                </header>

                {/* Scrollable Content */}
                <main className="flex-1 overflow-y-auto px-4 lg:px-8 pb-8 custom-scrollbar">
                    {children}
                    <div className="py-6 text-center">
                        <p className="text-gray-400 text-xs">© 2025 HOW | Developed by Scolus Infotech</p>
                    </div>
                </main>
            </div>

            {/* Install Help Modal */}
            {showInstallHelp && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowInstallHelp(false)}>
                    <div className="bg-white w-full max-w-sm rounded-[32px] p-8 shadow-2xl animate-in zoom-in-95 relative" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowInstallHelp(false)} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200">
                            <FiX size={20} />
                        </button>

                        <div className="text-center space-y-4">
                            <div className="w-20 h-20 bg-primary/20 rounded-2xl mx-auto flex items-center justify-center shadow-lg transform -rotate-3">
                                <span className="text-4xl font-black text-primary">H</span>
                            </div>

                            <h3 className="text-2xl font-black text-[#8F1E22]">Install App</h3>
                            <p className="text-gray-500 font-medium">To install the app on your device:</p>

                            <div className="bg-gray-50 rounded-2xl p-6 text-left space-y-4 border border-gray-100">
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 rounded-full bg-[#8F1E22] text-white flex items-center justify-center font-bold flex-shrink-0">1</div>
                                    <p className="text-sm font-bold text-gray-700">Tap the browser menu button <span className="inline-block px-2 py-0.5 bg-gray-200 rounded text-xs ml-1">⋮</span> or <span className="inline-block px-2 py-0.5 bg-gray-200 rounded text-xs ml-1">Share</span></p>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 rounded-full bg-[#8F1E22] text-white flex items-center justify-center font-bold flex-shrink-0">2</div>
                                    <p className="text-sm font-bold text-gray-700">Select <span className="text-black">'Add to Home Screen'</span> or <span className="text-black">'Install App'</span></p>
                                </div>
                            </div>

                            <button onClick={() => setShowInstallHelp(false)} className="w-full bg-[#8F1E22] text-white font-bold py-4 rounded-xl shadow-lg hover:scale-[1.02] transition-transform">
                                Got it!
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const NavItem = ({ to, label, icon, disabled }) => (
    <NavLink
        to={disabled ? '#' : to}
        className={({ isActive }) =>
            `flex items-center px-5 py-3.5 text-sm font-medium rounded-2xl transition-all duration-200 group relative ${disabled
                ? 'opacity-50 cursor-not-allowed text-text-subtle'
                : isActive
                    ? 'bg-primary text-black shadow-md shadow-primary/20 font-bold' // Yellow Active State
                    : 'text-text-secondary hover:text-text-main hover:bg-bg'
            }`
        }
    >
        <span className="mr-4 text-xl">{icon}</span>
        {label}
    </NavLink>
);

// --- ICONS (Figma "Same to Same" SVGs) ---

const GridIcon = ({ className }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="3" y="3" width="7" height="7" rx="1"></rect>
        <rect x="14" y="3" width="7" height="7" rx="1"></rect>
        <rect x="14" y="14" width="7" height="7" rx="1"></rect>
        <rect x="3" y="14" width="7" height="7" rx="1"></rect>
    </svg>
);

const CalendarPlusIcon = ({ className }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
        <line x1="12" y1="14" x2="12" y2="18"></line>
        <line x1="10" y1="16" x2="14" y2="16"></line>
    </svg>
);

const DollarIcon = ({ className }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="2" y="5" width="20" height="14" rx="2"></rect>
        <line x1="2" y1="10" x2="22" y2="10"></line>
    </svg>
);

const BookIcon = ({ className }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
    </svg>
);

const ChartIcon = ({ className }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <line x1="18" y1="20" x2="18" y2="10"></line>
        <line x1="12" y1="20" x2="12" y2="4"></line>
        <line x1="6" y1="20" x2="6" y2="14"></line>
    </svg>
);

const CardIcon = ({ className }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
        <line x1="1" y1="10" x2="23" y2="10"></line>
    </svg>
);

const HistoryIcon = ({ className }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="10"></circle>
        <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
);

const ServicesIcon = ({ className }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
        <line x1="12" y1="22.08" x2="12" y2="12"></line>
    </svg>
);

const UserIcon = ({ className }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);
const SettingsIcon = ({ className }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </svg>
);

const SunIcon = ({ className }) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>);
const MoonIcon = ({ className }) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>);

const BellIcon = ({ className }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
    </svg>
);

const GearIcon = ({ className }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
    </svg>
);

export default LayoutShell;
