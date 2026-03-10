"use client";

import { useState, useRef, ChangeEvent, DragEvent } from "react";
import Link from "next/link";

type ConversionType = "replace" | "add" | "remove";

function escapeRegExp(string: string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export default function ConverterPage() {
    const [originalContent, setOriginalContent] = useState("");
    const [convertedContent, setConvertedContent] = useState("");
    const [fileName, setFileName] = useState("");

    // Config states
    const [originalDelimiterType, setOriginalDelimiterType] = useState(";");
    const [customOriginalDelimiter, setCustomOriginalDelimiter] = useState("");
    const [newDelimiter, setNewDelimiter] = useState("#");
    const [conversionType, setConversionType] = useState<ConversionType>("replace");

    // Stats
    const [linesCount, setLinesCount] = useState(0);
    const [replacementsCount, setReplacementsCount] = useState(0);

    // UI state
    const [isDragging, setIsDragging] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = (file: File) => {
        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = (e) => {
            if (e.target?.result) {
                setOriginalContent(e.target.result as string);
                setConvertedContent(""); // clear previous
            }
        };
        reader.readAsText(file, "utf-8");
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

    const getDelimiterValue = () => {
        if (originalDelimiterType === "custom") {
            return customOriginalDelimiter || "#";
        } else if (originalDelimiterType === "\\t") {
            return "\t";
        }
        return originalDelimiterType;
    };

    const handleConvert = () => {
        if (!originalContent) return;

        const originalDelimiter = getDelimiterValue();
        const targetDelimiter = newDelimiter || "#";

        if (originalDelimiter === targetDelimiter) {
            alert("El delimitador original y el nuevo no pueden ser iguales");
            return;
        }

        const lines = originalContent.split(/\r?\n/);

        const cleanLines = lines.filter(line => {
            const trimmedLine = line.trim();
            if (trimmedLine.length === 0) return false;

            const contentWithoutDelimiters = trimmedLine.split(originalDelimiter).join('').trim();
            return contentWithoutDelimiters.length > 0;
        });

        const contentToProcess = cleanLines.join("\n");
        let result = contentToProcess;
        let diffCount = 0;

        const regex = new RegExp(escapeRegExp(originalDelimiter), "g");

        switch (conversionType) {
            case "replace":
                result = contentToProcess.replace(regex, targetDelimiter);
                diffCount = (contentToProcess.match(regex) || []).length;
                break;
            case "add":
                result = contentToProcess.replace(regex, originalDelimiter + targetDelimiter);
                diffCount = (contentToProcess.match(regex) || []).length;
                break;
            case "remove":
                result = contentToProcess.replace(regex, "");
                diffCount = (contentToProcess.match(regex) || []).length;
                break;
        }

        setConvertedContent(result);
        setLinesCount(cleanLines.length);
        setReplacementsCount(diffCount);
    };

    const downloadFile = (format: "csv" | "txt" | "tsv") => {
        if (!convertedContent) return;

        let mimeType = "text/csv;charset=utf-8;";
        let extension = "csv";

        switch (format) {
            case "txt":
                mimeType = "text/plain;charset=utf-8;";
                extension = "txt";
                break;
            case "tsv":
                mimeType = "text/tab-separated-values;charset=utf-8;";
                extension = "tsv";
                break;
            default:
                mimeType = "text/csv;charset=utf-8;";
                extension = "csv";
        }

        const blob = new Blob([convertedContent], { type: mimeType });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);

        const baseName = fileName ? fileName.replace(/\.[^/.]+$/, "") : "documento";
        link.setAttribute("download", `${baseName}_convertido.${extension}`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleClear = () => {
        setOriginalContent("");
        setConvertedContent("");
        setFileName("");
        setOriginalDelimiterType(";");
        setCustomOriginalDelimiter("");
        setNewDelimiter("#");
        setConversionType("replace");
        setLinesCount(0);
        setReplacementsCount(0);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    return (
        <main className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <header className="text-center mb-12 animate-fade-in opacity-0" style={{ animationDelay: '100ms' }}>
                    <div className="mb-6 flex justify-center text-center">
                        <Link href="/" className="inline-flex items-center self-start gap-2 text-sm text-brand-600 hover:text-brand-800 font-medium transition-colors">
                            <span>&larr;</span> Volver al Menú Principal
                        </Link>
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 mb-3">
                        Convertidor de{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-brand-800">
                            Archivos
                        </span>
                    </h1>
                    <p className="text-lg text-slate-500 max-w-xl mx-auto">
                        Sube tu archivo y modifica los delimitadores instantáneamente de forma segura en tu navegador.
                    </p>
                </header>

                <div className="bg-white/80 backdrop-blur-sm shadow-sm border border-slate-200 rounded-2xl p-6 sm:p-8 animate-fade-in opacity-0" style={{ animationDelay: '200ms' }}>

                    {/* Settings Area */}
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold text-slate-800 mb-4 border-b pb-2">Configuración de Conversión</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Delimitador Original</label>
                                <select
                                    value={originalDelimiterType}
                                    onChange={(e) => setOriginalDelimiterType(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 transition-shadow"
                                >
                                    <option value=";">Punto y coma (;)</option>
                                    <option value=",">Coma (,)</option>
                                    <option value="\t">Tabulador</option>
                                    <option value=" ">Espacio</option>
                                    <option value="|">Barra vertical (|)</option>
                                    <option value="custom">Personalizado</option>
                                </select>
                            </div>

                            {originalDelimiterType === "custom" && (
                                <div className="animate-fade-in">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Delimitador Personalizado</label>
                                    <input
                                        type="text"
                                        value={customOriginalDelimiter}
                                        onChange={(e) => setCustomOriginalDelimiter(e.target.value)}
                                        placeholder="Ej: ; o | o tab"
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 transition-shadow"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Nuevo Delimitador</label>
                                <input
                                    type="text"
                                    value={newDelimiter}
                                    onChange={(e) => setNewDelimiter(e.target.value)}
                                    placeholder="Ej: # o ; o ,"
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 transition-shadow"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Conversión</label>
                                <select
                                    value={conversionType}
                                    onChange={(e) => setConversionType(e.target.value as ConversionType)}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-brand-400 transition-shadow"
                                >
                                    <option value="replace">Reemplazar delimitador</option>
                                    <option value="add">Añadir nuevo delimitador</option>
                                    <option value="remove">Eliminar delimitador original</option>
                                </select>
                            </div>
                        </div>
                    </div>

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
                            accept=".csv,.txt,.tsv"
                        />
                        <div className={`mb-4 rounded-xl p-3 transition-colors ${fileName ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"}`}>
                            📁
                        </div>
                        <h3 className="text-sm font-semibold text-slate-700 mb-1">Arrastra aquí o haz clic para seleccionar</h3>
                        <p className="text-xs text-slate-400">Archivos CSV, TXT o TSV</p>

                        {fileName && (
                            <p className="mt-3 text-xs text-emerald-700 font-medium truncate max-w-full px-4">
                                ✓ {fileName}
                            </p>
                        )}
                    </div>

                    {/* Actions Area */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
                        <button
                            onClick={handleConvert}
                            disabled={!originalContent || originalContent === ""}
                            className={`
                                inline-flex items-center justify-center gap-3 px-8 py-3.5
                                rounded-xl font-semibold text-base
                                transition-all duration-200 ease-out
                                focus:outline-none w-full sm:w-auto
                                ${!originalContent
                                    ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                                    : "bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white shadow-lg shadow-brand-200/40 hover:-translate-y-0.5"
                                }
                            `}
                        >
                            Convertir Archivo
                        </button>

                        <div className="flex items-center justify-center gap-3 w-full sm:w-auto flex-wrap">
                            <span className="text-sm font-medium text-slate-600 hidden sm:inline-block">Descargar como:</span>
                            <div className="flex flex-wrap gap-2">
                                <button disabled={!convertedContent} onClick={() => downloadFile('csv')} className="px-3 py-1.5 text-sm font-medium border border-blue-200 text-blue-700 rounded bg-blue-50 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed">CSV</button>
                                <button disabled={!convertedContent} onClick={() => downloadFile('txt')} className="px-3 py-1.5 text-sm font-medium border border-blue-200 text-blue-700 rounded bg-blue-50 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed">TXT</button>
                                <button disabled={!convertedContent} onClick={() => downloadFile('tsv')} className="px-3 py-1.5 text-sm font-medium border border-blue-200 text-blue-700 rounded bg-blue-50 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed">TSV</button>
                            </div>
                        </div>

                        <button
                            onClick={handleClear}
                            className="px-6 py-2.5 text-red-600 bg-red-50 hover:bg-red-100 font-medium rounded-lg transition-colors w-full sm:w-auto"
                        >
                            Limpiar Todo
                        </button>
                    </div>

                </div>

                {/* Result Area */}
                {convertedContent && (
                    <div className="bg-slate-800 rounded-2xl shadow-xl border border-slate-700 overflow-hidden animate-fade-in">
                        <div className="bg-slate-900 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 text-white">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                <span className="text-brand-400">✨</span> Contenido Convertido
                            </h3>
                            <div className="flex gap-4 text-xs font-mono text-slate-300 bg-slate-800 px-4 py-1.5 rounded-lg border border-slate-700">
                                <span>{linesCount.toLocaleString()} líneas detectadas</span>
                                <span>{replacementsCount.toLocaleString()} reemplazos</span>
                            </div>
                        </div>
                        <div className="p-6">
                            <textarea
                                readOnly
                                value={convertedContent}
                                className="w-full h-64 bg-slate-900 text-slate-300 font-mono text-sm resize-none p-4 rounded-xl border border-slate-700 focus:outline-none focus:border-brand-500 custom-scrollbar"
                            />
                        </div>
                    </div>
                )}

            </div>
        </main>
    );
}
