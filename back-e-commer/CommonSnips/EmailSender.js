const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,  // Use environment variables
    pass: process.env.GMAIL_PASS,  // Use environment variables
  }
});

// Function to send email
const sendEmail = async (to, subject, text) => {
    const mailOptions = {
      from: 'baghela.mayank@gmail.com',
      to: to,
      subject: subject,
      text: text,
    };
  
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent:', info.response);
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send reset email');  // Rethrow error for proper handling
    }
  };
  

// Export the sendEmail function
module.exports = { sendEmail };  // Export the function

