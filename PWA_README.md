# PWA Setup Guide for Study Japan Journey

## Overview
This app is now configured as a Progressive Web App (PWA) with offline support, installability, and mobile-first design.

## Features
- ✅ **Offline Support**: Works without internet connection
- ✅ **Installable**: Can be installed on mobile and desktop
- ✅ **Responsive**: Mobile-first design
- ✅ **Fast Loading**: Service Worker caching
- ✅ **App-like Experience**: Full-screen standalone mode

## Building and Testing

### Development
```bash
npm run dev
```

### Production PWA Build
```bash
npm run build:pwa
```

### Serve PWA Locally
```bash
npm run serve:pwa
```

## Generating Icons

### Option 1: Using the Icon Generator HTML
1. Open `http://localhost:3000/icon-generator.html` in your browser
2. Click "Generate All Icons"
3. Download each icon size
4. Place them in the `public/icons/` directory

### Option 2: Using the Node.js Script
```bash
npm run generate-icons
```
This creates SVG files that you can convert to PNG using online tools.

## PWA Configuration Files

### Key Files:
- `public/manifest.json` - App manifest
- `public/sw.js` - Service Worker
- `public/browserconfig.xml` - Windows tiles
- `public/offline.html` - Offline fallback page
- `src/components/PWAInstaller.tsx` - Install prompt component

## Testing PWA Features

### Desktop (Chrome/Edge)
1. Build and serve the app
2. Open DevTools → Application → Manifest
3. Check "Add to home screen" option
4. Test offline mode in Network tab

### Mobile
1. Open app in mobile browser
2. Look for "Add to Home Screen" prompt
3. Install and test offline functionality

## Deployment

### Static Hosting (Recommended)
- Vercel, Netlify, or GitHub Pages
- Ensure HTTPS is enabled (required for PWA)

### Server Requirements
- Serve `manifest.json` with `application/manifest+json` content type
- Serve `sw.js` with appropriate cache headers
- Enable HTTPS (required for Service Worker)

## Offline Strategy

The app uses a "Cache First" strategy:
1. Check cache first
2. If not found, fetch from network
3. Cache successful responses
4. Show offline page if both fail

## Browser Support
- Chrome/Edge: Full support
- Firefox: Good support
- Safari: Partial support (no install prompt)
- Safari iOS: Good support with "Add to Home Screen"

## Troubleshooting

### Service Worker Issues
- Clear browser cache
- Check DevTools → Application → Service Workers
- Ensure HTTPS is used

### Icons Not Loading
- Verify icon files exist in `public/icons/`
- Check manifest.json paths
- Ensure proper PNG format

### Install Prompt Not Showing
- Ensure HTTPS
- Check PWA criteria in DevTools
- Verify manifest.json is valid

## PWA Criteria Checklist
- ✅ HTTPS served
- ✅ Service Worker registered
- ✅ Web App Manifest with required fields
- ✅ Icons (192x192 and 512x512 minimum)
- ✅ Start URL responds when offline
- ✅ Responsive design
- ✅ Fast loading

## Next Steps
1. Generate proper app icons
2. Test on various devices
3. Deploy to HTTPS hosting
4. Monitor PWA metrics
5. Add push notifications (optional)
