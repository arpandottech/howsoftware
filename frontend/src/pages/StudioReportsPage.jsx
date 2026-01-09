import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import LayoutShell from '../components/ui/LayoutShell';
import Card from '../components/ui/Card';

const StudioReportsPage = () => {
    const [period, setPeriod] = useState('TODAY'); // TODAY, YESTERDAY, THIS_MONTH, THIS_YEAR
    const [stats, setStats] = useState([]);
    const [filteredStats, setFilteredStats] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchStats = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/bookings/analytics/studios?period=${period}`);
            if (res.data.success) {
                setStats(res.data.data);
                setFilteredStats(res.data.data);
                const total = res.data.data.reduce((acc, curr) => acc + curr.totalRevenue, 0);
                setTotalRevenue(total);
            }
        } catch (err) {
            console.error("Failed to fetch studio analytics", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, [period]);

    useEffect(() => {
        if (!searchTerm) {
            setFilteredStats(stats);
        } else {
            const lower = searchTerm.toLowerCase();
            const filtered = stats.filter(s => (s.name || '').toLowerCase().includes(lower));
            setFilteredStats(filtered);
        }
    }, [searchTerm, stats]);

    const tabs = [
        { id: 'TODAY', label: 'Today' },
        { id: 'YESTERDAY', label: 'Yesterday' },
        { id: 'THIS_MONTH', label: 'This Month' },
        { id: 'THIS_YEAR', label: 'This Year' }
    ];

    return (
        <LayoutShell title="Reports">
            <div className="w-full max-w-5xl mx-auto py-6">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Studio Reports</h1>
                        <p className="text-gray-500 mt-1">Analyze business performance by photography studio.</p>
                    </div>

                    {/* Filters & Search - Stacked on Mobile, Row on Desktop */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Search Box */}
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Search studio..."
                                className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8F1E22] focus:border-transparent w-full sm:w-64 shadow-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Date Filters */}
                        <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setPeriod(tab.id)}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${period === tab.id
                                            ? 'bg-[#8F1E22] text-white shadow-md'
                                            : 'text-gray-600 hover:bg-gray-50'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                    <Card className="flex items-center justify-between p-6 bg-gradient-to-br from-[#8F1E22] to-[#6d1619] text-white border-none shadow-xl shadow-[#8F1E22]/20">
                        <div>
                            <p className="text-sm font-bold opacity-80 uppercase tracking-wider mb-1">Total Revenue</p>
                            <h2 className="text-3xl font-bold">
                                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(totalRevenue)}
                            </h2>
                        </div>
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                    </Card>

                    <Card className="flex items-center justify-between p-6">
                        <div>
                            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">Active Studios</p>
                            <h2 className="text-3xl font-bold text-gray-900">{filteredStats.length}</h2>
                        </div>
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-500">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                        </div>
                    </Card>
                </div>

                {/* List View */}
                <Card className="overflow-hidden p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Rank</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Studio Name</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Bookings</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Revenue</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan="4" className="py-12 text-center text-gray-400">
                                            <span className="inline-block animate-pulse font-medium">Loading data...</span>
                                        </td>
                                    </tr>
                                ) : filteredStats.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="py-12 text-center text-gray-400 mb-2">
                                            No business data found for this period.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredStats.map((studio, index) => (
                                        <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                    index === 1 ? 'bg-gray-100 text-gray-600' :
                                                        index === 2 ? 'bg-orange-100 text-orange-700' :
                                                            'bg-white border border-gray-200 text-gray-400'
                                                    }`}>
                                                    {index + 1}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-gray-900">{studio.name || 'Unknown Studio'}</td>
                                            <td className="px-6 py-4 text-right font-medium text-gray-600">{studio.bookingCount}</td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded-lg">
                                                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(studio.totalRevenue)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>

            </div>
        </LayoutShell>
    );
};

export default StudioReportsPage;
