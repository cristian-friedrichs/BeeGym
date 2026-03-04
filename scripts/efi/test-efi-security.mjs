/**
 * TESTE 6 — Auditoria de Segurança
 * Verifica vazamentos de credenciais em logs e arquivos versionados.
 *
 * Executar: node scripts/efi/test-efi-security.mjs
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';

const CHECKS = [];
let failed = false;

function check(name, fn) {
    try {
        fn();
        CHECKS.push({ name, status: '✅ PASSOU' });
    } catch (e) {
        CHECKS.push({ name, status: `❌ FALHOU — ${e.message}` });
        failed = true;
    }
}

console.log('\n🔒 [TESTE 6] Auditoria de Segurança EFI\n');

// 1. .p12 não está no git
check('Certificado .p12 não versionado', () => {
    try {
        const tracked = execSync('git ls-files certs/').toString().trim();
        if (tracked.includes('.p12')) {
            throw new Error('Arquivo .p12 encontrado no git!');
        }
    } catch (e) {
        // If git is not present or not a repo, skip check or handle error
        if (e.message.includes('not a git repository')) return;
        throw e;
    }
});

// 2. .env não está no git
check('Arquivo .env não versionado', () => {
    try {
        const tracked = execSync('git ls-files .env').toString().trim();
        if (tracked === '.env') {
            throw new Error('.env está sendo rastreado pelo git!');
        }
    } catch (e) {
        if (e.message.includes('not a git repository')) return;
        throw e;
    }
});

// 3. Sem Client_Secret hardcoded
check('Client_Secret não hardcoded no código', () => {
    // Busca recursiva manual para compatibilidade com Windows
    const searchInDir = (dir) => {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const path = dir + '/' + file;
            if (fs.statSync(path).isDirectory()) {
                if (!file.includes('node_modules') && !file.includes('.git')) {
                    searchInDir(path);
                }
            } else if (file.endsWith('.ts') || file.endsWith('.js')) {
                const content = fs.readFileSync(path, 'utf8');
                if (content.includes('Client_Secret_')) {
                    throw new Error(`Strings suspeitas ("Client_Secret_") encontradas em: ${path}`);
                }
            }
        }
    };
    searchInDir('src');
});

// 4. Módulo EFI isolado do banco
check('Módulo EFI isolado do Supabase/Prisma', () => {
    const searchInDir = (dir) => {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const path = dir + '/' + file;
            if (fs.statSync(path).isDirectory()) {
                searchInDir(path);
            } else if (file.endsWith('.ts')) {
                const content = fs.readFileSync(path, 'utf8');
                if (content.toLowerCase().includes('supabase') || content.toLowerCase().includes('prisma')) {
                    throw new Error(`Referência ao DB ("supabase" ou "prisma") encontrada no módulo EFI: ${path}`);
                }
            }
        }
    };
    searchInDir('src/payments/efi');
});

// Relatório final
console.log('─────────────────────────────────────────────');
CHECKS.forEach(c => console.log(`  ${c.status} — ${c.name}`));
console.log('─────────────────────────────────────────────');

if (failed) process.exit(1);
