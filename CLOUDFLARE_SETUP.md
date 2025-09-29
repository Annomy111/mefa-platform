# Cloudflare Pages Setup - Complete Guide

## ✅ What's Already Done

- [x] GitHub repository created: https://github.com/Annomy111/mefa-platform
- [x] Code committed and pushed to `main` branch
- [x] Cloudflare Pages project created: `mefa-platform`
- [x] Deployment fixes applied (removed static export, fixed redirects)

## 🔧 Complete Setup via Dashboard

I've opened your Cloudflare dashboard. Follow these exact steps:

### Step 1: Connect GitHub Repository (Required - OAuth)

**Current URL:** https://dash.cloudflare.com/a867271c1fc772b3fbd26f1c347892ff/pages/view/mefa-platform

1. **Click Settings tab** (top navigation)

2. **Scroll to "Source" section**

3. **Click "Connect to Git"** button

4. **Authorize GitHub:**
   - Click "Connect GitHub"
   - GitHub OAuth popup will open
   - Click "Authorize Cloudflare Pages"
   - Select: **Annomy111/mefa-platform** repository
   - Click "Save"

5. **Configure Build Settings:**
   ```
   Production branch: main
   Build command: npm run build && npx @cloudflare/next-on-pages
   Build output directory: .vercel/output/static
   Root directory: (leave empty)
   ```

6. **Click "Save"**

### Step 2: Configure Environment Variables

Still in **Settings** tab:

1. **Scroll to "Environment Variables" section**

2. **Click "Add variable"** (Production)

3. **Add these variables:**
   ```
   Variable: NODE_ENV
   Value: production
   Type: Plain text
   → Click "Add variable"
   ```

   ```
   Variable: OPENROUTER_API_KEY
   Value: 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
   Type: Encrypted (recommended)
   → Click "Add variable"
   ```

4. **Click "Save"**

### Step 3: Configure D1 Database Binding

1. **In Settings tab, scroll to "Functions" section**

2. **Click on "D1 database bindings"**

3. **Click "Add binding":**
   ```
   Variable name: DB
   D1 database: mefa-db
   ```

4. **Click "Save"**

### Step 4: Trigger Deployment

1. **Go to "Deployments" tab**

2. **Click "Create deployment"** or **"Retry deployment"**

3. **Or: Make a commit to trigger auto-deploy:**
   ```bash
   echo "# MEFA Platform" > README.md
   git add README.md
   git commit -m "Add README"
   git push origin main
   ```

4. **Watch the build progress** (usually 2-5 minutes)

### Step 5: Verify Deployment

Once build completes:

1. **Visit:** https://mefa-platform.pages.dev

2. **Should see:** MEFA Platform landing page (not blank!)

3. **Test features:**
   - Language selector works
   - Form loads properly
   - AI assist buttons appear
   - Auto-save functions

---

## 🎯 Quick CLI Alternative (After GitHub Connected)

Once GitHub is connected, future deployments happen automatically on push.

You can also manually deploy:
```bash
# Build locally
npm run build && npx @cloudflare/next-on-pages

# Deploy
wrangler pages deploy .vercel/output/static --project-name mefa-platform
```

---

## 📋 Build Configuration Summary

**Project:** mefa-platform
**Domain:** https://mefa-platform.pages.dev
**Repository:** https://github.com/Annomy111/mefa-platform
**Branch:** main

**Build Settings:**
- Framework: Next.js (with Cloudflare adapter)
- Build Command: `npm run build && npx @cloudflare/next-on-pages`
- Output Directory: `.vercel/output/static`
- Node Version: 18+ (auto-detected)

**Environment Variables:**
- `NODE_ENV=production`
- `OPENROUTER_API_KEY=<your-key>`

**Bindings:**
- D1 Database: `DB` → `mefa-db`

---

## 🐛 Troubleshooting

**If build fails:**
1. Check build logs in Cloudflare dashboard
2. Verify all environment variables are set
3. Confirm D1 binding is configured
4. Check GitHub repository access

**If page is still blank:**
1. Clear browser cache
2. Check browser console for errors
3. Verify deployment succeeded (green checkmark)
4. Check that main branch has latest code

**If API doesn't work:**
1. Verify OPENROUTER_API_KEY is set
2. Check D1 database binding is correct
3. Look at Functions logs in Cloudflare dashboard

---

## ✅ Success Criteria

Your deployment is successful when:
- ✅ mefa-platform.pages.dev shows the application
- ✅ Language selector changes interface language
- ✅ Project Builder form is visible and interactive
- ✅ AI Fill buttons appear on form fields
- ✅ Auto-save indicator appears when typing
- ✅ Compliance score updates in real-time

---

## 🔗 Useful Links

- **Live Site:** https://mefa-platform.pages.dev
- **Dashboard:** https://dash.cloudflare.com/a867271c1fc772b3fbd26f1c347892ff/pages/view/mefa-platform
- **GitHub Repo:** https://github.com/Annomy111/mefa-platform
- **Build Logs:** https://dash.cloudflare.com (Deployments tab)

---

**Need Help?** Check the build logs in Cloudflare dashboard for specific error messages.