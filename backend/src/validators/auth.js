const { z, email, phone, password, otp } = require('./common');

module.exports = {
  register: z.object({ name: z.string().trim().min(2, 'Enter your name').max(80), email, phone, password }),
  login: z.object({ email, password: z.string().min(1, 'Enter your password').max(72) }),
  verifyEmail: z.object({ email, otp }),
  resendOtp: z.object({ email, purpose: z.enum(['verify_email', 'reset_password']) }),
  forgotPassword: z.object({ email }),
  resetPassword: z.object({ email, otp, password }),
  changePassword: z.object({ currentPassword: z.string().min(1).max(72), newPassword: password }),
  updateProfile: z.object({ name: z.string().trim().min(2).max(80).optional(), phone: phone.optional() }),
  adminLogin: z.object({ email, password: z.string().min(1).max(72) }),
};
