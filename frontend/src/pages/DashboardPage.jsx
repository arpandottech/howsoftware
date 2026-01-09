
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LayoutShell from '../components/ui/LayoutShell';
import Card from '../components/ui/Card';
import ActionBar from '../components/ui/ActionBar';
import BookingModal from '../components/modals/BookingModal';
import CalendarWidget from '../components/widgets/CalendarWidget';
import { format, isToday, isYesterday, isTomorrow, parseISO, isAfter, startOfToday } from 'date-fns';
import api from '../api/axios';


const DashboardPage = () => {
    const navigate = useNavigate();
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [bookingStats, setBookingStats] = useState({ today: 0, yesterday: 0, tomorrow: 0 });
    const [upcomingBookings, setUpcomingBookings] = useState([]);
    const [allBookings, setAllBookings] = useState([]); // Store ALL bookings for Calendar
    const [fetchError, setFetchError] = useState(null);

    React.useEffect(() => {
        const fetchBookings = async () => {
            setFetchError(null);
            try {
                const res = await api.get('/bookings');
                if (res.data.success) {
                    const bookings = res.data.data;
                    setAllBookings(bookings); // Save full list
                    let todayCount = 0;
                    let inSessionTodayCount = 0;
                    let totalInSessionCount = 0;

                    const todayDate = new Date();
                    todayDate.setHours(0, 0, 0, 0);

                    bookings.forEach(b => {
                        const date = parseISO(b.startTime);
                        const isTodayDate = isToday(date);

                        if (isTodayDate) {
                            todayCount++;
                            if (b.status === 'IN_SESSION') {
                                inSessionTodayCount++;
                            }
                        }

                        if (b.status === 'IN_SESSION') {
                            totalInSessionCount++;
                        }
                    });

                    setBookingStats({
                        today: todayCount,
                        inSessionToday: inSessionTodayCount,
                        totalInSession: totalInSessionCount
                    });

                    // PURE DEBUG: No Filtering. Just show everything sorted by date.
                    console.log("Total bookings fetched:", bookings.length);

                    const upcoming = bookings
                        .filter(b => {
                            const d = new Date(b.startTime);
                            return d >= todayDate;
                        })
                        .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
                        .slice(0, 5);

                    console.log("Showing top 5:", upcoming);
                    setUpcomingBookings(upcoming);
                } else {
                    console.error("API returned success: false");
                }
            } catch (err) {
                console.error("Failed to fetch bookings:", err);
                setFetchError(err.message || "Unknown Fetch Error");
            }
        };
        fetchBookings();
    }, [isBookingModalOpen]);


    return (
        <LayoutShell title="Dashboard">

            <ActionBar onAddNew={() => setIsBookingModalOpen(true)} />
            <BookingModal isOpen={isBookingModalOpen} onClose={() => setIsBookingModalOpen(false)} />

            {/* GRID LAYOUT: 3 Columns Total? 
                Actually, looking at the design:
                Left Main Area (2/3 width)
                Right Sidebar Area (1/3 width)
            */}
            {/* STATS CARDS: Full Width */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div onClick={() => navigate('/bookings?filter=TODAY&status=IN_SESSION')} className="cursor-pointer">
                    <StatsCard
                        title="In Session"
                        count={bookingStats.inSessionToday}
                    />
                </div>
                <div onClick={() => navigate('/bookings?filter=TODAY')} className="cursor-pointer">
                    <StatsCard
                        title="Today's Bookings"
                        count={bookingStats.today}
                        variant="black"
                    />
                </div>
                <div onClick={() => navigate('/bookings?status=IN_SESSION')} className="cursor-pointer">
                    <StatsCard
                        title="Checkout"
                        count={bookingStats.totalInSession}
                    />
                </div>
            </div>

            {/* MAIN CONTENT - FULL WIDTH */}
            <div className="flex flex-col gap-8 w-full">

                {/* CALENDAR SECTION */}
                <div className="w-full">
                    <CalendarWidget bookings={allBookings} />
                </div>


                {/* YEAR WISE REVENUE CHART */}
                <div className="w-full">
                    <RevenueChart bookings={allBookings} />
                </div>

            </div>
        </LayoutShell>
    );
};

// --- SUB COMPONENTS ---

const StatsCard = ({ title, count, variant }) => {
    // variant 'black' = Black background, white text (like the Finance card)
    // variant 'default' (or none) = White background, black text
    const isBlack = variant === 'black';

    return (
        <div className={`p-6 rounded-[24px] shadow-sm flex flex-col justify-between min-h-[160px] transition-all hover:scale-[1.02] border ${isBlack ? 'bg-[#8F1E22] text-white border-[#8F1E22] shadow-xl shadow-[#8F1E22]/20' : 'bg-surface text-text-main border-gray-100 hover:border-gray-200'}`}>
            <div className="flex justify-between items-center">
                <span className={`font-bold ${isBlack ? 'text-white' : 'text-text-main'}`}>Bookings</span>
            </div>

            <div className="mt-auto mb-auto">
                <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 truncate ${isBlack ? 'text-gray-400' : 'text-text-secondary'}`}>{title}</h4>
                <div className="flex items-end gap-3">
                    <span className="text-4xl lg:text-5xl font-bold tracking-tight">{count}</span>
                </div>
            </div>
        </div>
    );
};

const RevenueChart = ({ bookings }) => {
    const currentYear = new Date().getFullYear();
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [hoveredDay, setHoveredDay] = useState(null);

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i); // e.g. 2024-2028

    // Memoize calculations
    const { dailyData, totalRevenue, daysInMonth } = React.useMemo(() => {
        const days = new Date(selectedYear, selectedMonth + 1, 0).getDate();
        const data = new Array(days).fill(0);
        let total = 0;

        if (Array.isArray(bookings)) {
            bookings.forEach(b => {
                if (!b.startTime) return;
                try {
                    const d = parseISO(b.startTime);
                    if (d.getFullYear() === selectedYear && d.getMonth() === selectedMonth) {
                        const day = d.getDate(); // 1-31
                        const amount = Number(b.finance?.rentPaid || b.initialRentPayment || 0);
                        data[day - 1] += amount;
                        total += amount;
                    }
                } catch (e) { }
            });
        }
        return { dailyData: data, totalRevenue: total, daysInMonth: days };
    }, [bookings, selectedMonth, selectedYear]);


    // Chart SVG Logic
    const maxVal = Math.max(...dailyData, 1);
    const points = dailyData.map((val, i) => {
        const x = (i / (daysInMonth - 1)) * 100;
        const normalizedHeight = (val / maxVal) * 15; // Max height 15 units
        const y = 20 - normalizedHeight;
        return `${x},${y}`;
    }).join(' ');

    // Ensure area covers full width even if flat
    const areaPath = `0,20 ${points} 100,20`;

    return (
        <Card className="min-h-[300px]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div className="flex items-center gap-4 flex-wrap">
                    <h3 className="font-bold text-lg text-text-main mr-2">Day Wise Revenue</h3>

                    {/* Month Select */}
                    <select
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(Number(e.target.value))}
                        className="bg-gray-50 border border-gray-200 text-text-main text-sm rounded-lg focus:ring-[#8F1E22] focus:border-[#8F1E22] block px-3 py-2 font-medium outline-none cursor-pointer hover:bg-gray-100 transition-colors bg-no-repeat pr-8"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: `right 0.5rem center`, backgroundSize: `1.5em 1.5em`, appearance: 'none' }}
                    >
                        {months.map((m, i) => (
                            <option key={i} value={i}>{m}</option>
                        ))}
                    </select>

                    {/* Year Select */}
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(Number(e.target.value))}
                        className="bg-gray-50 border border-gray-200 text-text-main text-sm rounded-lg focus:ring-[#8F1E22] focus:border-[#8F1E22] block px-3 py-2 font-medium outline-none cursor-pointer hover:bg-gray-100 transition-colors bg-no-repeat pr-8"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3csvg%3e")`, backgroundPosition: `right 0.5rem center`, backgroundSize: `1.5em 1.5em`, appearance: 'none' }}
                    >
                        {years.map((y) => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>

                </div>

                <div className="flex flex-col items-end">
                    <p className="text-xs text-text-secondary font-bold uppercase tracking-wider mb-1">Total Limit</p>
                    <h2 className="text-2xl font-bold text-black transition-all">
                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(totalRevenue)}
                    </h2>
                </div>
            </div>

            {/* Chart Container */}
            <div className="relative group w-full mt-4 select-none">
                {/* Tooltip Overlay */}
                {hoveredDay !== null && dailyData[hoveredDay] > 0 && (
                    <div
                        className="absolute z-20 top-0 transform -translate-x-1/2 -translate-y-full mb-2 pointer-events-none transition-all duration-75"
                        style={{ left: `${(hoveredDay / (daysInMonth - 1)) * 100}%` }}
                    >
                        <div className="bg-gray-900 text-white text-xs rounded-lg py-1.5 px-3 shadow-lg flex flex-col items-center">
                            <span className="font-bold whitespace-nowrap">{months[selectedMonth]} {hoveredDay + 1}, {selectedYear}</span>
                            <span className="font-mono mt-0.5 text-[#ff8fa3]">
                                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(dailyData[hoveredDay])}
                            </span>
                            {/* Arrow */}
                            <div className="absolute w-2 h-2 bg-gray-900 transform rotate-45 -bottom-1 left-1/2 -translate-x-1/2"></div>
                        </div>
                    </div>
                )}

                <div className="h-48 w-full">
                    <svg viewBox="0 0 100 20" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                        <defs>
                            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#8F1E22" stopOpacity="0.4" />
                                <stop offset="100%" stopColor="#8F1E22" stopOpacity="0" />
                            </linearGradient>
                        </defs>

                        {/* Area Fill */}
                        <polygon points={areaPath} fill="url(#chartGradient)" />

                        {/* Line Stroke */}
                        <polyline
                            points={points}
                            fill="none"
                            stroke="#8F1E22"
                            strokeWidth="0.5"
                            vectorEffect="non-scaling-stroke"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />

                        {/* Interactive Data Points */}
                        {dailyData.map((val, i) => {
                            const x = (i / (daysInMonth - 1)) * 100;
                            const normalizedHeight = (val / maxVal) * 15;
                            const y = 20 - normalizedHeight;
                            const hasRevenue = val > 0;
                            const isHovered = hoveredDay === i;

                            return (
                                <g
                                    key={i}
                                    onMouseEnter={() => setHoveredDay(i)}
                                    onMouseLeave={() => setHoveredDay(null)}
                                    className="cursor-pointer group/dot"
                                >
                                    {/* Invisible large hit area column */}
                                    <rect
                                        x={x - (100 / daysInMonth) / 2}
                                        y="0"
                                        width={100 / daysInMonth}
                                        height="20"
                                        fill="transparent"
                                    />

                                    {/* Visible Dot (Only if revenue > 0 OR hovered) */}
                                    <circle
                                        cx={x}
                                        cy={y}
                                        r={isHovered ? "2" : (hasRevenue ? "1" : "0.5")}
                                        fill={isHovered ? "#8F1E22" : (hasRevenue ? "#8F1E22" : "#e5e7eb")}
                                        stroke={isHovered ? "white" : "none"}
                                        strokeWidth={isHovered ? "0.5" : "0"}
                                        vectorEffect="non-scaling-stroke" // Keep stroke consistent despite scaling
                                        className={`transition-all duration-200 ${isHovered ? 'opacity-100' : 'opacity-80'}`}
                                    />
                                </g>
                            );
                        })}
                    </svg>
                </div>

                {/* X-Axis Labels (Days) */}
                <div className="flex justify-between mt-2 px-1">
                    {[1, 5, 10, 15, 20, 25, 30].filter(d => d <= daysInMonth).map((day) => (
                        <span key={day} className="text-[10px] text-gray-400 font-medium">
                            {day}
                        </span>
                    ))}
                </div>
            </div>
        </Card>
    );
};

