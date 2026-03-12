import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import * as XLSX from "xlsx";

export const maxDuration = 60;

const BATCH_SIZE = 5;

const SYSTEM_PROMPT = `Eres un consultor técnico senior especializado en nóminas y sistemas de RRHH, experto en migraciones de Meta4 a Cegid XRP. Analiza los conceptos salariales extraídos de Meta4 y tradúcelos a la sintaxis equivalente en Cegid XRP. Tu respuesta DEBE SER ÚNICAMENTE un objeto JSON válido con estas 9 claves exactas:
1. 'concepto': Nombre original.
2. 'meta4_formula': Fórmula original.
3. 'meta4_unidades': Unidades originales.
4. 'meta4_precio': Precio original.
5. 'cegid_formula': Fórmula adaptada a Cegid XRP.
6. 'cegid_unidades': Lógica de unidades adaptada a Cegid XRP.
7. 'cegid_precio': Lógica de precio adaptada a Cegid XRP.
8. 'logica_aplicada': Breve explicación técnica de la transformación.
9. 'anotaciones': Advertencias técnicas.`;

interface RawRow {
    concepto: string;
    formula: string;
    unidades: string;
    precio: string;
}

interface MigracionResult {
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

async function processRow(
    openai: OpenAI,
    row: RawRow
): Promise<MigracionResult> {
    try {
        const completion = await openai.chat.completions.create({
            model: "stepfun/step-3.5-flash:free",
            messages: [
                { role: "system", content: SYSTEM_PROMPT },
                {
                    role: "user",
                    content: `Concepto: ${row.concepto}\nFórmula Meta4: ${row.formula}\nUnidades Meta4: ${row.unidades}\nPrecio Meta4: ${row.precio}`,
                },
            ],
        });

        const raw = completion.choices[0]?.message?.content || "{}";
        // Extract JSON from response (handle markdown code blocks)
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : "{}");

        return {
            concepto: row.concepto,
            meta4_formula: row.formula,
            meta4_unidades: row.unidades,
            meta4_precio: row.precio,
            cegid_formula: parsed.cegid_formula || "",
            cegid_unidades: parsed.cegid_unidades || "",
            cegid_precio: parsed.cegid_precio || "",
            logica_aplicada: parsed.logica_aplicada || "",
            anotaciones: parsed.anotaciones || "",
        };
    } catch (err) {
        return {
            concepto: row.concepto,
            meta4_formula: row.formula,
            meta4_unidades: row.unidades,
            meta4_precio: row.precio,
            cegid_formula: "",
            cegid_unidades: "",
            cegid_precio: "",
            logica_aplicada: "",
            anotaciones: `ERROR: ${err instanceof Error ? err.message : String(err)}`,
        };
    }
}

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json(
                { error: "No se recibió ningún archivo" },
                { status: 400 }
            );
        }

        if (!process.env.OPENROUTER_API_KEY) {
            return NextResponse.json(
                { error: "OPENROUTER_API_KEY no configurada en el servidor" },
                { status: 500 }
            );
        }

        // Parse Excel
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawRows = XLSX.utils.sheet_to_json<string[]>(sheet, {
            header: 1,
        });

        // Map rows: skip header (row 0), skip empty rows
        const rows: RawRow[] = [];
        for (let i = 1; i < rawRows.length; i++) {
            const r = rawRows[i];
            if (!r || !r[0]) continue; // skip empty rows
            rows.push({
                concepto: String(r[0] || ""),
                formula: String(r[1] || ""),
                unidades: String(r[2] || ""),
                precio: String(r[3] || ""),
            });
        }

        if (rows.length === 0) {
            return NextResponse.json(
                { error: "El archivo no contiene filas de datos" },
                { status: 400 }
            );
        }

        // Init OpenRouter client
        const openai = new OpenAI({
            baseURL: "https://openrouter.ai/api/v1",
            apiKey: process.env.OPENROUTER_API_KEY,
        });

        // Process in batches
        const results: MigracionResult[] = [];
        for (let i = 0; i < rows.length; i += BATCH_SIZE) {
            const batch = rows.slice(i, i + BATCH_SIZE);
            const batchResults = await Promise.all(
                batch.map((row) => processRow(openai, row))
            );
            results.push(...batchResults);
        }

        return NextResponse.json(results);
    } catch (error: unknown) {
        const message =
            error instanceof Error ? error.message : String(error);
        console.error("Error en /api/migrar:", message);
        return NextResponse.json(
            { error: "Error interno del servidor", details: message },
            { status: 500 }
        );
    }
}
