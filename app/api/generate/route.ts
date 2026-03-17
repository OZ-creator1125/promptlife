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

function getDetailInstruction(detail?: string) {
  const det = (detail || "").toLowerCase();

  if (det === "experto") {
    return "Profundiza bastante, añade contexto útil, criterios más precisos y mayor nivel de calidad en la respuesta.";
  }

  if (det === "simple") {
    return "Mantén la respuesta clara, directa, breve y fácil de usar.";
  }

  return "Haz la respuesta profesional, clara, bien estructurada y lista para obtener un gran resultado.";
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

function buildPremiumPrompt(
  idea: string,
  category?: string,
  detail?: string,
  platform?: string
) {
  const cat = (category || "").toLowerCase();
  const plat = platform || "ChatGPT";
  const detailInstruction = getDetailInstruction(detail);
  const trimmedIdea = idea.trim();

  if (cat.includes("marketing")) {
    return `Rol:
Actúa como un estratega senior en marketing digital, copywriting y conversión.

Objetivo:
Desarrolla una respuesta de alta calidad a partir de esta necesidad:
${trimmedIdea}

Contexto:
La respuesta debe estar pensada para generar interés, persuadir y mover a la acción. Debe sentirse profesional, convincente y útil.

Instrucciones:
- Identifica claramente la intención comercial.
- Construye un mensaje con enfoque en beneficios.
- Incluye un hook potente o apertura fuerte.
- Usa lenguaje persuasivo, claro y orientado a conversión.
- Incorpora una llamada a la acción clara.
- Optimiza el resultado para ${plat}.
- ${detailInstruction}`;
  }

  if (cat.includes("contenido")) {
    return `Rol:
Actúa como un creador de contenido senior especializado en contenido viral, guiones y engagement digital.

Objetivo:
Desarrolla una respuesta de alta calidad a partir de esta idea:
${trimmedIdea}

Contexto:
La respuesta debe captar atención rápido, mantener interés y estar diseñada para rendir bien en contenido digital y redes sociales.

Instrucciones:
- Empieza con un hook fuerte.
- Organiza la respuesta con ritmo y claridad.
- Prioriza atención, retención e impacto.
- Usa lenguaje atractivo, moderno y fácil de consumir.
- Optimiza el resultado para ${plat}.
- ${detailInstruction}`;
  }

  if (cat.includes("negocios")) {
    return `Rol:
Actúa como un consultor estratégico de negocios con enfoque práctico, analítico y orientado a ejecución.

Objetivo:
Desarrolla una respuesta de alta calidad a partir de esta necesidad:
${trimmedIdea}

Contexto:
La respuesta debe ayudar a tomar decisiones, estructurar ideas y orientar acciones concretas con sentido de negocio.

Instrucciones:
- Analiza el objetivo con enfoque estratégico.
- Identifica oportunidades, riesgos o factores importantes.
- Propón pasos accionables y ordenados.
- Mantén claridad, lógica y utilidad práctica.
- Optimiza el resultado para ${plat}.
- ${detailInstruction}`;
  }

  if (cat.includes("programación") || cat.includes("programacion")) {
    return `Rol:
Actúa como un ingeniero de software senior con criterio técnico, buenas prácticas y foco en soluciones robustas.

Objetivo:
Resuelve esta necesidad técnica:
${trimmedIdea}

Contexto:
La respuesta debe ser útil para desarrollo real, con claridad técnica, estructura limpia y enfoque en calidad.

Instrucciones:
- Define correctamente el problema técnico.
- Incluye solución clara y mantenible.
- Usa buenas prácticas de programación.
- Considera errores, estructura y legibilidad.
- Si aplica, pide código, arquitectura o pseudocódigo.
- Optimiza el resultado para ${plat}.
- ${detailInstruction}`;
  }

  if (cat.includes("automatización") || cat.includes("automatizacion")) {
    return `Rol:
Actúa como un experto senior en automatización de procesos, flujos de trabajo y eficiencia operativa.

Objetivo:
Diseña una solución a partir de esta idea:
${trimmedIdea}

Contexto:
La respuesta debe ayudar a construir una automatización útil, clara y lógica, pensando en pasos, disparadores, acciones y resultado esperado.

Instrucciones:
- Identifica el objetivo del flujo.
- Define el trigger inicial.
- Describe las acciones principales paso a paso.
- Considera herramientas, apps o sistemas involucrados.
- Añade lógica, validaciones o manejo de errores si aporta valor.
- Optimiza el resultado para ${plat}.
- ${detailInstruction}`;
  }

  if (cat.includes("educación") || cat.includes("educacion")) {
    return `Rol:
Actúa como un experto en enseñanza, aprendizaje y explicación clara.

Objetivo:
Desarrolla una explicación o respuesta a partir de esta idea:
${trimmedIdea}

Contexto:
La respuesta debe facilitar la comprensión, ordenar el pensamiento y explicar con claridad incluso temas complejos.

Instrucciones:
- Usa un lenguaje claro y preciso.
- Estructura la explicación paso a paso.
- Incluye ejemplos cuando ayuden a entender mejor.
- Adapta el nivel de claridad a una persona que quiere comprender bien el tema.
- Optimiza el resultado para ${plat}.
- ${detailInstruction}`;
  }

  return `Rol:
Actúa como un experto profesional en el área más adecuada para resolver esta necesidad.

Objetivo:
Desarrolla una respuesta de alta calidad a partir de esta idea:
${trimmedIdea}

Contexto:
La respuesta debe interpretar correctamente la intención del usuario y convertirla en una salida útil, clara y bien estructurada.

Instrucciones:
- Comprende el objetivo real detrás de la idea.
- Organiza la respuesta con lógica y claridad.
- Añade contexto útil y ejecución clara.
- Prioriza utilidad real y calidad.
- Optimiza el resultado para ${plat}.
- ${detailInstruction}`;
}

function buildExpertPrompt(
  idea: string,
  category?: string,
  platform?: string
) {
  const cat = (category || "").toLowerCase();
  const plat = platform || "ChatGPT";
  const trimmedIdea = idea.trim();

  const shared = `Incluye:
- supuestos inteligentes cuando falte contexto
- criterios de calidad elevados
- estructura avanzada
- enfoque práctico y estratégico
- optimización para ${plat}`;

  if (cat.includes("marketing")) {
    return `Rol:
Actúa como director de estrategia de marketing, conversión y posicionamiento.

Objetivo:
Crear la mejor respuesta posible para esta necesidad:
${trimmedIdea}

Contexto estratégico:
La respuesta debe maximizar claridad, persuasión, diferenciación y capacidad de convertir interés en acción real.

Instrucciones avanzadas:
${shared}
- define audiencia probable
- propone ángulo de posicionamiento
- resalta beneficios, objeciones y CTA
- haz que el resultado se sienta premium y listo para ejecución`;
  }

  if (cat.includes("contenido")) {
    return `Rol:
Actúa como estratega de contenido de alto rendimiento y storytelling digital.

Objetivo:
Crear la mejor respuesta posible para esta idea:
${trimmedIdea}

Contexto estratégico:
La respuesta debe captar atención, sostener interés y estar diseñada para alto impacto.

Instrucciones avanzadas:
${shared}
- usa narrativa, hook y ritmo
- prioriza claridad y engagement
- añade enfoque de performance y viralidad`;
  }

  if (cat.includes("negocios")) {
    return `Rol:
Actúa como asesor senior en negocio, crecimiento y ejecución estratégica.

Objetivo:
Crear la mejor respuesta posible para esta necesidad:
${trimmedIdea}

Contexto estratégico:
La respuesta debe ayudar a decidir, priorizar y ejecutar con criterio de negocio.

Instrucciones avanzadas:
${shared}
- separa análisis, opciones y recomendación
- identifica riesgos y oportunidades
- aporta pasos claros y priorizados`;
  }

  if (cat.includes("programación") || cat.includes("programacion")) {
    return `Rol:
Actúa como arquitecto de software senior.

Objetivo:
Crear la mejor respuesta posible para esta necesidad:
${trimmedIdea}

Contexto estratégico:
La respuesta debe ser sólida técnicamente, mantenible y pensada para implementación real.

Instrucciones avanzadas:
${shared}
- usa buenas prácticas
- considera escalabilidad y errores
- organiza solución, arquitectura y ejecución`;
  }

  if (cat.includes("automatización") || cat.includes("automatizacion")) {
    return `Rol:
Actúa como arquitecto de automatización y procesos.

Objetivo:
Crear la mejor respuesta posible para esta idea:
${trimmedIdea}

Contexto estratégico:
La respuesta debe diseñar una solución implementable, eficiente y robusta.

Instrucciones avanzadas:
${shared}
- define trigger, pasos, validaciones y errores
- organiza el flujo con lógica clara
- prioriza eficiencia, mantenibilidad y utilidad`;
  }

  if (cat.includes("educación") || cat.includes("educacion")) {
    return `Rol:
Actúa como diseñador instruccional senior.

Objetivo:
Crear la mejor respuesta posible para esta idea:
${trimmedIdea}

Contexto estratégico:
La respuesta debe enseñar con claridad, profundidad y progresión lógica.

Instrucciones avanzadas:
${shared}
- organiza el aprendizaje por pasos
- añade ejemplos útiles
- facilita comprensión profunda sin complicar el lenguaje`;
  }

  return `Rol:
Actúa como un experto senior en la disciplina más adecuada.

Objetivo:
Crear la mejor respuesta posible para esta necesidad:
${trimmedIdea}

Contexto estratégico:
La respuesta debe combinar claridad, profundidad, criterio y utilidad real.

Instrucciones avanzadas:
${shared}
- interpreta correctamente la intención
- ordena la respuesta con lógica premium
- entrega una salida lista para uso profesional`;
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
    const detail = body.detail;
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