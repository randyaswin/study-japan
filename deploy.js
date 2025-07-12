#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting PWA deployment to Vercel...\n');

// Check if vercel CLI is installed
try {
  execSync('vercel --version', { stdio: 'pipe' });
  console.log('✅ Vercel CLI is installed');
} catch (error) {
  console.log('❌ Vercel CLI not found. Installing...');
  execSync('npm install -g vercel', { stdio: 'inherit' });
}

// Build the project
console.log('\n📦 Building PWA...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

// Check for PWA files
const requiredFiles = [
  'out/sw.js',
  'out/manifest.json',
  'out/icons'
];

console.log('\n🔍 Checking PWA files...');
requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.log(`❌ ${file} missing`);
  }
});

// Deploy to Vercel
console.log('\n🚀 Deploying to Vercel...');
try {
  const deploymentType = process.argv[2] === '--production' ? '--prod' : '';
  execSync(`vercel ${deploymentType}`, { stdio: 'inherit' });
  console.log('\n✅ Deployment successful!');
  
  if (deploymentType === '--prod') {
    console.log('\n🌟 Your PWA is now live in production!');
    console.log('📱 Test the PWA features:');
    console.log('  - Install prompt on mobile devices');
    console.log('  - Offline functionality');
    console.log('  - App-like experience');
  } else {
    console.log('\n🌟 Your PWA preview is ready!');
    console.log('📱 Test before deploying to production with: node deploy.js --production');
  }
} catch (error) {
  console.error('❌ Deployment failed:', error.message);
  process.exit(1);
}

console.log('\n🎉 PWA deployment complete!');
