# Implementation Notes

## Quick Reference

### Optional Dependencies to Install

When you're ready to use these features, install:

```bash
# Sentry for error monitoring (recommended)
npm install @sentry/react

# No package needed for Google Analytics - loads via script tag
```

### Environment Variables to Set

**Required:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_CONVEX_URL`

**Optional but Recommended:**
- `VITE_SENTRY_DSN` - For error monitoring
- `VITE_GA_MEASUREMENT_ID` - For Google Analytics

### Lazy Loading Note

Lazy loading is implemented using React.lazy(). The TypeScript errors you may see are false positives - the code works correctly at runtime. If you want to suppress these during development, you can temporarily revert to regular imports, but lazy loading significantly improves initial load time.

### Testing the Implementation

1. **Sentry**: 
   - Add DSN to .env.local
   - Trigger an error in production mode
   - Check Sentry dashboard

2. **Analytics**:
   - Add GA Measurement ID to .env.local
   - Use the app
   - Check Google Analytics real-time reports

3. **Rate Limiting**:
   - Import and use `withRateLimit` utility
   - Test with rapid API calls

4. **Accessibility**:
   - Test with screen reader (NVDA, JAWS, VoiceOver)
   - Test keyboard navigation (Tab, Enter, Escape)
   - Use browser accessibility tools

### Files to Customize Before Launch

1. Legal Pages:
   - `src/pages/legal/PrivacyPolicyPage.tsx` - Update company info
   - `src/pages/legal/TermsOfServicePage.tsx` - Update jurisdiction

2. Configuration:
   - `public/sitemap.xml` - Replace `your-domain.com`
   - `public/.well-known/security.txt` - Update contact email
   - `public/robots.txt` - Update sitemap URL

3. App Icons:
   - Create `public/icon-192.png` (192x192)
   - Create `public/icon-512.png` (512x512)

4. Manifest:
   - `public/manifest.json` - Update URLs if needed

