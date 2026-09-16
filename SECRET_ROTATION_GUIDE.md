# Secret Rotation Guide - IMMEDIATE ACTION REQUIRED

## 🚨 CRITICAL: Your `.env` secrets are exposed in git history

The following secrets MUST be rotated immediately:

| Secret | Rotation Command | Where to Update |
|--------|------------------|-----------------|
| `JWT_ACCESS_SECRET` | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` | `.env`, all deployed environments |
| `JWT_REFRESH_SECRET` | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` | `.env`, all deployed environments |
| `EMAIL_VERIFICATION_SECRET` | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` | `.env`, all deployed environments |
| `MONGO_URI` (password) | MongoDB Atlas → Database Access → Edit User → New Password | `.env`, all deployed environments |
| `REDIS_PASSWORD` / `REDIS_URL` | Upstash Console → Redis Database → Reset Password | `.env`, all deployed environments |
| `BREVO_API_KEY` | Brevo Dashboard → SMTP & API → API Keys → Create New | `.env`, all deployed environments |
| `GOOGLE_MAPS_API_KEY` | Google Cloud Console → APIs & Services → Credentials → Regenerate | `.env`, all deployed environments |
| `R2_SECRET_ACCESS_KEY` | Cloudflare R2 → Manage R2 API Tokens → Create New | `.env`, all deployed environments |

---

## Step-by-Step Rotation Process

### 1. Generate New Secrets Locally
```bash
# Run these in terminal to generate secure secrets:
node -e "console.log('JWT_ACCESS_SECRET:', require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('JWT_REFRESH_SECRET:', require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('EMAIL_VERIFICATION_SECRET:', require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Rotate MongoDB Password
1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Select your project → Database Access
3. Find your database user → Edit → Change Password
4. Copy new connection string from Connect → Drivers
5. Update `MONGO_URI` in all environments

### 3. Rotate Redis (Upstash) Password
1. Go to [Upstash Console](https://console.upstash.com/)
2. Select your Redis database → Settings → Reset Password
3. Copy new `REDIS_URL` or individual components
4. Update in all environments

### 4. Rotate Brevo API Key
1. Go to [Brevo Dashboard](https://app.brevo.com/account/keys)
2. Create new API key (v3)
3. Delete old key
4. Update `BREVO_API_KEY` in all environments

### 5. Rotate Google Maps API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Find your API key → Regenerate Key
3. Update restrictions if needed
4. Update `GOOGLE_MAPS_API_KEY` in all environments

### 6. Rotate Cloudflare R2 Credentials
1. Go to Cloudflare Dashboard → R2 → Manage R2 API Tokens
2. Create new API token with Object Read/Write permissions
3. Delete old token
4. Update `R2_ACCESS_KEY_ID` and `R2_SECRET_ACCESS_KEY` in all environments

### 7. Update All Deployment Environments
- **Railway/Render/Vercel**: Update environment variables in dashboard
- **Docker**: Update `.env.production` or docker-compose env vars
- **Kubernetes**: Update secrets with `kubectl create secret generic...`

### 8. Clean Git History (REQUIRED)
```bash
# Option A: BFG Repo-Cleaner (faster for large repos)
# Download: https://rtyley.github.io/bfg-repo-cleaner/
java -jar bfg.jar --replace-text passwords.txt salon-api/.env

# Option B: git filter-repo (built-in)
pip install git-filter-repo
cd salon-api
git filter-repo --path .env --invert-paths

# Option C: If repo is new/small, just recreate
# rm -rf .git && git init && git add . && git commit -m "Initial commit"
```

### 9. Force Push Cleaned History
```bash
git push origin --force --all
git push origin --force --tags
```

### 10. Verify Rotation
- [ ] All old secrets invalidated
- [ ] New secrets working in all environments
- [ ] No old secrets in git log: `git log --all --full-history -- salon-api/.env`
- [ ] Application starts and authenticates correctly

---

## Post-Rotation Checklist

- [ ] JWT secrets rotated - all users logged out (expected)
- [ ] MongoDB password rotated - app connects successfully
- [ ] Redis password rotated - caching/rate limiting works
- [ ] Brevo API key rotated - emails send successfully
- [ ] Google Maps API key rotated - maps/geocoding works
- [ ] R2 credentials rotated - file uploads work
- [ ] Git history cleaned - no secrets in any commit
- [ ] Team notified of new secrets (via secure channel)
- [ ] CI/CD pipelines updated with new secrets
- [ ] Monitoring alerts configured for auth failures

---

## Prevention for Future

1. **Never commit `.env`** - Already in `.gitignore` ✓
2. **Use `.env.example`** as template - Created ✓
3. **Use secret managers** in production:
   - AWS Secrets Manager
   - HashiCorp Vault
   - Doppler
   - 1Password CLI
4. **Rotate secrets quarterly** - Set calendar reminder
5. **Scan for secrets** in CI/CD:
   ```yaml
   # Add to GitHub Actions
   - uses: trufflesecurity/trufflehog@main
     with:
       path: ./
   ```
6. **Pre-commit hooks**:
   ```bash
   # Install
   npm install --save-dev @secretlint/secretlint @secretlint/secretlint-rule-preset-recommend
   npx secretlint --init
   ```