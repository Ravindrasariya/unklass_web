import type { ParsedQuestion, ChapterMetadata } from "@shared/schema";

function isTableLine(line: string): boolean {
  // Detect table-like lines: pipes, multiple consecutive spaces (3+), tab-separated content
  if (line.includes('|')) return true;
  if (/\t/.test(line)) return true;
  // Check for column-like structure: multiple groups of text separated by 3+ spaces
  if (/\S\s{3,}\S/.test(line)) return true;
  // Table header/separator lines
  if (/^[\s\-|+]+$/.test(line) && line.length > 10) return true;
  return false;
}

function preserveTableStructure(content: string): string {
  // Convert tables to a more parseable format while preserving structure
  const lines = content.split('\n');
  const result: string[] = [];
  
  for (const line of lines) {
    if (isTableLine(line)) {
      // Replace tabs with " | " to preserve column separation
      let tableLine = line.replace(/\t+/g, ' | ');
      // Preserve multiple spaces as column separators but mark them
      tableLine = tableLine.replace(/(\S)\s{3,}(\S)/g, '$1 | $2');
      result.push(tableLine);
    } else {
      result.push(line);
    }
  }
  
  return result.join('\n');
}

function normalizeContent(content: string): string {
  // First preserve table structure before other normalization
  let normalized = preserveTableStructure(content);
  
  normalized = normalized
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ')
    // Only collapse spaces that are NOT part of table structure (already converted to |)
    .replace(/[ ]{3,}/g, '  ')
    .replace(/^\s*Page\s*\d+.*$/gim, '')
    .replace(/^\s*\d+\s*$/gm, '')
    .replace(/^\s*[-_=]{3,}\s*$/gm, '')
    .replace(/\n{3,}/g, '\n\n');

  const hindiNumerals: Record<string, string> = {
    '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
    '५': '5', '६': '6', '७': '7', '८': '8', '९': '9'
  };
  for (const [hindi, arabic] of Object.entries(hindiNumerals)) {
    normalized = normalized.replace(new RegExp(hindi, 'g'), arabic);
  }

  return normalized.trim();
}

// Check if a match position looks like a real question boundary vs mid-sentence number
// Returns false for cases like "₹90. The discount" where 90 is a value, not question number
function isLikelyQuestionBoundary(content: string, matchPos: number, matchedNum: number): boolean {
  // Look at the ~50 chars before the match to check context
  const lookbackStart = Math.max(0, matchPos - 50);
  const textBefore = content.substring(lookbackStart, matchPos);
  
  // Find the line boundary before the match
  const lastNewline = textBefore.lastIndexOf('\n');
  const prevLineEnd = lastNewline >= 0 ? textBefore.substring(0, lastNewline) : '';
  const currentLineStart = lastNewline >= 0 ? textBefore.substring(lastNewline + 1) : textBefore;
  
  // If there's non-whitespace text on the same line before the number, it's probably not a question start
  // Exception: allow "Question 1" or "Q1" type prefixes
  if (currentLineStart.trim().length > 0) {
    const hasQuestionPrefix = /(?:Que?s?(?:tion)?|Q|प्रश्न|Qn)\s*$/i.test(currentLineStart.trim());
    if (!hasQuestionPrefix) {
      return false;
    }
  }
  
  // Check if the previous line ends with patterns that suggest continuation
  const continuationEndings = [
    /[₹$€£]\s*$/,                    // Currency symbols: "₹" or "₹ "
    /\d+\s*$/,                        // Ends with a number
    /[+\-×÷=<>]\s*$/,                // Math operators
    /(?:is|are|was|were|for|and|or|of|to|in|at|by)\s*$/i,  // Prepositions/articles
    /[:;,]\s*$/,                      // Punctuation that continues
    /(?:है|का|की|के|को|में|से|पर)\s*$/,  // Hindi particles
  ];
  
  const prevLineTrimmed = prevLineEnd.trim();
  for (const pattern of continuationEndings) {
    if (pattern.test(prevLineTrimmed)) {
      return false;
    }
  }
  
  // Check if the matched number is suspiciously high and doesn't follow a sequential pattern
  // Numbers like 90, 100, 500 appearing suddenly are likely values, not question numbers
  // But this needs to be balanced - we do have PDFs with 50+ questions
  
  return true;
}

