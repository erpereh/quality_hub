"use client";

import { useState } from "react";
import * as XLSX from "xlsx";

interface DownloadButtonProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any[];
}

export default function DownloadButton({ data }: DownloadButtonProps) {
    const [loading, setLoading] = useState(false);

    const handleDownload = () => {
        if (!data || data.length === 0) {
            alert("No hay datos para descargar.");
            return;
        }

        setLoading(true);

        try {
            // Map rows to the desired Excel columns
            const excelData = data.map((row) => ({
                "Concepto": row.concepto || "",
                "Fórmula Meta4": row.meta4_formula || "",
                "Unidades Meta4": row.meta4_unidades || "",
                "Precio Meta4": row.meta4_precio || "",
                "Fórmula Cegid XRP": row.cegid_formula || "",
                "Unidades Cegid XRP": row.cegid_unidades || "",
                "Precio Cegid XRP": row.cegid_precio || "",
                "Lógica Aplicada": row.logica_aplicada || "",
                "Anotaciones": row.anotaciones || "",
            }));

            // Create workbook and worksheet
            const ws = XLSX.utils.json_to_sheet(excelData);

            // Auto-size columns based on header width + some padding
            const colWidths = Object.keys(excelData[0]).map((key) => ({
                wch: Math.max(key.length + 4, 18),
            }));
            ws["!cols"] = colWidths;

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Migración Meta4 → Cegid");

            // Generate and download
            XLSX.writeFile(wb, "migracion_meta4_cegid.xlsx");
        } catch (err) {
            console.error("Error generando el Excel:", err);
            alert(err instanceof Error ? err.message : "Error descargando Excel");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleDownload}
            disabled={loading || !data || data.length === 0}
            className={`
        inline-flex items-center gap-2.5 px-6 py-3
        font-semibold rounded-xl
        shadow-md transition-all duration-200 ease-out
        focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2
        ${loading
                    ? "bg-slate-300 text-slate-500 cursor-wait"
                    : (!data || data.length === 0)
                        ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                        : "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-emerald-200/50 hover:shadow-lg hover:shadow-emerald-200/60"
                }
      `}
        >
            {loading ? (
                <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
                        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    Generando…
                </>
            ) : (
                <>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Descargar Excel
                </>
            )}
        </button>
    );
}
