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
    return `Actúa como un experto en inteligencia artificial, marketing y generación de contenido.

Tu objetivo es convertir la siguiente idea en un prompt altamente efectivo, claro y orientado a resultados reales.

IDEA:
${trimmedIdea}

INSTRUCCIONES:
- Escribe el prompt como si fuera a usarse directamente en ChatGPT
- Hazlo específico, estructurado y accionable
- Incluye contexto, objetivo claro y formato esperado
- Optimízalo para obtener resultados de alto nivel

FORMATO FINAL:
Entrega únicamente el prompt final listo para copiar, sin explicaciones adicionales.`;
  }

  return `Act as an expert in AI, marketing, and content generation.

Your goal is to turn the following idea into a highly effective, clear, and results-oriented prompt.

IDEA:
${trimmedIdea}

INSTRUCTIONS:
- Write the prompt as if it will be used directly in ChatGPT
- Make it specific, structured, and actionable
- Include context, a clear objective, and the expected format
- Optimize it to get high-level results

FINAL FORMAT:
Return only the final prompt, ready to copy, with no extra explanations.`;
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