// Check if text looks like an actual MCQ (has options like A/B/C/D or answer markers)
function looksLikeMCQ(text: string): boolean {
  // Check for option patterns: (a), (b), A., B., 1), 2), etc.
  const optionPatterns = [
    /\n\s*\(?[aA]\)?[\s.\):\-]/,           // (a) or A. or a)
    /\n\s*\(?[bB]\)?[\s.\):\-]/,           // (b) or B. or b)
    /\n\s*[ABCD]\.\s/,                      // A. B. C. D.
    /\([aA]\)\s/,                           // (a) inline
    /\([bB]\)\s/,                           // (b) inline
  ];
  
  // Check for answer markers
  const answerPatterns = [
    /(?:Answer|Ans|उत्तर|Correct\s*(?:Answer|Option)?)\s*[:\.\-\s]*[a-dA-D1-4]/i,
    /Correct Answer\s*:/i,
    /सही उत्तर\s*:/,
  ];
  
  // Must have at least 2 option patterns OR an answer marker
  let optionCount = 0;
  for (const pattern of optionPatterns) {
    if (pattern.test(text)) {
      optionCount++;
    }
  }
  
  if (optionCount >= 2) return true;
  
  // Check for answer markers
  for (const pattern of answerPatterns) {
    if (pattern.test(text)) return true;
  }
  
  return false;
}

function extractQuestionsWithPatterns(content: string): { num: number; text: string; startPos: number }[] {
  // Step 1: Find ALL question start positions using multiple patterns
  // Pattern 1: "Question 1", "Question\t1", "Question | 1", "Q1.", "प्रश्न 1", etc.
  // Pattern 2: Just numbered questions like "81. What is..." (for PDFs that switch format mid-file)
  
  const patterns = [
    // "Question N" format (with optional prefix word) - these are reliable, don't need boundary check
    { regex: /(?:^|\n|[.\s])(?:Que?s?(?:tion)?|Q|प्रश्न|Qn)[\s.\-:\t|]*(\d+)[\s.\-:)\]\t|]*/gi, needsBoundaryCheck: false },
    // Just number followed by period at start of line: "81. What is..." - needs context check
    { regex: /(?:^|\n)(\d{1,3})\.\s+(?=[A-Z])/g, needsBoundaryCheck: true },
    // Hindi PDF format: ".-1." or "प्र-1." or "प्र.-1." patterns - reliable prefix
    { regex: /(?:^|\n|\|)\s*(?:प्र)?\.?\-(\d{1,3})\.\s*/gi, needsBoundaryCheck: false },
    // Format: "Q-1." or "प्र-1" without trailing period - reliable prefix
    { regex: /(?:^|\n|\|)\s*(?:Q|प्र)[\.\-](\d{1,3})[\.\s\|]/gi, needsBoundaryCheck: false },
  ];
  
  const questionStarts: { num: number; startPos: number; matchEnd: number }[] = [];
  
  for (const { regex: pattern, needsBoundaryCheck } of patterns) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const num = parseInt(match[1], 10);
      if (num > 0 && num <= 500) {
        // For simple number patterns, check if this looks like a real question boundary
        if (needsBoundaryCheck && !isLikelyQuestionBoundary(content, match.index, num)) {
          if (match.index === pattern.lastIndex) pattern.lastIndex++;
          continue;
        }
        
        // Check if we already have this position (to avoid duplicates from different patterns)
        const exists = questionStarts.some(q => Math.abs(q.startPos - match!.index) < 10 && q.num === num);
        if (!exists) {
          questionStarts.push({
            num,
            startPos: match.index,
            matchEnd: match.index + match[0].length
          });
        }
      }
      if (match.index === pattern.lastIndex) pattern.lastIndex++;
    }
  }
  
  // Step 2: Sort by position to ensure correct order
  questionStarts.sort((a, b) => a.startPos - b.startPos);
  
  // Step 3: Slice content between question boundaries
  const result: { num: number; text: string; startPos: number }[] = [];
  
  for (let i = 0; i < questionStarts.length; i++) {
    const current = questionStarts[i];
    const nextStart = i + 1 < questionStarts.length ? questionStarts[i + 1].startPos : content.length;
    
    // Extract text from after the "Question N" marker to just before the next question
    const text = content.substring(current.matchEnd, nextStart).trim();
    
    // Only include if it looks like an actual MCQ (has options or answer markers)
    if (text.length > 15 && text.length < 8000 && looksLikeMCQ(text)) {
      result.push({
        num: current.num,
        text,
        startPos: current.startPos
      });
    }
  }
  
  // Step 4: Return all questions sorted by position (not by number)
  // Each chapter restarts numbering, so we keep all questions in document order
  return result;
}

