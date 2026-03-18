import { NextResponse } from "next/server";

function looksSpanish(text: string) {
  const lower = text.toLowerCase();

  const spanishMarkers = [
    "actúa",
    "ayúdame",
    "quiero",
    "respuesta",
    "resultado",
    "optimiza",
    "desarrolla",
    "explica",
  ];

  return spanishMarkers.some(word => lower.includes(word));
}

function translatePrompt(text: string) {

  if (looksSpanish(text)) {
    return text;
  }

  return text
    .replaceAll("Act as", "Actúa como")
    .replaceAll("Help me with this need:", "Ayúdame con esta necesidad:")
    .replaceAll("Develop this idea:", "Desarrolla esta idea:")
    .replaceAll("Analyze this idea:", "Analiza esta idea:")
    .replaceAll("Solve this need:", "Resuelve esta necesidad:")
    .replaceAll("I want a clear response", "Quiero una respuesta clara")
    .replaceAll("useful and results-oriented", "útil y orientada a resultados")
    .replaceAll("Optimize the result for", "Optimiza el resultado para");
}

export async function POST(req: Request) {

  try {

    const body = await req.json();
    const text = body.text;

    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: "No hay texto para traducir." },
        { status: 400 }
      );
    }

    const translated = translatePrompt(text.trim());

    return NextResponse.json({
      prompt: translated
    });

  } catch (error: any) {

    return NextResponse.json(
      { error: error?.message || "Error al traducir." },
      { status: 500 }
    );
  }

}
