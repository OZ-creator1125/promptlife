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

  <button
    onClick={translatePrompt}
    disabled={translating}
    className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
  >
    {translating ? "Traduciendo..." : "Traducir"}
  </button>

</div>
