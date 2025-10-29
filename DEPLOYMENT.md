# Deployment Guide - Vercel

This guide will walk you through deploying the Retirement Fee Benchmarking application to Vercel.

## Prerequisites

- A GitHub account (or GitLab/Bitbucket)
- A Vercel account (free tier available at [vercel.com](https://vercel.com))
- Your Domo API credentials (if using Domo API instead of CSV)

## Step 1: Push to GitHub

1. Create a new repository on GitHub:
   - Go to [github.com/new](https://github.com/new)
   - Name it: `retirement-fee-benchmarking`
   - Make it **Private** (recommended since it contains business logic)
   - Do NOT initialize with README, .gitignore, or license

2. Push your local repository to GitHub:
   ```bash
   cd "/Users/jeffrausch/claude projects/RetirementFeeBenchmarkingV2"
   git remote add origin https://github.com/YOUR_USERNAME/retirement-fee-benchmarking.git
   git branch -M main
   git push -u origin main
   ```

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com) and sign in with your GitHub account

2. Click **"Add New..."** → **"Project"**

3. Import your GitHub repository:
   - Find `retirement-fee-benchmarking` in the list
   - Click **"Import"**

4. Configure your project:
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `./` (leave as default)
   - **Build Command:** `npm run build` (auto-detected)
   - **Output Directory:** `.next` (auto-detected)

5. Add Environment Variables:
   Click **"Environment Variables"** and add:

   ```
   DOMO_CLIENT_ID = your_actual_client_id
   DOMO_CLIENT_SECRET = your_actual_client_secret
   DOMO_DATASET_ID = your_actual_dataset_id
   NEXT_PUBLIC_USE_DOMO_API = false
   ```

   **Important:** Set `NEXT_PUBLIC_USE_DOMO_API` to `true` if you want to use Domo API in production, or `false` to use the CSV file.

6. Click **"Deploy"**

7. Wait 2-3 minutes for the build to complete

8. Your app will be live at: `https://your-project-name.vercel.app`

### Option B: Deploy via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy from your project directory:
   ```bash
   cd "/Users/jeffrausch/claude projects/RetirementFeeBenchmarkingV2"
   vercel
   ```

4. Follow the prompts and add environment variables when asked

## Step 3: Configure Environment Variables (Post-Deployment)

If you need to update environment variables after deployment:

1. Go to your project on Vercel dashboard
2. Click **"Settings"** → **"Environment Variables"**
3. Add or update variables:
   - `DOMO_CLIENT_ID`
   - `DOMO_CLIENT_SECRET`
   - `DOMO_DATASET_ID`
   - `NEXT_PUBLIC_USE_DOMO_API`
4. Redeploy by going to **"Deployments"** → **"..."** → **"Redeploy"**

## Step 4: Set Up Custom Domain (Optional)

1. In Vercel dashboard, go to your project
2. Click **"Settings"** → **"Domains"**
3. Add your custom domain (e.g., `fees.fiduciarydecisions.com`)
4. Follow Vercel's DNS configuration instructions

## Important Security Notes

⚠️ **Never commit your `.env.local` file to Git!**

- The `.gitignore` file is already configured to exclude `.env*.local` files
- Only commit `.env.local.example` with placeholder values
- Set actual credentials in Vercel's dashboard

## Troubleshooting

### Build Fails

**Issue:** Build fails with missing dependencies
**Solution:** Ensure all dependencies are in `package.json` and run `npm install` locally first

### Environment Variables Not Working

**Issue:** App can't access Domo API
**Solution:**
- Verify environment variables are set in Vercel dashboard
- Make sure `NEXT_PUBLIC_USE_DOMO_API=true` if using Domo
- Redeploy after changing environment variables

### CSV File Not Found

**Issue:** "File not found" error for CSV
**Solution:** Ensure `RetirementFeeDataset (1).csv` is in the `public` folder and committed to Git

### PowerPoint Export Not Working

**Issue:** PowerPoint export fails in production
**Solution:**
- Check browser console for errors
- Verify `pptxgenjs` is in `dependencies` (not `devDependencies`)
- This is a client-side operation and should work in all browsers

## Monitoring and Analytics

Vercel provides built-in analytics:
- Go to your project → **"Analytics"** to see page views and performance
- Go to **"Logs"** to see real-time function logs
- Go to **"Speed Insights"** for performance metrics

## Automatic Deployments

Once connected to GitHub:
- Every push to `main` branch triggers a production deployment
- Pull requests get preview deployments
- Vercel comments on PRs with preview URLs

## Cost Considerations

**Vercel Free Tier includes:**
- Unlimited deployments
- 100 GB bandwidth per month
- Serverless function executions
- Automatic HTTPS and CDN

**Upgrade if you need:**
- More bandwidth
- Commercial use
- Team collaboration features
- Priority support

## Next Steps

1. Test your deployed app thoroughly
2. Share the Vercel URL with stakeholders
3. Set up a custom domain if needed
4. Configure monitoring and alerts
5. Set up Salesforce integration for client/presenter names (future work)

## Support

- Vercel Documentation: [vercel.com/docs](https://vercel.com/docs)
- Next.js Documentation: [nextjs.org/docs](https://nextjs.org/docs)
- Vercel Support: Available through dashboard

---

**Last Updated:** 2025-10-29
