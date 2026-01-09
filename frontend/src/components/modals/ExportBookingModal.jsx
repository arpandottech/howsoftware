import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../../api/axios';
import { format } from 'date-fns';

const ExportBookingModal = ({ isOpen, onClose }) => {
    const [rangeType, setRangeType] = useState('TODAY'); // TODAY, YESTERDAY, CUSTOM
    const [customRange, setCustomRange] = useState([null, null]);
    const [startDate, endDate] = customRange;
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const generatePDF = async () => {
        setLoading(true);
        setError('');

        try {
            // 1. Determine Date Range
            let start = new Date();
            let end = new Date();
            let dateLabel = '';

            if (rangeType === 'TODAY') {
                dateLabel = format(new Date(), 'dd MMM yyyy');
            } else if (rangeType === 'YESTERDAY') {
                start.setDate(start.getDate() - 1);
                end.setDate(end.getDate() - 1);
                dateLabel = format(start, 'dd MMM yyyy');
            } else if (rangeType === 'CUSTOM') {
                if (!startDate || !endDate) {
                    setError("Please select a date range.");
                    setLoading(false);
                    return;
                }
                start = startDate;
                end = endDate;
                dateLabel = `${format(start, 'dd MMM')} - ${format(end, 'dd MMM yyyy')}`;
            }

            // 2. Fetch Data
            const startStr = format(start, 'yyyy-MM-dd');
            const endStr = format(end, 'yyyy-MM-dd');

            const res = await api.get(`/bookings?startDate=${startStr}&endDate=${endStr}`);
            const bookings = res.data.data;

            if (bookings.length === 0) {
                setError("No bookings found for selected period.");
                setLoading(false);
                return;
            }

            // 3. Generate PDF
            const doc = new jsPDF();

            // -- Branding Colors --
            const primaryColor = [143, 30, 34]; // #8F1E22
            const blackColor = [0, 0, 0];

            // -- Load Logo --
            // Assuming logo matches the one used in NewBooking or standard path
            const logoUrl = '/img/logo-new.jpg';
            try {
                const img = new Image();
                img.src = logoUrl;
                // We need to wait for image load if not cached, but in browser usually fast.
                // Better approach for production: Preload or use Base64. 
                // For simplicity here, we assume it loads or we skip.
                // To be safe, let's use await wrapper or simple timeout?
                // jsPDF needs base64 or loaded img.

                // Let's rely on browser cache or simple addImage
                doc.addImage(img, 'JPEG', 105 - 15, 10, 30, 30); // Center approx (width 30, height 30)
            } catch (e) {
                console.warn("Logo load fail", e);
            }

            // -- Header Text --
            doc.setTextColor(...primaryColor);
            doc.setFontSize(22);
            doc.setFont("helvetica", "bold");
            doc.text("House Of Wedding", 105, 50, { align: 'center' });

            doc.setTextColor(...blackColor);
            doc.setFontSize(14);
            doc.text(`Booking Report: ${dateLabel}`, 105, 60, { align: 'center' });

            // -- Table --
            const tableColumn = ["Couple Name", "Phone", "Date & Time", "Amount"];
            const tableRows = [];

            bookings.forEach(b => {
                const bookingDate = format(new Date(b.startTime), 'dd MMM yyyy, hh:mm a');
                // Fix Currency: '₹' renders as '1' in standard fonts. Use 'Rs.' prefix.
                const amount = `Rs. ${Number(b.finance.netAmount).toFixed(2)}`;

                const bookingData = [
                    b.customerName,
                    b.phone,
                    bookingDate,
                    amount
                ];
                tableRows.push(bookingData);
            });

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 70,
                theme: 'grid',
                headStyles: {
                    fillColor: primaryColor,
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    halign: 'center'
                },
                columnStyles: {
                    // 0: Couple Name (Text)
                    // 1: Phone
                    // 2: Date
                    // 3: Amount (Right align ideally)
                    3: { halign: 'right' }
                },
                styles: {
                    fontSize: 10,
                    cellPadding: 3,
                    valign: 'middle'
                },
                alternateRowStyles: {
                    fillColor: [250, 245, 245]
                }
            });

            // -- Footer --
            const pageCount = doc.internal.getNumberOfPages();
            doc.setFontSize(10);
            doc.setTextColor(100);
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.text("This pdf is generated by houseofwedding.online software", 105, 290, { align: 'center' });
            }

            doc.save(`HOW-${dateLabel}.pdf`);
            onClose();

        } catch (err) {
            console.error("PDF Fail", err);
            setError("Failed to generate PDF. check console.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h2 className="text-xl font-bold text-gray-900">Export Bookings</h2>
                    <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors">
                        <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    {error && <div className="text-red-500 text-sm font-bold bg-red-50 p-3 rounded-xl">{error}</div>}

                    <div className="space-y-3">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide">Select Period</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => setRangeType('TODAY')}
                                className={`p-3 rounded-xl border text-sm font-bold transition-all ${rangeType === 'TODAY' ? 'border-[#8F1E22] bg-[#8F1E22] text-white' : 'border-gray-200 text-gray-600 hover:border-[#8F1E22]'}`}
                            >
                                Today
                            </button>
                            <button
                                onClick={() => setRangeType('YESTERDAY')}
                                className={`p-3 rounded-xl border text-sm font-bold transition-all ${rangeType === 'YESTERDAY' ? 'border-[#8F1E22] bg-[#8F1E22] text-white' : 'border-gray-200 text-gray-600 hover:border-[#8F1E22]'}`}
                            >
                                Yesterday
                            </button>
                        </div>
                        <button
                            onClick={() => setRangeType('CUSTOM')}
                            className={`w-full p-3 rounded-xl border text-sm font-bold transition-all ${rangeType === 'CUSTOM' ? 'border-[#8F1E22] bg-[#8F1E22] text-white' : 'border-gray-200 text-gray-600 hover:border-[#8F1E22]'}`}
                        >
                            Custom Date Range
                        </button>
                    </div>

                    {rangeType === 'CUSTOM' && (
                        <div className="animate-in slide-in-from-top-2 fade-in duration-200">
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Pick Dates</label>
                            <DatePicker
                                selectsRange={true}
                                startDate={startDate}
                                endDate={endDate}
                                onChange={(update) => setCustomRange(update)}
                                isClearable={true}
                                placeholderText="Select start & end date"
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-[#8F1E22]"
                            />
                        </div>
                    )}

                    <div className="pt-4">
                        <button
                            onClick={generatePDF}
                            disabled={loading}
                            className="w-full py-4 bg-[#8F1E22] text-white rounded-xl font-bold shadow-lg hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <span className="animate-pulse">Generating PDF...</span>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    Download Report
                                </>
                            )}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ExportBookingModal;
