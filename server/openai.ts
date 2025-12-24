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
  previousQuestions: string[] = [],
  medium: string = "English"
): Promise<Question[]> {
  // Calculate starting position based on total previous questions asked
  const startPosition = previousQuestions.length + 1;
  const endPosition = previousQuestions.length + numQuestions;
  
  const sequentialInstruction = `
QUESTION SELECTION (VERY IMPORTANT - FOLLOW EXACTLY):

Student has completed ${previousQuestions.length} questions from this PDF.
YOUR TASK: Pick questions #${startPosition} to #${startPosition + numQuestions - 1} from the PDF.

SIMPLE STEPS:
1. Number all questions in the PDF from 1 to N (where N = total questions in PDF)
2. Start at question #${startPosition}
3. Pick the next ${numQuestions} questions in order
4. If you reach the end of PDF, wrap around to question #1 and continue

DO NOT pick random questions. DO NOT skip questions. Follow the PDF order exactly.

${previousQuestions.length > 0 ? `SKIP THESE (already asked):\n${previousQuestions.slice(-20).map((q, i) => `- ${q.substring(0, 80)}`).join('\n')}` : ''}`;

  const languageInstruction = medium === "Hindi" 
    ? `IMPORTANT LANGUAGE INSTRUCTION: Generate ALL content in Hindi (Devanagari script). The questions, all 4 options, and explanations MUST be written in Hindi. Use proper Hindi language and Devanagari script throughout.`
    : `Generate all content in English.`;

  const systemPrompt = `You are an EXPERT TEACHER and educational content creator for ${grade} grade ${board} board students in India.

${languageInstruction}

Your PRIMARY task is to EXTRACT ${numQuestions} multiple-choice questions DIRECTLY from the provided PDF content.

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
- "correctAnswer" must be 0, 1, 2, or 3 (the ZERO-BASED index of the correct option in the options array)
  - If correct answer is the FIRST option (index 0), set correctAnswer: 0
  - If correct answer is the SECOND option (index 1), set correctAnswer: 1
  - If correct answer is the THIRD option (index 2), set correctAnswer: 2
  - If correct answer is the FOURTH option (index 3), set correctAnswer: 3
- "explanation" must explain why the answer is correct AND the explanation MUST match the correctAnswer index
- If extracting from PDF, use the PDF's answer as the correct answer
- Return exactly ${numQuestions} questions based on the study material
- Each question must be UNIQUE and cover different concepts

MATH FORMATTING (IMPORTANT):
- For exponents/powers, use caret notation: a^2 for a squared, x^3 for x cubed
- For complex expressions: (a^0 + b^0) means a to the power 0 plus b to the power 0
- Examples: "2^3 = 8", "x^2 + y^2", "(a+b)^2", "10^-3"
- For subscripts: Use underscore notation like H_2O, CO_2
- For fractions: Use a/b format or "a divided by b"

CRITICAL EXPERT TEACHER VERIFICATION (MANDATORY FOR EVERY QUESTION):
As an expert teacher, you MUST critically verify EACH question before including it:
1. SOLVE the problem yourself step-by-step and note the calculated answer
2. VERIFY that your calculated answer matches options[correctAnswer]
3. CHECK that correctAnswer index (0,1,2,3) points to the EXACT correct option in the options array
4. CONFIRM the explanation's answer matches options[correctAnswer]
5. For arithmetic: If the question asks "Sum of two numbers is 40, one is 18, what is the other?" → Calculate: 40-18=22 → Find "22" in options → Set correctAnswer to that index
6. DOUBLE-CHECK: Read options[correctAnswer] - is it truly the correct answer? If not, FIX the correctAnswer index

EXAMPLE VERIFICATION:
Question: "What is 25% of 80?"
Step 1: Calculate → 25/100 × 80 = 20
Step 2: options = ["15", "20", "25", "30"]
Step 3: "20" is at index 1
Step 4: correctAnswer MUST be 1
Step 5: Explanation must say "25% of 80 = 20"

REJECT any question where the correctAnswer index does not match the calculated/verified answer.

${sequentialInstruction}`;

  const userPrompt = `EXTRACT ${numQuestions} questions from the ENTIRE PDF content below for ${subject}.

MCQ CONVERSION RULES:

1. **EXISTING MCQs**: Extract exactly as they appear in the PDF
2. **SHORT ANSWER (1-2 words/numbers)**: PDF answer = correct option, generate 3 plausible wrong alternatives
3. **SENTENCE-LENGTH (1-2 sentences)**: Full sentence = correct option, create 3 wrong options with factual errors
4. **PARAGRAPH/ESSAY (3+ sentences)**: Break into MULTIPLE sub-questions, each testing ONE fact
5. **FILL-IN-THE-BLANK**: Convert using PDF's answer as correct option
6. **TRUE/FALSE**: Create 4 options: ["True", "False", "Partially true", "None of the above"]
7. **DEFINITIONS**: Create "What is..." or "Define..." MCQs
8. **DIAGRAM-BASED**: Generate questions about parts, labels, functions - use your understanding for correct answers
9. Do not skip any type of question. Follow rules 1-8 depending on question type.
10. No question shall be skipped from PDF unless there is a parsing issue.
11. If answer is available in PDF, give it top priority. If not available, AI provides best possible option.
12. Wrong options must be plausible but clearly incorrect.
13. NEVER create questions from topics not in PDF.

PDF Content for ${subject}:
${pdfContent.substring(0, 50000)}`;

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

// CPCT Fallback questions (basic computer knowledge)
const CPCT_FALLBACK_QUESTIONS: { Hindi: Question[]; English: Question[] } = {
  English: [
    { id: 1, question: "What does CPU stand for?", options: ["Central Processing Unit", "Computer Personal Unit", "Central Personal Unit", "Computer Processing Unit"], correctAnswer: 0, explanation: "CPU stands for Central Processing Unit, which is the brain of the computer." },
    { id: 2, question: "Which device is used to input text into a computer?", options: ["Monitor", "Mouse", "Keyboard", "Printer"], correctAnswer: 2, explanation: "A keyboard is an input device used to type text and commands." },
    { id: 3, question: "What is the full form of RAM?", options: ["Read Access Memory", "Random Access Memory", "Run Access Memory", "Random Allowed Memory"], correctAnswer: 1, explanation: "RAM stands for Random Access Memory, used for temporary data storage." },
    { id: 4, question: "Which of the following is an output device?", options: ["Keyboard", "Mouse", "Monitor", "Scanner"], correctAnswer: 2, explanation: "A monitor is an output device that displays visual information." },
    { id: 5, question: "What does 'www' stand for in a website address?", options: ["World Wide Web", "World Wide Work", "Web Wide World", "Wide World Web"], correctAnswer: 0, explanation: "WWW stands for World Wide Web, the system of interlinked hypertext documents." },
    { id: 6, question: "Which software is used to browse the internet?", options: ["Microsoft Word", "Web Browser", "Calculator", "Paint"], correctAnswer: 1, explanation: "A web browser like Chrome or Firefox is used to access websites." },
    { id: 7, question: "What is 1 KB equal to?", options: ["1000 Bytes", "1024 Bytes", "100 Bytes", "512 Bytes"], correctAnswer: 1, explanation: "1 Kilobyte (KB) equals 1024 bytes in binary computing." },
    { id: 8, question: "Which key is used to delete characters to the left of cursor?", options: ["Delete", "Backspace", "Enter", "Shift"], correctAnswer: 1, explanation: "The Backspace key deletes characters to the left of the cursor." },
    { id: 9, question: "What type of software is MS Excel?", options: ["Word Processor", "Spreadsheet", "Presentation", "Database"], correctAnswer: 1, explanation: "MS Excel is a spreadsheet software used for calculations and data analysis." },
    { id: 10, question: "Which device stores data permanently?", options: ["RAM", "Hard Disk", "Cache", "Register"], correctAnswer: 1, explanation: "A hard disk is a permanent storage device that retains data when powered off." }
  ],
  Hindi: [
    { id: 1, question: "CPU का पूर्ण रूप क्या है?", options: ["सेंट्रल प्रोसेसिंग यूनिट", "कंप्यूटर पर्सनल यूनिट", "सेंट्रल पर्सनल यूनिट", "कंप्यूटर प्रोसेसिंग यूनिट"], correctAnswer: 0, explanation: "CPU का अर्थ है सेंट्रल प्रोसेसिंग यूनिट, जो कंप्यूटर का दिमाग है।" },
    { id: 2, question: "कंप्यूटर में टेक्स्ट इनपुट करने के लिए किस डिवाइस का उपयोग किया जाता है?", options: ["मॉनिटर", "माउस", "कीबोर्ड", "प्रिंटर"], correctAnswer: 2, explanation: "कीबोर्ड एक इनपुट डिवाइस है जिसका उपयोग टेक्स्ट और कमांड टाइप करने के लिए किया जाता है।" },
    { id: 3, question: "RAM का पूर्ण रूप क्या है?", options: ["रीड एक्सेस मेमोरी", "रैंडम एक्सेस मेमोरी", "रन एक्सेस मेमोरी", "रैंडम अलाउड मेमोरी"], correctAnswer: 1, explanation: "RAM का अर्थ है रैंडम एक्सेस मेमोरी, जो अस्थायी डेटा संग्रहण के लिए उपयोग की जाती है।" },
    { id: 4, question: "निम्नलिखित में से कौन सा आउटपुट डिवाइस है?", options: ["कीबोर्ड", "माउस", "मॉनिटर", "स्कैनर"], correctAnswer: 2, explanation: "मॉनिटर एक आउटपुट डिवाइस है जो विजुअल जानकारी प्रदर्शित करता है।" },
    { id: 5, question: "वेबसाइट एड्रेस में 'www' का पूर्ण रूप क्या है?", options: ["वर्ल्ड वाइड वेब", "वर्ल्ड वाइड वर्क", "वेब वाइड वर्ल्ड", "वाइड वर्ल्ड वेब"], correctAnswer: 0, explanation: "WWW का अर्थ है वर्ल्ड वाइड वेब, जो इंटरलिंक्ड हाइपरटेक्स्ट डॉक्यूमेंट्स की प्रणाली है।" },
    { id: 6, question: "इंटरनेट ब्राउज़ करने के लिए कौन सा सॉफ्टवेयर उपयोग किया जाता है?", options: ["माइक्रोसॉफ्ट वर्ड", "वेब ब्राउज़र", "कैलकुलेटर", "पेंट"], correctAnswer: 1, explanation: "वेब ब्राउज़र जैसे क्रोम या फायरफॉक्स वेबसाइट्स एक्सेस करने के लिए उपयोग किया जाता है।" },
    { id: 7, question: "1 KB कितने बाइट्स के बराबर है?", options: ["1000 बाइट्स", "1024 बाइट्स", "100 बाइट्स", "512 बाइट्स"], correctAnswer: 1, explanation: "1 किलोबाइट (KB) बाइनरी कंप्यूटिंग में 1024 बाइट्स के बराबर होता है।" },
    { id: 8, question: "कर्सर के बाईं ओर के अक्षरों को मिटाने के लिए किस कुंजी का उपयोग किया जाता है?", options: ["डिलीट", "बैकस्पेस", "एंटर", "शिफ्ट"], correctAnswer: 1, explanation: "बैकस्पेस कुंजी कर्सर के बाईं ओर के अक्षरों को मिटाती है।" },
    { id: 9, question: "MS Excel किस प्रकार का सॉफ्टवेयर है?", options: ["वर्ड प्रोसेसर", "स्प्रेडशीट", "प्रेजेंटेशन", "डेटाबेस"], correctAnswer: 1, explanation: "MS Excel एक स्प्रेडशीट सॉफ्टवेयर है जो गणना और डेटा विश्लेषण के लिए उपयोग किया जाता है।" },
    { id: 10, question: "कौन सा डिवाइस डेटा को स्थायी रूप से संग्रहीत करता है?", options: ["RAM", "हार्ड डिस्क", "कैश", "रजिस्टर"], correctAnswer: 1, explanation: "हार्ड डिस्क एक स्थायी स्टोरेज डिवाइस है जो पावर ऑफ होने पर भी डेटा रखता है।" }
  ]
};

export async function generateCpctQuizQuestions(
  pdfContent: string,
  year: string,
  medium: "Hindi" | "English",
  numQuestions: number = 10,
  previousQuestions: string[] = []
): Promise<Question[]> {
  // Calculate starting position based on total previous questions asked
  const startPosition = previousQuestions.length + 1;
  const endPosition = previousQuestions.length + numQuestions;
  
  const sequentialInstruction = `
QUESTION SELECTION (VERY IMPORTANT - FOLLOW EXACTLY):

Student has completed ${previousQuestions.length} questions from this PDF.
YOUR TASK: Pick questions #${startPosition} to #${startPosition + numQuestions - 1} from the PDF.

SIMPLE STEPS:
1. Number all questions in the PDF from 1 to N (where N = total questions in PDF)
2. Start at question #${startPosition}
3. Pick the next ${numQuestions} questions in order
4. If you reach the end of PDF, wrap around to question #1 and continue

DO NOT pick random questions. DO NOT skip questions. Follow the PDF order exactly.

${previousQuestions.length > 0 ? `SKIP THESE (already asked):\n${previousQuestions.slice(-20).map((q, i) => `- ${q.substring(0, 80)}`).join('\n')}` : ''}`;

  const languageInstruction = medium === "Hindi" 
    ? `IMPORTANT: Generate ALL content (questions, options, explanations) in HINDI (Devanagari script). The entire quiz must be in Hindi language.`
    : `Generate all content in clear, simple English.`;

  const systemPrompt = `You are an EXPERT TEACHER and CPCT (Computer Proficiency Certification Test) exam content creator for Madhya Pradesh, India.
${languageInstruction}

Your PRIMARY task is to EXTRACT ${numQuestions} multiple-choice questions DIRECTLY from the provided PDF content for CPCT exam preparation.

You MUST return a JSON object with exactly this structure:
{
  "questions": [
    {
      "question": "The full question text?",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctAnswer": 0,
      "explanation": "Why this answer is correct"
    }
  ]
}

RULES:
- "question" must be a complete question sentence in ${medium}
- "options" must be an array of exactly 4 answer choices in ${medium}
- "correctAnswer" must be 0, 1, 2, or 3 (the ZERO-BASED index of the correct option in the options array)
  - If correct answer is the FIRST option (index 0), set correctAnswer: 0
  - If correct answer is the SECOND option (index 1), set correctAnswer: 1
  - If correct answer is the THIRD option (index 2), set correctAnswer: 2
  - If correct answer is the FOURTH option (index 3), set correctAnswer: 3
- "explanation" must explain why the answer is correct in ${medium} AND MUST match the correctAnswer index
- If extracting from PDF, use the PDF's answer as the correct answer
- Return exactly ${numQuestions} questions based on CPCT syllabus concepts

MATH FORMATTING (IMPORTANT):
- For exponents/powers, use caret notation: a^2 for a squared, x^3 for x cubed
- Examples: "2^3 = 8", "10^6 bytes = 1 MB"
- For subscripts: Use underscore notation like H_2O, CO_2

CRITICAL EXPERT TEACHER VERIFICATION (MANDATORY FOR EVERY QUESTION):
As an expert teacher, you MUST critically verify EACH question before including it:
1. SOLVE the problem yourself step-by-step and note the calculated answer
2. VERIFY that your calculated answer matches options[correctAnswer]
3. CHECK that correctAnswer index (0,1,2,3) points to the EXACT correct option in the options array
4. CONFIRM the explanation's answer matches options[correctAnswer]
5. For arithmetic: If the question asks "1 KB = ? bytes" and correct answer is 1024 → Find "1024" in options → Set correctAnswer to that index
6. DOUBLE-CHECK: Read options[correctAnswer] - is it truly the correct answer? If not, FIX the correctAnswer index

EXAMPLE VERIFICATION:
Question: "1 KB कितने बाइट्स के बराबर है?"
Step 1: Factual answer → 1024 bytes
Step 2: options = ["1000 बाइट्स", "1024 बाइट्स", "100 बाइट्स", "512 बाइट्स"]
Step 3: "1024 बाइट्स" is at index 1
Step 4: correctAnswer MUST be 1
Step 5: Explanation must say "1 KB = 1024 bytes"

REJECT any question where the correctAnswer index does not match the verified answer.

${sequentialInstruction}`;

  const userPrompt = `EXTRACT ${numQuestions} questions from the ENTIRE PDF content below for CPCT exam preparation.

MCQ CONVERSION RULES:

1. **EXISTING MCQs**: Extract exactly as they appear in the PDF
2. **SHORT ANSWER (1-2 words/numbers)**: PDF answer = correct option, generate 3 plausible wrong alternatives
3. **SENTENCE-LENGTH (1-2 sentences)**: Full sentence = correct option, create 3 wrong options with factual errors
4. **PARAGRAPH/ESSAY (3+ sentences)**: Break into MULTIPLE sub-questions, each testing ONE fact
5. **FILL-IN-THE-BLANK**: Convert using PDF's answer as correct option
6. **TRUE/FALSE**: Create 4 options: ["True", "False", "Partially true", "None of the above"]
7. **DEFINITIONS**: Create "What is..." MCQs from explanatory text
8. **DIAGRAM-BASED**: Generate questions about parts, labels, functions - use your understanding for correct answers
9. Do not skip any type of question. Follow rules 1-8 depending on question type.
10. No question shall be skipped from PDF unless there is a parsing issue.
11. If answer is available in PDF, give it top priority. If not available, AI provides best possible option.
12. Wrong options must be plausible but clearly incorrect.
13. NEVER create questions from topics not in PDF.

LANGUAGE: Generate all content in ${medium === "Hindi" ? "Hindi (Devanagari script देवनागरी)" : "English"}

PDF Content from CPCT ${year}:
${pdfContent.substring(0, 50000)}`;

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
    
    let questions: any[];
    if (Array.isArray(parsed)) {
      questions = parsed;
    } else if (parsed.questions && Array.isArray(parsed.questions)) {
      questions = parsed.questions;
    } else {
      const arrayKey = Object.keys(parsed).find(key => Array.isArray(parsed[key]));
      if (arrayKey) {
        questions = parsed[arrayKey];
      } else {
        throw new Error("Invalid response format from OpenAI");
      }
    }
    
    if (questions.length === 0) {
      throw new Error("No questions in OpenAI response");
    }

    const validQuestions = questions.filter((q: any) => 
      q.question && 
      Array.isArray(q.options) && 
      q.options.length >= 2 &&
      (q.correctAnswer !== undefined || q.correct_answer !== undefined || q.answer !== undefined)
    );

    if (validQuestions.length === 0) {
      throw new Error("OpenAI response missing required question fields");
    }

    console.log(`Generated ${validQuestions.length} CPCT questions in ${medium}`);

    return validQuestions.map((q: any, index: number) => ({
      id: index + 1,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer ?? q.correct_answer ?? q.answer ?? 0,
      explanation: q.explanation ?? q.reason ?? (medium === "Hindi" ? "इस विषय की समीक्षा करें।" : "Review this topic."),
    }));
  } catch (error) {
    console.error("Error generating CPCT questions with OpenAI, using fallback:", error);
    const fallback = CPCT_FALLBACK_QUESTIONS[medium] || CPCT_FALLBACK_QUESTIONS.English;
    
    const previousSet = new Set(previousQuestions.map(q => q.toLowerCase().trim()));
    let availableQuestions = fallback.filter(q => 
      !previousSet.has(q.question.toLowerCase().trim())
    );
    
    if (availableQuestions.length < numQuestions) {
      availableQuestions = fallback;
    }
    
    return [...availableQuestions].sort(() => Math.random() - 0.5).slice(0, numQuestions);
  }
}

