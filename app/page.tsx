"use client";

import { useEffect, useState } from "react";

type PromptMode = "basico" | "premium" | "experto";

const DAILY_LIMIT = 1;
const STORAGE_KEY = "promptlife_daily_usage";
const COUNTER_KEY = "promptlife_total_prompts";

function getTodayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}

export default function HomePage() {
  const [idea, setIdea] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("Marketing");
  const [detail, setDetail] = useState("Profesional");
  const [platform, setPlatform] = useState("ChatGPT");
  const [mode, setMode] = useState<PromptMode>("basico");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [dailyUsed, setDailyUsed] = useState(0);
  const [totalCounter, setTotalCounter] = useState(32541);
  const [visibleMode, setVisibleMode] = useState("Básico");
  const [website, setWebsite] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const today = getTodayKey();

    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.date === today) {
        setDailyUsed(parsed.count || 0);
      } else {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ date: today, count: 0 })
        );
      }
    } else {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ date: today, count: 0 })
      );
    }

    const total = localStorage.getItem(COUNTER_KEY);
    if (total) {
      setTotalCounter(Number(total));
    } else {
      localStorage.setItem(COUNTER_KEY, "32541");
    }
  }, []);

  function updateDailyUsage(nextCount: number) {
    const today = getTodayKey();
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ date: today, count: nextCount })
    );
    setDailyUsed(nextCount);
  }

  function updateTotalCounter(increment: number) {
    const next = totalCounter + increment;
    localStorage.setItem(COUNTER_KEY, String(next));
    setTotalCounter(next);
  }

  async function handleGenerate() {
    if (!idea.trim()) {
      alert("Escribe una idea primero");
      return;
    }

    if (mode === "basico" && dailyUsed >= DAILY_LIMIT) {
      setResult(
        "Error: Ya usaste tu prompt gratis de hoy. Desbloquea Premium o Experto cuando activemos suscripciones."
      );
      return;
    }

    setLoading(true);
    setResult("");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idea,
          email,
          category,
          detail,
          platform,
          mode,
          website,
        }),
      });

      const text = await response.text();
      let data;

      try {
        data = JSON.parse(text);
      } catch {
        setResult(`Error del servidor:\n\n${text}`);
        return;
      }

      if (!response.ok) {
        setResult(`Error: ${data.error || "No se pudo generar el prompt."}`);
        return;
      }

      setResult(data.prompt || "No se generó ningún prompt.");
      setVisibleMode(data.visibleMode || "Básico");

      if (mode === "basico") {
        updateDailyUsage(dailyUsed + 1);
      }

      if (data.counterIncrement) {
        updateTotalCounter(data.counterIncrement);
      }
    } catch (error: any) {
      setResult(
        `Error: ${error?.message || "Ocurrió un error al generar el prompt."}`
      );
    } finally {
      setLoading(false);
    }
  }

  async function translatePrompt() {
    if (!result) return;

    setLoading(true);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          idea: `Traduce al español el siguiente prompt y devuelve únicamente el prompt traducido:\n\n${result}`,
          category,
          detail,
          platform,
          mode: "basico",
          website,
        }),
      });

      const text = await response.text();
      let data;

      try {
        data = JSON.parse(text);
      } catch {
        setResult(`Error del servidor:\n\n${text}`);
        return;
      }

      if (!response.ok) {
        setResult(`Error: ${data.error || "No se pudo traducir el prompt."}`);
        return;
      }

      setResult(data.prompt || result);
    } catch (error: any) {
      setResult(
        `Error: ${error?.message || "Ocurrió un error al traducir."}`
      );
    } finally {
      setLoading(false);
    }
  }

  const dailyRemaining = Math.max(0, DAILY_LIMIT - dailyUsed);

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <section className="mx-auto flex min-h-screen max-w-6xl items-center px-6 py-16">
        <div className="w-full">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
              1 prompt gratis al día · enviado a tu correo
            </div>

            <h1 className="mt-6 text-5xl font-bold tracking-tight md:text-7xl">
              PromptLife
            </h1>

            <p className="mt-6 text-lg leading-8 text-white/70 md:text-xl">
              Convierte cualquier idea en un prompt profesional, claro y listo
              para usar con IA.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm text-white/60">
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                Prompts generados: {totalCounter.toLocaleString()}
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                Gratis restantes hoy: {dailyRemaining}
              </span>
            </div>
          </div>

          <div className="mx-auto mt-12 max-w-4xl rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur md:p-8">
            <div className="mb-5 grid gap-3 md:grid-cols-3">
              <button
                onClick={() => setMode("basico")}
                className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                  mode === "basico"
                    ? "border-white bg-white text-black"
                    : "border-white/10 bg-black/30 text-white hover:bg-white/10"
                }`}
              >
                Básico
              </button>

              <button
                onClick={() => setMode("premium")}
                className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                  mode === "premium"
                    ? "border-white bg-white text-black"
                    : "border-white/10 bg-black/30 text-white hover:bg-white/10"
                }`}
              >
                Premium 🔒
              </button>

              <button
                onClick={() => setMode("experto")}
                className={`rounded-2xl border px-4 py-3 text-sm font-medium transition ${
                  mode === "experto"
                    ? "border-white bg-white text-black"
                    : "border-white/10 bg-black/30 text-white hover:bg-white/10"
                }`}
              >
                Experto 🔒
              </button>
            </div>

            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="Describe tu idea... Ejemplo: quiero un video viral para vender tenis deportivos"
              className="min-h-44 w-full rounded-2xl border border-white/10 bg-black/30 p-5 text-base text-white placeholder:text-white/35 outline-none"
            />

            <input
              type="text"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="hidden"
              tabIndex={-1}
              autoComplete="off"
            />

            <div className="mt-5 grid gap-3 md:grid-cols-4">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded-2xl border border-white/10 bg-black/30 p-3 text-white outline-none"
              >
                <option>Marketing</option>
                <option>Contenido</option>
                <option>Negocios</option>
                <option>Programación</option>
                <option>Automatización</option>
                <option>Educación</option>
              </select>

              <select
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                className="rounded-2xl border border-white/10 bg-black/30 p-3 text-white outline-none"
              >
                <option>Profesional</option>
                <option>Simple</option>
                <option>Experto</option>
              </select>

              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="rounded-2xl border border-white/10 bg-black/30 p-3 text-white outline-none"
              >
                <option>ChatGPT</option>
                <option>Claude</option>
                <option>Gemini</option>
                <option>General</option>
              </select>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Tu correo"
                className="rounded-2xl border border-white/10 bg-black/30 p-3 text-white placeholder:text-white/35 outline-none"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="mt-5 w-full rounded-2xl bg-white px-5 py-4 text-base font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Generando..." : "Generar Prompt Profesional"}
            </button>

            <p className="mt-4 text-center text-sm text-white/55">
              Básico gratis: 1 al día. Premium y Experto estarán disponibles con suscripción.
            </p>
          </div>

          {result && (
            <div className="mx-auto mt-8 max-w-4xl rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm uppercase tracking-widest text-white/50">
                  Prompt generado
                </p>
                <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-white/70">
                  Modo: {visibleMode}
                </span>
              </div>

              <pre className="whitespace-pre-wrap text-sm leading-7 text-white/90">
                {result}
              </pre>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={() => navigator.clipboard.writeText(result)}
                  className="rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
                >
                  Copiar Prompt
                </button>

                <button
                  onClick={translatePrompt}
                  className="rounded-xl border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
                >
                  Traducir al Español
                </button>
              </div>
            </div>
          )}

          <div className="mx-auto mt-8 max-w-4xl rounded-3xl border border-cyan-400/20 bg-cyan-400/5 p-5 text-center">
            <p className="text-sm text-cyan-100/80">
              ¿Probando automatizaciones o registros?
            </p>

            <p className="mt-2 text-lg font-semibold text-cyan-200">
              Usa Quantum Mail para generar correos temporales al instante.
            </p>

            <button className="mt-4 rounded-2xl border border-cyan-300/30 px-5 py-3 text-sm font-medium text-cyan-100 transition hover:bg-cyan-300/10">
              Ir a Quantum Mail
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}