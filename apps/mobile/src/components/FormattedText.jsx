import React from 'react';
import { Text, View, StyleSheet } from 'react-native';

/**
 * A component that renders text with formatting support including:
 * - ### Headers
 * - **bold** text
 * - *italic* text  
 * - `code` text
 * - Math equations (with pink highlight)
 * - Bullet points and numbered lists
 * - Horizontal lines (---)
 * - Proper paragraph spacing
 */
export default function FormattedText({ children, style, colors }) {
  if (!children || typeof children !== 'string') {
    return <Text style={style}>{children}</Text>;
  }

  // Pre-process: convert all math content to display-friendly format FIRST
  let text = preprocessMath(children);
  
  // Normalize line endings
  text = text.replace(/\r\n/g, '\n');
  
  // Split by double newlines for paragraphs
  const paragraphs = text.split(/\n\n+/);
  
  return (
    <View>
      {paragraphs.map((paragraph, pIndex) => {
        const trimmed = paragraph.trim();
        if (!trimmed) return null;
        
        return (
          <View key={pIndex} style={{ marginBottom: pIndex < paragraphs.length - 1 ? 16 : 0 }}>
            {renderBlock(trimmed, style, colors)}
          </View>
        );
      })}
    </View>
  );
}

// Pre-process all math/LaTeX content before any other parsing
function preprocessMath(text) {
  let result = text;
  
  // STEP 1: Convert common physics equations directly
  // These patterns handle LaTeX that ChatGPT might output
  
  // Kinetic Energy: \frac{1}{2}mv^2 -> ½mv²
  result = result.replace(/\\frac\s*\{\s*1\s*\}\s*\{\s*2\s*\}\s*m\s*v\s*\^\s*\{?\s*2\s*\}?/gi, '½mv²');
  result = result.replace(/\\frac\s*1\s*2\s*m\s*v\s*\^\s*2/gi, '½mv²');
  result = result.replace(/\(1\/2\)\s*m\s*v\s*\^\s*2/gi, '½mv²');
  result = result.replace(/1\/2\s*m\s*v\^2/gi, '½mv²');
  
  // Gravitational PE: mgh
  result = result.replace(/m\s*g\s*h/gi, 'mgh');
  
  // E=mc²
  result = result.replace(/E\s*=\s*m\s*c\s*\^\s*\{?\s*2\s*\}?/gi, 'E = mc²');
  result = result.replace(/m\s*c\s*\^\s*\{?\s*2\s*\}?/gi, 'mc²');
  
  // STEP 2: Handle all \frac{a}{b} patterns
  result = result.replace(/\\frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, (match, num, den) => {
    const n = num.trim();
    const d = den.trim();
    return getFractionSymbol(n, d);
  });
  
  // Handle \frac ab (no braces, single chars)
  result = result.replace(/\\frac\s*(\d)\s*(\d)/g, (match, num, den) => {
    return getFractionSymbol(num, den);
  });
  
  // Handle remaining \frac (incomplete) -> ½
  result = result.replace(/\\frac\b/g, '½');
  
  // STEP 3: Handle exponents - ^{2}, ^2, ^n
  result = result.replace(/\^\{([^}]+)\}/g, (match, exp) => toSuperscript(exp.trim()));
  result = result.replace(/\^(\d+)/g, (match, exp) => toSuperscript(exp));
  result = result.replace(/\^([a-zA-Z])/g, (match, exp) => toSuperscript(exp));
  
  // STEP 4: Handle Greek letters
  const greekLetters = {
    '\\alpha': 'α', '\\beta': 'β', '\\gamma': 'γ', '\\delta': 'δ', '\\Delta': 'Δ',
    '\\epsilon': 'ε', '\\theta': 'θ', '\\lambda': 'λ', '\\mu': 'μ', '\\nu': 'ν',
    '\\pi': 'π', '\\rho': 'ρ', '\\sigma': 'σ', '\\tau': 'τ', '\\phi': 'φ',
    '\\psi': 'ψ', '\\omega': 'ω', '\\Omega': 'Ω', '\\Sigma': 'Σ',
  };
  for (const [latex, symbol] of Object.entries(greekLetters)) {
    result = result.split(latex).join(symbol);
  }
  
  // STEP 5: Handle operators and symbols
  const operators = {
    '\\times': '×', '\\cdot': '·', '\\div': '÷', '\\pm': '±',
    '\\leq': '≤', '\\geq': '≥', '\\neq': '≠', '\\approx': '≈',
    '\\infty': '∞', '\\partial': '∂', '\\nabla': '∇',
    '\\rightarrow': '→', '\\leftarrow': '←', '\\Rightarrow': '⇒',
    '\\sqrt': '√', '\\sum': 'Σ', '\\int': '∫', '\\propto': '∝',
  };
  for (const [latex, symbol] of Object.entries(operators)) {
    result = result.split(latex).join(symbol);
  }
  
  // STEP 6: Handle \sqrt{x} -> √(x)
  result = result.replace(/√\{([^}]+)\}/g, '√($1)');
  
  // STEP 7: Handle subscripts _{x} -> [x]
  result = result.replace(/_\{([^}]+)\}/g, '[$1]');
  result = result.replace(/_([a-zA-Z0-9])/g, '[$1]');
  
  // STEP 8: Handle \text{} and \mathrm{}
  result = result.replace(/\\text\{([^}]+)\}/g, '$1');
  result = result.replace(/\\mathrm\{([^}]+)\}/g, '$1');
  result = result.replace(/\\mathbf\{([^}]+)\}/g, '$1');
  
  // STEP 9: Handle vectors
  result = result.replace(/\\vec\{([^}]+)\}/g, '$1⃗');
  result = result.replace(/\\hat\{([^}]+)\}/g, '$1̂');
  
  // STEP 10: Clean up LaTeX spacing commands
  result = result.replace(/\\quad/g, '  ');
  result = result.replace(/\\qquad/g, '    ');
  result = result.replace(/\\,/g, ' ');
  result = result.replace(/\\;/g, ' ');
  result = result.replace(/\\!/g, '');
  result = result.replace(/\\ /g, ' ');
  
  // STEP 11: Remove remaining braces and backslashes
  result = result.replace(/\{([^{}]*)\}/g, '$1');
  result = result.replace(/\\/g, '');
  
  // STEP 12: Clean up empty fractions that might have slipped through
  result = result.replace(/\(\s*\)\s*\/\s*\(\s*\)/g, '½');
  
  // STEP 13: Fix double spaces
  result = result.replace(/  +/g, ' ');
  
  return result;
}

