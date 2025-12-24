import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MathTextProps {
  text: string;
  className?: string;
}

function formatChemicalFormulas(input: string): string {
  if (!input) return '';
  
  let result = input;
  
  // Skip if already in LaTeX delimiters
  if (result.includes('$')) return result;
  
  // Common chemical elements (uppercase or uppercase+lowercase)
  const elementPattern = '(?:He|Li|Be|Ne|Na|Mg|Al|Si|Cl|Ar|Ca|Sc|Ti|Cr|Mn|Fe|Co|Ni|Cu|Zn|Ga|Ge|As|Se|Br|Kr|Rb|Sr|Zr|Nb|Mo|Tc|Ru|Rh|Pd|Ag|Cd|In|Sn|Sb|Te|Xe|Cs|Ba|La|Ce|Pr|Nd|Pm|Sm|Eu|Gd|Tb|Dy|Ho|Er|Tm|Yb|Lu|Hf|Ta|Re|Os|Ir|Pt|Au|Hg|Tl|Pb|Bi|Po|At|Rn|Fr|Ra|Ac|Th|Pa|Np|Pu|Am|Cm|Bk|Cf|Es|Fm|Md|No|Lr|Rf|Db|Sg|Bh|Hs|Mt|Ds|Rg|Cn|Nh|Fl|Mc|Lv|Ts|Og|H|B|C|N|O|F|P|S|K|V|Y|I|W|U)';
  
  // Match chemical formulas: element followed by number (e.g., H2, O2, C2H4)
  // Pattern: Element + digit(s), repeated
  const formulaRegex = new RegExp(
    `\\b(${elementPattern})(\\d+)(?=[${elementPattern.replace(/[|()]/g, '')}\\d\\s\\(\\)]|$)`,
    'g'
  );
  
  // Convert element+number to element_number for KaTeX subscript processing
  result = result.replace(formulaRegex, '$1_$2');
  
  // Handle parenthetical groups like (OH)2, (SO4)2
  result = result.replace(/\(([^)]+)\)(\d+)/g, '($1)_$2');
  
  // Handle charges like SO4^2-, Ca^2+, Fe^3+
  result = result.replace(/(\w+)\^(\d*[+-])/g, '$1^{$2}');
  result = result.replace(/(\w+)(\d*[+-])$/g, '$1^{$2}');
  
  return result;
}

export function MathText({ text, className = '' }: MathTextProps) {
  const renderMath = (input: string): string => {
    if (!input) return '';
    
    // Pre-process to convert chemical formulas to subscript notation
    let result = formatChemicalFormulas(input);
    
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
