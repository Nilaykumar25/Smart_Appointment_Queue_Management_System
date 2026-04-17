# Vercel Deployment Guide for SAQMS

## ✅ Step 1: Prerequisites (COMPLETED)

All client-side code has been updated to use environment variables:
- ✅ `client/src/services/api.js` - Uses `VITE_API_URL`
- ✅ `client/src/services/auth.js` - Uses `VITE_API_URL`
- ✅ `client/src/pages/Dashboard.jsx` - Uses `VITE_API_URL`
- ✅ `client/src/pages/BookAppointment.jsx` - Uses `VITE_API_URL`
- ✅ `client/src/pages/BookingConfirmation.jsx` - Uses `VITE_API_URL`
- ✅ `client/src/pages/DoctorSearch.jsx` - Uses `VITE_API_URL`
- ✅ `client/src/pages/admin/ReportsPage.jsx` - Uses `VITE_API_URL`
- ✅ `client/.env.production` - Created with production API URL

## Step 2: Set Up External Services

### Option A: Neon (Recommended for PostgreSQL)

1. Go to https://neon.tech
2. Sign up for free account
3. Create a new project
4. Copy the connection string (looks like: `postgresql://user:pass@host.neon.tech/dbname`)
5. Save it for later

### Option B: Supabase (Alternative)

1. Go to https://supabase.com
2. Create new project
3. Go to Settings → Database
4. Copy the connection string
5. Save it for later

### Redis Setup: Upstash

1. Go to https://upstash.com
2. Sign up for free account
3. Create a new Redis database
4. Copy the Redis URL (looks like: `redis://default:pass@host.upstash.io:6379`)
5. Save it for later

## Step 3: Run Database Migrations

Once you have your PostgreSQL connection string:

```bash
# Set the DATABASE_URL temporarily
$env:DATABASE_URL="your-postgresql-connection-string"

# Run migrations
cd server
node src/db/migrate.js

# Run seeds (optional - creates sample data)
node src/db/seed.js

# Create admin user
node create-admin.js

# Create staff user
node create-staff.js
```

## Step 4: Push Code to GitHub

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "feat: prepare for Vercel deployment"

# Create GitHub repository and push
git remote add origin https://github.com/YOUR_USERNAME/SAQMS.git
git branch -M main
git push -u origin main
```

## Step 5: Deploy Frontend to Vercel

### Via Vercel Dashboard:

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. Add Environment Variable:
   - Click "Environment Variables"
   - Add: `VITE_API_URL` = `https://your-backend-url.vercel.app/api` (we'll get this in next step)
   - For now, you can leave it as `/api` if deploying backend on same domain

5. Click "Deploy"

### Via Vercel CLI (Alternative):

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy from client directory
cd client
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name: saqms-client
# - Directory: ./
# - Override settings? Yes
#   - Build Command: npm run build
#   - Output Directory: dist
#   - Development Command: npm run dev
```

## Step 6: Deploy Backend

### Option A: Deploy to Railway (Recommended)

Railway is better for Node.js backends with long-running processes:

1. Go to https://railway.app
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your SAQMS repository
5. Click "Add variables" and add:
   ```
   DATABASE_URL=your-postgresql-connection-string
   REDIS_URL=your-redis-connection-string
   JWT_SECRET=your-secret-key-here
   REFRESH_TOKEN_SECRET=your-refresh-secret-here
   JWT_EXPIRY=15m
   REFRESH_TOKEN_EXPIRY=7d
   ENCRYPTION_KEY=your-64-char-hex-key
   NODE_ENV=production
   PORT=5000
   ```
6. In Settings:
   - Root Directory: `server`
   - Start Command: `node src/index.js`
7. Deploy!
8. Copy the deployment URL (e.g., `https://saqms-production.up.railway.app`)

### Option B: Deploy to Render

1. Go to https://render.com
2. Sign up with GitHub
3. Click "New" → "Web Service"
4. Connect your repository
5. Configure:
   - Name: saqms-backend
   - Root Directory: `server`
   - Build Command: `npm install`
   - Start Command: `node src/index.js`
6. Add environment variables (same as Railway)
7. Create Web Service
8. Copy the deployment URL

## Step 7: Update Frontend with Backend URL

1. Go back to Vercel dashboard
2. Go to your frontend project → Settings → Environment Variables
3. Update `VITE_API_URL` to your backend URL:
   - If Railway: `https://saqms-production.up.railway.app/api`
   - If Render: `https://saqms-backend.onrender.com/api`
4. Redeploy the frontend

## Step 8: Update CORS Settings

Update `server/src/index.js` to allow your Vercel frontend:

```javascript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://your-frontend.vercel.app'  // Add your Vercel URL
  ],
  credentials: true
}));
```

Commit and push this change to trigger a redeploy.

## Step 9: Test Your Deployment

1. Visit your Vercel frontend URL
2. Try to register a new account
3. Try to login with:
   - Admin: `admin@demo.com` / `admin123`
   - Staff: `staff@demo.com` / `staff123`
   - Patient: `patient1@demo.com` / `password123`
4. Test booking an appointment
5. Check queue status
6. Test all major features

## Step 10: Set Up Custom Domain (Optional)

### In Vercel:
1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

### In Railway/Render:
1. Go to Settings → Domains
2. Add custom domain
3. Update DNS records

## Troubleshooting

### Issue: "Failed to fetch" errors
- Check CORS settings in backend
- Verify `VITE_API_URL` is set correctly
- Check browser console for exact error

### Issue: Database connection fails
- Verify DATABASE_URL is correct
- Check if database allows connections from Railway/Render IPs
- For Neon: Enable "Allow all IPs" in settings

### Issue: Redis connection fails
- Verify REDIS_URL format
- Check Upstash dashboard for connection issues

### Issue: 404 on API routes
- Verify backend is running
- Check backend logs in Railway/Render dashboard
- Ensure routes are properly registered

## Environment Variables Summary

### Frontend (Vercel):
```
VITE_API_URL=https://your-backend-url/api
```

### Backend (Railway/Render):
```
DATABASE_URL=postgresql://user:pass@host:5432/dbname
REDIS_URL=redis://default:pass@host:6379
JWT_SECRET=your-secret-key-minimum-32-characters
REFRESH_TOKEN_SECRET=your-refresh-secret-minimum-32-characters
JWT_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d
ENCRYPTION_KEY=your-64-character-hex-key
NODE_ENV=production
PORT=5000
```

## Generate Secure Keys

```bash
# Generate JWT_SECRET (32+ characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate REFRESH_TOKEN_SECRET (32+ characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate ENCRYPTION_KEY (exactly 64 hex characters for AES-256)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Next Steps

1. Set up monitoring (Railway/Render provide built-in monitoring)
2. Configure automatic deployments on git push
3. Set up staging environment
4. Add health check endpoints
5. Configure backup strategy for database

## Support

If you encounter issues:
1. Check Railway/Render logs
2. Check Vercel deployment logs
3. Verify all environment variables are set
4. Test API endpoints directly using Postman/Thunder Client
