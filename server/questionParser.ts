import type { ParsedQuestion } from "@shared/schema";

function normalizeContent(content: string): string {
  let normalized = content
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ')
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
  const allMatches: { num: number; text: string; startPos: number; pattern: string }[] = [];

  const patterns: { regex: RegExp; name: string }[] = [
    { regex: /(?:^|\n)\s*(?:Que?s?(?:tion)?|Q|प्रश्न|Qn)[\s.\-:]*(\d+)[\s.\-:)\]]*([^\n]+(?:\n(?!\s*(?:Que?s?(?:tion)?|Q|प्रश्न|Qn)[\s.\-:]*\d+)[^\n]+)*)/gi, name: 'question_prefix' },
    { regex: /(?:^|\n)\s*(\d{1,3})\s*[.\):\-\]]\s*([^\n]+(?:\n(?!\s*\d{1,3}\s*[.\):\-\]])[^\n]+)*)/g, name: 'numbered_line' },
    { regex: /(?:^|\n)\s*\[(\d+)\]\s*([^\n]+(?:\n(?!\s*\[\d+\])[^\n]+)*)/g, name: 'bracketed' },
    { regex: /(?:^|\n)\s*(\d+)\s*[\.\)]\s*(?:What|Which|Who|When|Where|Why|How|Find|Calculate|Solve|Write|Name|Define|Explain|State|Describe|List|Give|क्या|कौन|कब|कहाँ|क्यों|कैसे|बताइए|लिखिए|समझाइए)([^\n]+(?:\n(?!\s*\d+\s*[\.\)])[^\n]+)*)/gi, name: 'question_words' },
  ];

  for (const { regex, name } of patterns) {
    regex.lastIndex = 0;
    let match;
    while ((match = regex.exec(content)) !== null) {
      const num = parseInt(match[1], 10);
      const text = match[2]?.trim() || '';
      if (num > 0 && num <= 500 && text.length > 15 && text.length < 8000) {
        allMatches.push({ num, text, startPos: match.index, pattern: name });
      }
      if (match.index === regex.lastIndex) regex.lastIndex++;
    }
  }

  type MatchEntry = { num: number; text: string; startPos: number; pattern: string };
  const grouped: Record<number, MatchEntry[]> = {};
  for (const m of allMatches) {
    if (!grouped[m.num]) grouped[m.num] = [];
    grouped[m.num].push(m);
  }

  const result: { num: number; text: string; startPos: number }[] = [];
  for (const numKey of Object.keys(grouped)) {
    const matches = grouped[parseInt(numKey, 10)];
    const best = matches.reduce((a: MatchEntry, b: MatchEntry) => b.text.length > a.text.length ? b : a);
    result.push({ num: best.num, text: best.text, startPos: best.startPos });
  }

  return result.sort((a, b) => a.num - b.num);
}

function extractQuestionsLineByLine(content: string): { num: number; text: string }[] {
  const lines = content.split('\n');
  const questions: { num: number; text: string; lineIndex: number }[] = [];
  
  const questionStartPattern = /^\s*(?:Que?s?(?:tion)?|Q|प्रश्न|Qn)?[\s.\-:]*(\d{1,3})[\s.\-:)\]]+(.+)/i;
  const simpleNumberPattern = /^\s*(\d{1,3})\s*[.\):\-\]]\s*(.+)/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let match = line.match(questionStartPattern) || line.match(simpleNumberPattern);
    
    if (match) {
      const num = parseInt(match[1], 10);
      let text = match[2]?.trim() || '';
      
      if (num > 0 && num <= 500 && text.length > 5) {
        let j = i + 1;
        while (j < lines.length) {
          const nextLine = lines[j].trim();
          if (!nextLine) { j++; continue; }
          
          const isNewQuestion = questionStartPattern.test(lines[j]) || simpleNumberPattern.test(lines[j]);
          const isOption = /^[\(\[]?\s*[a-dA-D1-4]\s*[\)\]\.:]/.test(nextLine);
          const isAnswer = /^(?:Answer|Ans|उत्तर|Correct)/i.test(nextLine);
          const isMarks = /^\s*\[?\s*\d+\s*(?:marks?|अंक)\s*\]?\s*$/i.test(nextLine);
          
          if (isNewQuestion) break;
          if (isMarks) { j++; continue; }
          
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
      }
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
