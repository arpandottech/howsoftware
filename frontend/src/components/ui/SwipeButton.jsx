import React, { useState, useRef, useEffect } from 'react';

const SwipeButton = ({ onComplete, mainText = "Slide to Pay", amount, disabled = false, resetKey }) => {
    const [dragWidth, setDragWidth] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [completed, setCompleted] = useState(false);
    const containerRef = useRef(null);
    const sliderRef = useRef(null);
    const startXRef = useRef(0);

    // Reset state when resetKey changes or if explicitly requested
    useEffect(() => {
        if (!completed) {
            setDragWidth(0);
        }
    }, [resetKey, completed]);

    const handleStart = (clientX) => {
        if (completed || disabled) return;
        setIsDragging(true);
        startXRef.current = clientX;
    };

    const handleMove = (clientX) => {
        if (!isDragging || completed || disabled) return;
        const containerWidth = containerRef.current.clientWidth;
        const sliderWidth = sliderRef.current.clientWidth;
        const maxDrag = containerWidth - sliderWidth - 8; // 8px padding/margin buffer

        let newWidth = clientX - startXRef.current;
        if (newWidth < 0) newWidth = 0;
        if (newWidth > maxDrag) newWidth = maxDrag;

        setDragWidth(newWidth);
    };

    const handleEnd = () => {
        if (!isDragging || completed || disabled) return;
        setIsDragging(false);

        const containerWidth = containerRef.current.clientWidth;
        const sliderWidth = sliderRef.current.clientWidth;
        const maxDrag = containerWidth - sliderWidth - 8;
        const threshold = maxDrag * 0.9; // 90% to complete

        if (dragWidth > threshold) {
            setDragWidth(maxDrag);
            setCompleted(true);
            if (onComplete) onComplete();
        } else {
            setDragWidth(0); // Snap back
        }
    };

    // Mouse Events
    const onMouseDown = (e) => handleStart(e.clientX);
    const onMouseMove = (e) => handleMove(e.clientX);
    const onMouseUp = () => handleEnd();
    const onMouseLeave = () => handleEnd();

    // Touch Events
    const onTouchStart = (e) => handleStart(e.touches[0].clientX);
    const onTouchMove = (e) => handleMove(e.touches[0].clientX);
    const onTouchEnd = () => handleEnd();

    return (
        <div
            className={`relative h-14 rounded-full overflow-hidden select-none transition-all duration-300 ${completed ? 'bg-green-600' : 'bg-green-500'} ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer shadow-lg shadow-green-500/30'}`}
            ref={containerRef}
            onMouseMove={!disabled ? onMouseMove : undefined}
            onMouseUp={!disabled ? onMouseUp : undefined}
            onMouseLeave={!disabled ? onMouseLeave : undefined}
            onTouchMove={!disabled ? onTouchMove : undefined}
            onTouchEnd={!disabled ? onTouchEnd : undefined}
        >
            {/* Background Text */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 transition-opacity duration-300" style={{ opacity: Math.max(0, 1 - dragWidth / 150) }}>
                <span className="text-white font-bold text-lg tracking-wide">
                    {completed ? 'Success!' : `${mainText} ${amount ? '| ' + amount : ''}`}
                </span>
            </div>

            {/* Drag Handle */}
            <div
                ref={sliderRef}
                onMouseDown={!disabled ? onMouseDown : undefined}
                onTouchStart={!disabled ? onTouchStart : undefined}
                className="absolute top-1 left-1 bottom-1 w-12 bg-white rounded-full flex items-center justify-center shadow-md z-20 transition-transform duration-75 ease-out active:scale-95"
                style={{ transform: `translateX(${dragWidth}px)` }}
            >
                {completed ? (
                    <svg className="w-6 h-6 text-green-600 animate-in zoom-in spin-in-180 duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                ) : (
                    <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                )}
            </div>

            {/* Fill Progress Overlay (Optional, for visual smoothness behind handle) */}
            <div
                className="absolute inset-y-0 left-0 bg-green-600 opacity-20 z-0"
                style={{ width: `${dragWidth + 48}px` }}
            />
        </div>
    );
};

export default SwipeButton;
