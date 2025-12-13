import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import LayoutShell from '../components/ui/LayoutShell';
import Card from '../components/ui/Card';
import api from '../api/axios';
import { format, isSameDay, addDays, isSameWeek, parseISO, startOfToday } from 'date-fns';
import CheckInModal from '../components/modals/CheckInModal';
import BookingDetailsModal from '../components/modals/BookingDetailsModal';

const BookingsPage = () => {
    const [allBookings, setAllBookings] = useState([]);
    const [filteredBookings, setFilteredBookings] = useState([]);
    const [filterType, setFilterType] = useState('ALL'); // 'TODAY', 'TOMORROW', 'THIS_WEEK', 'ALL'
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);
    const [checkInBooking, setCheckInBooking] = useState(null); // For checkin modal
    const [detailsBooking, setDetailsBooking] = useState(null); // For details/checkout modal

    const fetchBookings = async () => {
        try {
            const res = await api.get('/bookings');
            if (res.data.success) {
                // Sort by Date descending (newest first) by default, or ascending for upcoming?
                // User probably wants to see relevant filtered items. Let's do Ascending by default for better calendar feel.
                const sorted = res.data.data.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
                setAllBookings(sorted);
                setFilteredBookings(sorted);
            }
        } catch (err) {
            console.error("Failed to fetch bookings:", err);
        }
    };

    const [searchParams] = useSearchParams();

    useEffect(() => {
        fetchBookings();
    }, []);

    // Sync state with URL params on mount/update
    useEffect(() => {
        const filterParam = searchParams.get('filter');
        const statusParam = searchParams.get('status');

        if (filterParam) {
            setFilterType(filterParam);
        }
        // If status param exists (e.g. IN_SESSION), we might want to store it in a state or apply it directly
        // We'll handle it in the filtering effect below
    }, [searchParams]);

    // Apply Filter when filterType, searchParams, or allBookings changes
    useEffect(() => {
        const today = startOfToday();
        let result = allBookings;

        // 1. Date Filter
        switch (filterType) {
            case 'TODAY':
                result = allBookings.filter(b => isSameDay(parseISO(b.startTime), today));
                break;
            case 'TOMORROW':
                result = allBookings.filter(b => isSameDay(parseISO(b.startTime), addDays(today, 1)));
                break;
            case 'THIS_WEEK':
                result = allBookings.filter(b => isSameWeek(parseISO(b.startTime), today, { weekStartsOn: 1 }));
                break;
            case 'ALL':
            default:
                result = allBookings;
                break;
        }

        // 2. Status Filter (from URL mainly, for "Checkout" / "In Session" boxes)
        const statusParam = searchParams.get('status');
        if (statusParam) {
            result = result.filter(b => b.status === statusParam);
        }

        setFilteredBookings(result);
        setCurrentPage(1); // Reset to first page on filter change
    }, [filterType, allBookings, searchParams]);

    // Pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredBookings.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);

    const handlePageChange = (page) => setCurrentPage(page);

    return (
        <LayoutShell title="All Bookings">
            <Card className="min-h-[80vh]">
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <div>
                        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                            Bookings List
                        </h2>
                        <p className="text-sm text-text-secondary mt-1">
                            Showing {currentItems.length} of {filteredBookings.length} {filterType.toLowerCase().replace('_', ' ')} entries
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 items-center w-full sm:w-auto">
                        {/* Items Per Page Selector */}
                        <div className="flex items-center gap-2 self-start sm:self-center">
                            <span className="text-sm text-text-secondary font-medium">Show</span>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => {
                                    setItemsPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                                className="bg-gray-100 border-none rounded-lg px-3 py-2 text-sm font-bold text-gray-700 cursor-pointer focus:ring-2 focus:ring-black/5 outline-none"
                            >
                                <option value={20}>20</option>
                                <option value={30}>30</option>
                                <option value={40}>40</option>
                                <option value={50}>50</option>
                            </select>
                        </div>

                        {/* Filter Buttons - Swipable with Highlight */}
                        <div className="relative w-full sm:w-auto group">
                            <div className="flex bg-gray-100 p-1 rounded-xl overflow-x-auto hide-scrollbar sm:overflow-visible w-full sm:w-auto snap-x relative z-0">
                                {[
                                    { label: 'All', value: 'ALL' },
                                    { label: 'Today', value: 'TODAY' },
                                    { label: 'Tomorrow', value: 'TOMORROW' },
                                    { label: 'This Week', value: 'THIS_WEEK' },
                                ].map((btn) => (
                                    <button
                                        key={btn.value}
                                        onClick={() => setFilterType(btn.value)}
                                        className={`px-4 py-2 text-sm font-bold rounded-lg transition-all duration-200 whitespace-nowrap flex-shrink-0 snap-center ${filterType === btn.value
                                            ? 'bg-white text-black shadow-sm scale-100 ring-1 ring-black/5'
                                            : 'text-text-secondary hover:text-text-main hover:bg-gray-200/50'
                                            }`}
                                    >
                                        {btn.label}
                                    </button>
                                ))}
                            </div>
                            {/* Mobile Scroll Hint Gradient (Right Side) */}
                            <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l from-white/80 to-transparent pointer-events-none sm:hidden rounded-r-xl z-10" />
                        </div>
                    </div>
                </div>

                {/* Bookings Table with Mobile Scroll Hint */}
                <div className="relative group">
                    <div className="overflow-x-auto rounded-xl border border-gray-100 hide-scrollbar pb-2">
                        <table className="w-full min-w-[1000px] text-left border-collapse">
                            <thead className="bg-gray-50/50">
                                <tr className="border-b border-gray-100 text-xs text-text-secondary uppercase tracking-wider">
                                    <th className="p-4 font-bold">Customer</th>
                                    <th className="p-4 font-bold">Date & Time</th>
                                    <th className="p-4 font-bold">Type</th>
                                    <th className="p-4 font-bold">Persons</th>
                                    <th className="p-4 font-bold">Total</th>
                                    <th className="p-4 font-bold">Status</th>
                                    <th className="p-4 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {currentItems.length > 0 ? (
                                    currentItems.map((booking) => (
                                        <tr
                                            key={booking._id}
                                            onClick={() => setDetailsBooking(booking)}
                                            className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group cursor-pointer"
                                        >
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center font-bold text-sm text-gray-700 shadow-inner">
                                                        {booking.customerName?.charAt(0).toUpperCase() || '?'}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-text-main group-hover:text-primary transition-colors">{booking.customerName}</p>
                                                        <p className="text-xs text-text-secondary">{booking.phone || booking.mobileNumber}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <p className="font-medium">{format(parseISO(booking.startTime), 'dd MMM yyyy')}</p>
                                                <p className="text-xs text-text-secondary">{format(parseISO(booking.startTime), 'hh:mm a')}</p>
                                            </td>
                                            <td className="p-4">
                                                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100">
                                                    {booking.bookingType || 'Standard'}
                                                </span>
                                            </td>
                                            <td className="p-4 font-medium text-gray-600">{booking.persons}</td>
                                            <td className="p-4 font-bold">
                                                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(booking.totalAmount || booking.initialRentPayment || 0)}
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-700 border-green-200' :
                                                    booking.status === 'IN_SESSION' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                                        booking.status === 'COMPLETED' ? 'bg-gray-100 text-gray-700 border-gray-200' :
                                                            'bg-red-50 text-red-600 border-red-100'
                                                    }`}>
                                                    {booking.status}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                {booking.bookingType === 'ADVANCE' && booking.status === 'CONFIRMED' && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setCheckInBooking(booking);
                                                        }}
                                                        className="px-3 py-1.5 bg-[#8F1E22] text-white text-xs font-bold rounded-lg hover:bg-gray-800 transition-all shadow-sm"
                                                    >
                                                        Check In
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="p-12 text-center">
                                            <div className="flex flex-col items-center gap-2">
                                                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-400">
                                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                                                </div>
                                                <h3 className="text-gray-900 font-bold">No bookings found</h3>
                                                <p className="text-gray-500 text-sm">Try selecting a different filter.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Mobile Scroll Hint Gradient (Right Side) */}
                    <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l from-white/90 to-transparent pointer-events-none lg:hidden rounded-r-xl z-10" />
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex justify-center mt-8 gap-2">
                        <button
                            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Previous
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => (
                            <button
                                key={i + 1}
                                onClick={() => handlePageChange(i + 1)}
                                className={`w-9 h-9 text-sm font-bold rounded-lg transition-all ${currentPage === i + 1
                                    ? 'bg-[#8F1E22] text-white shadow-md'
                                    : 'hover:bg-gray-100 text-gray-600'
                                    }`}
                            >
                                {i + 1}
                            </button>
                        ))}
                        <button
                            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Next
                        </button>
                    </div>
                )}
            </Card>

            <CheckInModal
                booking={checkInBooking}
                isOpen={!!checkInBooking}
                onClose={() => setCheckInBooking(null)}
                onSuccess={() => {
                    fetchBookings();
                }}
            />

            <BookingDetailsModal
                booking={detailsBooking}
                isOpen={!!detailsBooking}
                onClose={() => setDetailsBooking(null)}
                onSuccess={() => {
                    fetchBookings();
                }}
            />
        </LayoutShell>
    );
};

export default BookingsPage;
