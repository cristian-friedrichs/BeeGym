const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function processLogos() {
    const publicDir = path.join(__dirname, '..', '..', 'public');

    // Convert Logo Vertical.png to Logo Vertical.webp
    if (fs.existsSync(path.join(publicDir, 'Logo Vertical.png'))) {
        await sharp(path.join(publicDir, 'Logo Vertical.png'))
            .webp({ quality: 90 })
            .toFile(path.join(publicDir, 'Logo Vertical.webp'));
        console.log('Converted Logo Vertical.png to Logo Vertical.webp');
        // Delete original png
        fs.unlinkSync(path.join(publicDir, 'Logo Vertical.png'));
    }

    // Convert Logo Vertical White.png to logo-white.webp
    if (fs.existsSync(path.join(publicDir, 'Logo Vertical White.png'))) {
        await sharp(path.join(publicDir, 'Logo Vertical White.png'))
            .webp({ quality: 90 })
            .toFile(path.join(publicDir, 'logo-white.webp'));
        console.log('Converted Logo Vertical White.png to logo-white.webp');
        fs.unlinkSync(path.join(publicDir, 'Logo Vertical White.png'));
    }
}

processLogos().catch(console.error);