function getFractionSymbol(num, den) {
  const n = String(num).trim();
  const d = String(den).trim();
  
  // Common fractions to Unicode
  if (n === '1' && d === '2') return '½';
  if (n === '1' && d === '3') return '⅓';
  if (n === '2' && d === '3') return '⅔';
  if (n === '1' && d === '4') return '¼';
  if (n === '3' && d === '4') return '¾';
  if (n === '1' && d === '5') return '⅕';
  if (n === '2' && d === '5') return '⅖';
  if (n === '3' && d === '5') return '⅗';
  if (n === '4' && d === '5') return '⅘';
  if (n === '1' && d === '6') return '⅙';
  if (n === '5' && d === '6') return '⅚';
  if (n === '1' && d === '8') return '⅛';
  if (n === '3' && d === '8') return '⅜';
  if (n === '5' && d === '8') return '⅝';
  if (n === '7' && d === '8') return '⅞';
  
  // For other fractions, show as fraction text
  if (n && d && n !== '' && d !== '') {
    return `${n}/${d}`;
  }
  
  // Default fallback
  return '½';
}

function toSuperscript(text) {
  const superscripts = {
    '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
    '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
    'a': 'ᵃ', 'b': 'ᵇ', 'c': 'ᶜ', 'd': 'ᵈ', 'e': 'ᵉ',
    'f': 'ᶠ', 'g': 'ᵍ', 'h': 'ʰ', 'i': 'ⁱ', 'j': 'ʲ',
    'k': 'ᵏ', 'l': 'ˡ', 'm': 'ᵐ', 'n': 'ⁿ', 'o': 'ᵒ',
    'p': 'ᵖ', 'r': 'ʳ', 's': 'ˢ', 't': 'ᵗ', 'u': 'ᵘ',
    'v': 'ᵛ', 'w': 'ʷ', 'x': 'ˣ', 'y': 'ʸ', 'z': 'ᶻ',
    '+': '⁺', '-': '⁻', '=': '⁼', '(': '⁽', ')': '⁾',
  };
  
  return String(text).split('').map(char => superscripts[char.toLowerCase()] || char).join('');
}

