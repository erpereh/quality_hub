import { NextRequest, NextResponse } from "next/server";

const N8N_WEBHOOK_URL = "https://d4vbit-n8n.hf.space/webhook/migrar-nomina";

export async function POST(request: NextRequest) {
    try {
        // Read the incoming FormData (file + job_id) from the client
        const formData = await request.formData();

        // Forward it as-is to the real n8n webhook
        const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
            method: "POST",
            body: formData,
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
    } catch (error) {
        console.error("Proxy error:", error);
        return NextResponse.json(
            { error: "Error interno del proxy" },
            { status: 500 }
        );
    }
}
