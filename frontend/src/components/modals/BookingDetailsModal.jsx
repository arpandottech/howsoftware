import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { format, parseISO, addMinutes, differenceInMinutes } from 'date-fns';
import SwipeButton from '../ui/SwipeButton';

const BookingDetailsModal = ({ booking, isOpen, onClose, onSuccess }) => {
    const [viewMode, setViewMode] = useState('DETAILS'); // 'DETAILS' or 'CHECKOUT'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const getLocalISOString = () => {
        const now = new Date();
        const offset = now.getTimezoneOffset() * 60000; // offset in milliseconds
        const localISOTime = (new Date(now - offset)).toISOString().slice(0, 16);
        return localISOTime;
    };

    // Checkout State
    const [payAmount, setPayAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('CASH');
    const [exitTime, setExitTime] = useState(getLocalISOString());
    const [overtimeStats, setOvertimeStats] = useState({ minutes: 0, hours: 0, amount: 0 });
    const [manualOvertimeAmount, setManualOvertimeAmount] = useState(0); // New State
    const [discountAmount, setDiscountAmount] = useState(0);
    const [discountReference, setDiscountReference] = useState('');

    // Edit Mode State
    const [editFormData, setEditFormData] = useState({});
    const [editLoading, setEditLoading] = useState(false);

    // Derived State for Financials (Hoisted for safety and scope)
    const finance = booking?.finance || {};
    const pricing = booking?.pricingSnapshot || {};
    const totalCurrentGross = (finance.grossAmount || 0) + Number(manualOvertimeAmount || 0);
    const totalCurrentLiability = totalCurrentGross - Number(discountAmount || 0);
    const totalCurrentPaid = (finance.rentPaid || 0) + (finance.depositCollected || 0);
    const currentNetPayable = totalCurrentLiability - totalCurrentPaid;

    useEffect(() => {
        if (isOpen && booking) {
            setViewMode('DETAILS');
            setPayAmount('');
            setExitTime(getLocalISOString());
            setDiscountAmount(booking?.finance?.discountAmount || 0);
            setDiscountReference(booking?.finance?.discountReference || '');
            setManualOvertimeAmount(0); // Reset manual overtime
            setError('');
        }
    }, [isOpen, booking]);

    useEffect(() => {
        if (viewMode === 'CHECKOUT' && booking) {
            setExitTime(getLocalISOString()); // Update to current time when entering checkout
            setManualOvertimeAmount(0);
        }
    }, [viewMode, booking]);

    useEffect(() => {
        if (viewMode === 'CHECKOUT' && booking) {
            calculateOvertime();
        }
    }, [viewMode, exitTime, booking]);

    useEffect(() => {
        if (viewMode === 'EDIT' && booking) {
            setEditFormData({
                customerName: booking.customerName,
                coupleName: booking.coupleName,
                photographyName: booking.photographyName,
                phone: booking.phone,
                persons: booking.persons,
                sessionType: booking.sessionType,
                customHours: booking.customHours || 0,
                // Format date for input type="date"
                startDate: new Date(booking.startTime).toISOString().slice(0, 10),
                // Format time for input type="time" (HH:mm)
                startTime: new Date(booking.startTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
                notes: booking.notes || ''
            });
        }
    }, [viewMode, exitTime, booking]);

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleUpdateBooking = async (e) => {
        e.preventDefault();
        setEditLoading(true);
        try {
            // Need to combine date and time for startTime
            const combinedStart = new Date(`${editFormData.startDate}T${editFormData.startTime}:00`);

            const payload = {
                ...editFormData,
                startTime: combinedStart.toISOString(),
                persons: Number(editFormData.persons),
                customHours: Number(editFormData.customHours)
            };

            const res = await api.put(`/bookings/${booking._id}`, payload);
            if (res.data.success) {
                if (onSuccess) onSuccess(); // Refresh data
                // We should ideally update local booking prop or wait for parent to refresh.
                // Assuming onSuccess triggers parent refresh which updates prop.
                setViewMode('DETAILS');
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || 'Failed to update booking');
        } finally {
            setEditLoading(false);
        }
    };

    if (!isOpen || !booking) return null;

    const calculateOvertime = () => {
        if (!exitTime) return;

        const end = new Date(booking.endTime);
        const actualExit = new Date(exitTime);
        const bufferMinutes = 10;
        const cutoff = addMinutes(end, bufferMinutes);

        if (actualExit > cutoff) {
            const diffMs = actualExit - cutoff;
            const diffMinutes = Math.ceil(diffMs / 60000);
            const extraHours = Math.ceil(diffMinutes / 60);

            const rate = pricing.ratePerPersonPerHour || 0;
            const extraCharge = rate * booking.persons * extraHours;

            setOvertimeStats({ minutes: diffMinutes, hours: extraHours, amount: extraCharge });
        } else {
            setOvertimeStats({ minutes: 0, hours: 0, amount: 0 });
        }
    };

    const handleCheckout = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Use Pre-calculated Safe Variables for Consistency
        // Re-deriving here to ensure latest state values are used in closure if needed, 
        // but since this is a functional component, variables from top scope are fresh on each render.
        // However, async functions close over the render scope.

        // Let's use the hoisted variables directly? 
        // Yes, 'currentNetPayable' is calculated in the render scope.
        // 'handleCheckout' is recreated on every render because it's not wrapped in useCallback (it is not).
        // So it captures the fresh 'currentNetPayable'.

        const netPayable = currentNetPayable;

        // if netPayable > 0: Customer pays this amount.
        // if netPayable < 0: We refund abs(netPayable).

        // Enforcement:
        // If Paying: payAmount must be >= netPayable
        // If Refunding: Just informative, no payment needed.

        if (netPayable > 0) {
            if (Number(payAmount) < netPayable) {
                setError(`Full payment of balance ₹${netPayable} is required.`);
                setLoading(false);
                return;
            }
        }

        try {
            let extraRentPayment = 0;
            let depositReturnAmount = 0;

            if (netPayable > 0) {
                extraRentPayment = netPayable;
            } else {
                // Refund scenario.
                // We need to record that we "used" the deposit/rent toward the liability?
                // Actually, if we refund, it means they paid too much.
                // We return 'netPayable'.
                // Backend handles 'extraRentPayment' as ADDING to rent.
                // If we have negative netPayable, we don't send negative rent payment.
                // We send depositReturnAmount or just record refund.

                // However, the backend logic for 'endSession' is:
                // 4. Rent Payment at Exit: adds extraRentPayment to rentPaid.
                // 5. Deposit Return: adds depositReturnAmount to depositReturned.

                // If we have a refund, we probably want to return deposit first.
                depositReturnAmount = Math.abs(netPayable);

                // What if refund is MORE than deposit? (e.g. huge discount)
                // Then we are refunding Rent Paid too?
                // Backend only supports 'depositReturnAmount' which logs type 'DEPOSIT_OUT'.
                // We might need to support 'RENT_REFUND' if deposit isn't enough?
                // For now, assuming refund comes out of deposit or is just recorded as returned.
                // Let's just pass depositReturnAmount as the full refund value.
            }

            const payload = {
                exitTime: exitTime ? new Date(exitTime).toISOString() : new Date().toISOString(),
                extraRentPayment: payAmount ? Number(payAmount) : 0,
                depositReturnAmount: depositReturnAmount,
                discountAmount: discountAmount ? Number(discountAmount) : 0,
                discountReference,
                paymentMethod,
                manualOvertimeAmount: Number(manualOvertimeAmount) // Send manual amount
            };

            // Note: If netPayable > 0, we collected cash. If netPayable < 0, we refunded cash.
            // If paying, use selected method.
            if (netPayable > 0) payload.paymentMethod = paymentMethod;
            else payload.paymentMethod = 'DEPOSIT_DEDUCTION'; // Or 'CASH' for refund out.

            const res = await api.post(`/bookings/${booking._id}/end-session`, payload);

            if (res.data.success) {
                onSuccess();
                onClose();
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || 'Failed to checkout');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);

    // Derived State for Financials - REMOVED (Hoisted to top)

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/80 backdrop-blur-md sticky top-0 z-10">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                            {viewMode === 'DETAILS' ? 'Booking Details' : viewMode === 'CHECKOUT' ? 'Session Checkout' : 'Edit Booking'}
                        </h2>
                        <p className="text-sm text-gray-500 font-medium mt-1">{booking.bookingCode}</p>
                    </div>
                    <button onClick={onClose} className="p-2.5 hover:bg-white rounded-full transition-all shadow-sm border border-transparent hover:border-gray-200">
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                <div className="overflow-y-auto custom-scrollbar p-0">
                    {/* Error Banner */}
                    {error && (
                        <div className="mx-8 mt-6 bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl flex items-start gap-3">
                            <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <span className="text-sm font-medium">{error}</span>
                        </div>
                    )}

                    {viewMode === 'DETAILS' ? (
                        <div className="p-8 space-y-8">
                            {/* Key Info Grid */}
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <h4 className="text-xs uppercase tracking-wider font-bold text-gray-400">Customer</h4>
                                    <p className="text-lg font-bold text-gray-900">{booking.customerName}</p>
                                    <p className="text-sm text-gray-500">{booking.phone}</p>
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-xs uppercase tracking-wider font-bold text-gray-400">Status</h4>
                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' :
                                        booking.status === 'IN_SESSION' ? 'bg-blue-100 text-blue-700' :
                                            booking.status === 'COMPLETED' ? 'bg-gray-100 text-gray-700' : 'bg-red-50 text-red-600'
                                        }`}>
                                        {booking.status}
                                    </span>
                                </div>
                            </div>

                            {/* Timeline */}
                            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                                <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    Session Timeline
                                </h3>
                                <div className="flex items-center gap-4 text-sm relative">
                                    <div className="flex-1">
                                        <div className="text-xs text-gray-500 font-semibold mb-1">START</div>
                                        <div className="font-bold text-gray-900">{format(parseISO(booking.startTime), 'hh:mm a')}</div>
                                        <div className="text-xs text-gray-400">{format(parseISO(booking.startTime), 'dd MMM')}</div>
                                    </div>

                                    <div className="flex flex-col items-center justify-center relative">
                                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full mb-1">
                                            {differenceInMinutes(parseISO(booking.endTime), parseISO(booking.startTime)) / 60} Hr
                                        </span>
                                        <div className="w-16 h-px bg-gray-200"></div>
                                        <div className="absolute right-0 -mr-1 top-1/2 mt-1 w-2 h-2 border-t border-r border-gray-300 transform rotate-45"></div>
                                    </div>

                                    <div className="flex-1 text-right">
                                        <div className="text-xs text-text-secondary font-semibold mb-1">SCHEDULED END</div>
                                        <div className="font-bold text-gray-900">{format(parseISO(booking.endTime), 'hh:mm a')}</div>
                                        <div className="text-xs text-gray-400">{format(parseISO(booking.endTime), 'dd MMM')}</div>
                                    </div>
                                </div>
                                {booking.actualExitTime && (
                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                        <div className="text-xs text-gray-500 font-semibold mb-1">ACTUAL EXIT</div>
                                        <div className="font-bold text-blue-600">{format(parseISO(booking.actualExitTime), 'hh:mm a')}</div>
                                    </div>
                                )}
                            </div>

                            {/* Financials */}
                            <div className="border border-gray-100 rounded-2xl overflow-hidden">
                                <div className="bg-gray-50/50 px-6 py-3 border-b border-gray-100 flex justify-between items-center">
                                    <h3 className="text-sm font-bold text-gray-900">Financial Summary</h3>
                                    {finance.depositCollected > 0 && <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">Security Deposit Held: {formatCurrency(finance.depositCollected)}</span>}
                                </div>
                                <div className="p-6 space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Gross Amount</span>
                                        <span className="font-medium">{formatCurrency(finance.grossAmount || 0)}</span>
                                    </div>
                                    <div className="flex justify-between text-green-600">
                                        <span>Discount</span>
                                        <span>-{formatCurrency(finance.discountAmount || 0)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-900 font-bold">Net Payable</span>
                                        <span className="font-bold">{formatCurrency(finance.netAmount || 0)}</span>
                                    </div>
                                    <div className="flex justify-between text-green-600 pt-2 border-t border-dashed border-gray-200">
                                        <span>Paid Amount</span>
                                        <span>{formatCurrency(finance.rentPaid || 0)}</span>
                                    </div>
                                    <div className="flex justify-between pt-2 border-t border-gray-100">
                                        <span className={`font-bold ${finance.rentDue > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                            Balance Due
                                        </span>
                                        <span className={`font-bold ${finance.rentDue > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                            {formatCurrency(finance.rentDue || 0)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                        </div>
                    ) : viewMode === 'CHECKOUT' ? (
                        // CHECKOUT MODE
                        <form onSubmit={handleCheckout} className="p-8 space-y-8">
                            {/* Note Removed as per user request */}

                            {/* Time Controls */}
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Scheduled End</label>
                                    <div className="px-4 py-3 bg-gray-100 rounded-xl text-sm font-bold text-gray-500 cursor-not-allowed">
                                        {format(parseISO(booking.endTime), 'hh:mm a, dd MMM')}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-900 uppercase tracking-wide mb-1.5">Checkout Time</label>
                                    <input
                                        type="datetime-local"
                                        value={exitTime}
                                        onChange={(e) => setExitTime(e.target.value)}
                                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-black transition-colors"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Overtime & Dues Calculation */}
                            <div className="bg-gray-900 rounded-2xl p-6 text-white space-y-4 shadow-xl">
                                <div className="space-y-2 pb-4 border-b border-gray-700">
                                    <div className="flex justify-between items-center text-sm opacity-80">
                                        <span>Gross Rent</span>
                                        <span>{formatCurrency(finance.grossAmount || 0)}</span>
                                    </div>

                                    {/* Overtime Suggestion Display */}
                                    {overtimeStats.minutes > 0 ? (
                                        <div className="bg-yellow-900/30 p-2 rounded-lg border border-yellow-500/30 text-xs">
                                            <div className="flex justify-between text-yellow-500 font-bold mb-1">
                                                <span>Duration Exceeded by {overtimeStats.minutes} mins</span>
                                                <span>({overtimeStats.hours} extra hr)</span>
                                            </div>
                                            <div className="flex justify-between text-gray-300">
                                                <span>Suggested Charge:</span>
                                                <span>{formatCurrency(overtimeStats.amount)}</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setManualOvertimeAmount(overtimeStats.amount)}
                                                className="w-full mt-3 py-3 bg-yellow-400 text-yellow-900 rounded-xl font-bold hover:bg-yellow-300 transition-colors shadow-lg flex items-center justify-center gap-2"
                                            >
                                                Apply Suggestion (+ {formatCurrency(overtimeStats.amount)})
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="text-xs text-gray-500 italic">
                                            No overtime detected based on schedule.
                                        </div>
                                    )}

                                    {/* Manual Overtime Input (Visual in Receipt) */}
                                    <div className="flex justify-between items-center text-sm font-bold text-yellow-400">
                                        <span>Extra / Overtime Charge</span>
                                        <span>+ {formatCurrency(Number(manualOvertimeAmount))}</span>
                                    </div>

                                    <div className="flex justify-between items-center text-sm font-bold pt-1 border-t border-gray-700">
                                        <span>Total Gross</span>
                                        <span>{formatCurrency((finance.grossAmount || 0) + Number(manualOvertimeAmount))}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm text-green-400">
                                        <span>Discount</span>
                                        <span>- {formatCurrency(Number(discountAmount))}</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-sm text-blue-300">
                                        <span>Less: Paid Rent</span>
                                        <span>- {formatCurrency(finance.rentPaid || 0)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm text-blue-300">
                                        <span>Less: Security Deposit</span>
                                        <span>- {formatCurrency(finance.depositCollected || 0)}</span>
                                    </div>
                                </div>

                                <div className="border-t border-white/20 pt-4 flex justify-between items-center">
                                    <div className="border-t border-white/20 pt-4 flex justify-between items-center">
                                        {currentNetPayable > 0 ? (
                                            <>
                                                <span className="text-lg font-bold">Total To Pay</span>
                                                <span className="text-3xl font-black text-white">{formatCurrency(currentNetPayable)}</span>
                                            </>
                                        ) : (
                                            <>
                                                <span className="text-lg font-bold text-green-400">Refund To Customer</span>
                                                <span className="text-3xl font-black text-green-400">{formatCurrency(Math.abs(currentNetPayable))}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Payment Logic */}
                            {currentNetPayable > 0 ? (
                                <div className="space-y-4">
                                    {/* Overtime Input Field */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Manual Overtime / Extra Charge</label>
                                        <input
                                            type="number"
                                            value={manualOvertimeAmount}
                                            onChange={(e) => setManualOvertimeAmount(e.target.value)}
                                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-black"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Discount Amount</label>
                                            <input
                                                type="number"
                                                value={discountAmount}
                                                onChange={(e) => setDiscountAmount(e.target.value)}
                                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-black"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Discount Note</label>
                                            <input
                                                type="text"
                                                value={discountReference}
                                                onChange={(e) => setDiscountReference(e.target.value)}
                                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-black"
                                                placeholder="Optional"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Payment Amount</label>
                                            <input
                                                type="number"
                                                value={payAmount}
                                                onChange={(e) => setPayAmount(e.target.value)}
                                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-black"
                                                placeholder="Enter Amount"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Method</label>
                                            <select
                                                value={paymentMethod}
                                                onChange={(e) => setPaymentMethod(e.target.value)}
                                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-black"
                                            >
                                                <option value="CASH">Cash</option>
                                                <option value="UPI">UPI</option>
                                                <option value="CARD">Card</option>
                                                <option value="OTHER">Other</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-green-50 text-green-700 p-4 rounded-xl text-center font-bold border border-green-100">
                                    Please return {formatCurrency(Math.abs(currentNetPayable))} to customer.
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-left">
                                        <div>
                                            <label className="block text-xs font-bold text-green-700 uppercase tracking-wide mb-1.5">Discount Amount</label>
                                            <input
                                                type="number"
                                                value={discountAmount}
                                                onChange={(e) => setDiscountAmount(e.target.value)}
                                                className="w-full bg-white border border-green-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-green-500 text-green-800"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-green-700 uppercase tracking-wide mb-1.5">Discount Note</label>
                                            <input
                                                type="text"
                                                value={discountReference}
                                                onChange={(e) => setDiscountReference(e.target.value)}
                                                className="w-full bg-white border border-green-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-green-500 text-green-800"
                                                placeholder="Optional"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}



                            {/* Action Button - Replaced with SwipeButton */}
                            <div className="pt-2">
                                <SwipeButton
                                    onComplete={() => {
                                        // We need to trigger form submission programmatically or call the handler directly.
                                        // Since SwipeButton handles the "click", we call handleCheckout directly.
                                        // We need to pass a fake event preventsDefault? No, handleCheckout takes event.
                                        // Let's modify handleCheckout to be callable without event or mock it.
                                        handleCheckout({ preventDefault: () => { } });
                                    }}
                                    mainText="Slide to Complete"
                                    amount={currentNetPayable > 0 ? formatCurrency(currentNetPayable) : 'Refund'}
                                    disabled={loading}
                                    resetKey={viewMode} // Reset when mode toggles
                                />
                            </div >
                        </form>
                    ) : (
                        // EDIT MODE
                        <form onSubmit={handleUpdateBooking} className="p-8 space-y-6">
                            {/* Two Column Layout */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Left Col: Customer Info */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Customer Details</h3>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Customer Name</label>
                                        <input name="customerName" value={editFormData.customerName || ''} onChange={handleEditChange} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-black" required />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Phone</label>
                                        <input name="phone" value={editFormData.phone || ''} onChange={handleEditChange} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-black" required />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Couple Name</label>
                                            <input name="coupleName" value={editFormData.coupleName || ''} onChange={handleEditChange} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-black" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Studio</label>
                                            <input name="photographyName" value={editFormData.photographyName || ''} onChange={handleEditChange} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-black" />
                                        </div>
                                    </div>
                                </div>

                                {/* Right Col: Session Info */}
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-gray-900 border-b border-gray-100 pb-2">Session Details</h3>
                                    <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 mb-2">
                                        <p className="text-xs text-yellow-800">⚠️ Changing these will recalculate costs.</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Persons</label>
                                            <input type="number" name="persons" value={editFormData.persons || ''} onChange={handleEditChange} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-black" required />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Type</label>
                                            <select name="sessionType" value={editFormData.sessionType || 'ONE_HOUR'} onChange={handleEditChange} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-black">
                                                <option value="ONE_HOUR">1 Hour</option>
                                                <option value="TWO_HOUR">2 Hours</option>
                                                <option value="THREE_HOUR">3 Hours</option>
                                                <option value="HALF_DAY">Half Day</option>
                                                <option value="FULL_DAY">Full Day</option>
                                                <option value="CUSTOM">Custom</option>
                                            </select>
                                        </div>
                                    </div>
                                    {editFormData.sessionType === 'CUSTOM' && (
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Hours</label>
                                            <input type="number" name="customHours" value={editFormData.customHours || ''} onChange={handleEditChange} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-black" />
                                        </div>
                                    )}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Date</label>
                                            <input type="date" name="startDate" value={editFormData.startDate || ''} onChange={handleEditChange} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-black" required />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Time</label>
                                            <input type="time" name="startTime" value={editFormData.startTime || ''} onChange={handleEditChange} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-black" required />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => setViewMode('DETAILS')} className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" disabled={editLoading} className="px-8 py-3 bg-[#8F1E22] text-white rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg flex items-center gap-2">
                                    {editLoading ? 'Updating...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Footer Controls for Details View */}
                {viewMode === 'DETAILS' && (
                    <div className="p-6 border-t border-gray-100 bg-gray-50/80 backdrop-blur-md flex justify-end gap-3 sticky bottom-0">
                        {booking.status === 'IN_SESSION' || (booking.status !== 'COMPLETED' && booking.status !== 'CANCELLED') ? (
                            <button
                                onClick={() => setViewMode('CHECKOUT')}
                                className="px-6 py-3 bg-[#8F1E22] text-white rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg shadow-black/10 flex items-center gap-2"
                            >
                                Proceed to Checkout
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                            </button>
                        ) : (
                            <button disabled className="px-6 py-3 bg-gray-200 text-gray-400 rounded-xl font-bold cursor-not-allowed">
                                Booking Closed
                            </button>
                        )}
                        {/* Edit Button */}
                        {booking.status !== 'COMPLETED' && booking.status !== 'CANCELLED' && (
                            <button
                                onClick={() => setViewMode('EDIT')}
                                className="px-4 py-3 text-gray-500 hover:text-gray-900 font-bold hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                Edit
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookingDetailsModal;
