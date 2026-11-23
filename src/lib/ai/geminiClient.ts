import { GoogleGenAI } from '@google/genai';

/**
 * Creates and returns a GoogleGenAI client if an API key is available.
 * Returns null if no API key is configured.
 */
export function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === '' || apiKey.includes('your_api_key_here') || apiKey.includes('your_gemini_api_key')) {
    return null;
  }

  try {
    return new GoogleGenAI({ apiKey });
  } catch (error) {
    console.error('Failed to initialize GoogleGenAI client:', error);
    return null;
  }
}

export const PREFERRED_MODEL = 'gemini-3.1-flash-lite'; // Supported fast model in current Google GenAI API
export const FALLBACK_MODEL = 'gemini-3.5-flash-lite';

const SUPPORTED_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash-lite',
  'gemini-3.8-flash',
  'gemini-2.5-flash',
  'gemini-1.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-pro',
];

export function getResolvedModel(): string {
  const envModel = process.env.GEMINI_MODEL?.trim();
  if (envModel && SUPPORTED_MODELS.includes(envModel)) {
    return envModel;
  }
  return PREFERRED_MODEL;
}
