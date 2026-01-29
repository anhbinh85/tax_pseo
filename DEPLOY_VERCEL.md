# Deploy to Vercel (Step by Step)

## 1) Prepare the repository
- Make sure the project builds locally:
  - `npm install`
  - `npm run build`
- Commit your changes and push to a Git host Vercel can access (GitHub/GitLab/Bitbucket).

## 2) Create a Vercel project
1. Go to https://vercel.com/new
2. Import the repository.
3. In the configuration screen:
   - Framework Preset: `Next.js`
   - Root Directory: leave default (repo root)
   - Build Command: `npm run build`
   - Output Directory: leave default (Next.js)
   - Install Command: `npm install`

## 3) Configure environment variables
1. In Vercel, open **Project Settings → Environment Variables**.
2. Add every variable that exists in your local `.env` file.
3. Apply variables to **Production** (and **Preview** if desired).

## 4) Deploy
1. Click **Deploy**.
2. Wait for the build to finish.
3. Open the provided Vercel URL.

## 5) Set a custom domain (optional)
1. Go to **Project Settings → Domains**.
2. Add your domain and follow Vercel's DNS instructions.

## 6) Verify
- Check key pages:
  - `/vi`
  - `/en`
  - `/vi/hs-code/<slug>`
  - `/en/hs-code/<slug>`
- Confirm the data renders and search works.

## 7) Redeploys
- Every push to the connected branch triggers a new deployment.

