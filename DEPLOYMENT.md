# Vercel Deployment Guide

## Quick Deploy Steps

### 1. Install Vercel CLI (if not already installed)
```bash
npm install -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Deploy Preview
```bash
npm run deploy:preview
```

### 4. Deploy Production
```bash
npm run deploy
```

## Automatic Deployment

### Option 1: Connect GitHub Repository
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will automatically detect Next.js and deploy

### Option 2: Manual Deploy
1. Build the project: `npm run build`
2. Deploy: `vercel --prod`

## Environment Variables (if needed)
Add any environment variables in the Vercel dashboard under Settings → Environment Variables.

## Custom Domain
1. Go to your project on Vercel
2. Settings → Domains
3. Add your custom domain

## PWA Verification
After deployment, verify your PWA at:
- [web.dev/measure](https://web.dev/measure)
- Chrome DevTools → Lighthouse → PWA audit

## Troubleshooting
- Ensure all icon files are present in `public/icons/`
- Check that service worker is being served correctly
- Verify HTTPS is enabled (automatic on Vercel)
- Test install prompt on mobile devices
