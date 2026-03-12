"use client";

import { useState, useRef, ChangeEvent, DragEvent, useEffect, useMemo } from "react";
import Link from "next/link";
import DownloadButton from "@/components/DownloadButton";
import * as XLSX from "xlsx";

// Detección de entorno para optimizar delays
const isDev = process.env.NODE_ENV === 'development';

interface MigracionRow {
    concepto: string;
    meta4_formula: string;
    meta4_unidades: string;
    meta4_precio: string;
    cegid_formula: string;
    cegid_unidades: string;
    cegid_precio: string;
    logica_aplicada: string;
    anotaciones: string;
}

export type SortKey = keyof MigracionRow;
export type SortDir = "asc" | "desc";

function SortArrow({ active, dir }: { active: boolean; dir: SortDir }) {
    if (!active) {
        return (
            <svg className="ml-1 inline-block w-3 h-3 opacity-30" viewBox="0 0 10 14" fill="currentColor">
                <path d="M5 0L10 5H0z" />
                <path d="M5 14L0 9H10z" />
            </svg>
        );
    }
    return (
        <svg className="ml-1 inline-block w-3 h-3 opacity-90" viewBox="0 0 10 6" fill="currentColor">
            {dir === "asc" ? <path d="M5 0L10 6H0z" /> : <path d="M5 6L0 0H10z" />}
        </svg>
    );
}

