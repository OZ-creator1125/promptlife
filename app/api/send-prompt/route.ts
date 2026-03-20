import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

function escapeHtml(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const email = body.email?.trim();
    const prompt = body.prompt?.trim();

    if (!email) {
      return NextResponse.json(
        { error: "Falta el correo." },
        { status: 400 }
      );
    }

    if (!prompt) {
      return NextResponse.json(
        { error: "Falta el prompt." },
        { status: 400 }
      );
    }

    const safePrompt = escapeHtml(prompt);

    const response = await resend.emails.send({
      from: "PromptLife <onboarding@resend.dev>",
      to: [email],
      subject: "Tu prompt de PromptLife ya está listo",
      html: `
        <div style="font-family: Arial, sans-serif; background: #0a0a0a; color: #ffffff; padding: 24px;">
          <div style="max-width: 720px; margin: 0 auto; background: #111111; border: 1px solid #222; border-radius: 20px; padding: 24px;">
            <h1 style="margin: 0 0 12px; font-size: 28px;">Tu prompt ya está listo</h1>

            <p style="color: #cfcfcf; line-height: 1.6; margin: 0 0 18px;">
              Aquí está el prompt que generaste en PromptLife:
            </p>

            <div style="background: #0b0b0b; border: 1px solid #2a2a2a; border-radius: 16px; padding: 18px; margin: 0 0 22px;">
              <pre style="white-space: pre-wrap; color: #f3f3f3; font-family: Arial, sans-serif; line-height: 1.7; margin: 0;">${safePrompt}</pre>
            </div>

            <div style="background: rgba(255,255,255,0.03); border: 1px solid #2a2a2a; border-radius: 16px; padding: 18px; margin-bottom: 18px;">
              <h2 style="margin: 0 0 10px; font-size: 18px;">Desbloquea Premium</h2>
              <p style="color: #cfcfcf; line-height: 1.6; margin: 0;">
                Obtén prompts ilimitados, mejor calidad de salida y acceso profesional por solo $5 USD al mes.
              </p>
            </div>

            <div style="background: rgba(34,211,238,0.07); border: 1px solid rgba(34,211,238,0.18); border-radius: 16px; padding: 18px;">
              <h2 style="margin: 0 0 10px; font-size: 18px; color: #a5f3fc;">Evita el spam con Quantum Mail</h2>
              <p style="color: #cfcfcf; line-height: 1.6; margin: 0;">
                No te llenes de basura ni expongas tu correo real en registros innecesarios. Usa Quantum Mail para proteger tu privacidad con correos temporales.
              </p>
            </div>
          </div>
        </div>
      `,
    });

    if ((response as any)?.error) {
      return NextResponse.json(
        { error: (response as any).error.message || "No se pudo enviar el correo." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Correo enviado correctamente.",
    });
  } catch (error: any) {
    console.error("ERROR EN /api/send-prompt:", error);

    return NextResponse.json(
      {
        error: error?.message || "Error del servidor",
      },
      { status: 500 }
    );
  }
}