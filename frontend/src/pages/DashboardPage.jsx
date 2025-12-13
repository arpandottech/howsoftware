
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

            <div className="flex flex-col xl:flex-row gap-8">

                {/* LEFT COLUMN (MAIN) */}
                <div className="flex-1 flex flex-col gap-8">

                    {/* CALENDAR SECTION */}
                    <div className="w-full">
                        <CalendarWidget bookings={allBookings} />
                    </div>


                    {/* YEAR WISE REVENUE CHART */}
                    <div className="w-full">
                        <RevenueChart bookings={allBookings} />
                    </div>


                </div>


                {/* RIGHT COLUMN (SIDEBAR) */}
                <div className="xl:w-[350px] flex flex-col gap-6">



                    {/* UPCOMING BOOKINGS LIST */}
                    <Card>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg">Upcoming Bookings</h3>
                            <button onClick={() => navigate('/bookings/upcoming')} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-text-secondary hover:bg-gray-50 text-xs transition-colors group">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform">
                                    <line x1="7" y1="17" x2="17" y2="7"></line>
                                    <polyline points="7 7 17 7 17 17"></polyline>
                                </svg>
                            </button>
                        </div>

                        <div className="space-y-4">
                            {upcomingBookings.length > 0 ? (
                                upcomingBookings.map((b, i) => (
                                    <BookingItem
                                        key={b._id || i}
                                        name={b.customerName}
                                        mobile={b.phone || b.mobileNumber}
                                        date={b.startTime}
                                        persons={b.persons}
                                        colorIndex={i}
                                    />
                                ))
                            ) : (
                                <p className="text-xs text-text-secondary text-center py-4">No upcoming bookings</p>
                            )}
                        </div>
                    </Card>



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
    const [selectedMonth, setSelectedMonth] = useState(null);

    // Memoize calculations
    const { monthlyData, totalRevenue, currentYear } = React.useMemo(() => {
        const year = new Date().getFullYear();
        const mData = Array(12).fill(0);
        let total = 0;

        if (Array.isArray(bookings)) {
            bookings.forEach(b => {
                if (!b.startTime) return;
                try {
                    const d = parseISO(b.startTime);
                    if (d.getFullYear() === year) {
                        const month = d.getMonth();
                        // Fix for Data Source: Check finance.rentPaid first (Source of Truth), then fallback to legacy initialRentPayment
                        const amount = Number(b.finance?.rentPaid || b.initialRentPayment || 0);
                        mData[month] += amount;
                        total += amount;
                    }
                } catch (e) { }
            });
        }
        return { monthlyData: mData, totalRevenue: total, currentYear: year };
    }, [bookings]);

    // Derived Display Data
    const displayAmount = selectedMonth !== null ? monthlyData[selectedMonth] : totalRevenue;
    const monthName = selectedMonth !== null ? format(new Date(currentYear, selectedMonth), 'MMMM') : '';
    const displayTitle = selectedMonth !== null ? `${monthName} Revenue` : 'Total Rent Collected';
    const formattedAmount = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(displayAmount);

    // Chart SVG Logic
    const maxVal = Math.max(...monthlyData, 1);
    const points = monthlyData.map((val, i) => {
        const x = (i / 11) * 100;
        const normalizedHeight = (val / maxVal) * 15;
        const y = 20 - normalizedHeight;
        return `${x},${y}`;
    }).join(' ');
    const areaPath = `0,20 ${points} 100,20`;

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonthIndex = new Date().getMonth();

    const handleMonthClick = (index, e) => {
        e && e.stopPropagation();
        setSelectedMonth(index === selectedMonth ? null : index);
    };

    return (
        <Card className="min-h-[300px]">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg">Year Wise Revenue</h3>
                <div className="flex gap-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); setSelectedMonth(null); }}
                        title="Reset to Full Year"
                        className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-200 ${selectedMonth === null ? 'bg-[#8F1E22] text-white border-[#8F1E22] shadow-md' : 'border-gray-200 hover:bg-gray-50'}`}
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                    </button>
                    {/* Reuse ArrowButton but make it functional if needed, currently static */}
                    <div className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-text-secondary">
                        ↗
                    </div>
                </div>
            </div>

            {/* Swipable Chart Container */}
            <div className="relative group">
                <div className="overflow-x-auto hide-scrollbar pb-2">
                    <div className="min-w-[600px] sm:min-w-0">
                        {/* Clickable Chart Area */}
                        <div
                            className="h-40 w-full flex items-end justify-between gap-1 relative group cursor-pointer"
                            onClick={() => setSelectedMonth(null)}
                            title="Click anywhere to reset to yearly view"
                        >
                            {/* Floating Tooltip */}
                            <div className={`absolute top-0 right-0 px-3 py-1 rounded-full text-xs font-bold shadow-lg transition-all duration-300 ${selectedMonth !== null ? 'bg-primary text-black' : 'bg-[#8F1E22] text-white'}`}>
                                {selectedMonth !== null ? monthName : 'Yearly Total'}: {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(displayAmount)}
                            </div>

                            <svg viewBox="0 0 100 20" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                                <defs>
                                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#800020" stopOpacity="0.5" />
                                        <stop offset="100%" stopColor="#800020" stopOpacity="0" />
                                    </linearGradient>
                                </defs>
                                <polygon points={areaPath} fill="url(#chartGradient)" />
                                <polyline points={points} fill="none" stroke="#800020" strokeWidth="1" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />

                                {/* Render Dots with larger hit area */}
                                {monthlyData.map((val, i) => {
                                    const x = (i / 11) * 100;
                                    const normalizedHeight = (val / maxVal) * 15;
                                    const y = 20 - normalizedHeight;
                                    const isSelected = selectedMonth === i;

                                    return (
                                        <g key={i} onClick={(e) => handleMonthClick(i, e)} className="cursor-pointer group/dot">
                                            {/* Invisible Hit Area */}
                                            <circle cx={x} cy={y} r="6" fill="transparent" />
                                            {/* Visible Dot */}
                                            <circle
                                                cx={x}
                                                cy={y}
                                                r={isSelected ? "3" : "1.5"}
                                                fill={isSelected ? "#800020" : "black"}
                                                className={`transition-all duration-300 ${isSelected ? 'stroke-white stroke-2' : 'group-hover/dot:r-2'}`}
                                            />
                                        </g>
                                    );
                                })}
                            </svg>
                        </div>

                        {/* Month Buttons */}
                        <div className="flex justify-between mt-4">
                            {months.map((m, i) => {
                                const isCurrent = i === currentMonthIndex;
                                const isSelected = selectedMonth === i;
                                return (
                                    <button
                                        key={m}
                                        onClick={(e) => handleMonthClick(i, e)}
                                        className={`
                                            text-[10px] sm:text-xs px-1.5 py-1 rounded-md transition-all duration-200
                                            ${isSelected
                                                ? 'bg-[#8F1E22] text-white font-bold transform scale-110 shadow-sm'
                                                : isCurrent
                                                    ? 'bg-[#8F1E22] text-white font-bold'
                                                    : 'text-text-secondary hover:bg-gray-100 font-medium'
                                            }
                                        `}
                                    >
                                        {m}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
                {/* Mobile Scroll Hint Gradient (Right Side) */}
                <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l from-white/90 to-transparent pointer-events-none sm:hidden rounded-r-xl z-10" />
            </div>

            {/* Metric Display */}
            <div className="mt-6 flex justify-between items-end">
                <div>
                    <p className="text-sm text-text-secondary mb-1 transition-all font-medium">
                        {displayTitle}
                    </p>
                    <div className="flex items-baseline gap-2">
                        <h2 className="text-3xl font-bold text-black transition-all">
                            {formattedAmount}
                        </h2>
                    </div>
                </div>
                <div className="text-right">
                    <p className={`text-xs font-bold px-2 py-1 rounded-lg inline-flex items-center gap-1 ${selectedMonth !== null ? 'bg-yellow-50 text-yellow-700' : 'bg-green-50 text-green-600'}`}>
                        {selectedMonth !== null ? 'Month View' : 'Live Data'}
                    </p>
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

export default DashboardPage;
export { MonthIcon };