function renderBlock(block, baseStyle, colors) {
  const trimmed = block.trim();
  
  // Horizontal line
  if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
    return (
      <View style={[styles.horizontalLine, { backgroundColor: colors?.border || '#E2E8F0' }]} />
    );
  }
  
  // Headers
  if (trimmed.startsWith('### ')) {
    return (
      <Text style={[baseStyle, styles.h3, { color: colors?.text }]}>
        {renderInlineContent(trimmed.slice(4), baseStyle, colors)}
      </Text>
    );
  }
  if (trimmed.startsWith('## ')) {
    return (
      <Text style={[baseStyle, styles.h2, { color: colors?.text }]}>
        {renderInlineContent(trimmed.slice(3), baseStyle, colors)}
      </Text>
    );
  }
  if (trimmed.startsWith('# ')) {
    return (
      <Text style={[baseStyle, styles.h1, { color: colors?.text }]}>
        {renderInlineContent(trimmed.slice(2), baseStyle, colors)}
      </Text>
    );
  }
  
  // Block equation (on its own line with yellow highlight)
  // Match equations that look like formulas (contain =, letters, numbers, math symbols)
  const looksLikeEquation = /^[A-Za-z][\w\s]*=\s*[½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞\d\w²³⁴⁵⁶⁷⁸⁹⁰\+\-\*\/\(\)×÷√αβγδεθλμνπρστφψω]+$/;
  if (looksLikeEquation.test(trimmed) || (trimmed.includes('=') && trimmed.length < 50 && !trimmed.includes(' is ') && !trimmed.includes(' the '))) {
    return (
      <View style={[
        styles.blockEquation, 
        { 
          backgroundColor: colors?.mathBackground || 'rgba(255, 240, 120, 0.5)',
          borderLeftColor: colors?.mathText || '#FFD54F',
        }
      ]}>
        <Text style={[styles.mathText, { color: colors?.mathText || '#5D4037' }]}>
          {trimmed}
        </Text>
      </View>
    );
  }
  
  // Check if block contains bullet points or numbered lists
  const lines = trimmed.split('\n');
  const hasList = lines.some(line => /^[-•*]\s/.test(line.trim()) || /^\d+\.\s/.test(line.trim()));
  
  if (hasList) {
    return (
      <View style={{ gap: 10 }}>
        {lines.map((line, lIndex) => {
          const lineTrimmed = line.trim();
          if (!lineTrimmed) return null;
          
          // Bullet point
          if (/^[-•*]\s/.test(lineTrimmed)) {
            const content = lineTrimmed.replace(/^[-•*]\s+/, '');
            return (
              <View key={lIndex} style={styles.bulletItem}>
                <Text style={[baseStyle, styles.bullet, { color: colors?.text }]}>•</Text>
                <Text style={[baseStyle, styles.bulletText, { color: colors?.text }]}>
                  {renderInlineContent(content, baseStyle, colors)}
                </Text>
              </View>
            );
          }
          
          // Numbered list
          const numberedMatch = lineTrimmed.match(/^(\d+)\.\s+(.*)$/);
          if (numberedMatch) {
            return (
              <View key={lIndex} style={styles.bulletItem}>
                <Text style={[baseStyle, styles.number, { color: colors?.text }]}>{numberedMatch[1]}.</Text>
                <Text style={[baseStyle, styles.bulletText, { color: colors?.text }]}>
                  {renderInlineContent(numberedMatch[2], baseStyle, colors)}
                </Text>
              </View>
            );
          }
          
          // Regular line
          return (
            <Text key={lIndex} style={[baseStyle, { color: colors?.text }]}>
              {renderInlineContent(lineTrimmed, baseStyle, colors)}
            </Text>
          );
        })}
      </View>
    );
  }
  
  // Regular paragraph - render lines with proper spacing
  return (
    <View>
      {lines.map((line, lIndex) => {
        const lineTrimmed = line.trim();
        if (!lineTrimmed) return null;
        
        // Check if this line is an equation (short, contains =, has math symbols)
        const isEquationLine = lineTrimmed.includes('=') && 
                              lineTrimmed.length < 40 && 
                              !lineTrimmed.includes(' is ') && 
                              !lineTrimmed.includes(' the ') &&
                              !lineTrimmed.includes(' and ') &&
                              /[½⅓⅔¼¾⅕⅙⅛²³⁴⁵⁶⁷⁸⁹⁰×÷√]|[a-zA-Z]\s*[²³⁴⁵]/.test(lineTrimmed);
        
        if (isEquationLine) {
          return (
            <View 
              key={lIndex} 
              style={[
                styles.blockEquation, 
                { 
                  backgroundColor: colors?.mathBackground || 'rgba(255, 240, 120, 0.5)',
                  borderLeftColor: colors?.mathText || '#FFD54F',
                }
              ]}
            >
              <Text style={[styles.mathText, { color: colors?.mathText || '#5D4037' }]}>
                {lineTrimmed}
              </Text>
            </View>
          );
        }
        
        return (
          <Text key={lIndex} style={[baseStyle, { color: colors?.text, marginBottom: lIndex < lines.length - 1 ? 4 : 0 }]}>
            {renderInlineContent(lineTrimmed, baseStyle, colors)}
          </Text>
        );
      })}
    </View>
  );
}