// Check if a line-by-line match looks like a real question start vs mid-sentence number
function isLikelyQuestionStartLine(lines: string[], lineIndex: number): boolean {
  if (lineIndex === 0) return true; // First line is always valid
  
  // Find the previous non-empty line
  let prevLineIdx = lineIndex - 1;
  while (prevLineIdx >= 0 && !lines[prevLineIdx].trim()) {
    prevLineIdx--;
  }
  
  if (prevLineIdx < 0) return true; // No previous content
  
  const prevLine = lines[prevLineIdx].trim();
  
  // If previous line is empty or very short, this is likely a new question
  if (prevLine.length < 3) return true;
  
  // Check if the previous line ends with patterns that suggest continuation
  const continuationEndings = [
    /[₹$€£]\s*$/,                    // Currency symbols
    /\d+\s*$/,                        // Ends with a number
    /[+\-×÷=<>]\s*$/,                // Math operators
    /(?:is|are|was|were|for|and|or|of|to|in|at|by)\s*$/i,  // Prepositions/articles
    /[:;,]\s*$/,                      // Punctuation that continues
    /(?:है|का|की|के|को|में|से|पर)\s*$/,  // Hindi particles
  ];
  
  for (const pattern of continuationEndings) {
    if (pattern.test(prevLine)) {
      return false;
    }
  }
  
  // If previous line ends with answer/option or section header, this is a new question
  const boundaryEndings = [
    /(?:Answer|Ans|उत्तर).*$/i,
    /\([a-dA-D]\)\s*$/,               // Ends with option like "(a)"
    /Section\s+[A-Z].*$/i,
    /[.!?।]\s*$/,                     // Ends with sentence-ending punctuation
  ];
  
  for (const pattern of boundaryEndings) {
    if (pattern.test(prevLine)) {
      return true;
    }
  }
  
  return true; // Default to accepting if no clear signal
}

function extractQuestionsLineByLine(content: string): { num: number; text: string }[] {
  const lines = content.split('\n');
  const questions: { num: number; text: string; lineIndex: number }[] = [];
  
  // Pattern with explicit question prefix - reliable
  const questionStartPattern = /^\s*(?:Que?s?(?:tion)?|Q|प्रश्न|Qn)[\s.\-:]*(\d{1,3})[\s.\-:)\]]+(.+)/i;
  // Simple number pattern - needs context check
  const simpleNumberPattern = /^\s*(\d{1,3})\s*[.\):\-\]]\s*(.+)/;
  
  // Track preceding table context
  let precedingTableLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    // Accumulate table lines that might belong to the next question
    if (isTableLine(line) || (trimmedLine.includes('|') && trimmedLine.length > 5)) {
      precedingTableLines.push(trimmedLine);
      continue;
    }
    
    // Clear table context if we hit an empty line (table block ended)
    if (!trimmedLine) {
      // Keep the table context for now - it might precede a question
      continue;
    }
    
    // Try explicit question pattern first (more reliable)
    let match = line.match(questionStartPattern);
    let usedSimplePattern = false;
    
    if (!match) {
      match = line.match(simpleNumberPattern);
      usedSimplePattern = true;
    }
    
    if (match) {
      const num = parseInt(match[1], 10);
      let text = match[2]?.trim() || '';
      
      // For simple number patterns, check if this looks like a real question start
      if (usedSimplePattern && !isLikelyQuestionStartLine(lines, i)) {
        continue; // Skip - this is probably a value, not a question number
      }
      
      if (num > 0 && num <= 500 && text.length > 5) {
        // Prepend any preceding table context
        if (precedingTableLines.length > 0) {
          const tableContext = precedingTableLines.join('\n');
          text = '[Table Context]\n' + tableContext + '\n[Question]\n' + text;
        }
        
        let j = i + 1;
        while (j < lines.length) {
          const nextLine = lines[j].trim();
          if (!nextLine) { j++; continue; }
          
          const isNewQuestion = questionStartPattern.test(lines[j]) || simpleNumberPattern.test(lines[j]);
          const isOption = /^[\(\[]?\s*[a-dA-D1-4]\s*[\)\]\.:]/.test(nextLine);
          const isAnswer = /^(?:Answer|Ans|उत्तर|Correct)/i.test(nextLine);
          const isMarks = /^\s*\[?\s*\d+\s*(?:marks?|अंक)\s*\]?\s*$/i.test(nextLine);
          const isTableContent = isTableLine(lines[j]) || nextLine.includes('|');
          
          if (isNewQuestion) break;
          if (isMarks) { j++; continue; }
          
          // Include table content that follows the question
          if (isTableContent) {
            text += '\n' + nextLine;
            j++;
            continue;
          }
          
          if (isOption || isAnswer) {
            text += '\n' + nextLine;
            j++;
            while (j < lines.length) {
              const optLine = lines[j].trim();
              if (!optLine || questionStartPattern.test(lines[j]) || simpleNumberPattern.test(lines[j])) break;
              text += '\n' + optLine;
              j++;
            }
            break;
          }
          
          if (nextLine.length < 200) {
            text += ' ' + nextLine;
            j++;
          } else {
            break;
          }
        }
        
        // Only include if it looks like an actual MCQ
        if (text.length > 15 && text.length < 8000 && looksLikeMCQ(text)) {
          questions.push({ num, text: text.trim(), lineIndex: i });
        }
        
        // Clear table context after using it
        precedingTableLines = [];
      }
    } else {
      // Non-question, non-table line - clear table context
      precedingTableLines = [];
    }
  }

  // Return all questions in document order (not deduped by number)
  // Each chapter restarts numbering, so we keep all questions
  return questions.sort((a, b) => a.lineIndex - b.lineIndex);
}