// --- SPECIFIC DASHBOARD SVGs ---

const MonthIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EB5757" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
        <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
    </svg>
);

const ArrowButton = () => (
    <button className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-text-secondary hover:bg-gray-50 text-xs transition-colors group">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform">
            <line x1="7" y1="17" x2="17" y2="7"></line>
            <polyline points="7 7 17 7 17 17"></polyline>
        </svg>
    </button>
);

const BookingItem = ({ name, mobile, persons, colorIndex }) => {
    // Card Style: Random Light Background Colors
    const bgColors = [
        'bg-orange-50 border-orange-100',
        'bg-blue-50 border-blue-100',
        'bg-green-50 border-green-100',
        'bg-purple-50 border-purple-100',
        'bg-amber-50 border-amber-100',
        'bg-rose-50 border-rose-100'
    ];
    const bgClass = bgColors[colorIndex % bgColors.length];

    return (
        <div className={`${bgClass} p-4 rounded-xl shadow-sm border flex justify-between items-center hover:shadow-md transition-all duration-200 transform hover:-translate-y-0.5`}>
            <div className="flex items-center gap-4">
                {/* Icon Background matches card but slightly darker or white */}
                <div className={`w-10 h-10 rounded-full bg-white bg-opacity-60 flex items-center justify-center font-bold text-sm text-black shadow-sm`}>
                    {name?.charAt(0).toUpperCase()}
                </div>
                <div>
                    <h4 className="font-bold text-sm text-gray-800">{name}</h4>
                    <p className="text-xs text-gray-500 font-medium tracking-wide">{mobile}</p>
                </div>
            </div>
            <div className="text-right">
                <p className="font-bold text-lg text-black">{persons}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Persons</p>
            </div>
        </div>
    );
};

// --- ERROR BOUNDARY ---
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Dashboard Error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-8 bg-red-50 min-h-screen flex flex-col items-center justify-center text-center">
                    <h2 className="text-2xl font-bold text-red-700 mb-4">Something went wrong on the Dashboard.</h2>
                    <p className="text-red-900 bg-red-100 p-4 rounded-xl border border-red-200 font-mono text-sm max-w-2xl overflow-auto text-left">
                        {this.state.error?.toString()}
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-6 px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700"
                    >
                        Reload Page
                    </button>
                    <details className="mt-4 text-xs text-left max-w-2xl text-gray-500">
                        <summary>Stack Trace</summary>
                        <pre className="mt-2 p-2 bg-gray-100 rounded">{this.state.errorInfo?.componentStack}</pre>
                    </details>
                </div>
            );
        }

        return this.props.children;
    }
}

export default function WrappedDashboardPage() {
    return (
        <ErrorBoundary>
            <DashboardPage />
        </ErrorBoundary>
    );
}

export { MonthIcon };