function renderInlineContent(text, baseStyle, colors) {
  if (!text) return null;
  
  const parts = [];
  let remaining = text;
  let key = 0;
  
  while (remaining.length > 0) {
    // Check for **bold**
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    // Check for *italic* (not preceded or followed by *)
    const italicMatch = remaining.match(/(?<!\*)\*([^*]+?)\*(?!\*)/);
    // Check for `code`
    const codeMatch = remaining.match(/`([^`]+?)`/);
    
    // Find the earliest match
    let earliestMatch = null;
    let earliestIndex = remaining.length;
    let matchType = null;
    
    const matches = [
      { match: boldMatch, type: 'bold' },
      { match: italicMatch, type: 'italic' },
      { match: codeMatch, type: 'code' },
    ];
    
    for (const { match, type } of matches) {
      if (match && match.index < earliestIndex) {
        earliestMatch = match;
        earliestIndex = match.index;
        matchType = type;
      }
    }
    
    if (earliestMatch) {
      // Add text before the match
      if (earliestIndex > 0) {
        parts.push(remaining.substring(0, earliestIndex));
      }
      
      const content = earliestMatch[1];
      
      switch (matchType) {
        case 'bold':
          parts.push(
            <Text key={key++} style={{ fontWeight: '700' }}>{content}</Text>
          );
          break;
          
        case 'italic':
          parts.push(
            <Text key={key++} style={{ fontStyle: 'italic' }}>{content}</Text>
          );
          break;
          
        case 'code':
          parts.push(
            <Text 
              key={key++} 
              style={[
                styles.codeText,
                { backgroundColor: colors?.codeBackground || 'rgba(100,100,100,0.12)' }
              ]}
            >
              {content}
            </Text>
          );
          break;
      }
      
      remaining = remaining.substring(earliestIndex + earliestMatch[0].length);
    } else {
      // No more matches, add remaining text
      parts.push(remaining);
      break;
    }
  }
  
  return parts;
}

const styles = StyleSheet.create({
  h1: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
    marginTop: 8,
  },
  h2: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 12,
    marginTop: 6,
  },
  h3: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 10,
    marginTop: 4,
  },
  horizontalLine: {
    height: 1,
    marginVertical: 20,
  },
  blockEquation: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
    alignSelf: 'stretch',
    borderLeftWidth: 4,
    borderLeftColor: '#FFD54F',
  },
  mathText: {
    fontFamily: 'Courier',
    fontWeight: '700',
    fontSize: 18,
    letterSpacing: 1.2,
  },
  codeText: {
    fontFamily: 'Courier',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingLeft: 4,
  },
  bullet: {
    marginRight: 12,
    fontWeight: '600',
    fontSize: 16,
  },
  number: {
    marginRight: 12,
    minWidth: 24,
    fontWeight: '600',
  },
  bulletText: {
    flex: 1,
    lineHeight: 22,
  },
});