function extractAnswerFromText(text: string): { questionText: string; answer: string | undefined } {
  const answerPatterns = [
    /\n\s*(?:Answer|Ans|उत्तर|Correct\s*(?:Answer|Option)?)\s*[:\.\-\s]*([a-dA-D1-4]|\([a-dA-D1-4]\)|.{1,100})(?:\n|$)/i,
    /\((?:Answer|Ans|उत्तर)\s*[:\.\-\s]*([a-dA-D1-4]|.{1,50})\)/i,
    /(?:Answer|Ans|उत्तर)\s*[:\.\-\s]+([a-dA-D1-4]|\([a-dA-D1-4]\)|.{1,100})(?:\n|$)/i,
  ];
  
  for (const pattern of answerPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return {
        questionText: text.replace(pattern, '').trim(),
        answer: match[1].trim()
      };
    }
  }
  
  return { questionText: text, answer: undefined };
}

// Detect text fragments that are not complete questions
// These are typically partial sentences, continuation of answers, or truncated text
function isFragment(text: string): boolean {
  const trimmed = text.trim();
  
  // Too short to be a real question (less than 25 chars)
  if (trimmed.length < 25) return true;
  
  // Starts with lowercase letter (likely continuation of previous text)
  if (/^[a-z]/.test(trimmed)) return true;
  
  // Starts with common continuation patterns
  const continuationPatterns = [
    /^\(e\.g\./i,                          // "(e.g., ..."
    /^\(i\.e\./i,                          // "(i.e., ..."
    /^Step\s*:/i,                          // "Step: ..."
    /^Reason\s*:/i,                        // "Reason: ..."
    /^Note\s*:/i,                          // "Note: ..."
    /^Hint\s*:/i,                          // "Hint: ..."
    /^Where\s/i,                           // "Where x = ..."
    /^Here\s/i,                            // "Here, we ..."
    /^This\s+is\s/i,                       // "This is ..."
    /^Since\s/i,                           // "Since ..."
    /^Because\s/i,                         // "Because ..."
    /^Therefore\s/i,                       // "Therefore ..."
    /^Hence\s/i,                           // "Hence ..."
    /^Thus\s/i,                            // "Thus ..."
    /^So\s/i,                              // "So ..."
    /^and\s/i,                             // "and ..."
    /^or\s/i,                              // "or ..."
    /^but\s/i,                             // "but ..."
    /^with\s/i,                            // "with ..."
    /^for\s/i,                             // "for ..."
    /^to\s/i,                              // "to ..."
    /^of\s/i,                              // "of ..."
    /^in\s/i,                              // "in ..."
    /^at\s/i,                              // "at ..."
    /^by\s/i,                              // "by ..."
    /^from\s/i,                            // "from ..."
    /^₹\d/,                                // "₹100..." (currency continuation)
    /^\d+\s*[×x]\s*\d+/,                   // "20×20×20" (calculation)
    /^[=+\-×÷]/,                           // starts with math operator
    /^\.\s/,                               // starts with period
    /^,\s/,                                // starts with comma
  ];
  
  for (const pattern of continuationPatterns) {
    if (pattern.test(trimmed)) return true;
  }
  
  // Only contains options without question stem (like "(a) 2πrh (b) πr")
  // Real questions should have text before the options
  if (/^\s*\(?[aA]\)?[\s.\):]/.test(trimmed)) return true;
  
  // Just a partial answer or explanation
  if (/^Answer\s*:/i.test(trimmed) && trimmed.length < 100) return true;
  
  // Contains only a number pattern like "= 4.5." or "×4=300"
  if (/^[=×÷+\-]?\s*\d+[\d.,\s×÷+\-=]*\.?\s*$/.test(trimmed)) return true;
  
  // Hindi continuation patterns
  const hindiContinuationPatterns = [
    /^अर्थात्/,                              // "i.e."
    /^जैसे\s/,                              // "like"
    /^क्योंकि/,                             // "because"
    /^इसलिए/,                               // "therefore"
    /^अतः/,                                 // "hence"
  ];
  
  for (const pattern of hindiContinuationPatterns) {
    if (pattern.test(trimmed)) return true;
  }
  
  return false;
}

// Filter out instruction-like or notes entries that aren't real questions
// IMPORTANT: Only use explicit pattern matching - avoid length-based filtering that may drop valid short questions
function isInstructionOrNote(text: string): boolean {
  const trimmed = text.trim();
  
  // Common instruction/header patterns (English) - ONLY filter if text STARTS with these patterns
  const instructionPatterns = [
    /^choose the correct (?:option|answer)\s*[:.\-]?\s*$/i,
    /^select the (?:correct|right) (?:option|answer)\s*[:.\-]?\s*$/i,
    /^multiple choice questions?\s*[:.\-]?\s*$/i,
    /^answer the following\s*[:.\-]?\s*$/i,
    /^questions?\s*:?\s*$/i,
    /^mcq\s*:?\s*$/i,
    /^instructions?\s*:?\s*$/i,
    /^directions?\s*:?\s*$/i,
    /^note\s*:?\s*$/i,
    /^notes?\s*:?\s*$/i,
    /^objective (?:type )?questions?\s*[:.\-]?\s*$/i,
    /^section\s*[-:]\s*[a-z]\s*$/i,
    /^part\s*[-:]\s*[a-z]\s*$/i,
    /^each question carries\s+\d+\s*marks?\s*\.?\s*$/i,
    /^attempt all questions\s*\.?\s*$/i,
    /^answer any \d+\s*questions?\s*\.?\s*$/i,
    /^time allowed\s*[:.\-]/i,
    /^maximum marks\s*[:.\-]/i,
    /^general instructions\s*[:.\-]?\s*$/i,
    /^read the (?:passage|following|text) (?:carefully|and answer)\s*[:.\-]?\s*$/i,
  ];
  
  // Common instruction/header patterns (Hindi) - ONLY filter if text matches these patterns
  const hindiInstructionPatterns = [
    /^सही विकल्प चुन(?:िए|ें|ो)\s*[:\-।]?\s*$/i,
    /^निम्नलिखित में से सही विकल्प चुन(?:िए|ें|ो)\s*[:\-।]?\s*$/i,
    /^प्रश्न\s*:?\s*$/i,
    /^प्रश्नों के उत्तर (?:लिखिए|दीजिए)\s*[:\-।]?\s*$/i,
    /^निर्देश\s*[:।]?\s*$/i,
    /^टिप्पणी\s*[:।]?\s*$/i,
    /^नोट\s*[:।]?\s*$/i,
    /^वस्तुनिष्ठ प्रश्न\s*[:।]?\s*$/i,
    /^खंड\s*[-:।]\s*[अआ]\s*$/i,
    /^भाग\s*[-:।]\s*[अआ]\s*$/i,
    /^प्रत्येक प्रश्न\s+\d+\s*अंक\s*(?:का है)?[।]?\s*$/i,
    /^सभी प्रश्न (?:करें|अनिवार्य हैं)\s*[।]?\s*$/i,
    /^समय\s*[-:।]\s*\d+/i,
    /^पूर्णांक\s*[-:।]\s*\d+/i,
    /^सामान्य निर्देश\s*[:।]?\s*$/i,
  ];
  
  // Check against all patterns
  for (const pattern of [...instructionPatterns, ...hindiInstructionPatterns]) {
    if (pattern.test(trimmed)) return true;
  }
  
  return false;
}

export function parseQuestionsFromPdfContent(content: string): ParsedQuestion[] {
  const normalizedContent = normalizeContent(content);
  
  let bestQuestions: { num: number; text: string }[] = [];
  
  const patternMatches = extractQuestionsWithPatterns(normalizedContent);
  if (patternMatches.length > bestQuestions.length) {
    bestQuestions = patternMatches;
  }
  
  const lineMatches = extractQuestionsLineByLine(normalizedContent);
  if (lineMatches.length > bestQuestions.length) {
    bestQuestions = lineMatches;
  }

  const originalPatternMatches = extractQuestionsWithPatterns(content);
  if (originalPatternMatches.length > bestQuestions.length) {
    bestQuestions = originalPatternMatches;
  }
  
  const originalLineMatches = extractQuestionsLineByLine(content);
  if (originalLineMatches.length > bestQuestions.length) {
    bestQuestions = originalLineMatches;
  }

  // Filter out instructions/notes and fragments before processing
  bestQuestions = bestQuestions.filter(q => !isInstructionOrNote(q.text) && !isFragment(q.text));

  if (bestQuestions.length < 5) {
    const chunks = splitContentIntoChunks(normalizedContent, 150);
    // Also filter chunks that look like instructions
    const validChunks = chunks.filter(chunk => !isInstructionOrNote(chunk));
    return validChunks.map((chunk, i) => ({
      index: i,
      rawText: chunk,
      questionText: undefined,
      answer: undefined,
    }));
  }

  return bestQuestions.map((q, i) => {
    const { questionText, answer } = extractAnswerFromText(q.text);
    return {
      index: i,
      rawText: q.text,
      questionText: questionText.substring(0, 2000),
      answer,
    };
  });
}

function splitContentIntoChunks(content: string, targetChunkCount: number): string[] {
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 20);
  
  if (paragraphs.length >= targetChunkCount) {
    return paragraphs.slice(0, targetChunkCount);
  }
  
  const chunkSize = Math.ceil(content.length / targetChunkCount);
  const chunks: string[] = [];
  
  for (let i = 0; i < content.length && chunks.length < targetChunkCount; i += chunkSize) {
    const chunk = content.substring(i, i + chunkSize).trim();
    if (chunk.length > 20) {
      chunks.push(chunk);
    }
  }
  
  return chunks;
}

