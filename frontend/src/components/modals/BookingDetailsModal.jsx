import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { format, parseISO, addMinutes, differenceInMinutes } from 'date-fns';
import SwipeButton from '../ui/SwipeButton';

const BookingDetailsModal = ({ booking, isOpen, onClose, onSuccess }) => {
    const [viewMode, setViewMode] = useState('DETAILS'); // 'DETAILS' or 'CHECKOUT'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Checkout State
    const [payAmount, setPayAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('CASH');
    const [exitTime, setExitTime] = useState(new Date().toISOString().slice(0, 16)); // Default to now for input
    const [overtimeStats, setOvertimeStats] = useState({ minutes: 0, hours: 0, amount: 0 });

    useEffect(() => {
        if (isOpen && booking) {
            setViewMode('DETAILS');
            setPayAmount('');
            setExitTime(new Date().toISOString().slice(0, 16));
            setError('');
        }
    }, [isOpen, booking]);

    useEffect(() => {
        if (viewMode === 'CHECKOUT' && booking) {
            calculateOvertime();
        }
    }, [viewMode, exitTime]);

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

            const rate = booking.pricingSnapshot?.ratePerPersonPerHour || 0;
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

        const rentDues = booking.finance.rentDue + overtimeStats.amount;
        const depositHeld = booking.finance.depositCollected || 0;

        // Net Calculation:
        // If Deposit > Dues: Refund = Deposit - Dues. Dues are covered by Deposit.
        // If Dues > Deposit: Pay = Dues - Deposit. Deposit is fully used, remaining Dues paid by cash.

        const netPayable = rentDues - depositHeld;
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
                // Scenario: Dues > Deposit
                // We keep all deposit (depositReturn = 0)
                // We collect extraRentPayment = Dues (Total we are collecting to fill the rent hole). 
                // Wait. RentDue is the HOLE. 
                // If RentDue=1000, Deposit=500. NetPayable=500.
                // We collect 500 cash.
                // Total Rent Paid needs to go up by 1000.
                // Backend: extraRentPayment adds to rentPaid.
                // So we send extraRentPayment = 1000? But paymentMethod might be confusing.
                // Or does usage imply cash in?
                // The current backend logic: "Payment.create({ amount: payRent, type: 'RENT' })".
                // If we send 1000, we record 1000 received.
                // But we only received 500 cash. 500 was moved from Deposit.
                // Valid Approach: Send 1000. Backend records "Rent Payment: 1000".
                // This balances the book.
                // We just need to know internally that it was "Cash + Deposit".

                extraRentPayment = rentDues;
            } else {
                // Scenario: Deposit > Dues (e.g. Deposit 2000, Dues 500. Refund 1500)
                // We keep 500 of deposit. Return 1500.
                // extraRentPayment = 500 (The amount of rent we are "paying" using the deposit).
                // depositReturnAmount = 1500.

                extraRentPayment = rentDues;
                depositReturnAmount = Math.abs(netPayable);
            }

            const payload = {
                exitTime: new Date(exitTime).toISOString(),
                extraRentPayment, // This covers the Rent Due + Overtime fully
                paymentMethod: 'CASH', // or specific method if provided. ideally if mixed, we say mixed.
                depositReturnAmount
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/80 backdrop-blur-md sticky top-0 z-10">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                            {viewMode === 'DETAILS' ? 'Booking Details' : 'Session Checkout'}
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
                                    {booking.finance.depositCollected > 0 && <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">Security Deposit Held: {formatCurrency(booking.finance.depositCollected)}</span>}
                                </div>
                                <div className="p-6 space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Gross Amount</span>
                                        <span className="font-medium">{formatCurrency(booking.finance.grossAmount)}</span>
                                    </div>
                                    <div className="flex justify-between text-green-600">
                                        <span>Discount</span>
                                        <span>-{formatCurrency(booking.finance.discountAmount)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-900 font-bold">Net Payable</span>
                                        <span className="font-bold">{formatCurrency(booking.finance.netAmount)}</span>
                                    </div>
                                    <div className="flex justify-between text-green-600 pt-2 border-t border-dashed border-gray-200">
                                        <span>Paid Amount</span>
                                        <span>{formatCurrency(booking.finance.rentPaid)}</span>
                                    </div>
                                    <div className="flex justify-between pt-2 border-t border-gray-100">
                                        <span className={`font-bold ${booking.finance.rentDue > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                            Balance Due
                                        </span>
                                        <span className={`font-bold ${booking.finance.rentDue > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                            {formatCurrency(booking.finance.rentDue)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                        </div>
                    ) : (
                        // CHECKOUT MODE
                        <form onSubmit={handleCheckout} className="p-8 space-y-8">
                            <div className="bg-orange-50 rounded-xl p-4 border border-orange-100 text-orange-800 text-sm">
                                <p><strong>Note:</strong> Standard buffer is 10 minutes. Overtime applies automatically after that.</p>
                            </div>

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
                                        <span>Rent Balance</span>
                                        <span>{formatCurrency(booking.finance.rentDue)}</span>
                                    </div>
                                    {overtimeStats.amount > 0 && (
                                        <div className="flex justify-between items-center text-sm text-yellow-400 font-bold">
                                            <span>Overtime ({overtimeStats.hours} hr)</span>
                                            <span>+ {formatCurrency(overtimeStats.amount)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-center text-sm font-bold pt-1">
                                        <span>Total Charges</span>
                                        <span>{formatCurrency(booking.finance.rentDue + overtimeStats.amount)}</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-sm text-blue-300">
                                        <span>Less: Security Deposit</span>
                                        <span>- {formatCurrency(booking.finance.depositCollected || 0)}</span>
                                    </div>
                                </div>

                                <div className="border-t border-white/20 pt-4 flex justify-between items-center">
                                    {((booking.finance.rentDue + overtimeStats.amount) - (booking.finance.depositCollected || 0)) > 0 ? (
                                        <>
                                            <span className="text-lg font-bold">Total To Pay</span>
                                            <span className="text-3xl font-black text-white">{formatCurrency(((booking.finance.rentDue + overtimeStats.amount) - (booking.finance.depositCollected || 0)))}</span>
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-lg font-bold text-green-400">Refund To Customer</span>
                                            <span className="text-3xl font-black text-green-400">{formatCurrency(Math.abs((booking.finance.rentDue + overtimeStats.amount) - (booking.finance.depositCollected || 0)))}</span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Payment Logic */}
                            {((booking.finance.rentDue + overtimeStats.amount) - (booking.finance.depositCollected || 0)) > 0 ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
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
                                    Please return {formatCurrency(Math.abs((booking.finance.rentDue + overtimeStats.amount) - (booking.finance.depositCollected || 0)))} to customer.
                                </div>
                            )}

                            import SwipeButton from '../ui/SwipeButton'; // Add Import

                            // ... inside the component ...

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
                                    amount={((booking.finance.rentDue + overtimeStats.amount) - (booking.finance.depositCollected || 0)) > 0 ? formatCurrency(((booking.finance.rentDue + overtimeStats.amount) - (booking.finance.depositCollected || 0))) : 'Refund'}
                                    disabled={loading}
                                    resetKey={viewMode} // Reset when mode toggles
                                />
                            </div >
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
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookingDetailsModal;
