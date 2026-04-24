# 🚀 Render Deployment Instructions

## Quick Deploy (5 minutes)

### Option 1: Deploy from GitHub (Recommended)

1. **Push your code to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

2. **Go to Render Dashboard**:
   - Visit: https://render.com/
   - Sign in with your GitHub account

3. **Create New Web Service**:
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select this repository

4. **Configure Service**:
   - **Name**: `saqms-backend`
   - **Environment**: `Node`
   - **Region**: Choose closest to your users
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

5. **Add Environment Variables** (copy from server/.env):
   ```
   NODE_ENV=production
   PORT=10000
   SUPABASE_URL=https://wofxhadaxsvirjxawzhx.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZnhoYWRheHN2aXJqeGF3emh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzNjc1NjksImV4cCI6MjA5MDk0MzU2OX0.yddSK_bdCkcAUduLuzHbvqEtiZp8i844_AF2HztdyRM
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZnhoYWRheHN2aXJqeGF3emh4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTM2NzU2OSwiZXhwIjoyMDkwOTQzNTY5fQ.z21CW-SME7yFOhAYU554dBtcqmQYUtVu2GiJWN_KIpg
   DB_HOST=aws-1-ap-south-1.pooler.supabase.com
   DB_PORT=5432
   DB_NAME=postgres
   DB_USER=postgres.wofxhadaxsvirjxawzhx
   DB_PASSWORD=facultyoftechnologyy
   DATABASE_URL=postgresql://postgres.wofxhadaxsvirjxawzhx:facultyoftechnologyy@aws-1-ap-south-1.pooler.supabase.com:5432/postgres
   ENCRYPTION_KEY=18f76ded7f8bab903b8d150947e864f66d2e8441e50f1a694702ddbdfb9074fc
   JWT_SECRET=01be64e411838f3d134b8420f2f1368ef4bc5f4a875168bb56be01e8fed4a9d3d4e00a13efefd3eda776742abd422e29b00588a986ca756a6689ffa20109d6bc
   JWT_EXPIRY=15m
   REFRESH_TOKEN_SECRET=79e3bbcb3030ea6c07ae90681066489893a01de67129c6bacace6ce705806dad1054bec6bf76f4ae3705f907d5732af55a22ffe4e4ebbc85e76755bf19029d59
   REFRESH_TOKEN_EXPIRY=7d
   REDIS_URL=rediss://default:gQAAAAAAAR_bAAIncDE4NDJjMDM0Y2E3NTk0MWE1ODE4MTQxN2MwOGFlMjc3OXAxNzM2OTE@immense-parakeet-73691.upstash.io:6379
   CLIENT_URL=https://smart-appointment-queue-management.vercel.app
   ```

6. **Deploy**: Click "Create Web Service"

### Option 2: Deploy using render.yaml

1. **Push code with render.yaml**:
   ```bash
   git add .
   git commit -m "Add render.yaml for deployment"
   git push origin main
   ```

2. **Use Render Blueprint**:
   - Go to Render Dashboard
   - Click "New +" → "Blueprint"
   - Connect repository and select `server/render.yaml`

## ✅ Verification

After deployment:

1. **Check Health Endpoint**:
   ```
   https://your-app-name.onrender.com/api/health
   ```

2. **Test API**:
   ```
   https://your-app-name.onrender.com/api/auth/health
   ```

## 🔧 Troubleshooting

- **Build fails**: Check Node.js version compatibility
- **Database connection**: Verify Supabase credentials
- **Redis connection**: Ensure Upstash Redis URL is correct
- **CORS errors**: Check CLIENT_URL matches your frontend domain

## 📝 Notes

- Free tier has cold starts (may take 30s to wake up)
- Upgrade to paid plan for better performance
- Monitor logs in Render dashboard
- Auto-deploys on git push to main branch