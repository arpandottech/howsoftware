import React, { useState, useEffect, useRef } from 'react';
import api from '../../api/axios';

const StudioAutocomplete = ({ value, onChange, required, label = "Photography Studio" }) => {
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const timeoutRef = useRef(null);

    const handleInputChange = (e) => {
        const val = e.target.value;
        onChange(e); // Propagate change to parent

        // Clear existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        if (val.length > 1) {
            // Set new timeout
            timeoutRef.current = setTimeout(async () => {
                try {
                    const res = await api.get(`/bookings/studios?q=${encodeURIComponent(val)}`);
                    if (res.data.success) {
                        setSuggestions(res.data.data);
                        setShowSuggestions(true);
                    }
                } catch (err) {
                    console.error("Failed to fetch studios", err);
                }
            }, 300); // 300ms debounce
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const handleSelect = (name) => {
        // Create a fake event to pass back to parent's handleChange
        const event = {
            target: {
                name: 'photographyName', // Hardcoded as per usage, or could be passed via prop
                value: name
            }
        };
        onChange(event);
        setShowSuggestions(false);
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <label className="block text-xs font-bold text-text-secondary mb-1.5 uppercase tracking-wide">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
                type="text"
                name="photographyName"
                value={value}
                onChange={handleInputChange}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder:text-gray-300"
                placeholder={`Enter ${label.toLowerCase()}`}
                required={required}
                autoComplete="off"
            />

            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute z-[60] w-full bg-white border border-gray-100 rounded-xl shadow-xl mt-1 max-h-48 overflow-y-auto custom-scrollbar">
                    {suggestions.map((studio) => (
                        <div
                            key={studio._id}
                            onClick={() => handleSelect(studio.name)}
                            className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm font-medium text-gray-700"
                        >
                            {studio.name}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default StudioAutocomplete;
