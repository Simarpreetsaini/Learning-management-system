const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

const sendDownloadLinkEmail = async ({ to, noteTitle, downloadLink }) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: to,
      subject: `Download Link for ${noteTitle}`,
      html: `
        <h2>Your Purchase is Complete!</h2>
        <p>Thank you for purchasing: <strong>${noteTitle}</strong></p>
        <p>Click the link below to download your file:</p>
        <a href="${downloadLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Download Now</a>
        <p>This link will expire in 24 hours.</p>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Download email sent successfully');
  } catch (error) {
    console.error('Email sending error:', error);
    throw new Error('Failed to send email');
  }
};

module.exports = {
  sendDownloadLinkEmail
};
