import React, { useState, useEffect } from 'react';
import LayoutShell from '../components/ui/LayoutShell';
import Card from '../components/ui/Card';
import api from '../api/axios';
import { format, isAfter, parseISO, startOfToday } from 'date-fns';

const UpcomingBookingsPage = () => {
    const [bookings, setBookings] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const res = await api.get('/bookings');
                if (res.data.success) {
                    const allBookings = res.data.data;
                    const today = startOfToday();

                    // Filter: Upcoming (startDate >= today)
                    // Sort: Date ascending (closest first)
                    const upcoming = allBookings
                        .filter(b => {
                            const date = parseISO(b.startTime);
                            // Include today and future
                            return isAfter(date, today) || date.getTime() === today.getTime();
                        })
                        .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

                    setBookings(upcoming);
                }
            } catch (err) {
                console.error("Failed to fetch upcoming bookings:", err);
            }
        };

        fetchBookings();
    }, []);

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = bookings.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(bookings.length / itemsPerPage);

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
        window.scrollTo(0, 0);
    };

    return (
        <LayoutShell title="Upcoming Bookings">
            <Card className="min-h-[80vh]">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-bold">Upcoming Bookings</h2>
                        <p className="text-sm text-text-secondary">Showing {currentItems.length} of {bookings.length} entries</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-gray-100 text-xs text-text-secondary uppercase tracking-wider">
                                <th className="p-4 font-bold">Customer</th>
                                <th className="p-4 font-bold">Date & Time</th>
                                <th className="p-4 font-bold">Service</th>
                                <th className="p-4 font-bold">Persons</th>
                                <th className="p-4 font-bold">Total</th>
                                <th className="p-4 font-bold">Status</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {currentItems.length > 0 ? (
                                currentItems.map((booking) => (
                                    <tr key={booking._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-xs text-black`}>
                                                    {booking.customerName?.charAt(0).toUpperCase() || '?'}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-text-main">{booking.customerName}</p>
                                                    <p className="text-xs text-text-secondary">{booking.phone || booking.mobileNumber}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <p className="font-medium">{format(parseISO(booking.startTime), 'dd MMM yyyy')}</p>
                                            <p className="text-xs text-text-secondary">{booking.startTime}</p>
                                        </td>
                                        <td className="p-4 font-medium">{booking.serviceType || 'Standard'}</td>
                                        <td className="p-4">{booking.persons}</td>
                                        <td className="p-4 font-bold">${booking.totalAmount || 0}</td>
                                        <td className="p-4">
                                            <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-600">
                                                Confirmed
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-text-secondary">
                                        No upcoming bookings found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex justify-center mt-8 gap-2">
                        <button
                            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => (
                            <button
                                key={i + 1}
                                onClick={() => handlePageChange(i + 1)}
                                className={`w-10 h-10 text-sm font-bold rounded-lg transition-colors ${currentPage === i + 1
                                    ? 'bg-[#8F1E22] text-white'
                                    : 'hover:bg-gray-50 border border-transparent'
                                    }`}
                            >
                                {i + 1}
                            </button>
                        ))}
                        <button
                            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                )}
            </Card>
        </LayoutShell>
    );
};

export default UpcomingBookingsPage;
