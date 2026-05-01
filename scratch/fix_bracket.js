const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/lib/billiards/bracket-automation.ts');
const content = fs.readFileSync(filePath, 'utf8');

// The file has original code up to around line 878: `return result;\n}`
// Then the user pasted `// ════════════...`
const splitMarker = '// ═══════════════════════════════════════════════════════════════════════════════\n// EXTENSIÓN DE bracket-automation.ts';

if (content.includes(splitMarker)) {
    const parts = content.split(splitMarker);
    const originalPart = parts[0];
    const newPart = parts[1];

    // Extract ONLY matchesToBracket from the new part
    const matchesToBracketIndex = newPart.indexOf('export function matchesToBracket(');
    
    if (matchesToBracketIndex !== -1) {
        const matchesToBracketCode = newPart.substring(matchesToBracketIndex);
        
        // Combine original code with matchesToBracket
        const fixedContent = originalPart.trim() + '\n\n' + matchesToBracketCode;
        
        fs.writeFileSync(filePath, fixedContent);
        console.log('✅ bracket-automation.ts ha sido corregido limpiando los duplicados.');
    } else {
        console.log('No se encontró matchesToBracket en la parte duplicada.');
    }
} else {
    console.log('No se encontró el marcador de duplicación.');
}
