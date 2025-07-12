const fs = require('fs');
const path = require('path');

// Create a simple base64 encoded PNG icon
// This is a simple 1x1 pixel PNG with orange color that we'll use as a placeholder
const createPlaceholderIcon = (size) => {
  // Simple PNG data for a colored square (this is a very basic implementation)
  // In a real scenario, you'd want to use a proper image library like sharp or canvas
  const svgIcon = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#f97316;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#ea580c;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#grad)"/>
      <text x="50%" y="35%" text-anchor="middle" font-family="Arial, sans-serif" font-size="${size * 0.3}" font-weight="bold" fill="white">日</text>
      <text x="50%" y="75%" text-anchor="middle" font-family="Arial, sans-serif" font-size="${size * 0.15}" font-weight="bold" fill="white">STUDY</text>
    </svg>
  `;
  
  return svgIcon;
};

// Create icons directory if it doesn't exist
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Icon sizes to generate
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Generate SVG icons
sizes.forEach(size => {
  const svgContent = createPlaceholderIcon(size);
  const filename = `icon-${size}x${size}.svg`;
  const filepath = path.join(iconsDir, filename);
  
  fs.writeFileSync(filepath, svgContent);
  console.log(`Generated ${filename}`);
});

console.log('\n✅ SVG icons generated successfully!');
console.log('\n📝 To convert to PNG:');
console.log('1. Open http://localhost:3000/icon-generator.html');
console.log('2. Generate and download PNG icons');
console.log('3. Place them in the public/icons/ directory');
console.log('\nAlternatively, use online converters or tools like ImageMagick.');
