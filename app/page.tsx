
"use client";

import { useEffect, useState } from "react";

const DAILY_LIMIT = 1;
const STORAGE_KEY = "promptlife_daily_usage";

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
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [sendEmail, setSendEmail] = useState("");
  const [sent, setSent] = useState(false);

  const [dailyUsed, setDailyUsed] = useState(0);

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
    }
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

  async function handleGenerate() {
    if (!idea.trim()) return;

    if (!email || !isValidEmail(email)) {
      alert("Ingresa un correo válido");
      return;
    }

    if (dailyUsed >= DAILY_LIMIT) {
      alert("Ya usaste tu prompt gratis de hoy.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        body: JSON.stringify({ idea }),
      });

      const data = await res.json();

      setResult(data.prompt);
      setTimeLeft(60);
      updateUsage();
    } catch {
      alert("Error generando prompt");
    } finally {
      setLoading(false);
    }
  }

  // ⏳ TIMER 60 SEGUNDOS
  useEffect(() => {
    if (timeLeft <= 0) {
      setResult("");
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft]);

  function copyPrompt() {
    navigator.clipboard.writeText(result);
    setCopied(true);

    setTimeout(() => setCopied(false), 2000);
  }

  async function sendPromptEmail() {
    if (!isValidEmail(sendEmail)) {
      alert("Correo inválido");
      return;
    }

    await fetch("/api/send-prompt", {
      method: "POST",
      body: JSON.stringify({
        email: sendEmail,
        prompt: result,
      }),
    });

    setSent(true);
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white px-6 py-16">
      <div className="max-w-3xl mx-auto">

        <h1 className="text-4xl font-bold text-center">PromptLife</h1>

        <textarea
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          placeholder="Describe tu idea..."
          className="w-full mt-6 p-4 rounded-xl bg-black/30"
        />

        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Tu correo"
          className="w-full mt-3 p-3 rounded-xl bg-black/30"
        />

        <button
          onClick={handleGenerate}
          className="w-full mt-4 bg-white text-black p-3 rounded-xl"
        >
          {loading ? "Generando..." : "Generar Prompt"}
        </button>

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => (window.location.href = "/pricing")}
            className="flex-1 border p-3 rounded-xl"
          >
            Premium 🔒
          </button>

          <button className="flex-1 border p-3 rounded-xl opacity-50">
            Experto (próximamente)
          </button>
        </div>

        {result && (
          <div className="mt-6 p-5 bg-white/5 rounded-xl">
            <p className="text-xs mb-2">Se borra en {timeLeft}s</p>

            <pre className="whitespace-pre-wrap">{result}</pre>

            <div className="flex gap-3 mt-4">
              <button
                onClick={copyPrompt}
                className="border px-4 py-2 rounded-xl"
              >
                {copied ? "✓ Copiado" : "Copiar"}
              </button>
            </div>

            {/* EMAIL BLOCK */}
            <div className="mt-6 border-t pt-4">
              <p className="text-sm mb-2">
                Envíatelo a tu correo y accede después
              </p>

              <input
                value={sendEmail}
                onChange={(e) => setSendEmail(e.target.value)}
                placeholder="Tu correo"
                className="w-full p-3 rounded-xl bg-black/30"
              />

              <button
                onClick={sendPromptEmail}
                className="mt-3 w-full bg-white text-black p-3 rounded-xl"
              >
                Enviar a mi correo
              </button>

              {sent && (
                <p className="text-green-400 mt-2">
                  ✓ Enviado correctamente
                </p>
              )}
            </div>

            {/* UPSELL */}
            <div className="mt-6 text-sm text-white/60">
              Desbloquea Premium para prompts ilimitados.
            </div>

            {/* QUANTUM */}
            <div className="mt-4 text-xs text-cyan-300">
              Evita spam usando correos temporales con Quantum Mail.
            </div>

          </div>
        )}
      </div>
    </main>
  );
}
