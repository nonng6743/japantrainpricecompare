// User API Usage Examples
// Run these examples using tools like Postman, Insomnia, or curl

// 1. Register a new user
const registerUser = {
  method: 'POST',
  url: 'http://localhost:4000/api/users/register',
  headers: {
    'Content-Type': 'application/json'
  },
  body: {
    username: 'johndoe',
    email: 'john@example.com',
    password: 'password123',
    firstName: 'John',
    lastName: 'Doe'
  }
};

// 2. Login user
const loginUser = {
  method: 'POST',
  url: 'http://localhost:4000/api/users/login',
  headers: {
    'Content-Type': 'application/json'
  },
  body: {
    email: 'john@example.com',
    password: 'password123'
  }
};

// 3. Get user profile (requires authentication)
const getProfile = {
  method: 'GET',
  url: 'http://localhost:4000/api/users/profile',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE'
  }
};

// 4. Update user profile
const updateProfile = {
  method: 'PUT',
  url: 'http://localhost:4000/api/users/profile',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE'
  },
  body: {
    firstName: 'John Updated',
    lastName: 'Doe Updated',
    email: 'john.updated@example.com'
  }
};

// 5. Change password
const changePassword = {
  method: 'PUT',
  url: 'http://localhost:4000/api/users/change-password',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE'
  },
  body: {
    currentPassword: 'password123',
    newPassword: 'newpassword123'
  }
};

// 6. Get all users (Admin only)
const getAllUsers = {
  method: 'GET',
  url: 'http://localhost:4000/api/users?page=1&limit=10',
  headers: {
    'Authorization': 'Bearer ADMIN_JWT_TOKEN_HERE'
  }
};

// 7. Get user by ID (Admin only)
const getUserById = {
  method: 'GET',
  url: 'http://localhost:4000/api/users/USER_ID_HERE',
  headers: {
    'Authorization': 'Bearer ADMIN_JWT_TOKEN_HERE'
  }
};

// 8. Update user (Admin only)
const updateUser = {
  method: 'PUT',
  url: 'http://localhost:4000/api/users/USER_ID_HERE',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ADMIN_JWT_TOKEN_HERE'
  },
  body: {
    firstName: 'Updated Name',
    lastName: 'Updated Last',
    email: 'updated@example.com',
    role: 'admin',
    isActive: true
  }
};

// 9. Delete user (Admin only)
const deleteUser = {
  method: 'DELETE',
  url: 'http://localhost:4000/api/users/USER_ID_HERE',
  headers: {
    'Authorization': 'Bearer ADMIN_JWT_TOKEN_HERE'
  }
};

// 10. Deactivate user (Admin only)
const deactivateUser = {
  method: 'PUT',
  url: 'http://localhost:4000/api/users/USER_ID_HERE/deactivate',
  headers: {
    'Authorization': 'Bearer ADMIN_JWT_TOKEN_HERE'
  }
};

// 11. Reactivate user (Admin only)
const reactivateUser = {
  method: 'PUT',
  url: 'http://localhost:4000/api/users/USER_ID_HERE/reactivate',
  headers: {
    'Authorization': 'Bearer ADMIN_JWT_TOKEN_HERE'
  }
};

export {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  changePassword,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  deactivateUser,
  reactivateUser
};
