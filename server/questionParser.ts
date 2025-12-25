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

function extractQuestionsWithPatterns(content: string): { num: number; text: string; startPos: number }[] {
  // Step 1: Find ALL question start positions using multiple patterns
  // Pattern 1: "Question 1", "Question\t1", "Question | 1", "Q1.", "प्रश्न 1", etc.
  // Pattern 2: Just numbered questions like "81. What is..." (for PDFs that switch format mid-file)
  
  const patterns = [
    // "Question N" format (with optional prefix word)
    /(?:^|\n|[.\s])(?:Que?s?(?:tion)?|Q|प्रश्न|Qn)[\s.\-:\t|]*(\d+)[\s.\-:)\]\t|]*/gi,
    // Just number followed by period at start of line: "81. What is..."
    /(?:^|\n)(\d{1,3})\.\s+(?=[A-Z])/g,
  ];
  
  const questionStarts: { num: number; startPos: number; matchEnd: number }[] = [];
  
  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const num = parseInt(match[1], 10);
      if (num > 0 && num <= 500) {
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
    
    if (text.length > 15 && text.length < 8000) {
      result.push({
        num: current.num,
        text,
        startPos: current.startPos
      });
    }
  }
  
  // Step 4: Deduplicate by question number (keep first occurrence by position)
  const seen = new Set<number>();
  const deduped: { num: number; text: string; startPos: number }[] = [];
  
  for (const q of result) {
    if (!seen.has(q.num)) {
      seen.add(q.num);
      deduped.push(q);
    }
  }
  
  return deduped.sort((a, b) => a.num - b.num);
}

