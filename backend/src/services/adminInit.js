const User = require('../models/User');

/**
 * Initialize default admin user on first startup
 * Creates an admin user if no users exist in the database
 */
const initializeAdmin = async () => {
  try {
    console.log('🔍 Checking for existing users...');
    
    // Check if any users exist
    const userCount = await User.countDocuments();
    console.log(`📊 Found ${userCount} existing users`);
    
    if (userCount === 0) {
      console.log('🚀 No users found - creating default admin user...');
      
      // Create default admin user
      const adminUser = new User({
        username: 'ADMIN',
        email: 'admin@esigned.local',
        password: '1qaz@WSX',
        isActivated: true, // Admin is pre-activated
        activationCode: undefined,
        activationCodeExpires: undefined
      });
      
      await adminUser.save();
      
      console.log('✅ Default admin user created successfully!');
      console.log('👤 Admin Credentials:');
      console.log('   Username: ADMIN');
      console.log('   Password: 1qaz@WSX');
      console.log('   Email: admin@esigned.local');
      console.log('   Status: Activated');
      console.log('');
      console.log('⚠️  IMPORTANT: Change the admin password after first login!');
      console.log('');
      
      return {
        success: true,
        message: 'Default admin user created',
        user: {
          username: adminUser.username,
          email: adminUser.email,
          isActivated: adminUser.isActivated
        }
      };
    } else {
      console.log('👥 Users already exist - skipping admin creation');
      return {
        success: true,
        message: 'Users already exist, admin creation skipped'
      };
    }
  } catch (error) {
    console.error('❌ Error initializing admin user:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Check if admin user exists
 */
const checkAdminExists = async () => {
  try {
    const adminUser = await User.findOne({ username: 'ADMIN' });
    return {
      exists: !!adminUser,
      user: adminUser ? {
        username: adminUser.username,
        email: adminUser.email,
        isActivated: adminUser.isActivated
      } : null
    };
  } catch (error) {
    console.error('❌ Error checking admin user:', error);
    return {
      exists: false,
      error: error.message
    };
  }
};

/**
 * Update admin password (for security)
 */
const updateAdminPassword = async (newPassword) => {
  try {
    const adminUser = await User.findOne({ username: 'ADMIN' });
    
    if (!adminUser) {
      return {
        success: false,
        error: 'Admin user not found'
      };
    }
    
    adminUser.password = newPassword;
    await adminUser.save();
    
    console.log('✅ Admin password updated successfully');
    return {
      success: true,
      message: 'Admin password updated'
    };
  } catch (error) {
    console.error('❌ Error updating admin password:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  initializeAdmin,
  checkAdminExists,
  updateAdminPassword
};
