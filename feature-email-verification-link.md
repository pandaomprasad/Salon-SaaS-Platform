# Feature: Email Verification via Confirmation Link

## Goal
When a user signs up with email + password:
1. Reject obviously fake/disposable emails instantly (MX record + disposable domain check).
2. Send a confirmation link to their inbox. The account stays `email_verified: false` until they click it — this is what actually proves they own the inbox.

## Part 1 — Pre-signup validity check (unchanged from before)

### 1. Install dependencies
```bash
npm install disposable-email-domains
```

### 2. Add a validation utility
Create `utils/emailValidation.js`:
```js
const dns = require("dns").promises;
const disposableDomains = require("disposable-email-domains");

const disposableSet = new Set(disposableDomains);

function isValidFormat(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getDomain(email) {
  return email.split("@")[1]?.toLowerCase();
}

function isDisposableDomain(email) {
  return disposableSet.has(getDomain(email));
}

async function hasMxRecord(email) {
  try {
    const records = await dns.resolveMx(getDomain(email));
    return records && records.length > 0;
  } catch {
    return false;
  }
}

async function validateEmail(email) {
  if (!isValidFormat(email)) return { valid: false, reason: "Invalid email format." };
  if (isDisposableDomain(email)) return { valid: false, reason: "Disposable email addresses are not allowed." };
  if (!(await hasMxRecord(email))) return { valid: false, reason: "This email domain cannot receive mail." };
  return { valid: true };
}

module.exports = { validateEmail };
```

### 3. Use it in your signup route
```js
const { validateEmail } = require("../utils/emailValidation");

app.post("/api/auth/signup", async (req, res) => {
  const { email, password } = req.body;

  const check = await validateEmail(email);
  if (!check.valid) {
    return res.status(400).json({ success: false, error: check.reason });
  }

  // proceed to create user with email_verified: false
});
```

## Part 2 — Confirmation link verification

### 1. Install dependencies
```bash
npm install nodemailer jsonwebtoken
```
`jsonwebtoken` generates a signed, expiring, tamper-proof token to embed in the link — no need to store a separate OTP/token in the database, and no risk of guessable codes.

### 2. Add `email_verified` to your User model
```js
{
  email_verified: { type: Boolean, default: false },
}
```
(No token fields needed on the user — the JWT itself carries and verifies everything.)

### 3. Generate and send the confirmation link on signup
Create `utils/sendVerificationEmail.js`:
```js
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

function generateVerificationToken(userId, email) {
  return jwt.sign(
    { userId, email },
    process.env.EMAIL_VERIFICATION_SECRET,
    { expiresIn: "1h" }
  );
}

async function sendVerificationEmail(user) {
  const token = generateVerificationToken(user._id, user.email);
  const verifyUrl = `${process.env.APP_BASE_URL}/verify-email?token=${token}`;

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: user.email,
    subject: "Confirm your email",
    html: `
      <p>Tap the link below to confirm your email and activate your account:</p>
      <p><a href="${verifyUrl}">Confirm my email</a></p>
      <p>This link expires in 1 hour. If you didn't create an account, you can ignore this email.</p>
    `,
  });
}

module.exports = { sendVerificationEmail };
```

Call `sendVerificationEmail(user)` immediately after successful user creation in the signup route.

### 4. Add the verify route (this is what the link hits)
```js
const jwt = require("jsonwebtoken");

app.get("/api/auth/verify-email", async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ success: false, error: "Missing verification token." });
  }

  try {
    const payload = jwt.verify(token, process.env.EMAIL_VERIFICATION_SECRET);
    const user = await User.findById(payload.userId);

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found." });
    }
    if (user.email !== payload.email) {
      return res.status(400).json({ success: false, error: "Token does not match account email." });
    }
    if (user.email_verified) {
      return res.json({ success: true, message: "Email already verified." });
    }

    user.email_verified = true;
    await user.save();

    res.json({ success: true, message: "Email verified successfully." });
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(400).json({ success: false, error: "Verification link expired. Request a new one." });
    }
    return res.status(400).json({ success: false, error: "Invalid verification link." });
  }
});
```

### 5. Add a resend-link route
```js
app.post("/api/auth/resend-verification", async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) return res.status(404).json({ success: false, error: "User not found." });
  if (user.email_verified) return res.status(400).json({ success: false, error: "Already verified." });

  await sendVerificationEmail(user);
  res.json({ success: true, message: "Verification email resent." });
});
```

### 6. How the link opens back into your app (deep linking)

Since this is an Expo app, the confirmation link should open your app directly (or a web fallback page that redirects into the app) rather than just showing a bare JSON response.

**Option A — Web landing page (simplest, works everywhere)**
Point `APP_BASE_URL` at a small hosted page (or a route in your existing backend) that:
1. Calls `/api/auth/verify-email?token=...` server-side.
2. Shows "Email verified! You can return to the app" with a deep link button.

**Option B — Direct deep link into the app**
Use your existing custom scheme:
```
customerapp://verify-email?token=...
```
Requires the email client to support opening custom schemes from a link tap (works on most modern mail apps) — otherwise Option A is more reliable as a fallback.

Recommended: **use Option A**, and have that landing page include a deep link button (`customerapp://`) for users who have the app installed, with a plain "verified" message for those who don't.

### 7. Gate app usage until verified
Return `email_verified` on login so the frontend can show a "check your inbox" screen with a resend button:
```js
res.json({ success: true, token, email_verified: user.email_verified });
```

## Environment variables needed
```
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
MAIL_FROM=noreply@yourapp.com
EMAIL_VERIFICATION_SECRET=
APP_BASE_URL=https://yourapp.com
```

## Instruction for Agent
1. Install `disposable-email-domains`, `nodemailer`, and `jsonwebtoken` in the backend project.
2. Create `utils/emailValidation.js` and `utils/sendVerificationEmail.js` exactly as shown above.
3. Add `email_verified` (boolean, default false) to the existing User model/schema — locate it first rather than assuming its structure or ORM.
4. Wire `validateEmail()` into the existing signup route before user creation; return the `reason` string as the error message on failure.
5. Call `sendVerificationEmail(user)` immediately after successful user creation in the signup route.
6. Add `/api/auth/verify-email` (GET) and `/api/auth/resend-verification` (POST) routes to the existing auth router — match the existing route file's response format/conventions rather than introducing a new response shape.
7. Build the web landing page described in Option A (simple HTML page or React page depending on what the existing backend/frontend stack supports) that calls the verify endpoint and shows a deep-link button back into the app.
8. Add the new environment variables to `.env.example` (placeholders only, not real credentials).
9. On the frontend, after signup show a "check your inbox to confirm your email" screen with a resend button, disabled for 30–60 seconds after each send.
10. Do not remove or alter the existing Google sign-in flow — this verification flow applies only to email/password signups, since Google-authenticated emails are already verified by Google.