function extractQuestionsLineByLine(content: string): { num: number; text: string }[] {
  const lines = content.split('\n');
  const questions: { num: number; text: string; lineIndex: number }[] = [];
  
  const questionStartPattern = /^\s*(?:Que?s?(?:tion)?|Q|प्रश्न|Qn)?[\s.\-:]*(\d{1,3})[\s.\-:)\]]+(.+)/i;
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
    
    let match = line.match(questionStartPattern) || line.match(simpleNumberPattern);
    
    if (match) {
      const num = parseInt(match[1], 10);
      let text = match[2]?.trim() || '';
      
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
        
        if (text.length > 15 && text.length < 8000) {
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

  const seen = new Set<number>();
  return questions.filter(q => {
    if (seen.has(q.num)) return false;
    seen.add(q.num);
    return true;
  }).sort((a, b) => a.num - b.num);
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

  if (bestQuestions.length < 5) {
    const chunks = splitContentIntoChunks(normalizedContent, 150);
    return chunks.map((chunk, i) => ({
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
  // Pattern: "Chapter" on one line, number on next, title on following line(s)
  const lines = normalizedContent.split('\n');
  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i].trim();
    
    // Check if line is just "Chapter" or "अध्याय" (chapter heading split across lines)
    if (/^(?:Chapter|अध्याय|Ch\.?)$/i.test(line)) {
      // Look at next few lines for number and title
      let chapterNumber: number | null = null;
      let chapterName: string | null = null;
      let lineOffset = 1;
      
      // Find the chapter number in next 2 lines
      for (let j = i + 1; j <= Math.min(i + 2, lines.length - 1); j++) {
        const nextLine = lines[j].trim();
        const numMatch = nextLine.match(/^(\d+)$/);
        if (numMatch) {
          chapterNumber = parseInt(numMatch[1], 10);
          lineOffset = j - i + 1;
          break;
        }
        // Also check for "Chapter N" on a single line (number only)
        const numOnlyMatch = nextLine.match(/^(\d+)\s*[:\.\-–—]?\s*$/);
        if (numOnlyMatch) {
          chapterNumber = parseInt(numOnlyMatch[1], 10);
          lineOffset = j - i + 1;
          break;
        }
      }
      
      // Find chapter name in the lines after the number
      if (chapterNumber && chapterNumber > 0 && chapterNumber <= 50) {
        for (let j = i + lineOffset; j <= Math.min(i + lineOffset + 2, lines.length - 1); j++) {
          const titleLine = lines[j].trim();
          // Skip empty lines and lines that are just numbers
          if (!titleLine || /^\d+$/.test(titleLine)) continue;
          // Skip if this looks like a question
          if (/^(?:Que?s?(?:tion)?|Q|प्रश्न)/i.test(titleLine)) break;
          // This should be the chapter name
          if (titleLine.length >= 2 && titleLine.length <= 100) {
            chapterName = titleLine;
            break;
          }
        }
        
        if (chapterName) {
          const exists = chapterPositions.some(c => c.chapterNumber === chapterNumber);
          if (!exists) {
            // Find position in original content
            const linesBefore = lines.slice(0, i).join('\n');
            const position = linesBefore.length;
            chapterPositions.push({
              chapterNumber,
              chapterName,
              position,
            });
          }
        }
      }
    }
    
    // Also check for pattern: just a number on its own line followed by chapter title
    // This handles "1" followed by "Real Numbers" format
    const justNumber = line.match(/^(\d+)$/);
    if (justNumber) {
      const num = parseInt(justNumber[1], 10);
      // Only consider as chapter if between 1-20 (reasonable chapter numbers)
      if (num >= 1 && num <= 20) {
        // Check if previous line was "Chapter" or if next line looks like a title
        const prevLine = i > 0 ? lines[i - 1].trim().toLowerCase() : '';
        const nextLine = i + 1 < lines.length ? lines[i + 1].trim() : '';
        
        const isAfterChapter = /^(?:chapter|अध्याय|ch\.?)$/i.test(prevLine);
        const nextIsTitle = nextLine.length >= 3 && nextLine.length <= 100 && 
                           !/^(?:Que?s?(?:tion)?|Q|प्रश्न|\d+\.)/i.test(nextLine) &&
                           !/^\d+$/.test(nextLine);
        
        if (isAfterChapter && nextIsTitle) {
          const exists = chapterPositions.some(c => c.chapterNumber === num);
          if (!exists) {
            const linesBefore = lines.slice(0, i - 1).join('\n');
            chapterPositions.push({
              chapterNumber: num,
              chapterName: nextLine,
              position: linesBefore.length,
            });
          }
        }
      }
    }
  }
  
  chapterPositions.sort((a, b) => a.position - b.position);
  
  const parsedQuestions = parseQuestionsFromPdfContent(content);
  
  if (chapterPositions.length === 0) {
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
  
  const questionsWithPositions: { question: ParsedQuestion; position: number }[] = [];
  
  for (const q of parsedQuestions) {
    const pos = normalizedContent.indexOf(q.rawText.substring(0, 50));
    questionsWithPositions.push({
      question: q,
      position: pos >= 0 ? pos : 0,
    });
  }
  
  const chapters: ChapterMetadata[] = [];
  
  for (let i = 0; i < chapterPositions.length; i++) {
    const current = chapterPositions[i];
    const nextPosition = i + 1 < chapterPositions.length 
      ? chapterPositions[i + 1].position 
      : normalizedContent.length;
    
    const chapterQuestions = questionsWithPositions.filter(
      qp => qp.position >= current.position && qp.position < nextPosition
    );
    
    if (chapterQuestions.length > 0) {
      const indices = chapterQuestions.map(qp => parsedQuestions.indexOf(qp.question));
      const startIndex = Math.min(...indices);
      const endIndex = Math.max(...indices);
      
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
  
  return { questions: parsedQuestions, chapters };
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
  const chapter = chapters.find(c => c.name === chapterName || c.chapterName === chapterName);
  
  if (!chapter || chapter.questionCount === 0) {
    return [];
  }
  
  return parsedQuestions.slice(chapter.startIndex, chapter.endIndex + 1);
}
