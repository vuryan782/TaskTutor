import { GoogleGenAI } from '@google/genai';

export async function generateTutorFeedback(
  base64Data: string,
  mimeType: string,
  question: string,
  userAnswer: string,
  correctAnswer: string
): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing VITE_GEMINI_API_KEY");
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `A student got a question wrong on a quiz.
Here is the study material they used.

Question: ${question}
Student's Answer: ${userAnswer}
Correct Answer: ${correctAnswer}

Based strictly on the provided study material, briefly explain why the student's answer is incorrect and why the correct answer is right. Keep it concise, helpful, and encouraging. Focus on clarifying the misconception.`;

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
      temperature: 0.3,
    },
  });

  if (!response.text) {
    throw new Error("No text returned from Gemini");
  }

  return response.text;
}
