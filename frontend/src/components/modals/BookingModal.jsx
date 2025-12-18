import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import api from '../../api/axios'; // Adjust path if necessary, assuming ../../api/axios exists

const BookingModal = ({ isOpen, onClose }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const getCurrentTime = () => {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    };

    const [formData, setFormData] = useState({
        bookingType: 'WALK_IN',
        customerName: '',
        coupleName: '',
        photographyName: '',
        phone: '',
        persons: 1,
        sessionType: 'ONE_HOUR',
        customHours: 0,
        startDate: new Date().toISOString().split('T')[0],
        startTime: getCurrentTime(),

        depositAmount: 0,
        initialRentPayment: 0,
        paymentMethod: 'CASH'
    });

    // Guard Clause: Don't render if not open
    if (!isOpen) return null;

    useEffect(() => {
        if (isOpen) {
            // Reset or init logic logic if needed
        }
    }, [isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const updates = { ...prev, [name]: value };
            if (name === 'bookingType' && value === 'WALK_IN') {
                updates.startTime = getCurrentTime();
                updates.startDate = new Date().toISOString().split('T')[0];
            }
            return updates;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccessMsg('');

        // Strict Validation: Check all fields
        const requiredFields = [
            'bookingType', 'customerName', 'phone', 'coupleName', 'photographyName',
            'persons', 'sessionType', 'startDate', 'startTime',
            'depositAmount', 'initialRentPayment', 'paymentMethod'
        ];

        const missingField = requiredFields.find(field => {
            const value = formData[field];
            // Check for empty string, null, undefined. Allow 0.
            return value === '' || value === null || value === undefined;
        });

        // Special check for Custom Hours
        if (!missingField && formData.sessionType === 'CUSTOM' && !formData.customHours) {
            setError("Custom Hours is required.");
            setLoading(false);
            return;
        }

        if (missingField) {
            setError("All fields are compulsory. Please fill in all details.");
            setLoading(false);
            return;
        }

        try {
            const combinedStart = new Date(`${formData.startDate}T${formData.startTime}:00`);
            const payload = {
                ...formData,
                startTime: combinedStart.toISOString(),
                persons: Number(formData.persons),
                customHours: Number(formData.customHours),

                depositAmount: Number(formData.depositAmount),
                initialRentPayment: Number(formData.initialRentPayment)
            };

            const res = await api.post('/bookings', payload);

            if (res.data.success) {
                setSuccessMsg(`Booking Created! Code: ${res.data.data.bookingCode}`);
                setFormData({
                    bookingType: 'WALK_IN', customerName: '', coupleName: '', photographyName: '', phone: '',
                    persons: 1, sessionType: 'ONE_HOUR', customHours: 0, startDate: new Date().toISOString().split('T')[0],
                    startTime: getCurrentTime(), depositAmount: 0,
                    initialRentPayment: 0, paymentMethod: 'CASH'
                });
                setTimeout(() => {
                    setSuccessMsg('');
                    onClose();
                }, 2000);
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || 'Failed to create booking');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[90vh] flex flex-col">

                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="text-2xl font-bold text-text-main">New Booking</h2>
                        <p className="text-sm text-text-secondary mt-1">Create a new reservation for studio time.</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-text-secondary hover:text-text-main hover:bg-gray-50 transition-colors">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>

                {/* Toast Notification (Success) */}
                {successMsg && (
                    <div className="fixed top-8 right-8 z-[60] bg-white border-l-4 border-green-500 rounded-xl shadow-2xl p-4 min-w-[320px] animate-in slide-in-from-right fade-in duration-300 flex items-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </div>
                        <div>
                            <h4 className="font-bold text-gray-900 text-sm">Success!</h4>
                            <p className="text-sm text-gray-600 mt-0.5">{successMsg}</p>
                        </div>
                    </div>
                )}

                {/* Scrollable Form Content */}
                <div className="p-8 overflow-y-auto custom-scrollbar flex-1">

                    {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 flex items-center gap-3"><span className="w-2 h-2 rounded-full bg-red-600"></span>{error}</div>}

                    <form onSubmit={handleSubmit} className="space-y-8">

                        {/* Section: Booking Type */}
                        <div>
                            <label className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3 block">Booking Type</label>
                            <div className="flex gap-4">
                                <label className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${formData.bookingType === 'WALK_IN' ? 'bg-primary/10 border-primary text-black font-bold' : 'border-gray-200 text-text-secondary hover:border-primary/50'}`}>
                                    <input type="radio" name="bookingType" value="WALK_IN" checked={formData.bookingType === 'WALK_IN'} onChange={handleChange} className="hidden" />
                                    <span>Walk-in</span>
                                </label>
                                <label className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${formData.bookingType === 'ADVANCE' ? 'bg-primary/10 border-primary text-black font-bold' : 'border-gray-200 text-text-secondary hover:border-primary/50'}`}>
                                    <input type="radio" name="bookingType" value="ADVANCE" checked={formData.bookingType === 'ADVANCE'} onChange={handleChange} className="hidden" />
                                    <span>Advance</span>
                                </label>
                            </div>
                        </div>

                        {/* Two Column Layout */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                            {/* Left Col: Customer Info */}
                            <div className="space-y-5">
                                <h3 className="text-lg font-bold text-text-main border-b border-gray-100 pb-2">Customer Details</h3>
                                <Input label="Customer Name" name="customerName" value={formData.customerName} onChange={handleChange} required />
                                <Input label="Phone Number" name="phone" value={formData.phone} onChange={handleChange} required />
                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="Couple Name" name="coupleName" value={formData.coupleName} onChange={handleChange} required />
                                    <Input label="Photography Studio" name="photographyName" value={formData.photographyName} onChange={handleChange} required />
                                </div>
                            </div>

                            {/* Right Col: Session Info */}
                            <div className="space-y-5">
                                <h3 className="text-lg font-bold text-text-main border-b border-gray-100 pb-2">Session Details</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="Persons" type="number" name="persons" value={formData.persons} onChange={handleChange} required />

                                    <div>
                                        <label className="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wide">Session Type <span className="text-red-500">*</span></label>
                                        <select name="sessionType" value={formData.sessionType} onChange={handleChange} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-primary transition-colors appearance-none">
                                            <option value="ONE_HOUR">1 Hour</option>
                                            <option value="TWO_HOUR">2 Hours</option>
                                            <option value="THREE_HOUR">3 Hours</option>
                                            <option value="HALF_DAY">Half Day</option>
                                            <option value="FULL_DAY">Full Day</option>
                                            <option value="CUSTOM">Custom Hours</option>
                                        </select>
                                    </div>
                                </div>
                                {formData.sessionType === 'CUSTOM' && (
                                    <Input label="Custom Hours" type="number" name="customHours" value={formData.customHours} onChange={handleChange} required />
                                )}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wide">Date <span className="text-red-500">*</span></label>
                                        <DatePicker
                                            selected={formData.startDate ? new Date(formData.startDate) : null}
                                            onChange={(date) => setFormData(prev => ({ ...prev, startDate: date ? date.toISOString().split('T')[0] : '' }))}
                                            dateFormat="dd MMM yyyy"
                                            customInput={<CustomFormDateInput placeholder="Select Date" />}
                                            wrapperClassName="w-full"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wide">Start Time <span className="text-red-500">*</span></label>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <select
                                                    value={formData.startTime ? formData.startTime.split(':')[0] : '00'}
                                                    onChange={(e) => {
                                                        const newHour = e.target.value;
                                                        const minute = formData.startTime ? formData.startTime.split(':')[1] : '00';
                                                        setFormData(prev => ({ ...prev, startTime: `${newHour}:${minute}` }));
                                                    }}
                                                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-3.5 text-sm font-medium focus:outline-none focus:border-primary appearance-none cursor-pointer hover:border-primary transition-colors text-center"
                                                >
                                                    {Array.from({ length: 24 }).map((_, i) => (
                                                        <option key={i} value={i.toString().padStart(2, '0')}>{i.toString().padStart(2, '0')}</option>
                                                    ))}
                                                </select>
                                                <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-xs text-gray-400 font-bold">H</span>
                                            </div>
                                            <span className="flex items-center text-gray-400 font-bold">:</span>
                                            <div className="relative flex-1">
                                                <select
                                                    value={formData.startTime ? formData.startTime.split(':')[1] : '00'}
                                                    onChange={(e) => {
                                                        const newMinute = e.target.value;
                                                        const hour = formData.startTime ? formData.startTime.split(':')[0] : '00';
                                                        setFormData(prev => ({ ...prev, startTime: `${hour}:${newMinute}` }));
                                                    }}
                                                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-3.5 text-sm font-medium focus:outline-none focus:border-primary appearance-none cursor-pointer hover:border-primary transition-colors text-center"
                                                >
                                                    {Array.from({ length: 60 }).map((_, i) => (
                                                        <option key={i} value={i.toString().padStart(2, '0')}>{i.toString().padStart(2, '0')}</option>
                                                    ))}
                                                </select>
                                                <span className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-xs text-gray-400 font-bold">M</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Finance Section */}
                        <div className="pt-4">
                            <h3 className="text-lg font-bold text-text-main border-b border-gray-100 pb-2 mb-5">Payment & Finance</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <Input label="Deposit Amount (₹)" type="number" name="depositAmount" value={formData.depositAmount} onChange={handleChange} required />
                                <Input label="Initial Rent (₹)" type="number" name="initialRentPayment" value={formData.initialRentPayment} onChange={handleChange} required />
                                <div>
                                    <label className="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wide">Payment Method <span className="text-red-500">*</span></label>
                                    <select name="paymentMethod" value={formData.paymentMethod} onChange={handleChange} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-primary transition-colors appearance-none">
                                        <option value="CASH">Cash</option>
                                        <option value="UPI">UPI</option>
                                        <option value="CARD">Card</option>
                                        <option value="OTHER">Other</option>
                                    </select>
                                </div>
                            </div>

                        </div>

                    </form>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-text-secondary hover:text-text-main hover:bg-gray-100 transition-colors">
                        Cancel
                    </button>
                    <button onClick={handleSubmit} disabled={loading} className="px-8 py-3 bg-[#8F1E22] text-white rounded-xl font-bold hover:bg-gray-800 hover:scale-[1.02] active:scale-95 transition-all shadow-lg flex items-center gap-2">
                        {loading ? 'Processing...' : 'Create Booking'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const Input = ({ label, name, type = "text", value, onChange, required = false }) => (
    <div>
        <label className="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wide">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <input
            type={type}
            name={name}
            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-gray-300"
            placeholder={`Enter ${label.toLowerCase()}`}
            value={value}
            onChange={onChange}
            required={required}
        />
    </div>
);

const CustomFormDateInput = React.forwardRef(({ value, onClick, onChange, placeholder }, ref) => (
    <div className="relative w-full group">
        <input
            value={value}
            onClick={onClick}
            onChange={onChange}
            ref={ref}
            placeholder={placeholder}
            className="w-full bg-white border border-gray-200 rounded-xl pl-4 pr-10 py-3.5 text-sm font-medium text-text-main placeholder:text-gray-400 focus:outline-none focus:border-primary hover:border-primary transition-all cursor-pointer"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-text-main transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
        </div>
    </div>
));



export default BookingModal;
