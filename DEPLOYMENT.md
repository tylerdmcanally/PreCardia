# CardioTools Deployment Guide

This guide provides instructions for deploying CardioTools to various hosting platforms.

## Pre-Deployment Checklist

✅ All unnecessary development files have been removed
✅ Package.json updated to reflect unified application (cardiotools v1.0.0)
✅ README.md updated with comprehensive documentation
✅ Vite build configuration optimized with vendor code splitting
✅ Production build verified and tested
✅ TypeScript compilation successful with no errors

## Project Structure

```
CardioTools/
└── cv-risk-calculator/          # Main application directory
    ├── dist/                    # Production build output (generated)
    ├── src/                     # Source code
    ├── public/                  # Static assets
    ├── node_modules/            # Dependencies (not deployed)
    ├── package.json             # Project configuration
    ├── vite.config.ts          # Build configuration
    ├── tailwind.config.js      # Styling configuration
    └── vercel.json             # Vercel deployment configuration
```

## Build Information

### Production Build Stats
- **Total Size:** ~422 KB uncompressed, ~123 KB gzipped
- **HTML:** 0.92 KB
- **CSS:** 25.85 KB (4.98 KB gzipped)
- **JavaScript:**
  - React Vendor: 43.64 KB (15.62 KB gzipped)
  - UI Vendor: 6.89 KB (2.01 KB gzipped)
  - Main Bundle: 370.84 KB (105.05 KB gzipped)

### Optimization Features
- Automatic vendor code splitting for better caching
- Separate chunks for React ecosystem and UI libraries
- Minimized and tree-shaken production bundles
- Optimized CSS with Tailwind purging

## Deployment Options

### Option 1: Vercel (Recommended)

Vercel is pre-configured and recommended for this project.

#### Quick Deploy
```bash
cd /Users/tylermcanally/Desktop/CardioTools/cv-risk-calculator
vercel deploy
```

#### Production Deploy
```bash
vercel deploy --prod
```

#### Configuration
The `vercel.json` file is already configured with appropriate settings.

### Option 2: Netlify

#### Deploy via Netlify CLI
```bash
cd /Users/tylermcanally/Desktop/CardioTools/cv-risk-calculator
npm install -g netlify-cli
netlify deploy --prod
```

#### Build Settings
- **Build Command:** `npm run build`
- **Publish Directory:** `dist`
- **Node Version:** 18 or higher

#### Create `netlify.toml` (optional)
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Option 3: AWS S3 + CloudFront

#### Build and Deploy
```bash
cd /Users/tylermcanally/Desktop/CardioTools/cv-risk-calculator
npm run build
aws s3 sync dist/ s3://your-bucket-name --delete
```

#### CloudFront Configuration
- Set up CloudFront distribution pointing to S3 bucket
- Configure custom error responses:
  - Error Code: 404
  - Response Page Path: `/index.html`
  - HTTP Response Code: 200
  - This enables client-side routing to work properly

### Option 4: GitHub Pages

#### Vite Configuration Update
Update `vite.config.ts` to include base path:

```typescript
export default defineConfig({
  base: '/repository-name/',  // Replace with your repo name
  plugins: [react()],
  // ... rest of config
})
```

#### Deploy
```bash
cd /Users/tylermcanally/Desktop/CardioTools/cv-risk-calculator
npm run build
npx gh-pages -d dist
```

### Option 5: Docker Container

#### Create `Dockerfile`
```dockerfile
# Build stage
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Create `nginx.conf`
```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Enable gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

#### Build and Run
```bash
docker build -t cardiotools .
docker run -p 80:80 cardiotools
```

## Environment Configuration

### Development
```bash
cd /Users/tylermcanally/Desktop/CardioTools/cv-risk-calculator
npm run dev
```
Runs on http://localhost:5173/

### Production Build
```bash
npm run build
```
Output: `dist/` directory

### Preview Production Build
```bash
npm run preview
```
Runs on http://localhost:4173/

## Post-Deployment Verification

After deploying, verify the following:

1. **Homepage Loads**
   - Navigate to the deployed URL
   - Verify the CardioTools landing page displays correctly
   - Check that both tool cards are visible and styled properly

2. **CV Optimization Tool**
   - Click on "CV Optimization" card
   - Verify the form loads with all sections
   - Test calculation functionality
   - Verify report generation works
   - Test copy and print functionality

3. **PreCardia Tool**
   - Click on "PreCardia" card
   - Verify all form sections load and expand/collapse properly
   - Test RCRI calculation
   - Test DASI questionnaire functionality
   - Verify report generation works
   - Test copy and print functionality

4. **Navigation**
   - Test back buttons work correctly
   - Verify direct URL navigation works (e.g., /prevent-calculator, /precardia)
   - Test browser back/forward buttons

5. **Responsive Design**
   - Test on mobile devices
   - Test on tablets
   - Test on desktop at various screen sizes

## Troubleshooting

### Issue: 404 Errors on Direct Navigation
**Solution:** Configure your hosting platform to redirect all requests to `index.html`. This is required for client-side routing.

### Issue: Assets Not Loading
**Solution:** Check that the `base` path in `vite.config.ts` matches your deployment URL structure.

### Issue: Build Fails
**Solution:**
- Ensure Node.js version is 18 or higher
- Delete `node_modules` and `package-lock.json`, then run `npm install`
- Check for TypeScript errors: `npm run build`

### Issue: Large Bundle Size Warnings
**Solution:** The build is already optimized with code splitting. If additional optimization is needed, consider:
- Lazy loading routes with React.lazy()
- Analyzing bundle with `npm run build -- --analyze`

## Maintenance

### Updating Dependencies
```bash
# Check for outdated packages
npm outdated

# Update dependencies
npm update

# Rebuild
npm run build
```

### Adding New Features
1. Develop and test locally with `npm run dev`
2. Run TypeScript check: `tsc -b`
3. Build for production: `npm run build`
4. Preview build: `npm run preview`
5. Deploy when verified

## Security Considerations

- ✅ No sensitive data stored in client-side code
- ✅ No API keys or secrets exposed
- ✅ All calculations performed client-side
- ✅ HTTPS recommended for deployment
- ⚠️ Clinical disclaimer prominently displayed
- ⚠️ Not a substitute for professional medical judgment

## Support and Documentation

- **Main README:** `/cv-risk-calculator/README.md`
- **Clinical Guidelines:** Referenced in application reports
- **Version:** 1.0.0

## Version Control

The project is managed with Git. To deploy from a specific commit or tag:

```bash
git checkout v1.0.0  # or specific commit hash
npm run build
# Deploy as per chosen method
```

---

**Last Updated:** November 4, 2024
**Project:** CardioTools Unified Application
**Status:** Production Ready ✅
