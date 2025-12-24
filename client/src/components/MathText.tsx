import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MathTextProps {
  text: string;
  className?: string;
}

export function MathText({ text, className = '' }: MathTextProps) {
  const renderMath = (input: string): string => {
    if (!input) return '';
    
    let result = input;
    
    result = result.replace(/\$\$(.*?)\$\$/g, (_, math) => {
      try {
        return katex.renderToString(math, { displayMode: true, throwOnError: false });
      } catch {
        return math;
      }
    });
    
    result = result.replace(/\$(.*?)\$/g, (_, math) => {
      try {
        return katex.renderToString(math, { displayMode: false, throwOnError: false });
      } catch {
        return math;
      }
    });
    
    result = result.replace(/(\w+)\^(\d+)/g, (_, base, exp) => {
      try {
        return katex.renderToString(`${base}^{${exp}}`, { displayMode: false, throwOnError: false });
      } catch {
        return `${base}<sup>${exp}</sup>`;
      }
    });
    
    result = result.replace(/(\w+)\^{([^}]+)}/g, (_, base, exp) => {
      try {
        return katex.renderToString(`${base}^{${exp}}`, { displayMode: false, throwOnError: false });
      } catch {
        return `${base}<sup>${exp}</sup>`;
      }
    });
    
    result = result.replace(/(\w+)_(\d+)/g, (_, base, sub) => {
      try {
        return katex.renderToString(`${base}_{${sub}}`, { displayMode: false, throwOnError: false });
      } catch {
        return `${base}<sub>${sub}</sub>`;
      }
    });
    
    return result;
  };

  return (
    <span 
      className={className}
      dangerouslySetInnerHTML={{ __html: renderMath(text) }}
    />
  );
}
