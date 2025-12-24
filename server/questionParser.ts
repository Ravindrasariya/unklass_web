import type { ParsedQuestion } from "@shared/schema";

export function parseQuestionsFromPdfContent(content: string): ParsedQuestion[] {
  const questions: ParsedQuestion[] = [];
  
  const patterns = [
    /(?:^|\n)\s*(?:Q\.?\s*)?(\d+)[.\)]\s*(.+?)(?=(?:\n\s*(?:Q\.?\s*)?\d+[.\)])|$)/gi,
    /(?:^|\n)\s*(?:Question|प्रश्न)\s*[\-:.\s]*(\d+)[.\):\-]?\s*(.+?)(?=(?:\n\s*(?:Question|प्रश्न)\s*[\-:.\s]*\d+)|$)/gi,
    /(?:^|\n)\s*(\d+)\s*[.\):\-]\s*(.+?)(?=(?:\n\s*\d+\s*[.\):\-])|$)/gi,
  ];
  
  let bestMatches: { num: number; text: string }[] = [];
  
  for (const pattern of patterns) {
    const matches: { num: number; text: string }[] = [];
    let match;
    
    const contentCopy = content;
    pattern.lastIndex = 0;
    
    while ((match = pattern.exec(contentCopy)) !== null) {
      const questionNum = parseInt(match[1], 10);
      const questionText = match[2]?.trim() || '';
      
      if (questionNum > 0 && questionText.length > 10 && questionText.length < 5000) {
        matches.push({ num: questionNum, text: questionText });
      }
      
      if (match.index === pattern.lastIndex) {
        pattern.lastIndex++;
      }
    }
    
    if (matches.length > bestMatches.length) {
      bestMatches = matches;
    }
  }
  
  if (bestMatches.length === 0) {
    const chunks = splitContentIntoChunks(content, 150);
    for (let i = 0; i < chunks.length; i++) {
      questions.push({
        index: i,
        rawText: chunks[i],
        questionText: undefined,
        answer: undefined,
      });
    }
    return questions;
  }
  
  bestMatches.sort((a, b) => a.num - b.num);
  
  for (let i = 0; i < bestMatches.length; i++) {
    const { text } = bestMatches[i];
    
    let questionText = text;
    let answer: string | undefined;
    
    const answerPatterns = [
      /\n\s*(?:Answer|Ans|उत्तर)[:\.\-\s]*(.+?)(?:\n|$)/i,
      /\((?:Answer|Ans|उत्तर)[:\.\-\s]*(.+?)\)/i,
      /(?:Answer|Ans|उत्तर)[:\.\-\s]+(.+?)(?:\n|$)/i,
    ];
    
    for (const ansPattern of answerPatterns) {
      const ansMatch = text.match(ansPattern);
      if (ansMatch && ansMatch[1]) {
        answer = ansMatch[1].trim();
        questionText = text.replace(ansPattern, '').trim();
        break;
      }
    }
    
    questions.push({
      index: i,
      rawText: text,
      questionText: questionText.substring(0, 2000),
      answer,
    });
  }
  
  return questions;
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
