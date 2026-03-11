"use client";

import { useRef, useState, DragEvent, ChangeEvent } from "react";
import Link from "next/link";

export default function SgelGeneratorPage() {
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const onFile = (f: File) => {
        setFile(f);
        setError(null);
        setSuccess(false);
    };

    const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onFile(e.target.files[0]);
        }
    };

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            onFile(e.dataTransfer.files[0]);
        }
    };

    const handleGenerate = async () => {
        if (!file) return;
        setLoading(true);
        setError(null);
        setSuccess(false);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch("/api/generate-sgel-r", {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                const errBody = await res.json().catch(() => null);
                throw new Error(errBody?.detail || `Error del servidor (${res.status})`);
            }

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "Plantilla_R_Resultado.xlsx";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            setSuccess(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error inesperado");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen px-4 py-12 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-5xl space-y-10">
                <header className="text-center space-y-4 animate-fade-in opacity-0" style={{ animationDelay: "80ms" }}>
                    <div className="flex justify-center">
                        <Link href="/" className="inline-flex items-center gap-2 text-sm text-brand-600 hover:text-brand-800 font-medium transition-colors">
                            <span>&larr;</span> Volver al Menú Principal
                        </Link>
                    </div>
                    <div className="mx-auto max-w-3xl">
                        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
                            Generador de{" "}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 via-brand-700 to-brand-800">
                                Plantilla R
                            </span>
                        </h1>
                        <p className="text-lg text-slate-600 mt-4">
                            Sube tu Excel y deja que la IA transforme tus columnas al formato R seleccionado sin esfuerzo.
                        </p>
                    </div>
                </header>

                <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/80 shadow-lg animate-fade-in opacity-0" style={{ animationDelay: "160ms" }}>
                    <div className="absolute inset-0">
                        <div className="absolute -top-20 -right-24 h-72 w-72 rounded-full bg-brand-200/40 blur-3xl" />
                        <div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-emerald-200/40 blur-3xl" />
                    </div>

                    <div className="relative p-6 sm:p-10">
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-300 ease-out cursor-pointer
                                ${isDragging
                                    ? "border-brand-500 bg-brand-50 scale-[1.01] shadow-lg shadow-brand-200/50"
                                    : file
                                        ? "border-emerald-400 bg-emerald-50/60"
                                        : "border-slate-300 bg-white/70 hover:border-brand-400 hover:bg-brand-50/40"
                                }`}
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={onFileChange}
                                className="hidden"
                                accept=".xlsx,.xls,.csv"
                            />
                            <div className={`rounded-2xl p-4 flex items-center justify-center transition-all duration-300 ${
                                file
                                    ? "bg-emerald-100 text-emerald-600 shadow-inner"
                                    : "bg-slate-100 text-slate-400 border-2 border-dashed border-slate-200"
                                }`}>
                                {file ? (
                                    // Icono de Archivo Cargado (Check)
                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                    </svg>
                                ) : (
                                    // Icono de Subida (Upload)
                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="17 8 12 3 7 8"></polyline>
                                    <line x1="12" y1="3" x2="12" y2="15"></line>
                                    </svg>
                                )}
                            </div>
                            <h3 className="text-base font-semibold text-slate-800">
                                Arrastra tu Excel o haz clic para seleccionar
                            </h3>
                            <p className="text-xs text-slate-500">Formatos soportados: .xlsx, .xls, .csv</p>
                            {file && (
                                <p className="mt-2 text-xs font-medium text-emerald-700 truncate max-w-full px-4">
                                    OK {file.name}
                                </p>
                            )}
                        </div>

                        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
                            <div className="text-sm text-slate-500">
                                El resultado se descargará como{" "}
                                <span className="font-semibold text-slate-700">Plantilla_R_Resultado.xlsx</span>.
                            </div>
                            <button
                                onClick={handleGenerate}
                                disabled={!file || loading}
                                className={`inline-flex items-center justify-center gap-3 rounded-xl px-7 py-3.5 text-base font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2
                                    ${(!file || loading)
                                        ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                                        : "bg-brand-700 text-white hover:bg-brand-800 shadow-lg shadow-brand-200/50 hover:-translate-y-0.5"
                                    }`}
                            >
                                {loading ? (
                                    <>
                                        <svg className="h-5 w-5 animate-spin-slow" viewBox="0 0 24 24" fill="none">
                                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
                                            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                                        </svg>
                                        Procesando...
                                    </>
                                ) : (
                                    <>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                            <polyline points="17 8 12 3 7 8" />
                                            <line x1="12" y1="3" x2="12" y2="15" />
                                        </svg>
                                        Generar Plantilla R
                                    </>
                                )}
                            </button>
                        </div>

                        {loading && (
                            <div className="mt-6 rounded-2xl border border-brand-200 bg-brand-50 px-5 py-4 text-sm text-brand-700">
                                <span className="font-semibold">La IA está mapeando tus columnas al formato SGEL...</span>
                            </div>
                        )}

                        {error && (
                            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
                                <strong className="font-semibold">Error:</strong> {error}
                            </div>
                        )}

                        {success && !loading && !error && (
                            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
                                <strong className="font-semibold">Listo:</strong> Tu archivo SGEL ya está descargado.
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </main>
    );
}
