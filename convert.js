const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');
const { JSDOM } = require('jsdom');
const { DOMParser } = new JSDOM().window;

async function convertSvgToPng(svgPath, pngPath) {
    const svgContent = fs.readFileSync(svgPath, 'utf8');
    const doc = new DOMParser().parseFromString(svgContent, 'image/svg+xml');
    const svgElement = doc.documentElement;
    
    const width = parseInt(svgElement.getAttribute('width'));
    const height = parseInt(svgElement.getAttribute('height'));
    
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    const img = await loadImage(`data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`);
    ctx.drawImage(img, 0, 0);
    
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(pngPath, buffer);
}

async function convertAll() {
    const files = ['player', 'flower', 'cloud', 'background'];
    for (const file of files) {
        await convertSvgToPng(`assets/${file}.svg`, `assets/${file}.png`);
    }
}

convertAll().catch(console.error); 