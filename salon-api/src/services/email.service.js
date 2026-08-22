const nodemailer = require('nodemailer')
const { Queue, Worker } = require('bullmq')
const logger = require('../utils/logger')

// Initialize Transporter — uses SMTP if environment variables exist, else logs to console
const createTransporter = () => {
  const host = process.env.SMTP_HOST
  const port = process.env.SMTP_PORT || 587
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port: Number(port),
      secure: Number(port) === 465,
      auth: { user, pass },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
    })
  }

  // Fallback console log transport for local dev / testing
  return {
    sendMail: async (mailOptions) => {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log(`📧 [EMAIL SERVICE] Mock Send to: ${mailOptions.to}`)
      console.log(`📌 Subject: ${mailOptions.subject}`)
      console.log(`📝 Text Preview: ${mailOptions.text?.substring(0, 120)}...`)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      return { messageId: `mock-${Date.now()}` }
    }
  }
}

const transporter = createTransporter()
const EMAIL_FROM = process.env.EMAIL_FROM || '"ST CUT" <no-reply@stcut.com>'

// ── BullMQ & Connection Setup ─────────────────────────────
const isRedisEnabled = (process.env.REDIS_ENABLED ?? 'true').toLowerCase() !== 'false'
const isRedisConfigured = Boolean(
  process.env.REDIS_URL || process.env.REDIS_HOST || process.env.REDISHOST
)

const hostStr = process.env.REDIS_HOST || process.env.REDISHOST || ''
const isUpstashConn = hostStr.includes('upstash.io') || (process.env.REDIS_URL || '').includes('upstash.io')

const redisConnection = process.env.REDIS_URL
  ? { url: process.env.REDIS_URL }
  : {
      host: hostStr || 'localhost',
      port: Number(process.env.REDIS_PORT || process.env.REDISPORT) || 6379,
      password: process.env.REDIS_PASSWORD || process.env.REDISPASSWORD || undefined,
      ...(isUpstashConn && { tls: { rejectUnauthorized: false } }),
      maxRetriesPerRequest: null,
      enableOfflineQueue: false,
      retryStrategy: (times) => (times > 3 ? null : 1000),
    }

let emailQueue = null
let emailWorker = null
let isRedisConnected = false

if (isRedisEnabled && isRedisConfigured) {
  try {
    emailQueue = new Queue('emailQueue', {
      connection: redisConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 200,
      },
    })

    // Handle connection error gracefully without flooding console logs
    emailQueue.on('error', (err) => {
      isRedisConnected = false
    })

    emailWorker = new Worker(
      'emailQueue',
      async (job) => {
        const mailOptions = job.data
        try {
          await transporter.sendMail(mailOptions)
          if (logger.info) logger.info(`BullMQ Worker: Sent email [${job.id}] to ${mailOptions.to}`)
        } catch (err) {
          console.warn(`⚠️ [SMTP DISPATCH WARN] Could not send via SMTP (${err.message}). Printing mail to console:`)
          console.log(`📧 To: ${mailOptions.to}`)
          console.log(`📌 Subject: ${mailOptions.subject}`)
          console.log(`📝 Text: ${mailOptions.text}`)
        }
      },
      { connection: redisConnection }
    )

    emailWorker.on('ready', () => {
      isRedisConnected = true
      console.log('⚡ BullMQ Email Queue & Worker connected to Redis.')
    })

    emailWorker.on('error', (err) => {
      isRedisConnected = false
    })

    emailWorker.on('failed', (job, err) => {
      console.error(`❌ [BULLMQ EMAIL FAILED] Job [${job?.id}] to ${job?.data?.to}: ${err.message}`)
    })
  } catch (err) {
    isRedisConnected = false
    emailQueue = null
  }
} else {
  console.log('ℹ️ Redis not configured for BullMQ — using non-blocking async dispatch fallback.')
}

/**
 * Dispatch Mail helper with BullMQ / Async Fallback
 */
const dispatchEmail = async (mailOptions) => {
  if (emailQueue && isRedisConnected) {
    try {
      await emailQueue.add('sendMailJob', mailOptions)
      return
    } catch (err) {
      isRedisConnected = false
    }
  }

  // Fallback direct non-blocking send
  setImmediate(async () => {
    try {
      await transporter.sendMail(mailOptions)
    } catch (err) {
      console.warn(`⚠️ [SMTP DISPATCH WARN] To: ${mailOptions.to} — ${err.message}`)
      console.log(`📧 Mock Fallback To: ${mailOptions.to}`)
      console.log(`📌 Subject: ${mailOptions.subject}`)
      console.log(`📝 Text: ${mailOptions.text}`)
    }
  })
}

