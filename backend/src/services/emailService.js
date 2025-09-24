const nodemailer = require('nodemailer');

// Create transporter (using Gmail SMTP for development)
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'your-email@gmail.com',
      pass: process.env.EMAIL_PASS || 'your-app-password'
    }
  });
};

// Generate activation code
const generateActivationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
};

// Send activation email
const sendActivationEmail = async (email, username, activationCode) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: email,
      subject: 'Activate Your eSigned Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1976D2, #42A5F5); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">eSigned</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Electronic Document Signing Platform</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Welcome to eSigned!</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Hi <strong>${username}</strong>,
            </p>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Thank you for registering with eSigned! To complete your account setup and start signing documents, 
              please activate your account using the verification code below:
            </p>
            
            <div style="background: white; border: 2px dashed #1976D2; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <p style="margin: 0; color: #666; font-size: 14px;">Your Activation Code</p>
              <h1 style="margin: 10px 0; color: #1976D2; font-size: 32px; letter-spacing: 3px; font-family: monospace;">${activationCode}</h1>
              <p style="margin: 0; color: #999; font-size: 12px;">This code expires in 24 hours</p>
            </div>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Enter this code in the activation form on our website to verify your email address and activate your account.
            </p>
            
            <div style="background: #e3f2fd; border-left: 4px solid #1976D2; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; color: #1976D2; font-size: 14px;">
                <strong>Security Note:</strong> Never share this activation code with anyone. eSigned will never ask for your activation code via email or phone.
              </p>
            </div>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              If you didn't create an account with eSigned, please ignore this email.
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
              This email was sent by eSigned Electronic Document Signing Platform.<br>
              If you have any questions, please contact our support team.
            </p>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Activation email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending activation email:', error);
    return { success: false, error: error.message };
  }
};

// Send password reset email (for future use)
const sendPasswordResetEmail = async (email, username, resetCode) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: email,
      subject: 'Reset Your eSigned Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1976D2, #42A5F5); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">eSigned</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Password Reset Request</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Password Reset Request</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Hi <strong>${username}</strong>,
            </p>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              We received a request to reset your password for your eSigned account. 
              Use the code below to reset your password:
            </p>
            
            <div style="background: white; border: 2px dashed #1976D2; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
              <p style="margin: 0; color: #666; font-size: 14px;">Your Reset Code</p>
              <h1 style="margin: 10px 0; color: #1976D2; font-size: 32px; letter-spacing: 3px; font-family: monospace;">${resetCode}</h1>
              <p style="margin: 0; color: #999; font-size: 12px;">This code expires in 1 hour</p>
            </div>
            
            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; color: #856404; font-size: 14px;">
                <strong>Security Alert:</strong> If you didn't request this password reset, please ignore this email and your password will remain unchanged.
              </p>
            </div>
            
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              If you have any questions, please contact our support team.
            </p>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  generateActivationCode,
  sendActivationEmail,
  sendPasswordResetEmail
};
