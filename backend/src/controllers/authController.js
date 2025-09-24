const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { generateActivationCode, sendActivationEmail } = require('../services/emailService');
const { updateAdminPassword } = require('../services/adminInit');

exports.register = async (req, res) => {
  const { username, email, password } = req.body;
  
  try {
    // Validate required fields
    if (!username || !email || !password) {
      return res.status(400).json({ msg: 'Username, email, and password are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ username }, { email }] 
    });
    
    if (existingUser) {
      if (existingUser.username === username) {
        return res.status(400).json({ msg: 'Username already exists' });
      }
      if (existingUser.email === email) {
        return res.status(400).json({ msg: 'Email already exists' });
      }
    }

    // Generate activation code
    const activationCode = generateActivationCode();
    const activationCodeExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user with activation code
    const user = new User({ 
      username, 
      email, 
      password, 
      activationCode,
      activationCodeExpires,
      isActivated: false
    });
    
    await user.save();

    // Send activation email
    const emailResult = await sendActivationEmail(email, username, activationCode);
    
    if (!emailResult.success) {
      console.error('Failed to send activation email:', emailResult.error);
      // Don't fail registration if email fails, but log the error
    }

    res.status(201).json({ 
      msg: 'User registered successfully. Please check your email for activation code.',
      emailSent: emailResult.success,
      requiresActivation: true
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(400).json({ msg: err.message });
  }
};

exports.login = async (req, res) => {
  const { username, password } = req.body;
  try {
    console.log('Login attempt for user:', username);
    const user = await User.findOne({ username });
    console.log('User found:', !!user);
    
    if (!user || !(await user.comparePassword(password))) {
      console.log('Invalid credentials for user:', username);
      return res.status(401).json({ msg: 'Invalid credentials' });
    }

    // Check if user account is activated
    if (!user.isActivated) {
      console.log('User account not activated:', username);
      return res.status(401).json({ 
        msg: 'Account not activated. Please check your email for activation code.',
        requiresActivation: true,
        email: user.email
      });
    }
    
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    console.log('Token generated for user:', username, 'ID:', user._id);
    res.json({ token, user: { id: user._id, username: user.username, email: user.email } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ msg: err.message });
  }
};

exports.activateAccount = async (req, res) => {
  const { email, activationCode } = req.body;
  
  try {
    // Validate input
    if (!email || !activationCode) {
      return res.status(400).json({ msg: 'Email and activation code are required' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Check if already activated
    if (user.isActivated) {
      return res.status(400).json({ msg: 'Account is already activated' });
    }

    // Check activation code
    if (!user.activationCode || user.activationCode !== activationCode) {
      return res.status(400).json({ msg: 'Invalid activation code' });
    }

    // Check if code is expired
    if (user.activationCodeExpires && new Date() > user.activationCodeExpires) {
      return res.status(400).json({ msg: 'Activation code has expired. Please request a new one.' });
    }

    // Activate account
    user.isActivated = true;
    user.activationCode = undefined;
    user.activationCodeExpires = undefined;
    await user.save();

    console.log('Account activated successfully for user:', user.username);
    res.json({ msg: 'Account activated successfully! You can now login.' });
  } catch (err) {
    console.error('Activation error:', err);
    res.status(500).json({ msg: err.message });
  }
};

exports.resendActivationCode = async (req, res) => {
  const { email } = req.body;
  
  try {
    // Validate input
    if (!email) {
      return res.status(400).json({ msg: 'Email is required' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Check if already activated
    if (user.isActivated) {
      return res.status(400).json({ msg: 'Account is already activated' });
    }

    // Generate new activation code
    const activationCode = generateActivationCode();
    const activationCodeExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user with new activation code
    user.activationCode = activationCode;
    user.activationCodeExpires = activationCodeExpires;
    await user.save();

    // Send activation email
    const emailResult = await sendActivationEmail(email, user.username, activationCode);
    
    if (!emailResult.success) {
      console.error('Failed to resend activation email:', emailResult.error);
      return res.status(500).json({ msg: 'Failed to send activation email' });
    }

    console.log('Activation code resent for user:', user.username);
    res.json({ msg: 'Activation code sent successfully. Please check your email.' });
  } catch (err) {
    console.error('Resend activation error:', err);
    res.status(500).json({ msg: err.message });
  }
};

exports.updateAdminPassword = async (req, res) => {
  const { newPassword } = req.body;
  
  try {
    // Validate input
    if (!newPassword) {
      return res.status(400).json({ msg: 'New password is required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ msg: 'Password must be at least 6 characters' });
    }

    // Update admin password
    const result = await updateAdminPassword(newPassword);
    
    if (result.success) {
      res.json({ msg: 'Admin password updated successfully' });
    } else {
      res.status(400).json({ msg: result.error });
    }
  } catch (err) {
    console.error('Update admin password error:', err);
    res.status(500).json({ msg: err.message });
  }
};
