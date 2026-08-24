# 🔐 Salon SaaS Platform — Secrets & Config Management Specification

This document defines secret classifications, environment configurations, secret rotation workflows, and vault integration standards for production deployments.

---

## 📋 1. Secrets vs. Configuration Inventory

### 🔑 Critical Secrets (Must NEVER be committed to Git or exposed to client apps)
| Secret Key | Description | Storage Strategy |
| :--- | :--- | :--- |
| `JWT_ACCESS_SECRET` | Secret key used to sign & verify short-lived Access Tokens | Cloud Vault (Doppler / AWS Secrets Manager) |
| `JWT_REFRESH_SECRET` | Secret key used to sign & verify long-lived Refresh Tokens | Cloud Vault (Doppler / AWS Secrets Manager) |
| `MONGO_URI` | Database connection string containing credentials & host | Cloud Vault / Deployment Environment Variables |
| `REDIS_PASSWORD` / `REDIS_URL` | Cache cluster connection password | Cloud Vault / Deployment Environment Variables |
| `BREVO_API_KEY` | Transactional email provider API key | Cloud Vault |
| `EMAIL_VERIFICATION_SECRET` | Verification token hashing secret | Cloud Vault |

### ⚙️ Non-Sensitive Configuration (Safe for `.env.example`)
| Config Key | Description | Default Value |
| :--- | :--- | :--- |
| `PORT` | API Server listening port | `6969` |
| `NODE_ENV` | Application environment state | `development` / `staging` / `production` |
| `ALLOWED_ORIGINS` | Comma-separated whitelist of allowed CORS origins | Whitelisted domains (No `*` in prod) |
| `JWT_ACCESS_EXPIRES` | Server-enforced access token TTL | `15m` |
| `JWT_REFRESH_EXPIRES` | Server-enforced refresh token TTL | `7d` |
| `RATE_LIMIT_MAX` | Max requests per rate-limiting window | `1000` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window duration in milliseconds | `900000` (15 mins) |

---

## 🔄 2. Production Secret Rotation Workflow

To rotate JWT secrets or database credentials safely without disrupting active user sessions:

### JWT Secret Rotation Procedure
1. Deploy new secrets (`JWT_ACCESS_SECRET_NEW`, `JWT_REFRESH_SECRET_NEW`) to the Secret Manager.
2. Configure the auth middleware to accept signatures from both active and secondary keys (`JWT_ACCESS_SECRET_OLD` as fallback) during a 24-hour grace window.
3. Force silent token refresh across clients.
4. Remove the old key after 24 hours.

---

## ☁️ 3. Recommended Production Vault Setup (Doppler Integration)

For cloud platforms (Railway, Render, AWS, Kubernetes), inject secrets using **Doppler**:

```bash
# Install Doppler CLI in deployment pipeline
curl -Ls https://cli.doppler.com/install.sh | sh

# Run Express server with injected secrets
doppler run -- node src/app.js
```
