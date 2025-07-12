# 🚀 Deploy Study Japan PWA to Vercel

## Quick Deploy Options

### Option 1: One-Command Deploy (Recommended)
```bash
# Deploy to preview
node deploy.js

# Deploy to production
node deploy.js --production
```

### Option 2: Manual Deploy
```bash
# Build the project
npm run build

# Deploy with Vercel CLI
vercel --prod
```

### Option 3: GitHub Integration (Automatic)
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Vercel will automatically build and deploy

## Prerequisites

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Generate Better Icons** (optional but recommended):
   ```bash
   # Start dev server
   npm run dev
   
   # Open in browser: http://localhost:3000/icon-generator.html
   # Download generated PNG icons
   # Replace files in public/icons/
   ```

## Deployment Steps

### Step 1: Build and Test Locally
```bash
# Build the PWA
npm run build

# Test locally (optional)
npm run serve:pwa
```

### Step 2: Deploy to Vercel
```bash
# Deploy to preview
vercel

# Or deploy to production
vercel --prod
```

### Step 3: Verify PWA Features
After deployment, test:
- ✅ Install prompt on mobile
- ✅ Offline functionality
- ✅ App-like experience
- ✅ Fast loading

## Post-Deployment Checklist

### PWA Verification
1. **Lighthouse PWA Audit**:
   - Open your deployed site
   - Dev Tools → Lighthouse → PWA
   - Should score 100/100

2. **Manual Testing**:
   - Install on mobile device
   - Test offline mode
   - Verify app-like experience

### Domain Configuration (Optional)
1. Go to Vercel dashboard
2. Select your project
3. Settings → Domains
4. Add your custom domain

## Environment Variables
If you need environment variables:
1. Vercel dashboard → Settings → Environment Variables
2. Add your variables
3. Redeploy

## Troubleshooting

### Common Issues:
- **Icons not loading**: Check `public/icons/` contains PNG files
- **Service Worker not registering**: Ensure HTTPS (automatic on Vercel)
- **Install prompt not showing**: Verify PWA criteria in DevTools

### Build Errors:
- Check Next.js version compatibility
- Ensure all dependencies are installed
- Verify TypeScript/ESLint errors are resolved

## URLs After Deployment

Your PWA will be available at:
- **Preview**: `https://your-project-name-xxxxx.vercel.app`
- **Production**: `https://your-project-name.vercel.app`

## Performance Tips
- Icons are cached for 1 year
- Service Worker caches app shell
- Static assets are served from CDN
- Automatic HTTPS and HTTP/2

## Next Steps
1. Monitor usage in Vercel Analytics
2. Set up custom domain
3. Add push notifications (optional)
4. Implement app shortcuts
5. Add offline data sync

## Support
- [Vercel Documentation](https://vercel.com/docs)
- [Next.js PWA Guide](https://nextjs.org/docs/api-reference/next/head)
- [PWA Checklist](https://web.dev/pwa-checklist/)

---

🎉 **Your Study Japan PWA is ready to deploy!**
