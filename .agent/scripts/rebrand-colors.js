const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', '..', 'src');

const replacements = [
    // Old orange → New Amber
    [/#FF8C00/gi, '#FFBF00'],
    [/rgba\(255,\s*140,\s*0/gi, 'rgba(255, 191, 0'],
    // Old dark midnight → New Midnight Ink
    [/#00173F/gi, '#0B0F1A'],
    [/#020d28/gi, '#0B0F1A'],
    [/#030712/gi, '#0B0F1A'],
    // Old amber hover (#FFB347 was used as a warm hover) → Burnt Orange
    [/#FFB347/gi, '#E67E22'],
    // Old linear-gradient references using 00173F
    [/linear-gradient\(160deg,\s*#0B0F1A\s*0%,\s*#0B0F1A\s*60%,\s*#0B0F1A\s*100%\)/gi,
        'linear-gradient(160deg, #0B0F1A 0%, #070C15 60%, #030712 100%)'],
];

let updatedCount = 0;

function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            walk(fullPath);
        } else if (/\.(tsx?|css|js)$/.test(entry.name)) {
            let content = fs.readFileSync(fullPath, 'utf8');
            const original = content;
            for (const [pattern, replacement] of replacements) {
                content = content.replace(pattern, replacement);
            }
            if (content !== original) {
                fs.writeFileSync(fullPath, content, 'utf8');
                updatedCount++;
                console.log('Updated:', path.relative(SRC_DIR, fullPath));
            }
        }
    }
}

walk(SRC_DIR);
console.log(`\nDone. ${updatedCount} files updated.`);
