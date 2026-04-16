import nodemailer from 'nodemailer'

export type EmailDataType = {
  email: string
  subject: string
  html: string
  attachments?: any[]
}
export interface CustomRequest extends Request {
  userId?: string
}

export const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USERNAME,
    pass: process.env.SMTP_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false
}
})
export const emailSender = async (emailData: EmailDataType) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_USERNAME,
      to: emailData.email,
      subject: emailData.subject,
      html: emailData.html,
      attachments: emailData.attachments || [],
    }
    const info = await transporter.sendMail(mailOptions)
    console.log('Message sent: %s', info.response)
  } catch (error) {
    console.error('Error encountered while sening email', error)
    throw error
  }
}