export function getSequentialQuestions(
  parsedQuestions: ParsedQuestion[],
  startIndex: number,
  count: number
): { questions: ParsedQuestion[]; newLastIndex: number } {
  if (parsedQuestions.length === 0) {
    return { questions: [], newLastIndex: 0 };
  }
  
  const total = parsedQuestions.length;
  const cycledStartIndex = startIndex % total;
  
  const selectedQuestions: ParsedQuestion[] = [];
  
  for (let i = 0; i < count; i++) {
    const index = (cycledStartIndex + i) % total;
    selectedQuestions.push(parsedQuestions[index]);
  }
  
  const newLastIndex = (cycledStartIndex + count - 1) % total;
  
  return {
    questions: selectedQuestions,
    newLastIndex,
  };
}

export function parseChaptersFromPdfContent(content: string): ChapterMetadata[] {
  const normalizedContent = normalizeContent(content);
  const lines = normalizedContent.split('\n');
  
  const chapterPatterns = [
    /^(?:Chapter|अध्याय|Ch\.?)\s*(\d+)\s*[:\.\-–—]\s*(.+)/i,
    /^(?:Chapter|अध्याय)\s*(\d+)\s+(.+)/i,
    /^(\d+)\s*[:\.\-–—]\s*(.+)$/,
    /^Unit\s*(\d+)\s*[:\.\-–—]\s*(.+)/i,
    /^पाठ\s*(\d+)\s*[:\.\-–—]?\s*(.+)/i,
  ];
  
  const chapters: { chapterNumber: number; chapterName: string; lineIndex: number }[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.length < 3 || line.length > 150) continue;
    
    for (const pattern of chapterPatterns) {
      const match = line.match(pattern);
      if (match && match[1] && match[2]) {
        const chapterNumber = parseInt(match[1], 10);
        const chapterName = match[2].trim();
        
        if (chapterNumber > 0 && chapterNumber <= 50 && chapterName.length >= 2) {
          const exists = chapters.some(c => c.chapterNumber === chapterNumber);
          if (!exists) {
            chapters.push({ chapterNumber, chapterName, lineIndex: i });
          }
          break;
        }
      }
    }
  }
  
  chapters.sort((a, b) => a.chapterNumber - b.chapterNumber);
  
  return chapters.map(c => ({
    chapterNumber: c.chapterNumber,
    chapterName: c.chapterName,
    questionCount: 0,
    startIndex: 0,
    endIndex: 0,
  }));
}

