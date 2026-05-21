const fs = require('fs');
const path = require('path');

function renameFile(src, dest) {
    if (fs.existsSync(src)) {
        fs.renameSync(src, dest);
        console.log(`Renamed ${src} to ${dest}`);
    }
}

const actionsPath = path.join(__dirname, 'src', 'actions');
renameFile(path.join(actionsPath, 'workouts.ts'), path.join(actionsPath, 'treinos.ts'));
renameFile(path.join(actionsPath, 'students.ts'), path.join(actionsPath, 'alunos.ts'));
renameFile(path.join(actionsPath, 'classes.ts'), path.join(actionsPath, 'aulas.ts'));
renameFile(path.join(actionsPath, 'payments.ts'), path.join(actionsPath, 'pagamentos.ts'));
renameFile(path.join(actionsPath, 'settings.ts'), path.join(actionsPath, 'configuracoes.ts'));

const servicesPath = path.join(__dirname, 'src', 'services', 'supabase');
renameFile(path.join(servicesPath, 'workouts.ts'), path.join(servicesPath, 'treinos.ts'));
renameFile(path.join(servicesPath, 'students.ts'), path.join(servicesPath, 'alunos.ts'));
renameFile(path.join(servicesPath, 'classes.ts'), path.join(servicesPath, 'aulas.ts'));
renameFile(path.join(servicesPath, 'payments.ts'), path.join(servicesPath, 'pagamentos.ts'));
renameFile(path.join(servicesPath, 'settings.ts'), path.join(servicesPath, 'configuracoes.ts'));

// Also clean up Next.js cache
try {
    fs.rmSync(path.join(__dirname, '.next'), { recursive: true, force: true });
    console.log("Cleared .next directory");
} catch (e) { }
