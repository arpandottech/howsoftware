import React from 'react';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    parseISO
} from 'date-fns';
import { useNavigate } from 'react-router-dom';
import Card from '../ui/Card';

const CalendarWidget = ({ bookings = [] }) => {
    const navigate = useNavigate();
    const [currentMonth, setCurrentMonth] = React.useState(new Date());

    const stats = React.useMemo(() => {
        // Map date string (YYYY-MM-DD) to count
        const counts = {};
        if (!Array.isArray(bookings)) return counts;

        bookings.forEach(b => {
            // Assuming b.startTime is ISO string
            if (!b.startTime) return;
            try {
                const dateStr = format(parseISO(b.startTime), 'yyyy-MM-dd');
                counts[dateStr] = (counts[dateStr] || 0) + 1;
            } catch (e) {
                console.error("Invalid date in booking", b);
            }
        });
        return counts;
    }, [bookings]);

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

    const renderHeader = () => {
        return (
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg text-black">
                    {format(currentMonth, 'MMMM yyyy')}
                </h3>
                <div className="flex gap-2">
                    <button onClick={prevMonth} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
                        &lt;
                    </button>
                    <button onClick={nextMonth} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
                        &gt;
                    </button>
                </div>
            </div>
        );
    };

    const renderDays = () => {
        const days = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
        return (
            <div className="grid grid-cols-7 mb-2">
                {days.map(day => (
                    <div key={day} className="text-center text-xs font-bold text-text-secondary uppercase tracking-wider py-2">
                        {day}
                    </div>
                ))}
            </div>
        );
    };

    const renderCells = () => {
        const monthStart = startOfMonth(currentMonth);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart);
        const endDate = endOfWeek(monthEnd);

        const dateFormat = "d";
        const rows = [];
        let days = [];
        let day = startDate;
        let formattedDate = "";

        const dateRange = eachDayOfInterval({ start: startDate, end: endDate });

        return (
            <div className="grid grid-cols-7 gap-1">
                {dateRange.map((dayItem, i) => {
                    const dateStr = format(dayItem, 'yyyy-MM-dd');
                    const count = stats[dateStr] || 0;
                    const isCurrentMonth = isSameMonth(dayItem, monthStart);
                    const isTodayDate = isSameDay(dayItem, new Date());

                    return (
                        <div
                            key={dayItem.toString()}
                            className={`
                                relative p-2 h-14 md:h-16 rounded-xl flex flex-col items-center justify-start cursor-pointer transition-all duration-200 border
                                ${!isCurrentMonth ? 'text-gray-300 bg-gray-50 border-transparent hover:bg-gray-100' : 'bg-white border-gray-100/50 hover:border-primary hover:shadow-md'}
                                ${isTodayDate ? 'border-primary bg-yellow-50/30' : ''}
                            `}
                            onClick={() => navigate(`/bookings/date/${dateStr}`)}
                        >
                            <span className={`text-sm font-medium ${!isCurrentMonth ? 'text-gray-300' : 'text-gray-700'}`}>
                                {format(dayItem, dateFormat)}
                            </span>

                            {/* Booking Badge */}
                            {count > 0 && (
                                <div className={`
                                    mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold 
                                    ${isTodayDate ? 'bg-primary text-black' : 'bg-[#8F1E22] text-white'}
                                `}>
                                    {count}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <Card className="h-full">
            {renderHeader()}
            {renderDays()}
            {renderCells()}
        </Card>
    );
};

export default CalendarWidget;
