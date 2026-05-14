import { GoogleGenAI, Type, type Schema } from '@google/genai';
import type { Quiz } from '../../types/study';

export async function generateQuizFromMaterial(base64Data: string, mimeType: string, title: string): Promise<Quiz> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing VITE_GEMINI_API_KEY");
  }

  const ai = new GoogleGenAI({ apiKey });

  const responseSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      title: {
        type: Type.STRING,
        description: "The title of the quiz",
      },
      topic: {
        type: Type.STRING,
        description: "The primary topic of the quiz",
      },
      questions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING, description: "A unique identifier for the question (e.g. q1, q2)" },
            text: { type: Type.STRING, description: "The question text" },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Must contain exactly 4 possible options",
            },
            correctAnswerIndex: {
              type: Type.INTEGER,
              description: "Index of the correct option (0-3)",
            },
            explanation: { type: Type.STRING, description: "Explanation of why the answer is correct" },
          },
          required: ["id", "text", "options", "correctAnswerIndex", "explanation"],
        },
      },
    },
    required: ["title", "topic", "questions"],
  };

  const prompt = `Generate a 5-question multiple choice quiz based strictly on the provided material titled "${title}". Ensure all output follows the requested JSON schema.`;

  const documentPart = {
    inlineData: {
      data: base64Data,
      mimeType: mimeType,
    },
  };

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [prompt, documentPart],
    config: {
      responseMimeType: "application/json",
      responseSchema: responseSchema,
      temperature: 0.2,
    },
  });

  if (!response.text) {
    throw new Error("No text returned from Gemini");
  }

  const quizData = JSON.parse(response.text) as Quiz;
  return quizData;
}
