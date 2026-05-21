const fs = require('fs');
const path = require('path');

const tables = [
    'workout_execution', 'workout_executions', 'workout_exercises', 'workout_logs',
    'calendar_events', 'classes', 'class_attendance', 'class_attendees', 'event_enrollments',
    'conversations', 'messages', 'chats', 'chat_participants', 'chat_messages',
    'student_measurements', 'physical_assessments'
];

const results = {};
tables.forEach(t => results[t] = []);

function walkDir(dir, callback) {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) {
            walkDir(dirPath, callback);
        } else {
            callback(dirPath);
        }
    });
}

walkDir('./src', function (filePath) {
    if (!filePath.match(/\.(tsx?|jsx?|ts|js)$/)) return;

    // Ignore type definition files
    if (filePath.includes('database.types.ts') || filePath.includes('supabase.ts') || filePath.endsWith('.d.ts')) return;

    let content = fs.readFileSync(filePath, 'utf8');

    tables.forEach(table => {
        if (content.includes(table)) {
            if (!results[table].includes(filePath)) {
                results[table].push(filePath);
            }
        }
    });
});

let report = '# 📊 Relatório de Triagem de Tabelas (Filtro Rigoroso)\n\n';
report += '> ℹ️ **Nota:** Arquivos de tipagem do Supabase (`database.types.ts`, `supabase.ts`) foram ignorados para revelar o real uso em serviços e componentes.\n\n';

report += '## 🟢 Tabelas ATIVAS (com referências no código)\n';
let hasAtivas = false;
for (const [table, files] of Object.entries(results)) {
    if (files.length > 0) {
        hasAtivas = true;
        report += `- **${table}** (${files.length} arquivos)\n`;
        files.slice(0, 5).forEach(f => report += `  - \`${f.replace(/\\\\/g, '/')}\`\n`);
        if (files.length > 5) report += `  - ...e mais ${files.length - 5} arquivos\n`;
    }
}
if (!hasAtivas) report += 'Nenhuma tabela ativa encontrada.\n';

report += '\n## 🔴 Tabelas ÓRFÃS (ZERO referências no código base da aplicação!)\n';
let hasOrfas = false;
for (const [table, files] of Object.entries(results)) {
    if (files.length === 0) {
        hasOrfas = true;
        report += `- **${table}**\n`;
    }
}
if (!hasOrfas) report += 'Nenhuma tabela órfã encontrada.\n';

fs.writeFileSync('report-tables.md', report);
console.log('Report updated in report-tables.md');