export function parseQuestionsWithChapters(content: string): {
  questions: ParsedQuestion[];
  chapters: ChapterMetadata[];
} {
  const normalizedContent = normalizeContent(content);
  
  // Standard patterns for single-line chapter headings
  const chapterPatterns = [
    /(?:Chapter|अध्याय|Ch\.?)\s*(\d+)\s*[:\.\-–—]\s*(.+)/gi,
    /(?:Chapter|अध्याय)\s*(\d+)\s+(.+)/gi,
    /^Unit\s*(\d+)\s*[:\.\-–—]\s*(.+)/gim,
    /^पाठ\s*(\d+)\s*[:\.\-–—]?\s*(.+)/gim,
  ];
  
  const chapterPositions: { chapterNumber: number; chapterName: string; position: number }[] = [];
  
  // First, try standard single-line patterns
  for (const pattern of chapterPatterns) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(normalizedContent)) !== null) {
      const chapterNumber = parseInt(match[1], 10);
      const chapterName = match[2]?.trim() || `Chapter ${chapterNumber}`;
      
      if (chapterNumber > 0 && chapterNumber <= 50) {
        const exists = chapterPositions.some(c => c.chapterNumber === chapterNumber);
        if (!exists) {
          chapterPositions.push({
            chapterNumber,
            chapterName,
            position: match.index,
          });
        }
      }
    }
  }
  
  // Handle multi-line chapter headings (common with large font PDFs)
  const lines = normalizedContent.split('\n');
  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i].trim();
    
    if (/^(?:Chapter|अध्याय|Ch\.?)$/i.test(line)) {
      let chapterNumber: number | null = null;
      let chapterName: string | null = null;
      let lineOffset = 1;
      
      for (let j = i + 1; j <= Math.min(i + 2, lines.length - 1); j++) {
        const nextLine = lines[j].trim();
        const numMatch = nextLine.match(/^(\d+)$/);
        if (numMatch) {
          chapterNumber = parseInt(numMatch[1], 10);
          lineOffset = j - i + 1;
          break;
        }
        const numOnlyMatch = nextLine.match(/^(\d+)\s*[:\.\-–—]?\s*$/);
        if (numOnlyMatch) {
          chapterNumber = parseInt(numOnlyMatch[1], 10);
          lineOffset = j - i + 1;
          break;
        }
      }
      
      if (chapterNumber && chapterNumber > 0 && chapterNumber <= 50) {
        for (let j = i + lineOffset; j <= Math.min(i + lineOffset + 2, lines.length - 1); j++) {
          const titleLine = lines[j].trim();
          if (!titleLine || /^\d+$/.test(titleLine)) continue;
          if (/^(?:Que?s?(?:tion)?|Q|प्रश्न)/i.test(titleLine)) break;
          if (titleLine.length >= 2 && titleLine.length <= 100) {
            chapterName = titleLine;
            break;
          }
        }
        
        if (chapterName) {
          const exists = chapterPositions.some(c => c.chapterNumber === chapterNumber);
          if (!exists) {
            const linesBefore = lines.slice(0, i).join('\n');
            const position = linesBefore.length;
            chapterPositions.push({ chapterNumber, chapterName, position });
          }
        }
      }
    }
  }
  
  chapterPositions.sort((a, b) => a.position - b.position);
  
  // If no chapters found, return all questions as a single chapter
  if (chapterPositions.length === 0) {
    const parsedQuestions = parseQuestionsFromPdfContent(content);
    return {
      questions: parsedQuestions,
      chapters: [{
        chapterNumber: 1,
        chapterName: "All Questions",
        questionCount: parsedQuestions.length,
        startIndex: 0,
        endIndex: parsedQuestions.length - 1,
      }],
    };
  }
  
  // Parse questions PER CHAPTER to avoid deduplication issues
  // (Each chapter may restart numbering from 1)
  const allQuestions: ParsedQuestion[] = [];
  const chapters: ChapterMetadata[] = [];
  
  for (let i = 0; i < chapterPositions.length; i++) {
    const current = chapterPositions[i];
    const nextPosition = i + 1 < chapterPositions.length 
      ? chapterPositions[i + 1].position 
      : normalizedContent.length;
    
    // Extract content for this chapter only
    const chapterContent = normalizedContent.substring(current.position, nextPosition);
    
    // Parse questions from this chapter's content (no global deduplication)
    const chapterQuestions = parseChapterQuestions(chapterContent, current.chapterNumber);
    
    if (chapterQuestions.length > 0) {
      const startIndex = allQuestions.length;
      allQuestions.push(...chapterQuestions);
      const endIndex = allQuestions.length - 1;
      
      chapters.push({
        chapterNumber: current.chapterNumber,
        chapterName: current.chapterName,
        questionCount: chapterQuestions.length,
        startIndex,
        endIndex,
      });
    } else {
      chapters.push({
        chapterNumber: current.chapterNumber,
        chapterName: current.chapterName,
        questionCount: 0,
        startIndex: 0,
        endIndex: 0,
      });
    }
  }
  
  return { questions: allQuestions, chapters };
}

