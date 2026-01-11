# Deployment Guide - Netlify

This guide will help you deploy your Multi-Agent Chatbot System to Netlify.

## Prerequisites

- A Netlify account (free tier works)
- A Supabase project with credentials
- Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)

## Step 1: Prepare Your Repository

1. Ensure your code is committed and pushed to your Git repository
2. Make sure the `.env` file is NOT committed (it should be in `.gitignore`)
3. The `.gitignore` should include:
   ```
   .env
   .env.local
   ```

## Step 2: Connect to Netlify

1. Log in to [Netlify](https://app.netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Choose your Git provider (GitHub, GitLab, or Bitbucket)
4. Authorize Netlify to access your repositories
5. Select your chatbot repository

## Step 3: Configure Build Settings

Netlify should automatically detect Next.js and configure these settings:

- **Build command**: `npm run build` or `npx next build`
- **Publish directory**: `.next`
- **Functions directory**: (leave empty)

If not auto-detected, enter these manually.

## Step 4: Set Environment Variables

This is the **MOST CRITICAL STEP**. Your deployment will fail without these.

1. Before clicking "Deploy site", scroll down to "Environment variables"
2. Click "Add environment variables"
3. Add the following variables:

### Required Environment Variables

| Key | Value | Example |
|-----|-------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | `https://xxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon/public key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

### How to Get Your Supabase Credentials

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click on "Settings" (gear icon) in the sidebar
4. Navigate to "API" section
5. Copy:
   - **Project URL** → use for `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → use for `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Adding Variables in Netlify

For each variable:
1. Click "Add a new variable"
2. Enter the **Key** (exact name from table above)
3. Paste the **Value** from your Supabase dashboard
4. Click "Add" or press Enter

**IMPORTANT**: Make sure there are NO extra spaces before or after the values!

## Step 5: Deploy

1. After adding all environment variables, click "Deploy site"
2. Netlify will start building your site
3. Wait 2-5 minutes for the build to complete
4. If successful, you'll see "Published" with a URL

## Step 6: Update Environment Variables Later (If Needed)

If you need to change environment variables after deployment:

1. Go to your site's dashboard in Netlify
2. Click "Site configuration" → "Environment variables"
3. Edit or add new variables
4. Click "Save"
5. Trigger a new deploy:
   - Go to "Deploys" tab
   - Click "Trigger deploy" → "Deploy site"

## Step 7: Configure Custom Domain (Optional)

1. In Netlify dashboard, go to "Domain management"
2. Click "Add custom domain"
3. Enter your domain name
4. Follow instructions to update DNS settings
5. Wait for DNS propagation (can take up to 48 hours)

## Step 8: Update Widget URL

After deployment, you need to update the widget URL in your website:

1. Note your Netlify URL (e.g., `https://your-site.netlify.app`)
2. Update the widget script on any external websites:

```html
<script>
  window.CHATBOT_WIDGET_URL = 'https://your-site.netlify.app';
</script>
<script src="https://your-site.netlify.app/widget.js"></script>
```

## Step 9: Initial Setup

1. Visit your deployed site
2. Go to `/setup` (e.g., `https://your-site.netlify.app/setup`)
3. Create your first admin account
4. Login and configure your chatbot

## Troubleshooting

### Build Fails with "supabaseUrl is required"

**Cause**: Environment variables not set correctly

**Solution**:
1. Go to Site configuration → Environment variables
2. Verify both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are present
3. Check for typos in the variable names (they're case-sensitive!)
4. Ensure there are no extra spaces in the values
5. Trigger a new deploy

### Build Succeeds but Site Shows Errors

**Cause**: Runtime environment issues or database connection problems

**Solution**:
1. Check browser console for errors
2. Verify Supabase credentials are correct
3. Ensure your Supabase database schema is set up (see SETUP.md)
4. Check that RLS policies are configured

### 404 Errors on Navigation

**Cause**: Next.js routing not configured correctly

**Solution**:
1. This should be automatic with `@netlify/plugin-nextjs`
2. Verify `netlify.toml` has the Next.js plugin configured
3. Try clearing build cache: Site configuration → Build & deploy → Clear cache and retry deploy

### Widget Not Loading on External Sites

**Cause**: CORS or incorrect URL

**Solution**:
1. Verify the widget URL is correct
2. Check that `/widget.js` exists on your deployed site
3. Check browser console for CORS errors
4. Ensure Supabase project allows requests from your domain

### Real-time Features Not Working

**Cause**: Supabase Realtime not enabled or configured

**Solution**:
1. Go to your Supabase project settings
2. Navigate to API section
3. Ensure "Realtime" is enabled
4. Check that you're not exceeding free tier limits

## Performance Optimization

### Enable Edge Functions

Netlify Edge Functions can improve performance:

1. Go to Site configuration → Functions
2. Enable Edge Functions
3. Deploy

### Configure Caching

The `netlify.toml` is already configured with optimal settings.

## Monitoring

### View Deploy Logs

1. Go to Deploys tab
2. Click on any deploy
3. View build logs and errors

### View Function Logs

1. Go to Functions tab
2. View real-time logs and errors

### Analytics

1. Go to Analytics tab (may require paid plan)
2. View traffic, performance metrics

## Security Best Practices

1. **Never commit** `.env` files to your repository
2. **Rotate credentials** if accidentally exposed
3. **Use environment variables** for all sensitive data
4. **Enable RLS** on all Supabase tables
5. **Regular backups** of your Supabase database
6. **HTTPS only** - Netlify provides this automatically

## Continuous Deployment

Netlify automatically deploys when you push to your Git repository:

1. Make changes to your code
2. Commit and push to your repository
3. Netlify automatically detects changes and rebuilds
4. Wait for build to complete
5. Changes are live

### Disable Auto-Deploy (Optional)

1. Go to Site configuration → Build & deploy
2. Under "Build settings", click "Edit settings"
3. Set "Auto publishing" to "Stopped"
4. Manually trigger deploys when needed

## Cost Considerations

### Netlify Free Tier Includes:
- 300 build minutes/month
- 100 GB bandwidth/month
- Automatic HTTPS
- Continuous deployment

### Supabase Free Tier Includes:
- 500 MB database space
- 1 GB file storage
- 2 GB bandwidth
- 50 MB file uploads
- Unlimited API requests

Monitor your usage in both dashboards to avoid overages.

## Support

If you encounter issues:

1. Check Netlify build logs
2. Review Supabase logs
3. Verify all environment variables
4. Test locally first with `npm run build`
5. Check browser console for errors

## Next Steps

After successful deployment:

1. Create admin account via `/setup`
2. Configure brand settings
3. Add agent accounts
4. Set up conversation flows
5. Embed widget on your website
6. Test real-time messaging
7. Monitor usage and performance

---

**Your Multi-Agent Chatbot System is now live!**

For local development setup, see [SETUP.md](./SETUP.md)
