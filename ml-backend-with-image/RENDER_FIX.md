# 🔧 Quick Fix for Render Deployment Error

## ❌ Current Error:
```
ERROR: Could not open requirements file: [Errno 2] No such file or directory: 'requirements.txt'
```

## ✅ Solution:

Render is trying to build from the **root** of your repository, but your ML backend is in the **`ml-backend-with-image`** subdirectory.

### Fix Steps:

1. **Go to Render Dashboard**
   - Navigate to your service: https://dashboard.render.com
   - Click on your service name

2. **Update Root Directory**
   - Click on **"Settings"** tab
   - Scroll down to **"Root Directory"** field
   - Enter: `ml-backend-with-image`
   - Click **"Save Changes"**

3. **Redeploy**
   - Render will automatically trigger a new deployment
   - Or manually click "Manual Deploy" → "Deploy latest commit"

## 📋 Configuration Summary:

| Setting | Value |
|---------|-------|
| **Root Directory** | `ml-backend-with-image` |
| **Build Command** | `pip install --upgrade pip && pip install -r requirements.txt` |
| **Start Command** | `uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 1 --timeout-keep-alive 75 --access-log --log-level info` |
| **Health Check Path** | `/health` |

## ✅ After Fix:

Your build should now:
1. ✅ Find `requirements.txt` in `ml-backend-with-image/`
2. ✅ Install all dependencies
3. ✅ Start the FastAPI app successfully
4. ✅ Health check at `/health` endpoint should work

## 🧪 Verify Deployment:

After deployment succeeds, test with:
```bash
curl https://your-service-url.onrender.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "ML Backend",
  "ml_available": true
}
```