// Parse questions from a chapter's content without global deduplication
function parseChapterQuestions(chapterContent: string, chapterNum: number): ParsedQuestion[] {
  const questionPattern = /(?:^|\n)\s*(\d{1,3})\s*[.\):\-\]]\s+(.+?)(?=\n\s*\d{1,3}\s*[.\):\-\]]\s+|\n\s*(?:Chapter|अध्याय)\s*\d+|$)/gi;
  
  const questions: ParsedQuestion[] = [];
  let match;
  
  // First try: regex-based extraction
  while ((match = questionPattern.exec(chapterContent)) !== null) {
    const questionNum = parseInt(match[1], 10);
    let text = match[2]?.trim() || '';
    
    if (questionNum > 0 && questionNum <= 100 && text.length > 10) {
      // Check if text has MCQ pattern
      const hasOptions = /[(\[]?\s*[aA]\s*[)\]\.:]/.test(text);
      
      if (hasOptions) {
        questions.push({
          index: questions.length, // Sequential numbering across all chapters
          rawText: text,
        });
      }
    }
  }
  
  // Fallback: line-by-line parsing if regex didn't find enough
  if (questions.length === 0) {
    const lines = chapterContent.split('\n');
    const simplePattern = /^\s*(\d{1,3})\s*[.\):\-\]]\s*(.+)/;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineMatch = line.match(simplePattern);
      
      if (lineMatch) {
        const qNum = parseInt(lineMatch[1], 10);
        let text = lineMatch[2]?.trim() || '';
        
        // Collect continuation lines
        let j = i + 1;
        while (j < lines.length) {
          const nextLine = lines[j].trim();
          if (!nextLine) { j++; continue; }
          if (simplePattern.test(lines[j])) break;
          if (/^(?:Chapter|अध्याय)\s*\d+/i.test(nextLine)) break;
          text += ' ' + nextLine;
          j++;
          if (text.length > 3000) break;
        }
        
        if (qNum > 0 && qNum <= 100 && text.length > 15) {
          const hasOptions = /[(\[]?\s*[aA]\s*[)\]\.:]/.test(text);
          if (hasOptions && !isFragment(text)) {
            questions.push({
              index: questions.length,
              rawText: text,
            });
          }
        }
      }
    }
  }
  
  // Final fragment filter
  return questions.filter(q => !isFragment(q.rawText || ''));
}

