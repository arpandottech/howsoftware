import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LayoutShell from '../components/ui/LayoutShell';
import Card from '../components/ui/Card';
import api from '../api/axios';
import { format, parseISO, isSameDay } from 'date-fns';

const BookingsByDatePage = () => {
    const { date } = useParams();
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    const bookingDate = new Date(date);

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const res = await api.get('/bookings');
                if (res.data.success) {
                    const allBookings = res.data.data;

                    // Filter by selected date
                    const filtered = allBookings
                        .filter(b => {
                            // Robust check for date match
                            if (!b.startTime) return false;
                            const d = parseISO(b.startTime);
                            return isSameDay(d, bookingDate);
                        })
                        .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

                    setBookings(filtered);
                }
            } catch (err) {
                console.error("Failed to fetch bookings:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchBookings();
    }, [date]);

    // Reusing the Card Style from Dashboard
    const BookingItem = ({ customerName, coupleName, phone, persons, startTime, colorIndex }) => {
        const bgColors = [
            'bg-orange-50 border-orange-100',
            'bg-blue-50 border-blue-100',
            'bg-green-50 border-green-100',
            'bg-purple-50 border-purple-100',
            'bg-amber-50 border-amber-100',
            'bg-rose-50 border-rose-100'
        ];
        const bgClass = bgColors[colorIndex % bgColors.length];
        const timeStr = format(parseISO(startTime), 'h:mm a');

        return (
            <div className={`${bgClass} p-5 rounded-xl shadow-sm border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition-all duration-200`}>

                {/* Left Section: Time & Info */}
                <div className="flex items-start md:items-center gap-4 w-full">

                    {/* Time Badge (Prominent) */}
                    <div className="flex-shrink-0 flex flex-col items-center justify-center bg-white/60 rounded-lg p-2 min-w-[70px] border border-white/50 shadow-sm">
                        <span className="text-sm font-black text-gray-800">{timeStr.split(' ')[0]}</span>
                        <span className="text-[10px] font-bold text-gray-500 uppercase">{timeStr.split(' ')[1]}</span>
                    </div>

                    {/* Details */}
                    <div className="flex-1">
                        <div className="flex flex-col md:flex-row md:items-center md:gap-2">
                            <h4 className="font-bold text-gray-900 text-lg leading-tight">{customerName}</h4>
                            {coupleName && (
                                <span className="hidden md:inline text-gray-400">•</span>
                            )}
                            {coupleName && (
                                <span className="font-medium text-gray-600 text-sm italic">Couple: {coupleName}</span>
                            )}
                        </div>

                        <div className="flex items-center gap-3 mt-1">
                            {/* Mobile */}
                            <div className="flex items-center gap-1.5 bg-white/40 px-2 py-0.5 rounded-full w-fit">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                </svg>
                                <span className="text-xs font-bold text-gray-600 tracking-wide">{phone}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Section: Persons Count */}
                <div className="flex items-center gap-2 self-end md:self-auto bg-white/50 px-3 py-1.5 rounded-lg border border-white/60">
                    <div className="flex -space-x-2">
                        <div className="w-5 h-5 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-[8px]">👤</div>
                        <div className="w-5 h-5 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center text-[8px]">👤</div>
                    </div>
                    <span className="text-sm font-bold text-gray-800">{persons} <span className="text-[10px] font-medium text-gray-500 uppercase">People</span></span>
                </div>
            </div>
        );
    };

    return (
        <LayoutShell title={`Bookings for ${format(bookingDate, 'MMMM do, yyyy')}`}>
            <Card>
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => navigate('/')}
                        className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                        ←
                    </button>
                    <div>
                        <h2 className="text-xl font-bold">Bookings on {format(bookingDate, 'MMMM do')}</h2>
                        <p className="text-sm text-text-secondary">
                            {bookings.length} {bookings.length === 1 ? 'Booking' : 'Bookings'} Found
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-12 text-gray-400">Loading...</div>
                ) : (
                    <div className="space-y-4">
                        {bookings.length > 0 ? (
                            bookings.map((b, i) => (
                                <BookingItem
                                    key={b._id}
                                    {...b}
                                    colorIndex={i}
                                />
                            ))
                        ) : (
                            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                <p className="text-gray-500">No bookings scheduled for this date.</p>
                                <button onClick={() => navigate('/')} className="mt-4 text-sm font-bold text-primary hover:underline">
                                    Go back to Dashboard
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </Card>
        </LayoutShell>
    );
};

export default BookingsByDatePage;
