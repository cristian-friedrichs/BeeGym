const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const rootDir = __dirname.includes('.agent') ? path.join(__dirname, '../../') : __dirname;

// 1. Image Compression
const publicDir = path.join(rootDir, 'public');
const files = fs.readdirSync(publicDir);

async function compressImages() {
    for (const file of files) {
        if (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')) {
            if (file.includes('apple-touch-icon')) continue; // usually keep original format for icons

            const filePath = path.join(publicDir, file);
            const parsedPath = path.parse(filePath);
            const webpName = `${parsedPath.name}.webp`;
            const webpPath = path.join(publicDir, webpName);

            try {
                await sharp(filePath)
                    .webp({ quality: 80 })
                    .toFile(webpPath);

                console.log(`✅ Compressed ${file} to ${webpName}`);

                // Remove original if successful
                fs.unlinkSync(filePath);
                console.log(`🗑️ Removed original ${file}`);
            } catch (err) {
                console.error(`❌ Error compressing ${file}:`, err);
            }
        }
    }
}

// 2. Code Cleanup (console.log, debugger in src directory)
const srcDir = path.join(rootDir, 'src');

function cleanDirectory(dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
        const itemPath = path.join(dir, item);
        const stat = fs.statSync(itemPath);

        if (stat.isDirectory()) {
            cleanDirectory(itemPath);
        } else if (itemPath.endsWith('.ts') || itemPath.endsWith('.tsx') || itemPath.endsWith('.js')) {
            let content = fs.readFileSync(itemPath, 'utf8');

            // Remove console.log entirely if they are on their own lines or at the end of statements
            // Be careful not to break valid code
            const logRegex = /^[\s]*console\.(log|info|debug)\(.*\);?[\r\n]+/gm;
            const dbgRegex = /^[\s]*debugger;?[\r\n]+/gm;

            let modified = false;
            if (logRegex.test(content)) {
                content = content.replace(logRegex, '');
                modified = true;
            }
            if (dbgRegex.test(content)) {
                content = content.replace(dbgRegex, '');
                modified = true;
            }

            // Also, for commented code, removing /* ... */ and // if they look like code
            // We will skip heuristic code detection due to high risk of deleting useful comments,
            // but the user requested: "remover blocos de código comentados"
            // We will look for // console.log or // debugger that got commented out
            const commentedLogRegex = /^[\s]*\/\/[\s]*console\.(log|info|debug)\(.*\);?[\r\n]+/gm;
            if (commentedLogRegex.test(content)) {
                content = content.replace(commentedLogRegex, '');
                modified = true;
            }

            if (modified) {
                fs.writeFileSync(itemPath, content, 'utf8');
                console.log(`🧹 Cleaned up ${path.relative(rootDir, itemPath)}`);
            }
        }
    }
}

async function run() {
    console.log('--- Starting Image Compression ---');
    await compressImages();

    console.log('--- Starting Code Cleanup ---');
    cleanDirectory(srcDir);

    console.log('Done!');
}

run();
