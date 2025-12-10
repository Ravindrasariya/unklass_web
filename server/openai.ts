import OpenAI from "openai";
import type { Question } from "@shared/schema";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateQuizQuestions(
  pdfContent: string,
  subject: string,
  grade: string,
  board: string,
  numQuestions: number = 10
): Promise<Question[]> {
  const systemPrompt = `You are an expert educational content creator specializing in creating multiple-choice quiz questions for ${grade} grade students following the ${board} board curriculum in India.

Your task is to generate exactly ${numQuestions} high-quality multiple-choice questions based on the provided study material. Each question should:
1. Be appropriate for ${grade} grade level
2. Test understanding and application, not just memorization
3. Have exactly 4 options with only one correct answer
4. Include a clear, educational explanation for the correct answer

Return the questions as a JSON array with this exact structure:
[
  {
    "id": 1,
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Clear explanation of why this answer is correct."
  }
]

Important:
- correctAnswer is a zero-based index (0, 1, 2, or 3)
- Make questions diverse, covering different topics from the material
- Ensure explanations are educational and help students learn`;

  const userPrompt = `Generate ${numQuestions} multiple-choice questions for ${subject} based on this study material:

${pdfContent.substring(0, 15000)}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from OpenAI");
    }

    const parsed = JSON.parse(content);
    const questions = parsed.questions || parsed;
    
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error("Invalid response format from OpenAI");
    }

    return questions.map((q: Question, index: number) => ({
      id: index + 1,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
    }));
  } catch (error) {
    console.error("Error generating questions:", error);
    throw error;
  }
}

export async function generateAnswerFeedback(
  question: string,
  selectedOption: string,
  correctOption: string,
  isCorrect: boolean
): Promise<string> {
  const prompt = isCorrect
    ? `The student correctly answered "${selectedOption}" for the question: "${question}". Provide a brief (1-2 sentences) encouraging response that reinforces why this answer is correct.`
    : `The student answered "${selectedOption}" but the correct answer was "${correctOption}" for the question: "${question}". Provide a brief (2-3 sentences) helpful explanation that teaches why the correct answer is right without being discouraging.`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a friendly, encouraging tutor. Keep responses brief, educational, and age-appropriate for school students.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 150,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content || "Keep learning!";
  } catch (error) {
    console.error("Error generating feedback:", error);
    return isCorrect ? "Great job!" : "Keep practicing!";
  }
}
