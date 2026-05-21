const fs = require('fs');
const path = require('path');

const walk = (dir) => {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            if (!file.includes('node_modules') && !file.includes('.next') && !file.includes('.git')) {
                results = results.concat(walk(file));
            }
        } else {
            if (file.endsWith('.ts') || file.endsWith('.tsx')) {
                results.push(file);
            }
        }
    });
    return results;
};

const allFiles = walk(path.join(__dirname, 'src'));
allFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Quick fix for the /calendar to /agenda mistake in imports
    content = content.replace(/@\/components\/ui\/agenda/g, '@/components/ui/calendar');

    // We should also check if any '/students' broke the UI path? No, there is no ui/students.
    // What about '/settings'? 
    content = content.replace(/@\/components\/ui\/configuracoes/g, '@/components/ui/settings');

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Reverted UI import in ${file}`);
    }
});
console.log('UI Import fix completed.');
