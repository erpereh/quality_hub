"use client";

import { useState } from "react";
import ExcelJS from "exceljs";

interface DownloadButtonProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: any[];
}

export default function DownloadButton({ data }: DownloadButtonProps) {
    const [loading, setLoading] = useState(false);

    const handleDownload = async () => {
        if (!data || data.length === 0) {
            alert("No hay datos para descargar.");
            return;
        }

        setLoading(true);

        try {
            // Crear workbook y worksheet
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("Migración Meta4 → Cegid", {
                pageSetup: { paperSize: 9, orientation: "landscape" }, // A4 landscape
            });

            // Definir columnas con anchos específicos
            const columns = [
                { header: "Concepto", key: "concepto", width: 20 },
                { header: "Fórmula Meta4", key: "meta4_formula", width: 35 },
                { header: "Unidades Meta4", key: "meta4_unidades", width: 30 },
                { header: "Precio Meta4", key: "meta4_precio", width: 18 },
                { header: "Fórmula Cegid XRP", key: "cegid_formula", width: 35 },
                { header: "Unidades Cegid XRP", key: "cegid_unidades", width: 30 },
                { header: "Precio Cegid XRP", key: "cegid_precio", width: 18 },
                { header: "Lógica Aplicada", key: "logica_aplicada", width: 50 },
                { header: "Anotaciones", key: "anotaciones", width: 50 },
            ];

            worksheet.columns = columns;

            // Aplicar estilos a la cabecera
            const headerRow = worksheet.getRow(1);

            headerRow.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FF2574F2" }, // Brand color (azul)
            } as any;

            headerRow.font = {
                bold: true,
                color: { argb: "FFFFFFFF" }, // Blanco
                size: 11,
            };

            headerRow.alignment = {
                horizontal: "center",
                vertical: "center",
                wrapText: true,
            } as any;
            worksheet.getRow(1).height = 35; // Altura para que se vea bien con wrap

            // Agregar datos
            const mappedData = data.map((row) => ({
                concepto: row.concepto || "",
                meta4_formula: row.meta4_formula || "",
                meta4_unidades: row.meta4_unidades || "",
                meta4_precio: row.meta4_precio || "",
                cegid_formula: row.cegid_formula || "",
                cegid_unidades: row.cegid_unidades || "",
                cegid_precio: row.cegid_precio || "",
                logica_aplicada: row.logica_aplicada || "",
                anotaciones: row.anotaciones || "",
            }));

            worksheet.addRows(mappedData);

            // Aplicar estilos a las filas de datos
            worksheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) return; // Saltar cabecera (ya la estilizamos)

                // Alineación y wrap text para todas las celdas
                row.eachCell((cell) => {
                    cell.alignment = {
                        horizontal: "left",
                        vertical: "top",
                        wrapText: true,
                    } as any;

                    // Bordes sutiles
                    cell.border = {
                        top: { style: "thin", color: { argb: "FFD1D5DB" } },
                        left: { style: "thin", color: { argb: "FFD1D5DB" } },
                        bottom: { style: "thin", color: { argb: "FFD1D5DB" } },
                        right: { style: "thin", color: { argb: "FFD1D5DB" } },
                    } as any;

                    // Fuente clara
                    cell.font = {
                        name: "Calibri",
                        size: 10,
                        color: { argb: "FF1F2937" }, // Gris oscuro
                    };
                });

                // Altura mínima para que el wrap sea visible
                row.height = Math.max(30, row.getCell(8).value?.toString().split("\n").length ?? 1 * 15);
            });

            // Congelar la fila de cabecera
            worksheet.views = [{ state: "frozen", ySplit: 1 }];

            // Generar y descargar el archivo
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], {
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `migracion_meta4_cegid_${new Date().toISOString().split("T")[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
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
