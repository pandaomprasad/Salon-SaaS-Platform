const nodemailer = require('nodemailer')

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
      auth: { user, pass }
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
const EMAIL_FROM = process.env.EMAIL_FROM || '"Salon Platform" <no-reply@salonplatform.com>'

// Shared HTML Template Base
const wrapTemplate = (title, content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f3f0ee; margin: 0; padding: 20px; color: #141413; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
    .header { background: #141413; color: #ffffff; padding: 30px 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 600; letter-spacing: -0.5px; }
    .content { padding: 32px 24px; }
    .badge { display: inline-block; padding: 6px 16px; border-radius: 20px; font-weight: 600; font-size: 13px; margin-bottom: 16px; }
    .badge-confirmed { background: #e6f4ea; color: #137333; }
    .badge-cancelled { background: #fce8e6; color: #c5221f; }
    .badge-rescheduled { background: #e8f0fe; color: #1a73e8; }
    .badge-completed { background: #f3e8fd; color: #8430ce; }
    .details-box { background: #fcfbfa; border: 1px solid #f0ece9; border-radius: 12px; padding: 20px; margin: 20px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #e8e4e1; font-size: 14px; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: #696969; font-weight: 500; }
    .detail-value { font-weight: 600; color: #141413; }
    .footer { background: #faf9f8; text-align: center; padding: 20px; font-size: 12px; color: #888888; border-top: 1px solid #f0ece9; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💅 Salon SaaS Platform</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>Thank you for choosing our salon services.</p>
      <p>© ${new Date().getFullYear()} Salon Platform. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`

/**
 * Send Booking Confirmation Email
 */
const sendBookingConfirmationEmail = async ({ to, customerName, salonName, branchName, serviceName, staffName, date, time, price, bookingId }) => {
  if (!to) return

  const subject = `Booking Confirmation - ${salonName} (#${String(bookingId).slice(-6)})`
  const html = wrapTemplate('Booking Confirmed', `
    <div class="badge badge-confirmed">✓ BOOKING RECEIVED</div>
    <h2 style="margin-top:0;">Hello ${customerName || 'Valued Client'},</h2>
    <p>Your appointment has been successfully scheduled! Here are your booking details:</p>
    
    <div class="details-box">
      <div class="detail-row">
        <span class="detail-label">Salon</span>
        <span class="detail-value">${salonName} (${branchName})</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Service</span>
        <span class="detail-value">${serviceName}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Specialist</span>
        <span class="detail-value">${staffName || 'Any Available Staff'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Date & Time</span>
        <span class="detail-value">${date} at ${time}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Price</span>
        <span class="detail-value">$${price}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Booking ID</span>
        <span class="detail-value">#${bookingId}</span>
      </div>
    </div>

    <p style="color: #696969; font-size: 13px;">Please arrive 5-10 minutes prior to your slot time. You can manage or cancel your booking anytime from your mobile app.</p>
  `)

  try {
    await transporter.sendMail({
      from: EMAIL_FROM,
      to,
      subject,
      text: `Your appointment at ${salonName} for ${serviceName} on ${date} at ${time} is confirmed. Booking ID: ${bookingId}`,
      html
    })
  } catch (err) {
    console.error('❌ [EMAIL SERVICE ERROR]', err.message)
  }
}

/**
 * Send Appointment Status Change Email (CONFIRMED, COMPLETED, CANCELLED)
 */
const sendAppointmentStatusEmail = async ({ to, customerName, status, salonName, serviceName, date, time, bookingId, cancellationReason }) => {
  if (!to) return

  let badgeClass = 'badge-confirmed'
  if (status === 'CANCELLED') badgeClass = 'badge-cancelled'
  if (status === 'COMPLETED') badgeClass = 'badge-completed'

  const subject = `Appointment Status Update: ${status} - ${salonName}`
  const html = wrapTemplate(`Appointment ${status}`, `
    <div class="badge ${badgeClass}">${status}</div>
    <h2 style="margin-top:0;">Hello ${customerName || 'Valued Client'},</h2>
    <p>Your appointment status has been updated to <strong>${status}</strong>.</p>
    
    <div class="details-box">
      <div class="detail-row">
        <span class="detail-label">Salon</span>
        <span class="detail-value">${salonName}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Service</span>
        <span class="detail-value">${serviceName}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Date & Time</span>
        <span class="detail-value">${date} at ${time}</span>
      </div>
      ${cancellationReason ? `
      <div class="detail-row">
        <span class="detail-label">Cancellation Reason</span>
        <span class="detail-value" style="color:#c5221f;">${cancellationReason}</span>
      </div>` : ''}
    </div>

    ${status === 'COMPLETED' ? '<p style="color: #137333; font-weight: 500;">Thank you for visiting! Don\'t forget to leave a rating in your app.</p>' : ''}
  `)

  try {
    await transporter.sendMail({
      from: EMAIL_FROM,
      to,
      subject,
      text: `Your appointment at ${salonName} status is now ${status}. Date: ${date} at ${time}.`,
      html
    })
  } catch (err) {
    console.error('❌ [EMAIL SERVICE ERROR]', err.message)
  }
}

/**
 * Send Reschedule Confirmation Email
 */
const sendRescheduleConfirmationEmail = async ({ to, customerName, salonName, serviceName, oldDate, oldTime, newDate, newTime, bookingId }) => {
  if (!to) return

  const subject = `Appointment Rescheduled - ${salonName}`
  const html = wrapTemplate('Appointment Rescheduled', `
    <div class="badge badge-rescheduled">🗓 RESCHEDULED</div>
    <h2 style="margin-top:0;">Hello ${customerName || 'Valued Client'},</h2>
    <p>Your appointment at <strong>${salonName}</strong> has been successfully rescheduled.</p>
    
    <div class="details-box">
      <div class="detail-row">
        <span class="detail-label">Service</span>
        <span class="detail-value">${serviceName}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Previous Slot</span>
        <span class="detail-value" style="text-decoration: line-through; color: #888;">${oldDate} at ${oldTime}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">New Slot</span>
        <span class="detail-value" style="color: #1a73e8; font-weight: bold;">${newDate} at ${newTime}</span>
      </div>
    </div>
  `)

  try {
    await transporter.sendMail({
      from: EMAIL_FROM,
      to,
      subject,
      text: `Your appointment at ${salonName} has been rescheduled to ${newDate} at ${newTime}.`,
      html
    })
  } catch (err) {
    console.error('❌ [EMAIL SERVICE ERROR]', err.message)
  }
}

module.exports = {
  sendBookingConfirmationEmail,
  sendAppointmentStatusEmail,
  sendRescheduleConfirmationEmail
}
