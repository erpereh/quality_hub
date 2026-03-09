"use client";

interface Row {
    nombre: string;
    id_empleado: string;
    empresa: string;
    devengos_xrp: number;
    deducciones_xrp: number;
    liquido_xrp: number;
    devengos_meta4: number;
    deducciones_meta4: number;
    liquido_meta4: number;
    diferencia: number;
    _merge: string;
}

export type SortKey = keyof Row;
export type SortDir = "asc" | "desc";

interface ResultsTableProps {
    data: Row[];
    sortKey: SortKey | null;
    sortDir: SortDir;
    onSort: (key: SortKey) => void;
}

function formatNum(n: number): string {
    return n.toLocaleString("es-ES", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

const columns: { key: SortKey; label: string; numeric: boolean }[] = [
    { key: "nombre", label: "Nombre", numeric: false },
    { key: "id_empleado", label: "ID Empleado", numeric: false },
    { key: "empresa", label: "Empresa", numeric: false },
    { key: "devengos_xrp", label: "Devengos XRP", numeric: true },
    { key: "deducciones_xrp", label: "Deducciones XRP", numeric: true },
    { key: "liquido_xrp", label: "LÍQUIDO XRP", numeric: true },
    { key: "devengos_meta4", label: "Devengos META4", numeric: true },
    { key: "deducciones_meta4", label: "Deducciones META4", numeric: true },
    { key: "liquido_meta4", label: "LÍQUIDO META4", numeric: true },
    { key: "diferencia", label: "DIFERENCIA", numeric: true },
    { key: "_merge", label: "Sistema", numeric: false },
];

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

function StatusBadge({ merge }: { merge: string }) {
    if (merge === "both") {
        return <span className="inline-flex py-0.5 px-2 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-700">Ambos</span>;
    }
    if (merge === "left_only") {
        return <span className="inline-flex py-0.5 px-2 rounded-full text-[11px] font-medium bg-blue-100 text-blue-700">Solo Meta4</span>;
    }
    return <span className="inline-flex py-0.5 px-2 rounded-full text-[11px] font-medium bg-purple-100 text-purple-700">Solo XRP</span>;
}

export default function ResultsTable({
    data,
    sortKey,
    sortDir,
    onSort,
}: ResultsTableProps) {
    return (
        <div className="w-full">
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-brand-800 text-white text-[11px] uppercase tracking-wider">
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    className={`px-3 py-3 font-semibold cursor-pointer select-none hover:bg-brand-700 transition-colors ${col.numeric ? "text-right" : ""
                                        } ${col.key === "nombre" ? "rounded-tl-xl" : ""} ${col.key === "_merge" ? "rounded-tr-xl" : ""
                                        }`}
                                    onClick={() => onSort(col.key)}
                                >
                                    {col.label}
                                    <SortArrow active={sortKey === col.key} dir={sortDir} />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {data.map((row, i) => {
                            const hasDiff = Math.abs(row.diferencia) > 0.01;
                            return (
                                <tr
                                    key={i}
                                    className={`table-row-hover ${hasDiff ? "bg-red-50" : ""}`}
                                >
                                    <td className="px-3 py-2.5 text-sm text-slate-700 whitespace-nowrap max-w-[200px] truncate">
                                        {row.nombre}
                                    </td>
                                    <td className="px-3 py-2.5 text-sm font-medium text-slate-700 whitespace-nowrap">
                                        {row.id_empleado}
                                    </td>
                                    <td className="px-3 py-2.5 text-sm text-slate-600 whitespace-nowrap max-w-[180px] truncate">
                                        {row.empresa}
                                    </td>
                                    <td className="px-3 py-2.5 text-right font-mono text-sm">
                                        {formatNum(row.devengos_xrp)}
                                    </td>
                                    <td className="px-3 py-2.5 text-right font-mono text-sm">
                                        {formatNum(row.deducciones_xrp)}
                                    </td>
                                    <td className="px-3 py-2.5 text-right font-mono text-sm font-semibold">
                                        {formatNum(row.liquido_xrp)}
                                    </td>
                                    <td className="px-3 py-2.5 text-right font-mono text-sm">
                                        {formatNum(row.devengos_meta4)}
                                    </td>
                                    <td className="px-3 py-2.5 text-right font-mono text-sm">
                                        {formatNum(row.deducciones_meta4)}
                                    </td>
                                    <td className="px-3 py-2.5 text-right font-mono text-sm font-semibold">
                                        {formatNum(row.liquido_meta4)}
                                    </td>
                                    <td
                                        className={`px-3 py-2.5 text-right font-mono text-sm font-bold ${hasDiff ? "text-red-700" : "text-emerald-600"
                                            }`}
                                    >
                                        {formatNum(row.diferencia)}
                                    </td>
                                    <td className="px-3 py-2.5 text-center whitespace-nowrap">
                                        <StatusBadge merge={row._merge} />
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