// Navodaya Fallback questions (JNV entrance exam)
const NAVODAYA_FALLBACK_QUESTIONS: { "6th": { Hindi: Question[]; English: Question[] }; "9th": { Hindi: Question[]; English: Question[] } } = {
  "6th": {
    English: [
      { id: 1, question: "If 3 + 4 = 7, what is 7 + 8?", options: ["13", "14", "15", "16"], correctAnswer: 2, explanation: "7 + 8 = 15" },
      { id: 2, question: "Which shape has 4 equal sides?", options: ["Rectangle", "Square", "Triangle", "Circle"], correctAnswer: 1, explanation: "A square has 4 equal sides." },
      { id: 3, question: "What comes next: 2, 4, 6, 8, ?", options: ["9", "10", "11", "12"], correctAnswer: 1, explanation: "The pattern adds 2 each time, so next is 10." },
      { id: 4, question: "Which animal gives us milk?", options: ["Dog", "Cat", "Cow", "Lion"], correctAnswer: 2, explanation: "Cow gives us milk." },
      { id: 5, question: "How many days are in a week?", options: ["5", "6", "7", "8"], correctAnswer: 2, explanation: "There are 7 days in a week." },
      { id: 6, question: "Which is the largest planet in our solar system?", options: ["Earth", "Mars", "Jupiter", "Saturn"], correctAnswer: 2, explanation: "Jupiter is the largest planet in our solar system." },
      { id: 7, question: "What is 15 - 7?", options: ["6", "7", "8", "9"], correctAnswer: 2, explanation: "15 - 7 = 8" },
      { id: 8, question: "Which direction does the sun rise from?", options: ["North", "South", "East", "West"], correctAnswer: 2, explanation: "The sun rises from the East." },
      { id: 9, question: "How many legs does a spider have?", options: ["4", "6", "8", "10"], correctAnswer: 2, explanation: "A spider has 8 legs." },
      { id: 10, question: "What is the capital of India?", options: ["Mumbai", "New Delhi", "Kolkata", "Chennai"], correctAnswer: 1, explanation: "New Delhi is the capital of India." }
    ],
    Hindi: [
      { id: 1, question: "यदि 3 + 4 = 7 है, तो 7 + 8 क्या होगा?", options: ["13", "14", "15", "16"], correctAnswer: 2, explanation: "7 + 8 = 15" },
      { id: 2, question: "किस आकृति की चारों भुजाएं बराबर होती हैं?", options: ["आयत", "वर्ग", "त्रिभुज", "वृत्त"], correctAnswer: 1, explanation: "वर्ग की चारों भुजाएं बराबर होती हैं।" },
      { id: 3, question: "अगला क्या आएगा: 2, 4, 6, 8, ?", options: ["9", "10", "11", "12"], correctAnswer: 1, explanation: "यह क्रम हर बार 2 जोड़ता है, इसलिए अगला 10 है।" },
      { id: 4, question: "कौन सा जानवर हमें दूध देता है?", options: ["कुत्ता", "बिल्ली", "गाय", "शेर"], correctAnswer: 2, explanation: "गाय हमें दूध देती है।" },
      { id: 5, question: "एक सप्ताह में कितने दिन होते हैं?", options: ["5", "6", "7", "8"], correctAnswer: 2, explanation: "एक सप्ताह में 7 दिन होते हैं।" },
      { id: 6, question: "हमारे सौरमंडल का सबसे बड़ा ग्रह कौन सा है?", options: ["पृथ्वी", "मंगल", "बृहस्पति", "शनि"], correctAnswer: 2, explanation: "बृहस्पति हमारे सौरमंडल का सबसे बड़ा ग्रह है।" },
      { id: 7, question: "15 - 7 का मान क्या है?", options: ["6", "7", "8", "9"], correctAnswer: 2, explanation: "15 - 7 = 8" },
      { id: 8, question: "सूर्य किस दिशा से उगता है?", options: ["उत्तर", "दक्षिण", "पूर्व", "पश्चिम"], correctAnswer: 2, explanation: "सूर्य पूर्व दिशा से उगता है।" },
      { id: 9, question: "मकड़ी के कितने पैर होते हैं?", options: ["4", "6", "8", "10"], correctAnswer: 2, explanation: "मकड़ी के 8 पैर होते हैं।" },
      { id: 10, question: "भारत की राजधानी क्या है?", options: ["मुंबई", "नई दिल्ली", "कोलकाता", "चेन्नई"], correctAnswer: 1, explanation: "नई दिल्ली भारत की राजधानी है।" }
    ]
  },
  "9th": {
    English: [
      { id: 1, question: "What is the LCM of 12 and 18?", options: ["24", "36", "48", "72"], correctAnswer: 1, explanation: "LCM of 12 and 18 is 36." },
      { id: 2, question: "Which gas is most abundant in Earth's atmosphere?", options: ["Oxygen", "Carbon dioxide", "Nitrogen", "Hydrogen"], correctAnswer: 2, explanation: "Nitrogen makes up about 78% of Earth's atmosphere." },
      { id: 3, question: "What is the formula for area of a circle?", options: ["2πr", "πr²", "πd", "2πr²"], correctAnswer: 1, explanation: "Area of a circle is πr² where r is the radius." },
      { id: 4, question: "Who wrote 'Discovery of India'?", options: ["Mahatma Gandhi", "Jawaharlal Nehru", "Sardar Patel", "Dr. Ambedkar"], correctAnswer: 1, explanation: "Discovery of India was written by Jawaharlal Nehru." },
      { id: 5, question: "What is the SI unit of electric current?", options: ["Volt", "Watt", "Ampere", "Ohm"], correctAnswer: 2, explanation: "Ampere (A) is the SI unit of electric current." },
      { id: 6, question: "If x + 5 = 12, what is x?", options: ["5", "6", "7", "8"], correctAnswer: 2, explanation: "x = 12 - 5 = 7" },
      { id: 7, question: "Which vitamin is produced by sunlight?", options: ["Vitamin A", "Vitamin B", "Vitamin C", "Vitamin D"], correctAnswer: 3, explanation: "Vitamin D is produced when skin is exposed to sunlight." },
      { id: 8, question: "What is the atomic number of Carbon?", options: ["4", "5", "6", "7"], correctAnswer: 2, explanation: "Carbon has atomic number 6." },
      { id: 9, question: "Which river is known as 'Sorrow of Bengal'?", options: ["Ganga", "Brahmaputra", "Damodar", "Hooghly"], correctAnswer: 2, explanation: "Damodar river is known as 'Sorrow of Bengal' due to floods." },
      { id: 10, question: "What is 25% of 200?", options: ["25", "40", "50", "75"], correctAnswer: 2, explanation: "25% of 200 = (25/100) × 200 = 50" }
    ],
    Hindi: [
      { id: 1, question: "12 और 18 का LCM क्या है?", options: ["24", "36", "48", "72"], correctAnswer: 1, explanation: "12 और 18 का LCM 36 है।" },
      { id: 2, question: "पृथ्वी के वायुमंडल में सबसे अधिक कौन सी गैस है?", options: ["ऑक्सीजन", "कार्बन डाइऑक्साइड", "नाइट्रोजन", "हाइड्रोजन"], correctAnswer: 2, explanation: "नाइट्रोजन पृथ्वी के वायुमंडल का लगभग 78% है।" },
      { id: 3, question: "वृत्त के क्षेत्रफल का सूत्र क्या है?", options: ["2πr", "πr²", "πd", "2πr²"], correctAnswer: 1, explanation: "वृत्त का क्षेत्रफल πr² है जहां r त्रिज्या है।" },
      { id: 4, question: "'डिस्कवरी ऑफ इंडिया' किसने लिखी?", options: ["महात्मा गांधी", "जवाहरलाल नेहरू", "सरदार पटेल", "डॉ. अंबेडकर"], correctAnswer: 1, explanation: "डिस्कवरी ऑफ इंडिया जवाहरलाल नेहरू ने लिखी थी।" },
      { id: 5, question: "विद्युत धारा की SI इकाई क्या है?", options: ["वोल्ट", "वाट", "एम्पियर", "ओम"], correctAnswer: 2, explanation: "एम्पियर (A) विद्युत धारा की SI इकाई है।" },
      { id: 6, question: "यदि x + 5 = 12 है, तो x क्या है?", options: ["5", "6", "7", "8"], correctAnswer: 2, explanation: "x = 12 - 5 = 7" },
      { id: 7, question: "सूर्य के प्रकाश से कौन सा विटामिन बनता है?", options: ["विटामिन A", "विटामिन B", "विटामिन C", "विटामिन D"], correctAnswer: 3, explanation: "विटामिन D त्वचा पर सूर्य के प्रकाश पड़ने से बनता है।" },
      { id: 8, question: "कार्बन का परमाणु क्रमांक क्या है?", options: ["4", "5", "6", "7"], correctAnswer: 2, explanation: "कार्बन का परमाणु क्रमांक 6 है।" },
      { id: 9, question: "किस नदी को 'बंगाल का शोक' कहा जाता है?", options: ["गंगा", "ब्रह्मपुत्र", "दामोदर", "हुगली"], correctAnswer: 2, explanation: "दामोदर नदी को बाढ़ के कारण 'बंगाल का शोक' कहा जाता है।" },
      { id: 10, question: "200 का 25% क्या है?", options: ["25", "40", "50", "75"], correctAnswer: 2, explanation: "200 का 25% = (25/100) × 200 = 50" }
    ]
  }
};

