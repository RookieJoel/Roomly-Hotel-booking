const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // Create transporter (note: it's createTransport, not createTransporter)
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD
    }
  });

  // Message options
  const message = {
    from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
    to: options.email,
    subject: options.subject,
    html: options.html
  };

  // Send email
  const info = await transporter.sendMail(message);

  console.log('✅ Email sent successfully!');
  console.log('Message ID: %s', info.messageId);
};

module.exports = sendEmail;
