import { authService } from '../services/authService.js';
import User from '../models/User.js';

export const userController = {
  // POST /api/users/register - Register new user
  async register(req, res) {
    try {
      const { username, email, password, firstName, lastName } = req.body;

      // Validate required fields
      if (!username || !email || !password || !firstName || !lastName) {
        return res.status(400).json({
          success: false,
          error: 'All fields are required'
        });
      }

      const result = await authService.register({
        username,
        email,
        password,
        firstName,
        lastName
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  },

  // POST /api/users/login - Login user
  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          error: 'Email and password are required'
        });
      }

      const result = await authService.login({ email, password });

      res.json({
        success: true,
        message: 'Login successful',
        data: result
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        error: error.message
      });
    }
  },

  // GET /api/users/profile - Get current user profile
  async getProfile(req, res) {
    try {
      res.json({
        success: true,
        data: req.user
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // PUT /api/users/profile - Update user profile
  async updateProfile(req, res) {
    try {
      const { firstName, lastName, email } = req.body;
      
      const updatedUser = await authService.updateProfile(req.user._id, {
        firstName,
        lastName,
        email
      });

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedUser
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  },

  // PUT /api/users/change-password - Change password
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          error: 'Current password and new password are required'
        });
      }

      await authService.changePassword(req.user._id, currentPassword, newPassword);

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  },

  // GET /api/users - Get all users (Admin only)
  async getAllUsers(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;

      const users = await User.find()
        .select('-password')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

      const total = await User.countDocuments();

      res.json({
        success: true,
        data: {
          users,
          pagination: {
            current: page,
            pages: Math.ceil(total / limit),
            total
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // GET /api/users/:id - Get user by ID (Admin only)
  async getUserById(req, res) {
    try {
      const user = await User.findById(req.params.id).select('-password');
      
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // PUT /api/users/:id - Update user by ID (Admin only)
  async updateUser(req, res) {
    try {
      const { firstName, lastName, email, role, isActive } = req.body;
      
      const updateData = {};
      if (firstName) updateData.firstName = firstName;
      if (lastName) updateData.lastName = lastName;
      if (email) updateData.email = email;
      if (role) updateData.role = role;
      if (typeof isActive === 'boolean') updateData.isActive = isActive;

      const user = await User.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      ).select('-password');

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      res.json({
        success: true,
        message: 'User updated successfully',
        data: user
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  },

  // DELETE /api/users/:id - Delete user (Admin only)
  async deleteUser(req, res) {
    try {
      const user = await User.findByIdAndDelete(req.params.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found'
        });
      }

      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  },

  // PUT /api/users/:id/deactivate - Deactivate user (Admin only)
  async deactivateUser(req, res) {
    try {
      const result = await authService.deactivateUser(req.params.id);

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  },

  // PUT /api/users/:id/reactivate - Reactivate user (Admin only)
  async reactivateUser(req, res) {
    try {
      const result = await authService.reactivateUser(req.params.id);

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
};
