import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60; // Max allowed for Vercel Hobby

const N8N_WEBHOOK_URL = "https://d4vbit-n8n.hf.space/webhook/migrar-nomina";

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get("file") as File;
        const jobId = formData.get("job_id") as string;

        if (!file || !jobId) {
            return NextResponse.json(
                { error: "Faltan datos requeridos (file o job_id)" },
                { status: 400 }
            );
        }

        // Leer el archivo en memoria y crear un Blob explícito. 
        // Esto previene errores de 500 en Vercel cuando `fetch` intenta serializar
        // un objeto File de Next.js directamente.
        const fileBuffer = await file.arrayBuffer();
        const fileBlob = new Blob([fileBuffer], { type: file.type || 'application/octet-stream' });

        // Crear una nueva instancia de FormData para Vercel
        const newFormData = new FormData();
        newFormData.append("file", fileBlob, file.name || "archivo.csv");
        newFormData.append("job_id", jobId);

        // Forward it to the real n8n webhook
        console.log(`Enviando a n8n el archivo: ${file.name}, job: ${jobId}`);
        const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
            method: "POST",
            body: newFormData,
        });

        if (!n8nResponse.ok) {
            const errorText = await n8nResponse.text();
            console.error("n8n webhook error:", n8nResponse.status, errorText);
            return NextResponse.json(
                { error: "Error en el webhook de n8n", details: errorText },
                { status: n8nResponse.status }
            );
        }

        const data = await n8nResponse.json().catch(() => ({ ok: true }));
        return NextResponse.json(data);
    } catch (error: any) {
        console.error("Proxy error:", error?.message || error);
        return NextResponse.json(
            { error: "Error interno del proxy", details: error?.message || String(error) },
            { status: 500 }
        );
    }
}
