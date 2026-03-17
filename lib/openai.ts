import OpenAI from "openai";

console.log("ENV CHECK:", process.env.OPENAI_API_KEY ? "OK" : "MISSING");

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY no está definida en .env.local");
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});