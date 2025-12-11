import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

const TodayBookingsPage = () => {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [showModal, setShowModal] = useState(false);

    // Modal Form State
    const [endSessionForm, setEndSessionForm] = useState({
        extraRentPayment: 0,
        depositReturnAmount: 0,
        paymentMethod: 'CASH'
    });

    const fetchBookings = async () => {
        setLoading(true);
        try {
            const res = await api.get('/bookings/today');
            if (res.data.success) {
                setBookings(res.data.data);
            }
        } catch (err) {
            console.error("Failed to fetch bookings", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBookings();
    }, []);

    const handleEndSessionClick = (booking) => {
        setSelectedBooking(booking);
        // Pre-fill deposit return with what was collected, if any? 
        // Logic says "If depositReturnAmount > 0". 
        // Let's default to 0 and let user type.
        // Maybe default extraRentPayment to rentDue if positive?

        let initialRent = 0;
        if (booking.finance.rentDue > 0) {
            initialRent = booking.finance.rentDue;
        }

        setEndSessionForm({
            extraRentPayment: initialRent,
            depositReturnAmount: 0, // Default to 0, user decides how much to return
            paymentMethod: 'CASH'
        });
        setShowModal(true);
    };

    const handleModalSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post(`/bookings/${selectedBooking._id}/end-session`, {
                extraRentPayment: Number(endSessionForm.extraRentPayment),
                depositReturnAmount: Number(endSessionForm.depositReturnAmount),
                paymentMethod: endSessionForm.paymentMethod
            });

            if (res.data.success) {
                alert('Session Ended Successfully!');
                setShowModal(false);
                setSelectedBooking(null);
                fetchBookings(); // Refresh list
            }
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.error || 'Failed to end session');
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Today's Bookings</h2>
                    <div className="space-x-4">
                        <button
                            onClick={() => navigate('/bookings/new')}
                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                        >
                            + New Booking
                        </button>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="text-gray-600 hover:text-gray-900"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded shadow overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-100 border-b">
                                <th className="p-4 font-semibold text-gray-600">Time</th>
                                <th className="p-4 font-semibold text-gray-600">Code</th>
                                <th className="p-4 font-semibold text-gray-600">Customer</th>
                                <th className="p-4 font-semibold text-gray-600">Pax</th>
                                <th className="p-4 font-semibold text-gray-600">Status</th>
                                <th className="p-4 font-semibold text-gray-600">Rent Due</th>
                                <th className="p-4 font-semibold text-gray-600">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bookings.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="p-8 text-center text-gray-500">No bookings for today.</td>
                                </tr>
                            ) : (
                                bookings.map(b => (
                                    <tr key={b._id} className="border-b hover:bg-gray-50">
                                        <td className="p-4">
                                            {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            <br />
                                            <span className="text-xs text-gray-400">
                                                to {new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </td>
                                        <td className="p-4 font-mono text-sm">{b.bookingCode}</td>
                                        <td className="p-4">
                                            <div className="font-medium">{b.customerName}</div>
                                            <div className="text-xs text-gray-500">{b.phone}</div>
                                        </td>
                                        <td className="p-4">{b.persons}</td>
                                        <td className="p-4">
                                            <StatusBadge status={b.status} />
                                        </td>
                                        <td className="p-4 text-red-600 font-medium">
                                            {b.finance.rentDue > 0 ? `₹${b.finance.rentDue}` : '-'}
                                        </td>
                                        <td className="p-4">
                                            {b.status === 'IN_SESSION' && (
                                                <button
                                                    onClick={() => handleEndSessionClick(b)}
                                                    className="bg-orange-500 text-white px-3 py-1 rounded text-sm hover:bg-orange-600"
                                                >
                                                    End Session
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && selectedBooking && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
                        <h3 className="text-xl font-bold mb-4">End Session - {selectedBooking.customerName}</h3>
                        <form onSubmit={handleModalSubmit} className="space-y-4">
                            <div>
                                <label className="block text-gray-700 text-sm font-medium mb-1">Extra Rent / Balance Payment (₹)</label>
                                <input
                                    type="number"
                                    className="w-full p-2 border rounded"
                                    value={endSessionForm.extraRentPayment}
                                    onChange={e => setEndSessionForm({ ...endSessionForm, extraRentPayment: e.target.value })}
                                />
                                <p className="text-xs text-gray-500 mt-1">Current Due: ₹{selectedBooking.finance.rentDue}</p>
                            </div>

                            <div>
                                <label className="block text-gray-700 text-sm font-medium mb-1">Deposit Return Amount (₹)</label>
                                <input
                                    type="number"
                                    className="w-full p-2 border rounded"
                                    value={endSessionForm.depositReturnAmount}
                                    onChange={e => setEndSessionForm({ ...endSessionForm, depositReturnAmount: e.target.value })}
                                />
                                <p className="text-xs text-gray-500 mt-1">Collected Deposit: ₹{selectedBooking.finance.depositCollected}</p>
                            </div>

                            <div>
                                <label className="block text-gray-700 text-sm font-medium mb-1">Payment Method</label>
                                <select
                                    className="w-full p-2 border rounded"
                                    value={endSessionForm.paymentMethod}
                                    onChange={e => setEndSessionForm({ ...endSessionForm, paymentMethod: e.target.value })}
                                >
                                    <option value="CASH">Cash</option>
                                    <option value="UPI">UPI</option>
                                    <option value="CARD">Card</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                >
                                    Confirm End Session
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const StatusBadge = ({ status }) => {
    let color = 'bg-gray-100 text-gray-800';
    if (status === 'IN_SESSION') color = 'bg-orange-100 text-orange-800';
    if (status === 'COMPLETED') color = 'bg-green-100 text-green-800';
    if (status === 'CANCELLED') color = 'bg-red-100 text-red-800';
    if (status === 'CONFIRMED') color = 'bg-blue-100 text-blue-800';

    return (
        <span className={`px-2 py-1 rounded text-xs font-semibold ${color}`}>
            {status}
        </span>
    );
};

export default TodayBookingsPage;
