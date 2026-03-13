const fs = require('fs');
const path = require('path');

function moveDir(src, dest) {
    if (!fs.existsSync(src)) {
        console.log(`Source ${src} does not exist. Skipping.`);
        return;
    }
    try {
        fs.renameSync(src, dest);
        console.log(`Renamed ${src} to ${dest}`);
    } catch (err) {
        console.log(`Rename failed for ${src}. Trying copy and delete...`);
        try {
            fs.cpSync(src, dest, { recursive: true });
            fs.rmSync(src, { recursive: true, force: true });
            console.log(`Copied and deleted ${src} to ${dest}`);
        } catch (copyErr) {
            console.error(`Failed to move ${src}: ${copyErr.message}`);
        }
    }
}

const basePath = path.join(__dirname, 'src', 'app', '(main)');
const renames = {
    'dashboard': 'painel',
    'students': 'alunos',
    'calendar': 'agenda',
    'classes': 'aulas',
    'workouts': 'treinos',
    'payments': 'pagamentos',
    'settings': 'configuracoes'
};

for (const [oldName, newName] of Object.entries(renames)) {
    moveDir(path.join(basePath, oldName), path.join(basePath, newName));
}

// Now do global regex replacement across all .ts and .tsx files
const modifications = [
    { regex: /@\/components\/dashboard/g, replacement: '@/components/painel' },
    { regex: /\/dashboard\/settings\/plans/g, replacement: '/painel/configuracoes/plans' },
    { regex: /\/dashboard\/settings\/roles/g, replacement: '/painel/configuracoes/roles' },
    { regex: /\/dashboard\/settings\/units/g, replacement: '/painel/configuracoes/units' },
    { regex: /\/dashboard\/settings\/rooms/g, replacement: '/painel/configuracoes/rooms' },
    { regex: /\/dashboard\/settings\/financial/g, replacement: '/painel/configuracoes/financial' },
    { regex: /\/dashboard\/settings\/logs/g, replacement: '/painel/configuracoes/logs' },
    { regex: /\/dashboard\/settings\/team/g, replacement: '/painel/configuracoes/team' },
    { regex: /\/dashboard\/settings/g, replacement: '/painel/configuracoes' },
    { regex: /\/dashboard\/clients/g, replacement: '/painel/alunos' },
    { regex: /\/dashboard/g, replacement: '/painel' },
    { regex: /\/students/g, replacement: '/alunos' },
    { regex: /\/calendar/g, replacement: '/agenda' },
    { regex: /\/classes/g, replacement: '/aulas' },
    { regex: /\/workouts/g, replacement: '/treinos' },
    { regex: /\/payments/g, replacement: '/pagamentos' },
    { regex: /\/settings/g, replacement: '/configuracoes' }
];

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function (file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            // Exclude .git, .next, node_modules
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
}

const allFiles = walk(path.join(__dirname, 'src'));
allFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Safety check for false positives by order above
    modifications.forEach(mod => {
        content = content.replace(mod.regex, mod.replacement);
    });

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Updated refs in ${file}`);
    }
});
console.log('Done.');
