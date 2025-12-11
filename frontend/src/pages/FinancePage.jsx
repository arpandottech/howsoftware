import React, { useState, useEffect } from 'react';
import LayoutShell from '../components/ui/LayoutShell';
import Card from '../components/ui/Card';
import api from '../api/axios';
import { format, parseISO } from 'date-fns';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";

// Custom Date Input (Reused)
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

const FinancePage = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalIncome: 0, totalExpense: 0, netProfit: 0, netDepositFlow: 0, depositsCollected: 0, depositsReturned: 0 });
    const [transactions, setTransactions] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [filter, setFilter] = useState('THIS_MONTH');
    const [dateRange, setDateRange] = useState([null, null]);
    const [startDate, endDate] = dateRange;

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);

    // Derived State for Pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const paginatedTransactions = transactions.slice(indexOfFirstItem, indexOfLastItem);

    const fetchFinanceData = async () => {
        setLoading(true);
        try {
            let query = `/finance?filter=${filter}`;

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
                setStats(res.data.stats);
                setTransactions(res.data.recentTransactions);
                setChartData(res.data.chartData);
            }
        } catch (err) {
            console.error("Failed to fetch finance data", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFinanceData();
    }, [filter, startDate, endDate]);

    const handleFilterChange = (newFilter) => {
        setFilter(newFilter);
        if (newFilter !== 'CUSTOM') {
            setDateRange([null, null]);
        }
    };

    // Chart helpers
    const getChartMax = () => {
        if (!chartData.length) return 1000;
        return Math.max(...chartData.map(d => Math.max(d.income, d.expense))) * 1.2;
    };
    const chartMax = getChartMax();

    return (
        <LayoutShell title="Finance">
            <div className="space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Finance Overview</h2>
                        <p className="text-gray-500 font-medium mt-1">Track income, expenses, and profitability</p>
                    </div>

                    {/* Filters */}
                    <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-1">
                        {['TODAY', 'THIS_MONTH', 'YESTERDAY'].map(f => (
                            <button
                                key={f}
                                onClick={() => handleFilterChange(f)}
                                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filter === f ? 'bg-[#8F1E22] text-white shadow-md' : 'text-gray-500 hover:bg-gray-50'}`}
                            >
                                {f.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Date Picker (Consolidated Row) */}
                <div className="flex justify-end">
                    <div className="w-full md:w-auto min-w-[280px]">
                        <DatePicker
                            selectsRange={true}
                            startDate={startDate}
                            endDate={endDate}
                            onChange={(update) => {
                                setDateRange(update);
                                if (update[0]) handleFilterChange('CUSTOM');
                            }}
                            dateFormat="dd MMM, yyyy"
                            customInput={<CustomFormDateInput placeholder="Select Custom Date Range" />}
                            wrapperClassName="w-full"
                            placeholderText="Select Date Range"
                            isClearable={true}
                        />
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Income */}
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                        <div className="relative">
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Total Income</p>
                            <h3 className="text-3xl font-black text-gray-900">₹{stats.totalIncome.toLocaleString('en-IN')}</h3>
                            <div className="mt-4 flex items-center gap-2 text-green-600 text-xs font-bold bg-green-50 w-fit px-2 py-1 rounded-lg">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 10l7-7m0 0l7 7m-7-7v18" /></svg>
                                <span>Realized Revenue</span>
                            </div>
                        </div>
                    </div>

                    {/* Expense */}
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-red-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                        <div className="relative">
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Total Expense</p>
                            <h3 className="text-3xl font-black text-gray-900">₹{stats.totalExpense.toLocaleString('en-IN')}</h3>
                            <div className="mt-4 flex items-center gap-2 text-red-600 text-xs font-bold bg-red-50 w-fit px-2 py-1 rounded-lg">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 14l-7 7m0 0l-7-7m7 7V3" /></svg>
                                <span>Operational Costs</span>
                            </div>
                        </div>
                    </div>

                    {/* Net Profit */}
                    <div className="bg-[#8F1E22] text-white p-6 rounded-3xl shadow-lg relative overflow-hidden group hover:scale-[1.02] transition-all">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gray-800 rounded-full blur-2xl opacity-50 -mr-10 -mt-10"></div>
                        <div className="relative h-full flex flex-col justify-between">
                            <div>
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Net Profit</p>
                                <h3 className="text-3xl font-black text-[#F7D154]">₹{stats.netProfit.toLocaleString('en-IN')}</h3>
                            </div>
                            <div className="mt-4 text-xs font-medium text-gray-400">
                                Income - Expenses
                            </div>
                        </div>
                    </div>

                    {/* Deposits Held */}
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                        <div className="relative">
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Deposits Held</p>
                            <h3 className="text-3xl font-black text-gray-900">{stats.netDepositFlow > 0 ? '+' : ''}₹{stats.netDepositFlow.toLocaleString('en-IN')}</h3>
                            <div className="mt-4 flex flex-col gap-1 text-[10px] font-bold text-gray-500">
                                <div className="flex justify-between"><span>Collected:</span> <span>₹{stats.depositsCollected}</span></div>
                                <div className="flex justify-between"><span>Returned:</span> <span>₹{stats.depositsReturned}</span></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Transactions */}
                <div className="w-full">
                    <Card className="h-full">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <h3 className="font-bold text-xl text-gray-900">Recent Transactions</h3>

                            {/* Rows Per Page Selector */}
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-gray-500">Rows:</span>
                                <select
                                    value={itemsPerPage}
                                    onChange={(e) => {
                                        setItemsPerPage(Number(e.target.value));
                                        setCurrentPage(1); // Reset to page 1 on change
                                    }}
                                    className="bg-gray-50 border border-gray-200 text-gray-900 text-xs font-bold rounded-lg focus:ring-black focus:border-black block p-1.5"
                                >
                                    {[20, 30, 40, 50].map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                            {paginatedTransactions.length > 0 ? (
                                paginatedTransactions.map((t) => (
                                    <div key={t.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors border border-transparent hover:border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${t.type === 'INCOME' ? 'bg-green-100 text-green-600' :
                                                t.type === 'EXPENSE' ? 'bg-red-100 text-red-600' :
                                                    t.type === 'DEPOSIT_IN' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    {t.type === 'INCOME' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />}
                                                    {t.type === 'EXPENSE' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />}
                                                    {t.type === 'DEPOSIT_IN' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />}
                                                    {t.type === 'DEPOSIT_OUT' && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />}
                                                </svg>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-gray-900 truncate">{t.description}</p>
                                                <p className="text-xs text-gray-500">{format(parseISO(t.date), 'dd MMM, hh:mm a')}</p>
                                            </div>
                                        </div>
                                        <div className={`font-bold text-right ml-2 whitespace-nowrap ${t.type === 'INCOME' ? 'text-green-600' :
                                            t.type === 'EXPENSE' || t.amount < 0 ? 'text-red-600' :
                                                'text-gray-900'
                                            }`}>
                                            {t.amount > 0 ? '+' : ''}₹{t.amount.toLocaleString('en-IN')}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-gray-400 text-center py-8">No transactions found</div>
                            )}
                        </div>

                        {/* Pagination Controls */}
                        {transactions.length > itemsPerPage && (
                            <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 text-xs font-bold rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 transition-colors"
                                >
                                    Previous
                                </button>
                                <span className="text-xs font-bold text-gray-500">
                                    Page {currentPage} of {Math.ceil(transactions.length / itemsPerPage)}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(Math.ceil(transactions.length / itemsPerPage), p + 1))}
                                    disabled={currentPage === Math.ceil(transactions.length / itemsPerPage)}
                                    className="px-3 py-1 text-xs font-bold rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 transition-colors"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </Card>
                </div>

            </div>
        </LayoutShell>
    );
};



export default FinancePage;
