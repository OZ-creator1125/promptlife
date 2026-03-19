import { NextResponse } from "next/server";

function detectLanguage(text: string) {
  const lower = text.toLowerCase();

  const spanishHints = [
    "quiero",
    "necesito",
    "ayúdame",
    "crea",
    "haz",
    "anuncio",
    "ventas",
    "negocio",
    "explica",
    "dime",
    "como",
    "cómo",
  ];

  const englishHints = [
    "i want",
    "i need",
    "help me",
    "create",
    "make",
    "sales",
    "business",
    "explain",
    "tell me",
    "how to",
  ];

  const hasSpanish = spanishHints.some((word) => lower.includes(word));
  const hasEnglish = englishHints.some((word) => lower.includes(word));

  if (hasSpanish && !hasEnglish) return "es";
  if (hasEnglish && !hasSpanish) return "en";

  return /[áéíóúñ¿¡]/i.test(text) ? "es" : "en";
}

function buildPrompt(idea: string, language: "es" | "en") {
  const trimmedIdea = idea.trim();

  if (language === "es") {
    return `Actúa como un experto en la materia más adecuada para resolver esta solicitud.

Objetivo:
Convierte la siguiente idea en una tarea clara, útil y bien estructurada para una IA:

${trimmedIdea}

Instrucciones:
- Interpreta correctamente la intención del usuario.
- Estructura la respuesta de forma clara y accionable.
- Añade contexto útil cuando haga falta.
- Prioriza calidad, claridad y utilidad práctica.
- Entrega una salida lista para usar.

Formato de salida:
Devuelve una respuesta bien organizada, profesional y fácil de aplicar.`;
  }

  return `Act as an expert in the most appropriate field to solve this request.

Goal:
Turn the following idea into a clear, useful, and well-structured task for an AI:

${trimmedIdea}

Instructions:
- Correctly interpret the user's intent.
- Structure the response in a clear and actionable way.
- Add useful context when needed.
- Prioritize quality, clarity, and practical usefulness.
- Deliver an output that is ready to use.

Output format:
Return a well-organized, professional, and easy-to-apply response.`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const idea = body.idea?.trim();

    if (!idea) {
      return NextResponse.json(
        { error: "Escribe una idea primero." },
        { status: 400 }
      );
    }

    const language = detectLanguage(idea);
    const prompt = buildPrompt(idea, language);

    return NextResponse.json({
      prompt,
      counterIncrement: 1,
      visibleMode: "Básico",
    });
  } catch (error: any) {
    console.error("ERROR EN /api/generate:", error);

    return NextResponse.json(
      { error: error?.message || "Error generando prompt." },
      { status: 500 }
    );
  }
}