// Shared HTML Template Base
const wrapTemplate = (title, content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #090d16; margin: 0; padding: 24px; color: #f8fafc; }
    .container { max-width: 580px; margin: 0 auto; background: #111827; border-radius: 20px; overflow: hidden; border: 1px solid #1e293b; box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
    .header { background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); padding: 32px 28px; text-align: center; border-b: 1px solid #1e293b; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px; }
    .header span { color: #818cf8; }
    .content { padding: 32px 28px; background-color: #111827; }
    .badge { display: inline-block; padding: 6px 14px; border-radius: 9999px; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 20px; }
    .badge-confirmed { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
    .badge-cancelled { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }
    .badge-rescheduled { background: rgba(99, 102, 241, 0.15); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.3); }
    .badge-completed { background: rgba(168, 85, 247, 0.15); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.3); }
    .details-box { background: #0b101d; border: 1px solid #1e293b; border-radius: 14px; padding: 20px; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #1e293b; font-size: 13.5px; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: #94a3b8; font-weight: 500; }
    .detail-value { font-weight: 600; color: #f8fafc; text-align: right; }
    .footer { background: #0b101d; text-align: center; padding: 24px; font-size: 12px; color: #64748b; border-t: 1px solid #1e293b; }
    a { color: #818cf8; text-decoration: none; font-weight: 600; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>LUXE<span>SALON</span> PLATFORM</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>Thank you for using Luxe Salon SaaS Platform.</p>
      <p>© ${new Date().getFullYear()} Luxe Salon Platform. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`

/**
 * Send Booking Confirmation Email (Sent immediately when customer books)
 */
const sendBookingConfirmationEmail = async ({ to, customerName, salonName, branchName, serviceName, staffName, date, time, price, bookingId }) => {
  if (!to) return

  const displaySalon = salonName || 'Salon'
  const displayService = serviceName || 'Service'
  const subject = `Booking Received — ${displaySalon} (#${String(bookingId).slice(-6)})`

  const html = wrapTemplate('Booking Confirmed', `
    <div class="badge badge-confirmed">✓ BOOKING SUBMITTED</div>
    <h2 style="margin-top:0; color:#ffffff;">Thank You for Your Booking, ${customerName || 'Valued Client'}!</h2>
    <p style="color:#cbd5e1; font-size:14.5px; line-height:1.6;">
      Your appointment request for <strong style="color:#818cf8;">${displayService}</strong> at <strong style="color:#ffffff;">${displaySalon}</strong> has been received!
    </p>

    <!-- Prominently Highlighted Date & Time Banner -->
    <div style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); border: 1px solid #6366f1; border-radius: 16px; padding: 20px; text-align: center; margin: 24px 0; box-shadow: 0 10px 25px rgba(99, 102, 241, 0.2);">
      <p style="color: #a5b4fc; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 6px 0;">🗓 APPOINTMENT DATE &amp; TIME</p>
      <p style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">${date}${time ? ` &nbsp;•&nbsp; ${time}` : ''}</p>
    </div>
    
    <div class="details-box">
      <div class="detail-row">
        <span class="detail-label">Salon</span>
        <span class="detail-value" style="color:#818cf8; font-weight:700;">${displaySalon} ${branchName ? `(${branchName})` : ''}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Service</span>
        <span class="detail-value" style="color:#ffffff; font-weight:700;">${displayService}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Specialist</span>
        <span class="detail-value">${staffName || 'Any Available Staff'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Price</span>
        <span class="detail-value" style="color:#34d399;">₹${price || '0'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Booking ID</span>
        <span class="detail-value">#${bookingId}</span>
      </div>
    </div>

    <p style="color: #94a3b8; font-size: 13px; line-height: 1.5;">
      Your request is currently awaiting salon confirmation. You will receive a notification as soon as the salon accepts your appointment.
    </p>
  `)

  await dispatchEmail({
    from: EMAIL_FROM,
    to,
    subject,
    text: `Thank you for your booking! Your appointment at ${displaySalon} for ${displayService} on ${date} ${time ? `at ${time}` : ''} is received. Booking ID: ${bookingId}`,
    html
  })
}

/**
 * Send Appointment Status Email (Accepted, Completed Thank You, Cancelled)
 */
const sendAppointmentStatusEmail = async ({ to, customerName, status, salonName, serviceName, date, time, bookingId, cancellationReason }) => {
  if (!to) return

  const displaySalon = salonName || 'Salon'
  const displayService = serviceName || 'Service'

  let badgeClass = 'badge-confirmed'
  let subject = `Appointment Status Update: ${status} — ${displaySalon}`
  let heading = `Hello ${customerName || 'Valued Client'},`
  let subtext = `Your appointment status has been updated to <strong style="color:#ffffff;">${status}</strong>.`

  if (status === 'CONFIRMED') {
    badgeClass = 'badge-confirmed'
    subject = `Appointment Accepted! 🎉 — ${displaySalon}`
    heading = `Great news, ${customerName || 'Valued Client'}!`
    subtext = `Your appointment for <strong style="color:#818cf8;">${displayService}</strong> has been <strong style="color:#34d399;">ACCEPTED</strong> by <strong style="color:#ffffff;">${displaySalon}</strong>. We look forward to hosting you!`
  } else if (status === 'COMPLETED') {
    badgeClass = 'badge-completed'
    subject = `Thank You for Visiting ${displaySalon}! 🌟`
    heading = `Thank You for Visiting Us, ${customerName || 'Valued Client'}!`
    subtext = `We hope you enjoyed your <strong style="color:#818cf8;">${displayService}</strong> service at <strong style="color:#ffffff;">${displaySalon}</strong>! Thank you for choosing us today.`
  } else if (status === 'CANCELLED') {
    badgeClass = 'badge-cancelled'
    subject = `Appointment Cancelled — ${displaySalon}`
    heading = `Appointment Cancelled`
    subtext = `Your appointment for <strong style="color:#f87171;">${displayService}</strong> at ${displaySalon} was cancelled.`
  }

  const html = wrapTemplate(`Appointment ${status}`, `
    <div class="badge ${badgeClass}">${status === 'CONFIRMED' ? '✓ ACCEPTED & CONFIRMED' : status === 'COMPLETED' ? '✨ SERVICE COMPLETED' : status}</div>
    <h2 style="margin-top:0; color:#ffffff;">${heading}</h2>
    <p style="color:#cbd5e1; font-size:14.5px; line-height:1.6;">${subtext}</p>

    <!-- Prominently Highlighted Date & Time Banner -->
    <div style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); border: 1px solid #6366f1; border-radius: 16px; padding: 20px; text-align: center; margin: 24px 0; box-shadow: 0 10px 25px rgba(99, 102, 241, 0.2);">
      <p style="color: #a5b4fc; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; margin: 0 0 6px 0;">🗓 APPOINTMENT DATE &amp; TIME</p>
      <p style="color: #ffffff; font-size: 22px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">${date}${time ? ` &nbsp;•&nbsp; ${time}` : ''}</p>
    </div>
    
    <div class="details-box">
      <div class="detail-row">
        <span class="detail-label">Salon</span>
        <span class="detail-value" style="color:#818cf8; font-weight:700;">${displaySalon}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Service</span>
        <span class="detail-value" style="color:#ffffff; font-weight:700;">${displayService}</span>
      </div>
      ${cancellationReason ? `
      <div class="detail-row">
        <span class="detail-label">Reason</span>
        <span class="detail-value" style="color:#f87171;">${cancellationReason}</span>
      </div>` : ''}
    </div>

    ${status === 'COMPLETED' ? `
      <div style="background: rgba(129, 140, 248, 0.1); border: 1px solid rgba(129, 140, 248, 0.3); border-radius: 12px; padding: 16px; text-align: center; margin-top: 20px;">
        <p style="color: #818cf8; font-weight: 600; margin: 0 0 6px 0; font-size: 14px;">How was your experience?</p>
        <p style="color: #94a3b8; font-size: 12.5px; margin: 0;">Open your mobile app to rate your appointment and leave a review!</p>
      </div>
    ` : ''}
  `)

  await dispatchEmail({
    from: EMAIL_FROM,
    to,
    subject,
    text: `${heading} ${subtext} Date: ${date} ${time ? `at ${time}` : ''}.`,
    html
  })
}

/**
 * Send Reschedule Confirmation Email
 */
const sendRescheduleConfirmationEmail = async ({ to, customerName, salonName, serviceName, oldDate, oldTime, newDate, newTime, bookingId }) => {
  if (!to) return

  const subject = `Appointment Rescheduled - ${salonName}`
  const html = wrapTemplate('Appointment Rescheduled', `
    <div class="badge badge-rescheduled">🗓 RESCHEDULED</div>
    <h2 style="margin-top:0; color:#ffffff;">Hello ${customerName || 'Valued Client'},</h2>
    <p style="color:#cbd5e1; font-size:14px;">Your appointment at <strong>${salonName}</strong> has been successfully rescheduled.</p>
    
    <div class="details-box">
      <div class="detail-row">
        <span class="detail-label">Service</span>
        <span class="detail-value">${serviceName}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Previous Slot</span>
        <span class="detail-value" style="text-decoration: line-through; color: #64748b;">${oldDate} at ${oldTime}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">New Slot</span>
        <span class="detail-value" style="color: #818cf8; font-weight: bold;">${newDate} at ${newTime}</span>
      </div>
    </div>
  `)

  await dispatchEmail({
    from: EMAIL_FROM,
    to,
    subject,
    text: `Your appointment at ${salonName} has been rescheduled to ${newDate} at ${newTime}.`,
    html
  })
}

/**
 * Send Owner Registration Received Email (Thanks & Pending Approval)
 */
const sendOwnerRegistrationReceivedEmail = async ({ to, ownerName, salonName }) => {
  if (!to) return

  const subject = `Registration Received — ${salonName}`
  const html = wrapTemplate('Registration Received', `
    <div class="badge badge-rescheduled">⏳ PENDING APPROVAL</div>
    <h2 style="margin-top:0; color:#ffffff;">Hello ${ownerName || 'Salon Owner'},</h2>
    <p style="color:#cbd5e1; font-size:14px; line-height:1.6;">Thank you for registering your salon <strong>"${salonName}"</strong> on Luxe Salon SaaS Platform!</p>
    
    <div class="details-box">
      <div class="detail-row">
        <span class="detail-label">Salon Name</span>
        <span class="detail-value">${salonName}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Owner Name</span>
        <span class="detail-value">${ownerName}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Status</span>
        <span class="detail-value" style="color: #fbbf24; font-weight: bold;">PENDING ADMIN REVIEW</span>
      </div>
    </div>

    <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
      Our platform superadmin team has received your request and is currently reviewing your registration. Once approved, you will be able to log in to your Salon Panel using your registered email and password.
    </p>

    <p style="color: #64748b; font-size: 13px; margin-top: 20px;">
      Account activations are typically processed within 24 hours. Thank you for your patience!
    </p>
  `)

  await dispatchEmail({
    from: EMAIL_FROM,
    to,
    subject,
    text: `Hello ${ownerName}, thank you for registering your salon "${salonName}". Your registration request has been received and is currently awaiting admin approval. Activations are typically completed within 24 hours.`,
    html
  })
}

/**
 * Send Owner Registration Approved Email
 */
const sendOwnerRegistrationApprovedEmail = async ({ to, ownerName, salonName }) => {
  if (!to) return

  const subject = `Account Approved! Welcome to Luxe Salon — ${salonName}`
  const html = wrapTemplate('Account Approved', `
    <div class="badge badge-confirmed">✓ APPROVED & ACTIVATED</div>
    <h2 style="margin-top:0; color:#ffffff;">Congratulations, ${ownerName}!</h2>
    <p style="color:#cbd5e1; font-size:14px; line-height:1.6;">Great news! Your registration request for <strong>"${salonName}"</strong> has been approved by our superadmin team.</p>
    
    <div class="details-box">
      <div class="detail-row">
        <span class="detail-label">Salon Name</span>
        <span class="detail-value">${salonName}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Login Email</span>
        <span class="detail-value">${to}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Account Status</span>
        <span class="detail-value" style="color: #34d399; font-weight: bold;">ACTIVE</span>
      </div>
    </div>

    <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
      You can now log in to the Salon Panel using your email and the password you created during registration to set up your branches, staff, and services.
    </p>
  `)

  await dispatchEmail({
    from: EMAIL_FROM,
    to,
    subject,
    text: `Congratulations ${ownerName}! Your salon "${salonName}" registration has been approved. You can now log in to your Salon Panel.`,
    html
  })
}

/**
 * Send Owner Registration Rejected Email
 */
const sendOwnerRegistrationRejectedEmail = async ({ to, ownerName, salonName, note }) => {
  if (!to) return

  const subject = `Registration Request Update — ${salonName}`
  const html = wrapTemplate('Registration Update', `
    <div class="badge badge-cancelled">❌ REQUEST NOT APPROVED</div>
    <h2 style="margin-top:0; color:#ffffff;">Hello ${ownerName || 'Salon Owner'},</h2>
    <p style="color:#cbd5e1; font-size:14px;">We reviewed your registration request for <strong>"${salonName}"</strong>.</p>
    
    <div class="details-box">
      <div class="detail-row">
        <span class="detail-label">Salon Name</span>
        <span class="detail-value">${salonName}</span>
      </div>
      ${note ? `
      <div class="detail-row">
        <span class="detail-label">Admin Note</span>
        <span class="detail-value" style="color: #f87171;">${note}</span>
      </div>` : ''}
    </div>

    <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
      If you have any questions or feel this was a mistake, please reach out to our platform support team.
    </p>
  `)

  await dispatchEmail({
    from: EMAIL_FROM,
    to,
    subject,
    text: `Hello ${ownerName}, your registration request for "${salonName}" was not approved.${note ? ` Reason: ${note}` : ''}`,
    html
  })
}

/**
 * Send Password Reset OTP Email (6-Digit OTP)
 */
const sendPasswordResetOtpEmail = async ({ to, userName, otp }) => {
  if (!to) return;

  const subject = `Your Password Reset OTP Code: ${otp}`;
  const html = wrapTemplate("Password Reset Verification", `
    <div class="badge badge-rescheduled">🔒 SECURITY VERIFICATION</div>
    <h2 style="margin-top:0; color:#ffffff;">Password Reset Request</h2>
    <p style="color:#cbd5e1; font-size:14.5px; line-height:1.6;">
      Hello ${userName || "User"}, we received a request to reset your password. Use the verification code below:
    </p>

    <!-- Prominently Highlighted OTP Banner -->
    <div style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); border: 1px solid #6366f1; border-radius: 16px; padding: 24px; text-align: center; margin: 24px 0; box-shadow: 0 10px 25px rgba(99, 102, 241, 0.2);">
      <p style="color: #a5b4fc; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 8px 0;">YOUR 6-DIGIT VERIFICATION CODE</p>
      <p style="color: #ffffff; font-size: 36px; font-weight: 800; margin: 0; letter-spacing: 8px; font-family: monospace;">${otp}</p>
    </div>

    <p style="color: #94a3b8; font-size: 13px; line-height: 1.5;">
      This code is valid for <strong>15 minutes</strong>. If you did not request a password reset, you can safely ignore this email.
    </p>
  `);

  await dispatchEmail({
    from: EMAIL_FROM,
    to,
    subject,
    text: `Your password reset OTP code is ${otp}. It is valid for 15 minutes.`,
    html,
  });
};

/**
 * Send Email Verification Link (Account Activation)
 */
const sendEmailVerificationLink = async ({ to, userName, token }) => {
  if (!to || !token) return;

  const baseUrl = process.env.APP_BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
  const verifyUrl = `${baseUrl}/api/auth/verify-email-landing?token=${token}`;

  const subject = "Confirm your ST CUT email address";
  const html = wrapTemplate("Confirm Your Email", `
    <div class="badge badge-rescheduled">✉️ EMAIL VERIFICATION</div>
    <h2 style="margin-top:0; color:#ffffff;">Confirm Your Account, ${userName || "Valued Member"}!</h2>
    <p style="color:#cbd5e1; font-size:14.5px; line-height:1.6;">
      Thank you for creating an account with <strong>ST CUT</strong>. Tap the button below to confirm your email address and activate your account:
    </p>

    <!-- Prominently Highlighted Verification Link Button -->
    <div style="text-align: center; margin: 32px 0;">
      <a href="${verifyUrl}" style="background: linear-gradient(135deg, #d49b45 0%, #c48b36 100%); color: #ffffff; display: inline-block; padding: 14px 32px; border-radius: 12px; font-weight: 700; font-size: 15px; text-decoration: none; box-shadow: 0 10px 20px rgba(196, 139, 54, 0.3);">
        Confirm My Email Address
      </a>
    </div>

    <p style="color: #94a3b8; font-size: 13px; line-height: 1.5; text-align: center;">
      Link not working? Copy and paste this URL into your web browser:<br/>
      <a href="${verifyUrl}" style="color: #d49b45; word-break: break-all;">${verifyUrl}</a>
    </p>

    <p style="color: #64748b; font-size: 12.5px; line-height: 1.5; margin-top: 24px;">
      This link expires in <strong>1 hour</strong>. If you did not create an account with ST CUT, you can safely ignore this email.
    </p>
  `);

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`✉️ [EMAIL VERIFICATION DISPATCH] To: ${to}`);
  console.log(`🔗 [VERIFICATION LINK]: ${verifyUrl}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  await dispatchEmail({
    from: EMAIL_FROM,
    to,
    subject,
    text: `Confirm your ST CUT email address: ${verifyUrl}`,
    html,
  });
};

module.exports = {
  sendBookingConfirmationEmail,
  sendAppointmentStatusEmail,
  sendRescheduleConfirmationEmail,
  sendOwnerRegistrationReceivedEmail,
  sendOwnerRegistrationApprovedEmail,
  sendOwnerRegistrationRejectedEmail,
  sendPasswordResetOtpEmail,
  sendEmailVerificationLink,
  emailQueue,
  emailWorker,
};
