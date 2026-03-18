import { NextResponse } from "next/server";

type PromptMode = "basico" | "premium" | "experto";

const ipStore = new Map<string, { count: number; resetAt: number }>();

function getClientIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return "local-ip";
}

function isRateLimited(ip: string) {
  const now = Date.now();
  const record = ipStore.get(ip);

  if (!record || now > record.resetAt) {
    ipStore.set(ip, { count: 1, resetAt: now + 60_000 });
    return false;
  }

  if (record.count >= 10) {
    return true;
  }

  record.count += 1;
  ipStore.set(ip, record);
  return false;
}

function buildBasicPrompt(
  idea: string,
  category?: string,
  platform?: string
) {
  const cat = (category || "").toLowerCase();
  const plat = platform || "ChatGPT";
  const trimmedIdea = idea.trim();

  if (cat.includes("marketing")) {
    return `Actúa como un especialista en marketing digital.

Ayúdame con esta necesidad:
${trimmedIdea}

Quiero una respuesta clara, útil y orientada a resultados.
Optimiza el resultado para ${plat}.`;
  }

  if (cat.includes("contenido")) {
    return `Actúa como un creador de contenido.

Desarrolla esta idea:
${trimmedIdea}

Quiero una respuesta clara, atractiva y lista para usar.
Optimiza el resultado para ${plat}.`;
  }

  if (cat.includes("negocios")) {
    return `Actúa como un consultor de negocios.

Analiza esta idea:
${trimmedIdea}

Quiero una respuesta práctica y accionable.
Optimiza el resultado para ${plat}.`;
  }

  if (cat.includes("programación") || cat.includes("programacion")) {
    return `Actúa como un desarrollador de software.

Resuelve esta necesidad:
${trimmedIdea}

Quiero una respuesta técnica, clara y útil.
Optimiza el resultado para ${plat}.`;
  }

  if (cat.includes("automatización") || cat.includes("automatizacion")) {
    return `Actúa como un experto en automatización.

Ayúdame con esta idea:
${trimmedIdea}

Quiero un flujo claro y práctico.
Optimiza el resultado para ${plat}.`;
  }

  if (cat.includes("educación") || cat.includes("educacion")) {
    return `Actúa como un profesor experto.

Explícame o desarrolla esta idea:
${trimmedIdea}

Quiero claridad, orden y facilidad para entender.
Optimiza el resultado para ${plat}.`;
  }

  return `Actúa como un experto profesional.

Desarrolla una respuesta útil para esta idea:
${trimmedIdea}

Optimiza el resultado para ${plat}.`;
}

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Espera un minuto e inténtalo de nuevo." },
        { status: 429 }
      );
    }

    const body = await req.json();

    const idea = body.idea;
    const category = body.category;
    const platform = body.platform;
    const mode = (body.mode || "basico") as PromptMode;
    const honeypot = body.website || "";

    if (honeypot) {
      return NextResponse.json(
        { error: "Solicitud bloqueada." },
        { status: 400 }
      );
    }

    if (!idea || !idea.trim()) {
      return NextResponse.json(
        { error: "Escribe una idea primero." },
        { status: 400 }
      );
    }

    if (idea.length > 1200) {
      return NextResponse.json(
        { error: "La idea es demasiado larga." },
        { status: 400 }
      );
    }

    if (mode !== "basico") {
      return NextResponse.json(
        { error: "Premium y Experto estarán disponibles para suscriptores." },
        { status: 403 }
      );
    }

    const prompt = buildBasicPrompt(idea, category, platform);

    return NextResponse.json({
      prompt,
      counterIncrement: 1,
      visibleMode: "Básico",
    });
  } catch (error: any) {
    console.error("ERROR EN /api/generate:", error);

    return NextResponse.json(
      {
        error: error?.message || "Error generating prompt",
      },
      { status: 500 }
    );
  }
}