export async function generateNavodayaQuizQuestions(
  pdfContent: string,
  examGrade: "6th" | "9th",
  medium: "Hindi" | "English",
  numQuestions: number = 10,
  previousQuestions: string[] = []
): Promise<Question[]> {
  // Calculate starting position based on total previous questions asked
  const startPosition = previousQuestions.length + 1;
  const endPosition = previousQuestions.length + numQuestions;
  
  const sequentialInstruction = `
QUESTION SELECTION (VERY IMPORTANT - FOLLOW EXACTLY):

Student has completed ${previousQuestions.length} questions from this PDF.
YOUR TASK: Pick questions #${startPosition} to #${startPosition + numQuestions - 1} from the PDF.

SIMPLE STEPS:
1. Number all questions in the PDF from 1 to N (where N = total questions in PDF)
2. Start at question #${startPosition}
3. Pick the next ${numQuestions} questions in order
4. If you reach the end of PDF, wrap around to question #1 and continue

DO NOT pick random questions. DO NOT skip questions. Follow the PDF order exactly.

${previousQuestions.length > 0 ? `SKIP THESE (already asked):\n${previousQuestions.slice(-20).map((q, i) => `- ${q.substring(0, 80)}`).join('\n')}` : ''}`;

  const gradeInfo = examGrade === "6th" 
    ? "Class 6 entry level (students appearing from Class 5)" 
    : "Class 9 entry level (students appearing from Class 8)";

  const languageInstruction = medium === "Hindi" 
    ? `IMPORTANT: Generate ALL content (questions, options, explanations) in HINDI (Devanagari script). The entire quiz must be in Hindi language.`
    : `Generate all content in clear, simple English.`;

  const systemPrompt = `You are an EXPERT TEACHER and Jawahar Navodaya Vidyalaya (JNV) entrance exam content creator for India.
${languageInstruction}

Your PRIMARY task is to EXTRACT ${numQuestions} multiple-choice questions DIRECTLY from the provided PDF content for Navodaya entrance exam preparation - ${gradeInfo}.

You MUST return a JSON object with exactly this structure:
{
  "questions": [
    {
      "question": "The full question text?",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctAnswer": 0,
      "explanation": "Why this answer is correct"
    }
  ]
}

RULES:
- "question" must be a complete question sentence in ${medium}
- "options" must be an array of exactly 4 answer choices in ${medium}
- "correctAnswer" must be 0, 1, 2, or 3 (the ZERO-BASED index of the correct option)
- "explanation" must explain why the answer is correct in ${medium} AND MUST match the correctAnswer index
- If extracting from PDF, use the PDF's answer as the correct answer
- Return exactly ${numQuestions} questions appropriate for ${gradeInfo}

MATH FORMATTING (IMPORTANT):
- For exponents/powers, use caret notation: a^2 for a squared, x^3 for x cubed
- Examples: "2^3 = 8", "x^2 + y^2", "(a+b)^2", "10^-3"
- For subscripts: Use underscore notation like H_2O, CO_2
- For fractions: Use a/b format or "a divided by b"

CRITICAL EXPERT TEACHER VERIFICATION (MANDATORY FOR EVERY QUESTION):
As an expert teacher, you MUST critically verify EACH question before including it:
1. SOLVE the problem yourself step-by-step and note the calculated answer
2. VERIFY that your calculated answer matches options[correctAnswer]
3. CHECK that correctAnswer index (0,1,2,3) points to the EXACT correct option in the options array
4. CONFIRM the explanation's answer matches options[correctAnswer]
5. For arithmetic: If the question asks "Sum of two numbers is 40, one is 18, what is the other?" → Calculate: 40-18=22 → Find "22" in options → Set correctAnswer to that index
6. DOUBLE-CHECK: Read options[correctAnswer] - is it truly the correct answer? If not, FIX the correctAnswer index

EXAMPLE VERIFICATION:
Question: "दो संख्याओं का योग 40 है। एक संख्या 18 है, दूसरी क्या होगी?"
Step 1: Calculate → 40 - 18 = 22
Step 2: options = ["20", "22", "24", "26"]
Step 3: "22" is at index 1
Step 4: correctAnswer MUST be 1
Step 5: Explanation must say "40 - 18 = 22"

REJECT any question where the correctAnswer index does not match the calculated/verified answer.

${sequentialInstruction}`;

  const userPrompt = `EXTRACT ${numQuestions} questions from the ENTIRE PDF content below for ${gradeInfo}.

MCQ CONVERSION RULES:

1. **EXISTING MCQs**: Extract exactly as they appear in the PDF
2. **SHORT ANSWER (1-2 words/numbers)**: PDF answer = correct option, generate 3 plausible wrong alternatives
3. **SENTENCE-LENGTH (1-2 sentences)**: Full sentence = correct option, create 3 wrong options with factual errors
4. **PARAGRAPH/ESSAY (3+ sentences)**: Break into MULTIPLE sub-questions, each testing ONE fact
5. **FILL-IN-THE-BLANK**: Convert using PDF's answer as correct option
6. **TRUE/FALSE**: Create 4 options: ["True", "False", "Partially true", "None of the above"]
7. **DEFINITIONS**: Create "What is..." MCQs
8. **DIAGRAM-BASED**: Generate questions about parts, labels, functions - use your understanding for correct answers
9. Do not skip any type of question. Follow rules 1-8 depending on question type.
10. No question shall be skipped from PDF unless there is a parsing issue.
11. If answer is available in PDF, give it top priority. If not available, AI provides best possible option.
12. Wrong options must be plausible but clearly incorrect.
13. NEVER create questions from topics not in PDF.

LANGUAGE: Generate all content in ${medium === "Hindi" ? "Hindi (Devanagari script देवनागरी)" : "English"}

PDF Content for ${examGrade} Navodaya exam:
${pdfContent.substring(0, 50000)}`;

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
    
    let questions: any[];
    if (Array.isArray(parsed)) {
      questions = parsed;
    } else if (parsed.questions && Array.isArray(parsed.questions)) {
      questions = parsed.questions;
    } else {
      const arrayKey = Object.keys(parsed).find(key => Array.isArray(parsed[key]));
      if (arrayKey) {
        questions = parsed[arrayKey];
      } else {
        throw new Error("Invalid response format from OpenAI");
      }
    }
    
    if (questions.length === 0) {
      throw new Error("No questions in OpenAI response");
    }

    const validQuestions = questions.filter((q: any) => 
      q.question && 
      Array.isArray(q.options) && 
      q.options.length >= 2 &&
      (q.correctAnswer !== undefined || q.correct_answer !== undefined || q.answer !== undefined)
    );

    if (validQuestions.length === 0) {
      throw new Error("OpenAI response missing required question fields");
    }

    console.log(`Generated ${validQuestions.length} Navodaya questions for ${examGrade} in ${medium}`);

    return validQuestions.map((q: any, index: number) => ({
      id: index + 1,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer ?? q.correct_answer ?? q.answer ?? 0,
      explanation: q.explanation ?? q.reason ?? (medium === "Hindi" ? "इस विषय की समीक्षा करें।" : "Review this topic."),
    }));
  } catch (error) {
    console.error("Error generating Navodaya questions with OpenAI, using fallback:", error);
    const gradeKey = examGrade === "6th" ? "6th" : "9th";
    const fallback = NAVODAYA_FALLBACK_QUESTIONS[gradeKey][medium] || NAVODAYA_FALLBACK_QUESTIONS[gradeKey].English;
    
    const previousSet = new Set(previousQuestions.map(q => q.toLowerCase().trim()));
    let availableQuestions = fallback.filter(q => 
      !previousSet.has(q.question.toLowerCase().trim())
    );
    
    if (availableQuestions.length < numQuestions) {
      availableQuestions = fallback;
    }
    
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
