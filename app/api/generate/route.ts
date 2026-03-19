import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const idea = body.idea;
    const email = body.email || null;

    if (!idea || !idea.trim()) {
      return NextResponse.json(
        { error: "Escribe una idea primero." },
        { status: 400 }
      );
    }

    // Generar prompt simple (modo básico)
    const prompt = `Actúa como un experto profesional.

Desarrolla una respuesta útil para esta idea:
${idea}

Optimiza el resultado para ChatGPT.`;

    // Guardar email (lead)
    if (email) {
      await supabaseAdmin.from("leads").upsert([
        {
          email,
        },
      ]);
    }

    // Guardar prompt
    await supabaseAdmin.from("prompts").insert([
      {
        email,
        idea,
        prompt,
        mode: "basico",
      },
    ]);

    // Obtener contador actual
    const { data } = await supabaseAdmin
      .from("stats")
      .select("value")
      .eq("key", "total_prompts")
      .single();

    const current = Number(data?.value || 0);
    const next = current + 1;

    // Actualizar contador
    await supabaseAdmin.from("stats").upsert([
      {
        key: "total_prompts",
        value: next,
      },
    ]);

    return NextResponse.json({
      prompt,
      totalPrompts: next,
    });
  } catch (error: any) {
    console.error(error);

    return NextResponse.json(
      { error: "Error generando prompt" },
      { status: 500 }
    );
  }
}