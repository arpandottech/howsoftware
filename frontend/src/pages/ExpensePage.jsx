import React, { useState, useEffect } from 'react';
import LayoutShell from '../components/ui/LayoutShell';
import Card from '../components/ui/Card';
import api from '../api/axios';
import { format, parseISO } from 'date-fns';
import CreateExpenseModal from '../components/modals/CreateExpenseModal';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

// Custom Date Input Component (Same as BookingModal)
const CustomFormDateInput = React.forwardRef(({ value, onClick, onChange, placeholder }, ref) => (
    <div className="relative w-full group">
        <input
            value={value}
            onClick={onClick}
            onChange={onChange}
            ref={ref}
            placeholder={placeholder}
            readOnly
            className="w-full bg-white border border-gray-200 rounded-xl pl-4 pr-10 py-2.5 text-sm font-bold text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-black hover:border-gray-300 transition-all cursor-pointer shadow-sm"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-black transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
        </div>
    </div>
));

const ExpensePage = () => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [limit, setLimit] = useState(20);
    const [page, setPage] = useState(1);
    const [totalDocs, setTotalDocs] = useState(0);
    const [totalAmount, setTotalAmount] = useState(0);
    const [filter, setFilter] = useState('ALL'); // TODAY, YESTERDAY, THIS_WEEK, CUSTOM, ALL
    const [dateRange, setDateRange] = useState([null, null]);
    const [startDate, endDate] = dateRange;
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const fetchExpenses = async () => {
        setLoading(true);
        try {
            let query = `/expenses?page=${page}&limit=${limit}&filter=${filter}`;

            if (filter === 'CUSTOM' && startDate) {
                const startStr = format(startDate, 'yyyy-MM-dd');
                if (endDate) {
                    const endStr = format(endDate, 'yyyy-MM-dd');
                    query += `&startDate=${startStr}&endDate=${endStr}`;
                } else {
                    query += `&customDate=${startStr}`;
                }
            }

            const res = await api.get(query);
            if (res.data.success) {
                setExpenses(res.data.data);
                setTotalDocs(res.data.total);
                if (res.data.totalAmount !== undefined) setTotalAmount(res.data.totalAmount);
            }
        } catch (err) {
            console.error("Failed to fetch expenses", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExpenses();
    }, [page, limit, filter, startDate, endDate]);

    const handleFilterChange = (newFilter) => {
        setFilter(newFilter);
        setPage(1);
        if (newFilter !== 'CUSTOM') {
            setDateRange([null, null]);
        }
    };

    const totalPages = Math.ceil(totalDocs / limit);
    const startEntry = (page - 1) * limit + 1;
    const endEntry = Math.min(page * limit, totalDocs);

    return (
        <LayoutShell title="Expenses">
            <div className="space-y-6">

                {/* Header & Controls */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Expense Tracker</h2>
                        <p className="text-gray-500 text-sm mt-1">Manage studio expenditures</p>
                    </div>

                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-[#8F1E22] text-white px-6 py-3 rounded-xl font-bold shadow-lg hover:bg-gray-800 transition-all flex items-center gap-2 active:scale-95"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                        Create Expense
                    </button>
                </div>

                {/* Filters & Stats */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex gap-2 items-center overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
                        {['ALL', 'TODAY', 'YESTERDAY', 'THIS_MONTH'].map(f => (
                            <button
                                key={f}
                                onClick={() => handleFilterChange(f)}
                                className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-colors ${filter === f ? 'bg-[#8F1E22] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                {f.replace('_', ' ')}
                            </button>
                        ))}
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                        <div className="flex items-center gap-2 w-full md:w-auto md:min-w-[200px]">
                            <DatePicker
                                selectsRange={true}
                                startDate={startDate}
                                endDate={endDate}
                                onChange={(update) => {
                                    setDateRange(update);
                                    if (update[0]) handleFilterChange('CUSTOM');
                                }}
                                dateFormat="dd MMM, yyyy"
                                customInput={<CustomFormDateInput placeholder="Select Date Range" />}
                                wrapperClassName="w-full"
                                placeholderText="Select Date Range"
                                isClearable={true}
                            />
                        </div>
                        <div className="h-8 w-px bg-gray-200 hidden md:block"></div>
                        <div className="bg-red-50 px-4 py-3 md:py-2 rounded-xl border border-red-100 flex flex-row md:flex-col justify-between md:justify-center items-center md:items-end w-full md:w-auto md:min-w-[120px]">
                            <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Total Expense</span>
                            <span className="font-black text-red-600 text-lg">₹{totalAmount.toLocaleString('en-IN')}</span>
                        </div>
                    </div>
                </div>

                {/* Table Card */}
                <Card>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-bold text-lg text-gray-800">Expense List</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>Show</span>
                            <select
                                value={limit}
                                onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                                className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 font-bold focus:outline-none"
                            >
                                <option value="20">20</option>
                                <option value="30">30</option>
                                <option value="40">40</option>
                                <option value="50">50</option>
                            </select>
                            <span>entries</span>
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-12 text-gray-400">Loading expenses...</div>
                    ) : (
                        <div className="relative group">
                            <div className="overflow-x-auto hide-scrollbar pb-2">
                                <table className="w-full text-left border-collapse min-w-[600px]">
                                    <thead>
                                        <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wider">
                                            <th className="py-3 px-4 font-bold">Date & Time</th>
                                            <th className="py-3 px-4 font-bold">Note / Description</th>

                                            <th className="py-3 px-4 font-bold text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {expenses.length > 0 ? (
                                            expenses.map((exp) => (
                                                <tr key={exp._id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                                    <td className="py-4 px-4 font-medium text-gray-900">
                                                        <div>{format(parseISO(exp.date), 'dd MMM yyyy')}</div>
                                                        <div className="text-xs text-gray-400 font-normal">{format(parseISO(exp.date), 'hh:mm a')}</div>
                                                    </td>
                                                    <td className="py-4 px-4 text-gray-600 font-medium">
                                                        {exp.category !== 'General' && <span className="inline-block px-1.5 py-0.5 rounded bg-gray-100 text-[10px] font-bold text-gray-500 mr-2 uppercase">{exp.category}</span>}
                                                        {exp.note}
                                                    </td>

                                                    <td className="py-4 px-4 text-right font-bold text-red-600">
                                                        ₹{exp.amount.toLocaleString('en-IN')}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="4" className="py-12 text-center text-gray-400 italic">No expenses found for this period.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {/* Mobile Scroll Hint Gradient (Right Side) */}
                            <div className="absolute top-0 right-0 bottom-0 w-8 bg-gradient-to-l from-white/90 to-transparent pointer-events-none lg:hidden rounded-r-xl z-10" />
                        </div>
                    )}

                    {/* Pagination */}
                    <div className="mt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500">
                        <div>
                            Showing <span className="font-bold text-gray-900">{expenses.length > 0 ? startEntry : 0}</span> to <span className="font-bold text-gray-900">{endEntry}</span> of <span className="font-bold text-gray-900">{totalDocs}</span> entries
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Previous
                            </button>
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pNum = i + 1;
                                if (page > 3) pNum = page - 2 + i;
                                if (pNum > totalPages) return null;

                                return (
                                    <button
                                        key={pNum}
                                        onClick={() => setPage(pNum)}
                                        className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold transition-all ${page === pNum ? 'bg-[#8F1E22] text-white' : 'hover:bg-gray-50 text-gray-600'}`}
                                    >
                                        {pNum}
                                    </button>
                                );
                            })}
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages || totalPages === 0}
                                className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </Card>

                <CreateExpenseModal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    onSuccess={() => fetchExpenses()}
                />
            </div>
        </LayoutShell>
    );
};

export default ExpensePage;
