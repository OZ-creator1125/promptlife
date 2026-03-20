"use client";

import { useEffect, useState } from "react";

const DAILY_LIMIT = 1;
const STORAGE_KEY = "promptlife_daily_usage";
const COUNTER_KEY = "promptlife_total_prompts";
const TEST_MODE = process.env.NEXT_PUBLIC_TEST_MODE === "true";

function getTodayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function HomePage() {
  const [idea, setIdea] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [sendEmail, setSendEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [dailyUsed, setDailyUsed] = useState(0);
  const [counter, setCounter] = useState(32541);

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
      setCounter(Number(total));
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
      setTimeLeft((t) => t - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, result]);

  // Contador "vivo" mientras la persona está en la página
  useEffect(() => {
    const interval = setInterval(() => {
      setCounter((prev) => {
        const next = prev + 1;
        localStorage.setItem(COUNTER_KEY, String(next));
        return next;
      });
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  function updateUsage() {
    const today = getTodayKey();
    const next = dailyUsed + 1;

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ date: today, count: next })
    );

    setDailyUsed(next);
  }

  function goToPricing() {
    window.location.href = "/pricing";
  }

  async function handleGenerate() {
    if (!idea.trim()) {
      setErrorMessage("Escribe una idea primero.");
      return;
    }

    if (!TEST_MODE && dailyUsed >= DAILY_LIMIT) {
      setErrorMessage("Ya usaste tu prompt gratis de hoy.");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setCopied(false);
    setSent(false);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idea }),
      });

      const text = await res.text();
      let data: any;

      try {
        data = JSON.parse(text);
      } catch {
        setErrorMessage(`Error del servidor:\n\n${text}`);
        return;
      }

      if (!res.ok) {
        setErrorMessage(data.error || "No se pudo generar el prompt.");
        return;
      }

      setResult(data.prompt || "");
      setTimeLeft(60);

      if (!TEST_MODE) {
        updateUsage();
      }

      const nextCounter = counter + 1;
      setCounter(nextCounter);
      localStorage.setItem(COUNTER_KEY, String(nextCounter));
    } catch {
      setErrorMessage("Error generando prompt");
    } finally {
      setLoading(false);
    }
  }

  function copyPrompt() {
    if (!result.trim()) return;

    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

    setErrorMessage("");

    try {
      const response = await fetch("/api/send-prompt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: sendEmail, prompt: result }),
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
    } catch {
      setErrorMessage("Error enviando correo.");
    }
  }

  const dailyRemaining = Math.max(0, DAILY_LIMIT - dailyUsed);
  const isUrgent = timeLeft > 0 && timeLeft <= 20;

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <section className="mx-auto flex min-h-screen max-w-6xl items-center px-6 py-16">
        <div className="w-full">
          <div className="mx-auto max-w-4xl text-center">
            {TEST_MODE && (
              <div className="mb-4 text-center text-xs text-yellow-400">
                ⚠️ Modo prueba activo
              </div>
            )}

            <div className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
              1 prompt gratis al día · Premium $5 USD/mes
            </div>

            <h1 className="mt-6 text-5xl font-bold tracking-tight md:text-7xl">
              Convierte cualquier idea en prompts que venden, automatizan o crecen tu negocio
            </h1>

            <p className="mt-6 text-lg leading-8 text-white/70 md:text-xl">
              Genera prompts listos para usar que te ahorran tiempo, aumentan resultados y te dan ventaja con IA en segundos.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm text-white/60">
              <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                Prompts generados: {counter.toLocaleString()}
              </span>

              {!TEST_MODE && (
                <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">
                  Gratis restantes hoy: {dailyRemaining}
                </span>
              )}

              {TEST_MODE && (
                <span className="rounded-full border border-yellow-400/20 bg-yellow-400/5 px-4 py-2 text-yellow-300">
                  Pruebas ilimitadas activas
                </span>
              )}

              <span className="rounded-full border border-green-400/20 bg-green-400/10 px-4 py-2 text-green-300">
                🔥 Usuarios generando prompts en este momento
              </span>
            </div>
          </div>

          <div className="mx-auto mt-12 max-w-4xl rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur md:p-8">
            <div className="mb-5 grid gap-3 md:grid-cols-3">
              <button className="rounded-2xl border border-white bg-white px-4 py-3 text-sm font-medium text-black transition">
                Básico
              </button>

              <button
                onClick={goToPricing}
                className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Premium 🔒
              </button>

              <button
                disabled
                className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm font-medium text-white/50 transition"
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

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="mt-5 w-full rounded-2xl bg-white px-5 py-4 text-base font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Generando..." : "Generar Prompt que Funciona"}
            </button>

            <p className="mt-3 text-center text-xs text-white/50">
              ⚡ Resultados en segundos · sin experiencia necesaria
            </p>

            <p className="mt-4 text-center text-sm text-white/55">
              Genera una vista previa gratis. Después puedes copiarla o enviártela a tu correo.
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

                <span
                  className={`rounded-full border px-3 py-1 text-xs ${
                    isUrgent
                      ? "animate-pulse border-red-400/30 bg-red-500/10 text-red-300"
                      : "border-white/10 bg-black/30 text-white/70"
                  }`}
                >
                  Se borra en {timeLeft}s
                </span>
              </div>

              <p className="mb-2 text-sm text-green-400">
                ✔️ Prompt optimizado para resultados reales
              </p>

              <pre className="whitespace-pre-wrap text-sm leading-7 text-white/90">
                {result}
              </pre>

              <p className="mt-4 text-xs text-white/40">
                Generated with PromptLife
              </p>

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

              <div
                className={`mt-6 rounded-2xl border p-4 transition ${
                  isUrgent
                    ? "animate-pulse border-yellow-400/30 bg-yellow-400/10"
                    : "border-white/10 bg-black/20"
                }`}
              >
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
                  No te llenes de spam y protege tu privacidad con correos temporales. Quantum Mail es tu mejor opción para evitar basura y registros invasivos.
                </div>
              </div>
            </div>
          )}

          <div className="mx-auto mt-8 max-w-4xl rounded-3xl border border-cyan-400/20 bg-cyan-400/5 p-5 text-center">
            <p className="text-sm text-cyan-100/80">
              ¿No quieres llenar tu correo de spam?
            </p>

            <p className="mt-2 text-lg font-semibold text-cyan-200">
              Quantum Mail te ayuda a proteger tu privacidad con correos temporales al instante.
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