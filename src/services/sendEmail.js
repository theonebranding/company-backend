import Nodemailer from 'nodemailer';

const sendEmail = async (email, subject, htmlContent) => {
  try {
    const transporter = Nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: true, // Secure for port 465, false for others
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false, // Allow self-signed certificates
      },
      debug: true, // Show debug logs in console
       connectionTimeout: 30000, // Extend timeout to 30 seconds
       socketTimeout: 30000, // Add socket timeout
    });
        transporter.on('log', (info) => {
        console.log(info.message);
      });

    const mailOptions = {
      from: `"The One Branding" <no-reply@theonebranding.com>`, // Better email formatting
      to: email,
      subject: subject,
      html: htmlContent
      // text: `Hi ${name},\n\nYour OTP is: ${otp}\n\nThis OTP will expire in 15 minutes.\n\nThe One Branding Team`, // Plain text content
    };

    const info = await transporter.sendMail(mailOptions);
    // console.log('Email sent:', info.response);
  } catch (error) {
    // console.error('Error sending email:', error);
    throw new Error('Email could not be sent');
  }
};

export default sendEmail;
