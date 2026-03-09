"use client";

import { useRef, useState, DragEvent } from "react";

interface DropZoneProps {
    label: string;
    file: File | null;
    onFile: (file: File) => void;
    icon: "xrp" | "meta4";
}

export default function DropZone({ label, file, onFile, icon }: DropZoneProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files?.[0];
        if (droppedFile) onFile(droppedFile);
    };

    const handleDrag = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    return (
        <div
            className={`
        relative flex flex-col items-center justify-center
        rounded-2xl border-2 border-dashed p-8 cursor-pointer
        transition-all duration-300 ease-out min-h-[200px]
        ${isDragging
                    ? "border-brand-500 bg-brand-50 scale-[1.02] shadow-lg shadow-brand-100/40"
                    : file
                        ? "border-emerald-400 bg-emerald-50/60"
                        : "border-slate-300 bg-white/70 hover:border-brand-400 hover:bg-brand-50/30"
                }
      `}
            onDrop={handleDrop}
            onDragOver={handleDrag}
            onDragLeave={handleDragLeave}
            onClick={() => inputRef.current?.click()}
        >
            <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                    const selected = e.target.files?.[0];
                    if (selected) onFile(selected);
                }}
            />

            {/* Icon */}
            <div
                className={`mb-4 rounded-xl p-3 transition-colors ${file
                        ? "bg-emerald-100 text-emerald-600"
                        : "bg-slate-100 text-slate-400"
                    }`}
            >
                {file ? (
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                ) : (
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="17 8 12 3 7 8" />
                        <line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                )}
            </div>

            {/* Label */}
            <span className="text-sm font-semibold text-slate-700 mb-1">{label}</span>

            {/* Badge */}
            <span
                className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full ${icon === "xrp"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-violet-100 text-violet-700"
                    }`}
            >
                {icon === "xrp" ? "XRP" : "META4"}
            </span>

            {/* File name */}
            {file ? (
                <p className="mt-3 text-xs text-emerald-700 font-medium truncate max-w-full px-4">
                    ✓ {file.name}
                </p>
            ) : (
                <p className="mt-3 text-xs text-slate-400">
                    Arrastra aquí o haz clic para seleccionar
                </p>
            )}
        </div>
    );
}
