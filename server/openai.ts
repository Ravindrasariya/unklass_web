import OpenAI from "openai";
import type { Question } from "@shared/schema";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Fallback questions when OpenAI is unavailable
const FALLBACK_QUESTIONS: Record<string, Question[]> = {
  Mathematics: [
    { id: 1, question: "What is the value of x in the equation 2x + 6 = 14?", options: ["2", "4", "6", "8"], correctAnswer: 1, explanation: "Subtract 6 from both sides: 2x = 8, then divide by 2: x = 4" },
    { id: 2, question: "What is the area of a rectangle with length 8 cm and width 5 cm?", options: ["13 sq cm", "26 sq cm", "40 sq cm", "80 sq cm"], correctAnswer: 2, explanation: "Area = length x width = 8 x 5 = 40 sq cm" },
    { id: 3, question: "What is 25% of 80?", options: ["15", "20", "25", "30"], correctAnswer: 1, explanation: "25% = 25/100 = 0.25. 0.25 x 80 = 20" },
    { id: 4, question: "If a triangle has angles of 60 and 70 degrees, what is the third angle?", options: ["40 degrees", "50 degrees", "60 degrees", "70 degrees"], correctAnswer: 1, explanation: "Sum of angles in a triangle = 180. Third angle = 180 - 60 - 70 = 50 degrees" },
    { id: 5, question: "What is the square root of 144?", options: ["10", "11", "12", "14"], correctAnswer: 2, explanation: "12 x 12 = 144, so the square root of 144 is 12" },
    { id: 6, question: "Simplify: 3(x + 4) - 2x", options: ["x + 4", "x + 12", "5x + 4", "5x + 12"], correctAnswer: 1, explanation: "3x + 12 - 2x = x + 12" },
    { id: 7, question: "What is the value of pi (rounded to 2 decimal places)?", options: ["3.12", "3.14", "3.16", "3.18"], correctAnswer: 1, explanation: "Pi is approximately 3.14159..., which rounds to 3.14" },
    { id: 8, question: "If a car travels 60 km in 2 hours, what is its speed?", options: ["20 km/h", "30 km/h", "40 km/h", "60 km/h"], correctAnswer: 1, explanation: "Speed = Distance/Time = 60/2 = 30 km/h" },
    { id: 9, question: "What is the HCF of 12 and 18?", options: ["2", "3", "6", "9"], correctAnswer: 2, explanation: "Factors of 12: 1,2,3,4,6,12. Factors of 18: 1,2,3,6,9,18. HCF = 6" },
    { id: 10, question: "What is the next prime number after 13?", options: ["14", "15", "17", "19"], correctAnswer: 2, explanation: "14 is divisible by 2, 15 by 3, but 17 has no divisors other than 1 and itself" }
  ],
  Science: [
    { id: 1, question: "What is the primary function of mitochondria in a cell?", options: ["Protein synthesis", "Energy production (ATP)", "Waste removal", "Cell division"], correctAnswer: 1, explanation: "Mitochondria are known as the 'powerhouse of the cell' because they generate ATP" },
    { id: 2, question: "Which of the following is NOT a type of blood cell?", options: ["Red blood cells", "White blood cells", "Platelets", "Neurons"], correctAnswer: 3, explanation: "Neurons are nerve cells, not blood cells" },
    { id: 3, question: "What is the chemical symbol for gold?", options: ["Go", "Gd", "Au", "Ag"], correctAnswer: 2, explanation: "Au is the chemical symbol for gold, derived from Latin 'aurum'" },
    { id: 4, question: "Which planet is known as the 'Red Planet'?", options: ["Venus", "Mars", "Jupiter", "Saturn"], correctAnswer: 1, explanation: "Mars appears red due to iron oxide on its surface" },
    { id: 5, question: "What process do plants use to make their own food?", options: ["Respiration", "Photosynthesis", "Transpiration", "Germination"], correctAnswer: 1, explanation: "Photosynthesis converts light energy into chemical energy in plants" },
    { id: 6, question: "What is the SI unit of force?", options: ["Joule", "Watt", "Newton", "Pascal"], correctAnswer: 2, explanation: "The Newton (N) is the SI unit of force" },
    { id: 7, question: "Which gas do humans exhale more of compared to inhaled air?", options: ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"], correctAnswer: 2, explanation: "Carbon dioxide is a byproduct of cellular respiration" },
    { id: 8, question: "What is the hardest natural substance on Earth?", options: ["Gold", "Iron", "Diamond", "Platinum"], correctAnswer: 2, explanation: "Diamond has the highest hardness on the Mohs scale" },
    { id: 9, question: "What is the center of an atom called?", options: ["Electron", "Proton", "Nucleus", "Neutron"], correctAnswer: 2, explanation: "The nucleus contains protons and neutrons at the center of an atom" },
    { id: 10, question: "Which vitamin is produced when skin is exposed to sunlight?", options: ["Vitamin A", "Vitamin C", "Vitamin D", "Vitamin E"], correctAnswer: 2, explanation: "Vitamin D is synthesized in the skin when exposed to UV rays" }
  ],
  default: [
    { id: 1, question: "What is the capital of India?", options: ["Mumbai", "New Delhi", "Kolkata", "Chennai"], correctAnswer: 1, explanation: "New Delhi is the capital city of India" },
    { id: 2, question: "Who wrote the national anthem of India?", options: ["Rabindranath Tagore", "Bankim Chandra", "Sarojini Naidu", "Mahatma Gandhi"], correctAnswer: 0, explanation: "Jana Gana Mana was written by Rabindranath Tagore" },
    { id: 3, question: "Which is the largest ocean on Earth?", options: ["Atlantic", "Indian", "Arctic", "Pacific"], correctAnswer: 3, explanation: "The Pacific Ocean is the largest and deepest ocean" },
    { id: 4, question: "What is the capital of Australia?", options: ["Sydney", "Melbourne", "Canberra", "Perth"], correctAnswer: 2, explanation: "Canberra is the capital city of Australia" },
    { id: 5, question: "How many continents are there on Earth?", options: ["5", "6", "7", "8"], correctAnswer: 2, explanation: "There are 7 continents: Asia, Africa, North America, South America, Antarctica, Europe, and Australia" },
    { id: 6, question: "Which is the longest river in the world?", options: ["Amazon", "Nile", "Yangtze", "Mississippi"], correctAnswer: 1, explanation: "The Nile is the longest river at about 6,650 km" },
    { id: 7, question: "What year did India gain independence?", options: ["1945", "1947", "1950", "1952"], correctAnswer: 1, explanation: "India gained independence from British rule on August 15, 1947" },
    { id: 8, question: "Which planet is closest to the Sun?", options: ["Venus", "Mars", "Mercury", "Earth"], correctAnswer: 2, explanation: "Mercury is the closest planet to the Sun" },
    { id: 9, question: "What is the national animal of India?", options: ["Lion", "Elephant", "Tiger", "Peacock"], correctAnswer: 2, explanation: "The Bengal Tiger is the national animal of India" },
    { id: 10, question: "How many states are there in India?", options: ["26", "28", "29", "30"], correctAnswer: 1, explanation: "As of now, India has 28 states" }
  ]
};

export async function generateQuizQuestions(
  pdfContent: string,
  subject: string,
  grade: string,
  board: string,
  numQuestions: number = 10,
  previousQuestions: string[] = []
): Promise<Question[]> {
  let excludeSection = '';
  if (previousQuestions.length > 0) {
    excludeSection = `

CRITICAL INSTRUCTION - QUESTION VARIETY:
The student has already been asked ${previousQuestions.length} questions on this subject.
You MUST generate questions on DIFFERENT topics/concepts than these previously asked questions:

${previousQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

RULES FOR NEW QUESTIONS:
1. Each new question MUST cover a DIFFERENT concept or topic from the study material
2. Do NOT ask about the same formulas, definitions, or facts already covered above
3. If most topics are covered, go DEEPER into subtopics or ask application-based questions
4. Focus on aspects NOT yet tested: different chapters, different types of problems, different difficulty levels
5. Only when ALL possible topics from the material are exhausted, you may revisit topics with significantly different question formats`;
  }

  const systemPrompt = `You are an expert educational content creator. Generate ${numQuestions} multiple-choice quiz questions for ${grade} grade ${board} board students in India.

You MUST return a JSON object with exactly this structure:
{
  "questions": [
    {
      "question": "The full question text ending with a question mark?",
      "options": ["First option", "Second option", "Third option", "Fourth option"],
      "correctAnswer": 0,
      "explanation": "Why this answer is correct"
    }
  ]
}

RULES:
- "question" must be a complete question sentence
- "options" must be an array of exactly 4 answer choices
- "correctAnswer" must be 0, 1, 2, or 3 (index of correct option)
- "explanation" must explain why the answer is correct
- Generate exactly ${numQuestions} questions based on the CONCEPTS covered in the study material
- Questions should TEST UNDERSTANDING of concepts, not just repeat exact text from the material
- Create application-based, analytical, and conceptual questions that assess deep understanding
- Each question must be UNIQUE and cover different concepts

QUESTION TYPES TO INCLUDE:
1. DIAGRAM-BASED: If the material mentions diagrams (e.g., neuron, cell, circuit, plant structure), ask about specific PARTS and their FUNCTIONS (e.g., "What is the function of dendrites in a neuron?", "Which part of a cell contains genetic material?")
2. NUMERICAL/FORMULA-BASED: Include calculation questions using formulas from the material (e.g., "Calculate the speed if distance is 100m and time is 20s", "Find the area of a circle with radius 7cm")
3. CONCEPTUAL: Ask why/how questions that test understanding
4. APPLICATION: Real-world problem-solving using concepts from the material

Aim for a MIX of question types: at least 2-3 numerical/formula-based, 2-3 diagram/parts-based, and the rest conceptual/application questions.${excludeSection}`;

  const userPrompt = `Generate ${numQuestions} NEW and UNIQUE multiple-choice questions for ${subject}.

IMPORTANT: All questions MUST be based ONLY on the concepts, topics, formulas, diagrams, and facts mentioned in the study material below. Do NOT introduce concepts or topics that are not covered in this material.

- If the material covers a formula, create numerical problems using that formula
- If the material mentions a diagram (e.g., neuron, cell), ask about its labeled parts
- If the material explains a process, ask about steps or components of that process
- Questions can be worded differently but must test concepts FROM THIS MATERIAL ONLY

Study Material:
${pdfContent.substring(0, 12000)}`;

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
    
    // Handle various response formats from OpenAI
    let questions: any[];
    if (Array.isArray(parsed)) {
      questions = parsed;
    } else if (parsed.questions && Array.isArray(parsed.questions)) {
      questions = parsed.questions;
    } else if (parsed.quiz && Array.isArray(parsed.quiz)) {
      questions = parsed.quiz;
    } else if (parsed.data && Array.isArray(parsed.data)) {
      questions = parsed.data;
    } else {
      // Try to find any array in the response
      const arrayKey = Object.keys(parsed).find(key => Array.isArray(parsed[key]));
      if (arrayKey) {
        questions = parsed[arrayKey];
      } else {
        console.error("Unexpected OpenAI response format:", JSON.stringify(parsed).substring(0, 500));
        throw new Error("Invalid response format from OpenAI");
      }
    }
    
    if (questions.length === 0) {
      throw new Error("No questions in OpenAI response");
    }

    // Validate and filter questions that have all required fields
    const validQuestions = questions.filter((q: any) => 
      q.question && 
      Array.isArray(q.options) && 
      q.options.length >= 2 &&
      (q.correctAnswer !== undefined || q.correct_answer !== undefined || q.answer !== undefined)
    );

    if (validQuestions.length === 0) {
      console.error("No valid questions in OpenAI response. Sample:", JSON.stringify(questions[0]).substring(0, 300));
      throw new Error("OpenAI response missing required question fields");
    }

    console.log(`Generated ${validQuestions.length} valid questions from PDF content`);

    return validQuestions.map((q: any, index: number) => ({
      id: index + 1,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer ?? q.correct_answer ?? q.answer ?? 0,
      explanation: q.explanation ?? q.reason ?? "Review this topic for better understanding.",
    }));
  } catch (error) {
    console.error("Error generating questions with OpenAI, using fallback:", error);
    // Return fallback questions when OpenAI is unavailable
    const fallback = FALLBACK_QUESTIONS[subject] || FALLBACK_QUESTIONS.default;
    
    // Filter out questions that match previous ones
    const previousSet = new Set(previousQuestions.map(q => q.toLowerCase().trim()));
    let availableQuestions = fallback.filter(q => 
      !previousSet.has(q.question.toLowerCase().trim())
    );
    
    // If we've used most questions, reset and use all
    if (availableQuestions.length < numQuestions) {
      console.log("Not enough unique fallback questions, reusing with shuffle");
      availableQuestions = fallback;
    }
    
    // Shuffle and return
    return [...availableQuestions].sort(() => Math.random() - 0.5).slice(0, numQuestions);
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
