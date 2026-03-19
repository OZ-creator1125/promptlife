import { NextResponse } from "next/server";

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

    console.log("Enviar email a:", email);
    console.log("Prompt:", prompt);

    return NextResponse.json({
      success: true,
      message: "Prompt listo para enviar",
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