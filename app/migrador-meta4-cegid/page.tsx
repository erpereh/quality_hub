"use client";

import { useState, useRef, ChangeEvent, DragEvent } from "react";
import Link from "next/link";

interface MockResult {
    id: number;
    concepto: string;
    formulaMeta4: string;
    formulaCegid: string;
    logica: string;
}

const mockResults: MockResult[] = [
    {
        id: 1,
        concepto: "Sueldo Base",
        formulaMeta4: "GET_CONCEPTO('SBASE') * DIAS_TRABAJADOS / 30",
        formulaCegid: "Variables.SBASE * Empleado.DiasActivos / 30",
        logica: "Se sustituye la función de obtención por acceso directo a Variables.",
    },
    {
        id: 2,
        concepto: "Plus Transporte",
        formulaMeta4: "IF(DISTANCIA > 20, 150.00, 50.00)",
        formulaCegid: "IIF(Empleado.DistanciaCentro > 20, 150.00, 50.00)",
        logica: "Reemplazo de condicional y mapeo de variable de distancia.",
    },
    {
        id: 3,
        concepto: "IRPF",
        formulaMeta4: "CALC_IRPF(BASE_IMPONIBLE, TIPOS_IRPF)",
        formulaCegid: "FuncionesLegales.CalculoIRPF(Nomina.BaseImponible)",
        logica: "Refactorización a la librería de funciones legales nativa de Cegid.",
    }
];

export default function MigradorPage() {
    const [fileName, setFileName] = useState("");
    const [fileFile, setFileFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [results, setResults] = useState<MockResult[] | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = (file: File) => {
        setFileName(file.name);
        setFileFile(file);
        setResults(null); // Clear previous results on new upload
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

    const handleProcess = async () => {
        if (!fileFile) return;

        setIsProcessing(true);

        try {
            // Scaffold validation and FormData logic for future n8n integration
            const formData = new FormData();
            formData.append("file", fileFile);

            /*
            // Future API Call
            const response = await fetch("YOUR_N8N_WEBHOOK_URL", {
                method: "POST",
                body: formData,
            });
            const data = await response.json();
            */

            // Simulate network latency
            await new Promise((resolve) => setTimeout(resolve, 2500));

            // Set mock results for UI
            setResults(mockResults);

        } catch (error) {
            console.error("Error procesando el archivo:", error);
            alert("Error al procesar el archivo. Inténtalo de nuevo.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleClear = () => {
        setFileName("");
        setFileFile(null);
        setResults(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleDownload = () => {
        alert("Integrar lógica de descarga del nuevo formato...");
    };

    return (
        <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <header className="text-center mb-12 animate-fade-in opacity-0" style={{ animationDelay: '100ms' }}>
                    <div className="mb-6 flex justify-center text-center">
                        <Link href="/" className="inline-flex items-center self-start gap-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors">
                            <span>&larr;</span> Volver al Menú Principal
                        </Link>
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 mb-3">
                        Migrador de Fórmulas{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">
                            Meta4 a Cegid
                        </span>
                    </h1>
                    <p className="text-lg text-slate-500 max-w-xl mx-auto">
                        Transforma pseudocódigo y lógicas de convenio automáticamente utilizando Inteligencia Artificial.
                    </p>
                </header>

                <div className="bg-white/80 backdrop-blur-sm shadow-sm border border-slate-200 rounded-2xl p-6 sm:p-8 animate-fade-in opacity-0 max-w-4xl mx-auto" style={{ animationDelay: '200ms' }}>

                    {/* Dropzone Area */}
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
                                ? "border-indigo-500 bg-indigo-50 scale-[1.02] shadow-lg shadow-indigo-100/40"
                                : fileName
                                    ? "border-emerald-400 bg-emerald-50/60"
                                    : "border-slate-300 bg-white/70 hover:border-indigo-400 hover:bg-indigo-50/30"
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
                            ⚡
                        </div>
                        <h3 className="text-sm font-semibold text-slate-700 mb-1">Arrastra aquí o haz clic para seleccionar</h3>
                        <p className="text-xs text-slate-400">Sube tu archivo de extracción de Meta4 (.xlsx, .csv)</p>

                        {fileName && (
                            <p className="mt-3 text-xs text-emerald-700 font-medium truncate max-w-full px-4">
                                ✓ {fileName}
                            </p>
                        )}
                    </div>

                    {/* Actions Area */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
                        <button
                            onClick={handleProcess}
                            disabled={!fileFile || isProcessing}
                            className={`
                                inline-flex items-center justify-center gap-3 px-8 py-3.5
                                rounded-xl font-semibold text-base
                                transition-all duration-200 ease-out
                                focus:outline-none w-full sm:w-auto min-w-[240px]
                                ${!fileFile
                                    ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                                    : isProcessing
                                        ? "bg-indigo-400 text-white cursor-wait"
                                        : "bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-lg shadow-indigo-200/40 hover:-translate-y-0.5"
                                }
                            `}
                        >
                            {isProcessing ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Transformando IA...
                                </>
                            ) : (
                                "Transformar con IA"
                            )}
                        </button>

                        <button
                            onClick={handleClear}
                            disabled={isProcessing}
                            className="px-6 py-2.5 text-red-600 bg-red-50 hover:bg-red-100 font-medium rounded-lg transition-colors w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Limpiar Todo
                        </button>
                    </div>
                </div>

                {/* Results Dashboard */}
                {results && (
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-fade-in opacity-0" style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}>
                        <div className="bg-slate-800 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 text-white">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                <span className="text-emerald-400">✅</span> Análisis Completado
                            </h3>
                            <button
                                onClick={handleDownload}
                                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-lg transition-colors flex items-center gap-2 shadow-sm"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                                Descargar Resultado
                            </button>
                        </div>

                        <div className="p-0 overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Concepto</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-[30%]">Fórmula Meta4</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider w-[30%]">Fórmula Cegid XRP</th>
                                        <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Lógica y Anotaciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {results.map((row) => (
                                        <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-slate-800 text-sm whitespace-nowrap">
                                                {row.concepto}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500 font-mono bg-slate-50/30">
                                                {row.formulaMeta4}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-indigo-700 font-mono bg-indigo-50/20">
                                                {row.formulaCegid}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                <div className="flex items-start gap-2">
                                                    <span className="text-xl leading-none opacity-50 mt-[-2px]">💡</span>
                                                    <span>{row.logica}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
