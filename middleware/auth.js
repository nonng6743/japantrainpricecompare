import { authService } from '../services/authService.js';

export const authMiddleware = {
  // Protect routes - require authentication
  async protect(req, res, next) {
    try {
      let token;

      // Get token from header
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
      }

      if (!token) {
        return res.status(401).json({
          success: false,
          error: 'Access denied. No token provided.'
        });
      }

      // Verify token
      const decoded = authService.verifyToken(token);
      
      // Get user from token
      const user = await authService.getUserById(decoded.userId);
      
      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          error: 'Account is deactivated'
        });
      }

      // Add user to request object
      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }
  },

  // Restrict to certain roles
  restrictTo(...roles) {
    return (req, res, next) => {
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: 'You do not have permission to perform this action'
        });
      }
      next();
    };
  }
};
