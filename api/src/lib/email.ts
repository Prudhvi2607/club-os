import nodemailer from 'nodemailer'

const CLUB_NAME = process.env.CLUB_NAME ?? 'Your Club'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

export async function sendAnnouncementEmail({
  to,
  subject,
  body,
  sentByName,
}: {
  to: string[]
  subject: string
  body: string
  sentByName: string
}) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || to.length === 0) return

  // Gmail BCC batch — send one email, BCC all recipients to avoid exposing addresses
  await transporter.sendMail({
    from: `${CLUB_NAME} <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER, // send to self
    bcc: to,
    subject,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="margin-bottom:4px">${subject}</h2>
        <p style="color:#888;font-size:13px;margin-top:0">Sent by ${sentByName}</p>
        <hr style="border:none;border-top:1px solid #eee;margin:16px 0"/>
        <div style="white-space:pre-wrap;font-size:15px;line-height:1.6">${body}</div>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
        <p style="color:#aaa;font-size:12px">You're receiving this because you're a member of ${CLUB_NAME}.</p>
      </div>
    `,
  })
}
