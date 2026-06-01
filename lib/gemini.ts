import { GoogleGenerativeAI } from "@google/generative-ai";

export const gemini = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
export const model = gemini.getGenerativeModel({ model: "gemini-2.5-flash" });
