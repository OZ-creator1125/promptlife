"use client";

import { useEffect, useState } from "react";

const DAILY_LIMIT = 1;
const STORAGE_KEY = "promptlife_daily_usage";
const COUNTER_KEY = "promptlife_total_prompts";

function getTodayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function HomePage() {
  const [idea, setIdea] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("Marketing");
  const [detail, setDetail] = useState("Profesional");
  const [platform, setPlatform] = useState("ChatGPT");
  const [result, setResult] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [dailyUsed, setDailyUsed] = useState(0);
  const [totalCounter, setTotalCounter] = useState(32541);
  const [copied, setCopied] = useState(false);
  const [sendEmail, setSendEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

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

  useEffect(() => {
    if (!result || timeLeft <= 0) {
      if (timeLeft === 0 && result) {
        setResult("");
      }
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, result]);

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

  function goToPricing(plan: "premium" | "experto") {
    window.location.href = `/pricing?plan=${plan}`;
  }

  async function handleGenerate() {
    if (!idea.trim()) {
      setErrorMessage("Escribe una idea primero.");
      return;
    }

    if (!email.trim()) {
      setErrorMessage("Ingresa tu correo para generar tu prompt.");
      return;
    }

    if (!isValidEmail(email)) {
      setErrorMessage("Ingresa un correo válido.");
      return;
    }

    if (dailyUsed >= DAILY_LIMIT) {
      setErrorMessage(
        "Ya usaste tu prompt gratis de hoy. Desbloquea Premium para seguir."
      );
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setCopied(false);
    setSent(false);

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
        }),
      });

      const text = await response.text();
      let data: any;

      try {
        data = JSON.parse(text);
      } catch {
        setErrorMessage(`Error del servidor:\n\n${text}`);
        return;
      }

      if (!response.ok) {
        setErrorMessage(data.error || "No se pudo generar el prompt.");
        return;
      }

      setResult(data.prompt || "");
      setSendEmail(email);
      setTimeLeft(60);
      updateDailyUsage(dailyUsed + 1);

      if (data.counterIncrement) {
        updateTotalCounter(data.counterIncrement);
      }
    } catch (error: any) {
      setErrorMessage(
        error?.message || "Ocurrió un error al generar el prompt."
      );
    } finally {
      setLoading(false);
    }
  }

  function copyPrompt() {
    if (!result.trim()) return;

    navigator.clipboard.writeText(result);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  }

  async function sendPromptEmail() {
    if (!isValidEmail(sendEmail)) {
      setErrorMessage("Ingresa un correo válido para enviarlo.");
      return;
    }

    if (!result.trim()) {
      setErrorMessage("No hay prompt para enviar.");
      return;
    }

    try {
      const response = await fetch("/api/send-prompt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: sendEmail,
          prompt: result,
        }),
      });

      const text = await response.text();
      let data: any;

      try {
        data = JSON.parse(text);
      } catch {
        setErrorMessage(`Error del servidor:\n\n${text}`);
        return;
      }

      if (!response.ok) {
        setErrorMessage(data.error || "No se pudo enviar el prompt.");
        return;
      }

      setSent(true);
      setErrorMessage("");
    } catch (error: any) {
      setErrorMessage(error?.message || "Error enviando correo.");
    }
  }

  const dailyRemaining = Math.max(0, DAILY_LIMIT - dailyUsed);

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <section className="mx-auto flex min-h-screen max-w-6xl items-center px-6 py-16">
        <div className="w-full">
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
              1 prompt gratis al día · acceso Pro por correo
            </div>

            <h1 className="mt-6 text-5xl font-bold tracking-tight md:text-7xl">
              PromptLife NUEVO
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
              <button className="rounded-2xl border border-white bg-white px-4 py-3 text-sm font-medium text-black transition">
                Básico
              </button>

              <button
                onClick={() => goToPricing("premium")}
                className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Premium 🔒
              </button>

              <button
                onClick={() => goToPricing("experto")}
                className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm font-medium text-white/70 transition hover:bg-white/10"
              >
                Experto (próximamente)
              </button>
            </div>

            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="Describe tu idea... Ejemplo: quiero un video viral para vender tenis deportivos"
              className="min-h-44 w-full rounded-2xl border border-white/10 bg-black/30 p-5 text-base text-white placeholder:text-white/35 outline-none"
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
              Básico gratis: 1 al día. Ingresa tu correo para generar. Premium
              desbloquea prompts ilimitados por $5 USD/mes.
            </p>
          </div>

          {errorMessage && (
            <div className="mx-auto mt-6 max-w-4xl rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
              {errorMessage}
            </div>
          )}

          {result && (
            <div className="mx-auto mt-8 max-w-4xl rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm uppercase tracking-widest text-white/50">
                  Prompt generado
                </p>

                <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-white/70">
                  Modo: básico
                </span>
              </div>

              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-white/70">
                  Se borra en {timeLeft}s
                </span>
              </div>

              <pre className="whitespace-pre-wrap text-sm leading-7 text-white/90">
                {result}
              </pre>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={copyPrompt}
                  className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                    copied
                      ? "border-green-400 bg-green-500 text-white"
                      : "border-white/10 text-white hover:bg-white/10"
                  }`}
                >
                  {copied ? "✓ Copiado" : "Copiar Prompt"}
                </button>
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
                <p className="mb-2 text-sm text-white/80">
                  Este prompt también puede enviarse a tu correo
                </p>

                <input
                  value={sendEmail}
                  onChange={(e) => setSendEmail(e.target.value)}
                  placeholder="Tu correo"
                  className="w-full rounded-2xl border border-white/10 bg-black/30 p-3 text-white placeholder:text-white/35 outline-none"
                />

                <button
                  onClick={sendPromptEmail}
                  className="mt-3 w-full rounded-2xl bg-white p-3 font-semibold text-black transition hover:opacity-90"
                >
                  Enviar a mi correo
                </button>

                {sent && (
                  <p className="mt-2 text-sm text-green-400">
                    ✓ Enviado correctamente
                  </p>
                )}

                <div className="mt-4 text-sm text-white/60">
                  Desbloquea Premium por $5 USD al mes para prompts ilimitados.
                </div>

                <div className="mt-3 text-xs text-cyan-300">
                  No te llenes de spam y protege tu privacidad. Quantum Mail es
                  tu mejor opción para evitar basura y registros invasivos.
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}