export default function MigradorPage() {
    const [fileName, setFileName] = useState("");
    const [fileFile, setFileFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);

    const [results, setResults] = useState<MigracionRow[]>([]);

    // UI State
    const [searchQuery, setSearchQuery] = useState("");
    const [sortKey, setSortKey] = useState<SortKey | null>(null);
    const [sortDir, setSortDir] = useState<SortDir>("asc");

    // Refs for synchronized scrolling
    const topScrollRef = useRef<HTMLDivElement>(null);
    const bottomScrollRef = useRef<HTMLDivElement>(null);
    const tableRef = useRef<HTMLTableElement>(null);
    const [tableWidth, setTableWidth] = useState<number>(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!tableRef.current) return;
        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                setTableWidth(entry.target.scrollWidth);
            }
        });
        observer.observe(tableRef.current);
        return () => observer.disconnect();
    }, [results]);

    const handleTopScroll = () => {
        if (bottomScrollRef.current && topScrollRef.current) {
            bottomScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
        }
    };

    const handleBottomScroll = () => {
        if (topScrollRef.current && bottomScrollRef.current) {
            topScrollRef.current.scrollLeft = bottomScrollRef.current.scrollLeft;
        }
    };

    const handleFile = (file: File) => {
        setFileName(file.name);
        setFileFile(file);
        setResults([]);
        setError(null);
        setProgress(null);
    };

    const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFile(e.target.files[0]);
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
            handleFile(e.dataTransfer.files[0]);
        }
    };

    // Función auxiliar: llamar a la API con reintentos exponenciales
    const fetchWithRetry = async (
        row: { concepto: string; formula: string; unidades: string; precio: string },
        maxRetries: number = 3
    ): Promise<MigracionRow> => {
        let lastError: Error | string = "Error desconocido";

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const response = await fetch("/api/migrar", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(row),
                });

                if (response.ok) {
                    return await response.json();
                }

                lastError = await response.json().catch(() => ({ error: `Error ${response.status}` }));

                // No reintentar en errores 400
                if (response.status === 400) {
                    throw lastError;
                }
            } catch (err) {
                lastError = err instanceof Error ? err.message : String(err);
                console.error(`Intento ${attempt + 1} falló para la fila ${row.concepto}:`, err);

                // Si es el último intento, lanzar error
                if (attempt === maxRetries - 1) {
                    throw lastError;
                }

                // Backoff exponencial: 1s, 2s, 4s en prod; 50ms, 100ms, 200ms en dev
                const baseDelay = isDev ? 50 : 1000;
                const delay = Math.pow(2, attempt) * baseDelay;
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }

        throw lastError;
    };

    // Función auxiliar: procesar hasta N filas simultáneamente (concurrencia limitada)
    const processRowsWithConcurrency = async (
        rows: Array<{ concepto: string; formula: string; unidades: string; precio: string }>,
        maxConcurrent: number = 2
    ) => {
        const processedResults: MigracionRow[] = [];
        let completed = 0;

        for (let i = 0; i < rows.length; i += maxConcurrent) {
            const batch = rows.slice(i, i + maxConcurrent);

            const batchPromises = batch.map(async (row) => {
                try {
                    return await fetchWithRetry(row);
                } catch (err) {
                    const errorMsg = err instanceof Error ? err.message : String(err);
                    console.error(`Error procesando la fila "${row.concepto}":`, err);
                    return {
                        concepto: row.concepto,
                        meta4_formula: row.formula,
                        meta4_unidades: row.unidades,
                        meta4_precio: row.precio,
                        cegid_formula: "",
                        cegid_unidades: "",
                        cegid_precio: "",
                        logica_aplicada: "",
                        anotaciones: `ERROR: ${errorMsg}`,
                    };
                }
            });

            const batchResults = await Promise.all(batchPromises);
            processedResults.push(...batchResults);
            completed += batch.length;

            // Actualizar progreso
            setProgress({ current: completed, total: rows.length });
            setResults([...processedResults]);
        }

        return processedResults;
    };

    const handleProcess = async () => {
        if (!fileFile) return;
        setIsProcessing(true);
        setResults([]);
        setError(null);
        setProgress(null);

        try {
            // Parse Excel en el cliente
            const buffer = await fileFile.arrayBuffer();
            const workbook = XLSX.read(buffer, { type: "array" });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rawRows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });

            // Mapear filas: saltar cabecera (fila 0) y filas vacías
            const rows: Array<{ concepto: string; formula: string; unidades: string; precio: string }> = [];
            for (let i = 1; i < rawRows.length; i++) {
                const r = rawRows[i];
                if (!r || !r[0]) continue;
                rows.push({
                    concepto: String(r[0] || ""),
                    formula: String(r[1] || ""),
                    unidades: String(r[2] || ""),
                    precio: String(r[3] || ""),
                });
            }

            if (rows.length === 0) {
                setError("El archivo no contiene filas de datos");
                setIsProcessing(false);
                return;
            }

            // Procesar con concurrencia limitada a 2 y reintentos automáticos
            await processRowsWithConcurrency(rows, 2);
            setProgress(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al procesar el archivo");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
        } else {
            setSortKey(key);
            setSortDir("asc");
        }
    };

    const visibleData = useMemo(() => {
        let rows = [...results];

        if (searchQuery.trim()) {
            const q = searchQuery.trim().toLowerCase();
            rows = rows.filter(
                (r) =>
                    (r.concepto && r.concepto.toLowerCase().includes(q)) ||
                    (r.meta4_formula && r.meta4_formula.toLowerCase().includes(q)) ||
                    (r.cegid_formula && r.cegid_formula.toLowerCase().includes(q)) ||
                    (r.meta4_unidades && r.meta4_unidades.toLowerCase().includes(q)) ||
                    (r.cegid_unidades && r.cegid_unidades.toLowerCase().includes(q))
            );
        }

        if (sortKey) {
            rows.sort((a, b) => {
                const av = String(a[sortKey] || "").toLowerCase();
                const bv = String(b[sortKey] || "").toLowerCase();
                if (av < bv) return sortDir === "asc" ? -1 : 1;
                if (av > bv) return sortDir === "asc" ? 1 : -1;
                return 0;
            });
        }
        return rows;
    }, [results, searchQuery, sortKey, sortDir]);

    const totalCols = 8;

    return (
        <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-[1600px] mx-auto space-y-8">
                {/* Header */}
                <header className="text-center mb-12 animate-fade-in opacity-0" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
                    <div className="mb-6 flex justify-center text-center">
                        <Link href="/" className="inline-flex items-center self-start gap-2 text-sm text-brand-600 hover:text-brand-800 font-medium transition-colors">
                            <span>&larr;</span> Volver al Menú Principal
                        </Link>
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 mb-3">
                        Migrador de{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-brand-800">
                            Nóminas
                        </span>
                    </h1>
                    <p className="text-lg text-slate-500 max-w-xl mx-auto">
                        Transforma pseudocódigo y lógicas de convenio automáticamente utilizando IA.
                    </p>
                </header>

                {/* Upload Panel */}
                <div className="bg-white/80 backdrop-blur-sm shadow-sm border border-slate-200 rounded-2xl p-6 sm:p-8 animate-fade-in opacity-0 max-w-4xl mx-auto" style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}>

                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`
                            relative flex flex-col items-center justify-center mb-8
                            rounded-2xl border-2 border-dashed p-8 cursor-pointer
                            transition-all duration-300 ease-out min-h-[200px]
                            ${isDragging
                                ? "border-brand-500 bg-brand-50 scale-[1.02] shadow-lg shadow-brand-100/40"
                                : fileName
                                    ? "border-emerald-400 bg-emerald-50/60"
                                    : "border-slate-300 bg-white/70 hover:border-brand-400 hover:bg-brand-50/30"
                            }
                        `}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={onFileChange}
                            className="hidden"
                            accept=".csv,.xlsx,.xls"
                        />
                        <div className={`mb-4 rounded-xl p-3 transition-colors ${fileName ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"}`}>
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                        </div>
                        <h3 className="text-sm font-semibold text-slate-700 mb-1">Arrastra aquí o haz clic para seleccionar</h3>
                        <p className="text-xs text-slate-400">Sube tu archivo de extracción de Meta4 (.xlsx, .csv)</p>

                        {fileName && (
                            <p className="mt-3 text-xs text-emerald-700 font-medium truncate max-w-full px-4">
                                ✓ {fileName}
                            </p>
                        )}
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-center pt-4 border-t border-slate-100">
                        <button
                            onClick={handleProcess}
                            disabled={!fileFile || isProcessing}
                            className={`
                                inline-flex items-center justify-center gap-3 px-8 py-3.5
                                rounded-xl font-semibold text-base
                                transition-all duration-200 ease-out
                                focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2
                                w-full sm:w-auto min-w-[260px]
                                ${(!fileFile)
                                    ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                                    : isProcessing
                                        ? "bg-brand-400 text-white cursor-wait"
                                        : "bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white shadow-lg shadow-brand-200/40 hover:shadow-xl hover:-translate-y-0.5"
                                }
                            `}
                        >
                            {isProcessing ? (
                                <>
                                    <svg className="animate-spin-slow h-5 w-5" viewBox="0 0 24 24" fill="none">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
                                        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                                    </svg>
                                    {progress ? `Procesando ${progress.current} / ${progress.total}...` : "Procesando con IA..."}
                                </>
                            ) : (
                                <>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                                        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                                        <line x1="12" y1="22.08" x2="12" y2="12" />
                                    </svg>
                                    Transformar con IA
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Results Section */}
                {results.length > 0 && (
                    <section className="space-y-6 animate-fade-in opacity-0" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
                        {/* Filters and Actions Bar */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-2 gap-4">
                            <div className="relative w-full sm:w-72">
                                <svg
                                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
                                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                </svg>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Buscar por concepto o fórmula..."
                                    className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 bg-white shadow-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 transition-shadow"
                                />
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="text-sm text-slate-500 bg-white border border-slate-200 px-4 py-2 rounded-lg shadow-sm">
                                    {isProcessing ? (
                                        <>Procesando <strong className="text-slate-800">{progress?.current}</strong> / <strong className="text-slate-800">{progress?.total}</strong></>
                                    ) : (
                                        <>Mostrando <strong className="text-slate-800">{visibleData.length}</strong> de <strong className="text-slate-800">{results.length}</strong> filas</>
                                    )}
                                </div>
                                <DownloadButton data={visibleData as any[]} />
                            </div>
                        </div>

                        {/* Table with grouped headers */}
                        <div className="w-full space-y-2">
                            <div ref={topScrollRef} onScroll={handleTopScroll} className="overflow-x-auto w-full">
                                <div style={{ height: "1px", width: tableWidth ? `${tableWidth}px` : "100%" }}></div>
                            </div>

                            <div ref={bottomScrollRef} onScroll={handleBottomScroll} className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                                <table ref={tableRef} className="w-full text-left" style={{ minWidth: '1200px' }}>
                                    <thead>
                                        {/* Group header row */}
                                        <tr className="bg-brand-900 text-white text-[10px] uppercase tracking-widest">
                                            <th className="px-3 py-2 font-bold rounded-tl-xl border-r border-brand-700" rowSpan={1}>
                                            </th>
                                            <th className="px-3 py-2 font-bold text-center border-r border-brand-700" colSpan={3}>
                                                <span className="inline-flex items-center gap-1.5">
                                                    <span className="w-2 h-2 rounded-full bg-slate-300 inline-block"></span>
                                                    Meta4
                                                </span>
                                            </th>
                                            <th className="px-3 py-2 font-bold text-center border-r border-brand-700" colSpan={3}>
                                                <span className="inline-flex items-center gap-1.5">
                                                    <span className="w-2 h-2 rounded-full bg-brand-400 inline-block"></span>
                                                    Cegid XRP
                                                </span>
                                            </th>
                                            <th className="px-3 py-2 font-bold rounded-tr-xl"></th>
                                        </tr>
                                        {/* Sub-header row */}
                                        <tr className="bg-brand-800 text-white text-[11px] uppercase tracking-wider">
                                            <th className="px-3 py-3 font-semibold cursor-pointer select-none hover:bg-brand-700 transition-colors border-r border-brand-700 min-w-[160px]" onClick={() => handleSort("concepto")}>
                                                Concepto <SortArrow active={sortKey === "concepto"} dir={sortDir} />
                                            </th>
                                            {/* META4 sub-columns */}
                                            <th className="px-3 py-3 font-semibold cursor-pointer select-none hover:bg-brand-700 transition-colors min-w-[200px]" onClick={() => handleSort("meta4_formula")}>
                                                Fórmula <SortArrow active={sortKey === "meta4_formula"} dir={sortDir} />
                                            </th>
                                            <th className="px-3 py-3 font-semibold cursor-pointer select-none hover:bg-brand-700 transition-colors min-w-[100px]" onClick={() => handleSort("meta4_unidades")}>
                                                Uds <SortArrow active={sortKey === "meta4_unidades"} dir={sortDir} />
                                            </th>
                                            <th className="px-3 py-3 font-semibold cursor-pointer select-none hover:bg-brand-700 transition-colors border-r border-brand-700 min-w-[100px]" onClick={() => handleSort("meta4_precio")}>
                                                Precio <SortArrow active={sortKey === "meta4_precio"} dir={sortDir} />
                                            </th>
                                            {/* CEGID sub-columns */}
                                            <th className="px-3 py-3 font-semibold cursor-pointer select-none hover:bg-brand-700 transition-colors min-w-[200px]" onClick={() => handleSort("cegid_formula")}>
                                                Fórmula <SortArrow active={sortKey === "cegid_formula"} dir={sortDir} />
                                            </th>
                                            <th className="px-3 py-3 font-semibold cursor-pointer select-none hover:bg-brand-700 transition-colors min-w-[100px]" onClick={() => handleSort("cegid_unidades")}>
                                                Uds <SortArrow active={sortKey === "cegid_unidades"} dir={sortDir} />
                                            </th>
                                            <th className="px-3 py-3 font-semibold cursor-pointer select-none hover:bg-brand-700 transition-colors border-r border-brand-700 min-w-[100px]" onClick={() => handleSort("cegid_precio")}>
                                                Precio <SortArrow active={sortKey === "cegid_precio"} dir={sortDir} />
                                            </th>
                                            {/* Lógica y Anotaciones */}
                                            <th className="px-3 py-3 font-semibold cursor-pointer select-none hover:bg-brand-700 transition-colors min-w-[220px]" onClick={() => handleSort("logica_aplicada")}>
                                                Lógica y Anotaciones <SortArrow active={sortKey === "logica_aplicada"} dir={sortDir} />
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {visibleData.map((row, i) => (
                                            <tr key={i} className="table-row-hover">
                                                {/* Concepto */}
                                                <td className="px-3 py-3 text-sm font-medium text-slate-800 whitespace-nowrap border-r border-slate-100">
                                                    {row.concepto}
                                                </td>
                                                {/* Meta4 */}
                                                <td className="px-3 py-3 text-sm text-slate-600 font-mono bg-slate-50/30">
                                                    {row.meta4_formula}
                                                </td>
                                                <td className="px-3 py-3 text-sm text-slate-500 bg-slate-50/30 text-center">
                                                    {row.meta4_unidades}
                                                </td>
                                                <td className="px-3 py-3 text-sm text-slate-500 bg-slate-50/30 text-right border-r border-slate-100">
                                                    {row.meta4_precio}
                                                </td>
                                                {/* Cegid XRP */}
                                                <td className="px-3 py-3 text-sm text-brand-700 font-mono bg-brand-50/20">
                                                    {row.cegid_formula}
                                                </td>
                                                <td className="px-3 py-3 text-sm text-brand-600 bg-brand-50/20 text-center">
                                                    {row.cegid_unidades}
                                                </td>
                                                <td className="px-3 py-3 text-sm text-brand-600 bg-brand-50/20 text-right border-r border-slate-100">
                                                    {row.cegid_precio}
                                                </td>
                                                {/* Lógica y Anotaciones */}
                                                <td className="px-3 py-3 text-sm text-slate-600">
                                                    <div className="flex flex-col gap-1">
                                                        <span>{row.logica_aplicada}</span>
                                                        {row.anotaciones && (
                                                            <span className="text-xs text-amber-600 font-medium">⚠ {row.anotaciones}</span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {visibleData.length === 0 && isProcessing && (
                                            <tr>
                                                <td colSpan={totalCols} className="px-6 py-8 text-center text-sm text-slate-500">
                                                    Procesando fila {progress?.current} de {progress?.total}...
                                                </td>
                                            </tr>
                                        )}
                                        {visibleData.length === 0 && !isProcessing && (
                                            <tr>
                                                <td colSpan={totalCols} className="px-6 py-8 text-center text-sm text-slate-500">
                                                    No hay resultados.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </section>
                )}
            </div>
        </main>
    );
}
