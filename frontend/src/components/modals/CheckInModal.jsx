import React, { useState } from 'react';
import api from '../../api/axios';

const CheckInModal = ({ booking, isOpen, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('CASH');
    const [error, setError] = useState('');

    if (!isOpen || !booking) return null;

    // Calculations
    // Total Rent Due (before check-in payment) should be the netAmount - token (which is already paid as rentPaid)
    // Actually, backend sets rentPaid = advanceToken for Advance bookings.
    // So rentDue = netAmount - rentPaid.
    // This is the balance the customer needs to pay NOW upon arrival.
    const pendingRent = booking.finance.rentDue;

    // Total to collect = Pending Rent
    const totalToCollect = Number(pendingRent);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const payload = {
                collectedRent: pendingRent, // We collect all pending rent
                paymentMethod
            };

            const res = await api.post(`/bookings/${booking._id}/check-in`, payload);

            if (res.data.success) {
                onSuccess();
                onClose();
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || 'Failed to check in');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Guest Check-In</h3>
                        <p className="text-sm text-gray-500">Booking: {booking.bookingCode}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium">{error}</div>}

                    {/* Financial Summary */}
                    <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 space-y-3">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Total Booking Amount</span>
                            <span className="font-bold text-gray-900">{formatCurrency(booking.finance.netAmount)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Advance Paid (Token)</span>
                            <span className="font-bold text-green-600">-{formatCurrency(booking.finance.rentPaid)}</span>
                        </div>
                        <div className="border-t border-blue-200/50 pt-2 flex justify-between items-center">
                            <span className="font-bold text-blue-900">Balance Rent Due</span>
                            <span className="font-bold text-blue-900 text-lg">{formatCurrency(pendingRent)}</span>
                        </div>
                    </div>

                    <div className="space-y-4">

                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                                Payment Method <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={paymentMethod}
                                onChange={(e) => setPaymentMethod(e.target.value)}
                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-black transition-colors"
                            >
                                <option value="CASH">Cash</option>
                                <option value="UPI">UPI</option>
                                <option value="CARD">Card</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <span className="text-gray-500 font-medium">Total To Collect Now</span>
                            <span className="text-2xl font-black text-gray-900">{formatCurrency(totalToCollect)}</span>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-[#8F1E22] text-white rounded-xl font-bold hover:bg-gray-800 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:hover:scale-100 flex justify-center gap-2"
                        >
                            {loading ? 'Processing...' : 'Confirm Check-In & Collect Payment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

export default CheckInModal;
