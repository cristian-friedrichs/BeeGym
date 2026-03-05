const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', '..', 'src');

const replacements = [
    // Specific button replacements
    [/bg-bee-orange hover:bg-orange-600 text-white/g, 'bg-bee-amber hover:bg-amber-500 text-bee-midnight'],
    [/bg-bee-orange hover:bg-orange-500 text-white/g, 'bg-bee-amber hover:bg-amber-500 text-bee-midnight'],
    [/bg-bee-orange text-white/g, 'bg-bee-amber text-bee-midnight'],
    [/text-bee-orange/g, 'text-bee-amber'],
    [/border-bee-orange/g, 'border-bee-amber'],
    [/ring-bee-orange/g, 'ring-bee-amber'],
    [/bg-bee-orange(?![/a-z])/g, 'bg-bee-amber'],
    [/hover:text-bee-orange/g, 'hover:text-bee-amber'],
    [/hover:bg-orange-50(?!0)/g, 'hover:bg-amber-50'],
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
console.log(`\nDone. ${updatedCount} files updated with Tailwind classes.`);
