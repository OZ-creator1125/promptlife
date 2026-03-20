import { NextResponse } from "next/server";

function detectLanguage(text: string) {
  const lower = text.toLowerCase();

  const spanishHints = ["quiero", "necesito", "dame", "crea", "haz"];
  const englishHints = ["i want", "i need", "create", "make"];

  const hasSpanish = spanishHints.some((w) => lower.includes(w));
  const hasEnglish = englishHints.some((w) => lower.includes(w));

  if (hasSpanish && !hasEnglish) return "es";
  if (hasEnglish && !hasSpanish) return "en";

  return /[áéíóúñ¿¡]/i.test(text) ? "es" : "en";
}

function generateFinalPrompt(idea: string, lang: "es" | "en") {
  const cleanIdea = idea.trim();

  if (lang === "es") {
    return `Actúa como un experto en inteligencia artificial, marketing y generación de contenido.

Tu tarea es ejecutar directamente la siguiente solicitud:

${cleanIdea}

Entrega una respuesta estructurada, clara y accionable.

Incluye:
- Estrategia o enfoque principal
- Desarrollo paso a paso
- Ejemplos concretos si aplican
- Recomendaciones prácticas

El resultado debe ser profesional, listo para usarse y orientado a resultados reales.`;
  }

  return `Act as an expert in AI, marketing, and content creation.

Your task is to directly execute the following request:

${cleanIdea}

Deliver a clear, structured, and actionable response.

Include:
- Main strategy or approach
- Step-by-step breakdown
- Concrete examples if applicable
- Practical recommendations

The result must be professional, ready to use, and focused on real outcomes.`;
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

    const lang = detectLanguage(idea);
    const prompt = generateFinalPrompt(idea, lang);

    return NextResponse.json({
      prompt,
      counterIncrement: 1,
    });
  } catch (error: any) {
    console.error("ERROR:", error);

    return NextResponse.json(
      { error: "Error generando prompt." },
      { status: 500 }
    );
  }
}