export function getQuestionsForChapter(
  parsedQuestions: ParsedQuestion[],
  chapters: ChapterMetadata[],
  chapterNumber: number
): ParsedQuestion[] {
  const chapter = chapters.find(c => c.chapterNumber === chapterNumber);
  
  if (!chapter || chapter.questionCount === 0) {
    return [];
  }
  
  return parsedQuestions.slice(chapter.startIndex, chapter.endIndex + 1);
}

export function getQuestionsForChapterByName(
  parsedQuestions: ParsedQuestion[],
  chapters: ChapterMetadata[],
  chapterName: string
): ParsedQuestion[] {
  // Handle formatted chapter names like "Chapter 1: Patterns in Mathematics" or "1. Patterns in Mathematics"
  let searchName = chapterName;
  
  // Handle "Chapter X: Name" format
  const chapterPrefixMatch = chapterName.match(/^Chapter\s+\d+:\s*(.+)$/i);
  if (chapterPrefixMatch) {
    searchName = chapterPrefixMatch[1].trim();
  }
  
  // Handle "X. Name" format (number followed by period)
  const numberPrefixMatch = chapterName.match(/^\d+\.\s*(.+)$/);
  if (numberPrefixMatch) {
    searchName = numberPrefixMatch[1].trim();
  }
  
  const chapter = chapters.find(c => c.chapterName === searchName);
  
  if (!chapter || chapter.questionCount === 0) {
    return [];
  }
  
  return parsedQuestions.slice(chapter.startIndex, chapter.endIndex + 1);
}
