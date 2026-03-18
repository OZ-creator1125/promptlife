import { NextResponse } from "next/server";

function looksSpanish(text: string) {
  const lower = text.toLowerCase();
  const spanishMarkers = [
    "actúa como",
    "ayúdame con esta necesidad",
    "desarrolla esta idea",
    "analiza esta idea",
    "resuelve esta necesidad",
    "quiero una respuesta",
    "optimiza el resultado para",
    "clara",
    "útil",
    "resultados",
  ];

  return spanishMarkers.some((marker) => lower.includes(marker));
}

function translateText(text: string) {
  if (looksSpanish(text)) {
    return text;
  }

  let translated = text;

  translated = translated.replaceAll(
    "Act as a digital marketing specialist.",
    "Actúa como un especialista en marketing digital."
  );

  translated = translated.replaceAll(
    "Help me with this need:",
    "Ayúdame con esta necesidad:"
  );

  translated = translated.replaceAll(
    "Develop this idea:",
    "Desarrolla esta idea:"
  );

  translated = translated.replaceAll(
    "Analyze this idea:",
    "Analiza esta idea:"
  );

  translated = translated.replaceAll(
    "Solve this need:",
    "Resuelve esta necesidad:"
  );

  translated = translated.replaceAll(
    "Explain or develop this idea:",
    "Explícame o desarrolla esta idea:"
  );

  translated = translated.replaceAll(
    "I want a clear, useful response focused on results.",
    "Quiero una respuesta clara, útil y orientada a resultados."
  );

  translated = translated.replaceAll(
    "I want a clear, attractive response ready to use.",
    "Quiero una respuesta clara, atractiva y lista para usar."
  );

  translated = translated.replaceAll(
    "I want a practical and actionable response.",
    "Quiero una respuesta práctica y accionable."
  );

  translated = translated.replaceAll(
    "I want a technical, clear and useful response.",
    "Quiero una respuesta técnica, clara y útil."
  );

  translated = translated.replaceAll(
    "I want clarity, order and ease of understanding.",
    "Quiero claridad, orden y facilidad para entender."
  );

  translated = translated.replaceAll(
    "Optimize the result for",
    "Optimiza el resultado para"
  );

  return translated;
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

    const prompt = translateText(text.trim());

    return NextResponse.json({ prompt });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Error al traducir." },
      { status: 500 }
    );
  }
}
