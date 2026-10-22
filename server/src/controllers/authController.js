const crypto = require('crypto');
const User = require('../models/User');
const Workspace = require('../models/Workspace');
const VerificationCode = require('../models/VerificationCode');
const { sendVerificationCodeEmail } = require('../services/mailService');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  getRefreshCookieOptions,
} = require('../utils/tokens');

// @desc    Step 1: Validate registration info and send 6-digit verification code to email
// @route   POST /api/v1/auth/register-send-code
exports.sendRegistrationCode = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, 'Please provide name, email, and password');
  }

  // Password validation: min 8 chars, at least 1 number
  if (password.length < 8 || !/\d/.test(password)) {
    throw new ApiError(400, 'Password must be at least 8 characters long and contain at least one number');
  }

  const normalizedEmail = email.toLowerCase().trim();
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  // Hash password beforehand so it is ready when OTP is verified
  const passwordHash = await User.hashPassword(password);

  // Generate 6-digit numeric OTP code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const codeHash = crypto.createHash('sha256').update(code).digest('hex');

  // Remove any prior pending registration codes for this email
  await VerificationCode.deleteMany({ email: normalizedEmail, purpose: 'registration' });

  // Store verification code with 10 min TTL
  await VerificationCode.create({
    email: normalizedEmail,
    codeHash,
    purpose: 'registration',
    payload: {
      name: name.trim(),
      passwordHash,
    },
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
  });

  // Send verification email (SMTP or logged to console with nice banner)
  await sendVerificationCodeEmail({
    toEmail: normalizedEmail,
    name: name.trim(),
    code,
    purpose: 'registration',
  });

  res.json({
    success: true,
    message: `Verification code sent to ${normalizedEmail}`,
    data: {
      email: normalizedEmail,
      expiresIn: 600,
    },
  });
});

// @desc    Step 2: Verify 6-digit OTP code, create user & workspace, issue tokens
// @route   POST /api/v1/auth/register-verify-code
exports.verifyRegistrationCode = asyncHandler(async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    throw new ApiError(400, 'Email and 6-digit verification code are required');
  }

  const normalizedEmail = email.toLowerCase().trim();
  const record = await VerificationCode.findOne({
    email: normalizedEmail,
    purpose: 'registration',
  });

  if (!record || record.expiresAt < new Date()) {
    throw new ApiError(400, 'Verification code has expired or is invalid. Please request a new code.');
  }

  if (record.attempts >= 5) {
    await VerificationCode.deleteOne({ _id: record._id });
    throw new ApiError(429, 'Too many failed verification attempts. Please request a new code.');
  }

  const incomingHash = crypto.createHash('sha256').update(code.trim()).digest('hex');
  if (incomingHash !== record.codeHash) {
    record.attempts = (record.attempts || 0) + 1;
    await record.save();
    const remaining = 5 - record.attempts;
    throw new ApiError(400, `Incorrect verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`);
  }

  // Safety check: verify user was not created in the interim
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    await VerificationCode.deleteOne({ _id: record._id });
    throw new ApiError(409, 'An account with this email already exists');
  }

  // Create User
  const user = new User({
    name: record.payload.name,
    email: normalizedEmail,
    passwordHash: record.payload.passwordHash,
  });
  await user.save();

  // Create personal workspace
  const personalWorkspace = new Workspace({
    name: `${user.name}'s Workspace`,
    description: 'Personal workspace',
    owner: user._id,
    members: [{ user: user._id, role: 'owner' }],
  });
  await personalWorkspace.save();

  user.lastActiveWorkspace = personalWorkspace._id;

  // Issue tokens
  const accessToken = signAccessToken({ userId: user._id });
  const refreshToken = signRefreshToken({ userId: user._id });

  user.refreshTokenHash = hashToken(refreshToken);
  await user.save();

  // Clean up verification record
  await VerificationCode.deleteOne({ _id: record._id });

  res.cookie('refreshToken', refreshToken, getRefreshCookieOptions());

  res.status(201).json({
    success: true,
    message: 'Email verified and account registered successfully',
    data: {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        lastActiveWorkspace: personalWorkspace._id,
      },
      workspace: personalWorkspace,
      accessToken,
    },
  });
});

// @desc    Resend 6-digit registration verification code
// @route   POST /api/v1/auth/register-resend-code
exports.resendRegistrationCode = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    throw new ApiError(400, 'Please provide an email address');
  }

  const normalizedEmail = email.toLowerCase().trim();
  const record = await VerificationCode.findOne({
    email: normalizedEmail,
    purpose: 'registration',
  });

  if (!record) {
    throw new ApiError(400, 'No pending registration found for this email. Please start registration again.');
  }

  // Rate limit: prevent spamming resend within 30 seconds
  const lastUpdated = new Date(record.updatedAt || record.createdAt).getTime();
  const elapsedSeconds = Math.floor((Date.now() - lastUpdated) / 1000);
  if (elapsedSeconds < 30) {
    throw new ApiError(429, `Please wait ${30 - elapsedSeconds} seconds before requesting a new code.`);
  }

  // Generate new code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const codeHash = crypto.createHash('sha256').update(code).digest('hex');

  record.codeHash = codeHash;
  record.expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  record.attempts = 0;
  await record.save();

  await sendVerificationCodeEmail({
    toEmail: normalizedEmail,
    name: record.payload?.name,
    code,
    purpose: 'registration',
  });

  res.json({
    success: true,
    message: `A new verification code has been sent to ${normalizedEmail}`,
    data: {
      email: normalizedEmail,
      expiresIn: 600,
    },
  });
});

// @desc    Register a new user & create initial workspace
// @route   POST /api/v1/auth/register
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new ApiError(400, 'Please provide name, email, and password');
  }

  // Password validation: min 8 chars, at least 1 number
  if (password.length < 8 || !/\d/.test(password)) {
    throw new ApiError(400, 'Password must be at least 8 characters long and contain at least one number');
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const passwordHash = await User.hashPassword(password);

  const user = new User({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    passwordHash,
  });

  await user.save();

  // FR-W1: Auto-create a personal workspace ("{Name}'s Workspace")
  const personalWorkspace = new Workspace({
    name: `${user.name}'s Workspace`,
    description: 'Personal workspace',
    owner: user._id,
    members: [{ user: user._id, role: 'owner' }],
  });

  await personalWorkspace.save();

  user.lastActiveWorkspace = personalWorkspace._id;

  // Issue tokens
  const accessToken = signAccessToken({ userId: user._id });
  const refreshToken = signRefreshToken({ userId: user._id });

  user.refreshTokenHash = hashToken(refreshToken);
  await user.save();

  res.cookie('refreshToken', refreshToken, getRefreshCookieOptions());

  res.status(201).json({
    success: true,
    message: 'Registered successfully',
    data: {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        lastActiveWorkspace: personalWorkspace._id,
      },
      workspace: personalWorkspace,
      accessToken,
    },
  });
});

// @desc    Login user
// @route   POST /api/v1/auth/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, 'Please provide email and password');
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash +refreshTokenHash');
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError(401, 'Invalid email or password');
  }

  // Find user workspaces
  const workspaces = await Workspace.find({
    $or: [{ owner: user._id }, { 'members.user': user._id }],
  });

  // Ensure lastActiveWorkspace is valid
  let activeWorkspaceId = user.lastActiveWorkspace;
  if (!activeWorkspaceId || !workspaces.some((w) => w._id.toString() === activeWorkspaceId.toString())) {
    if (workspaces.length > 0) {
      activeWorkspaceId = workspaces[0]._id;
      user.lastActiveWorkspace = activeWorkspaceId;
    }
  }

  const accessToken = signAccessToken({ userId: user._id });
  const refreshToken = signRefreshToken({ userId: user._id });

  user.refreshTokenHash = hashToken(refreshToken);
  await user.save();

  res.cookie('refreshToken', refreshToken, getRefreshCookieOptions());

  res.json({
    success: true,
    message: 'Logged in successfully',
    data: {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        lastActiveWorkspace: activeWorkspaceId,
      },
      workspaces,
      accessToken,
    },
  });
});

// @desc    Refresh access token
// @route   POST /api/v1/auth/refresh
exports.refreshToken = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  if (!refreshToken) {
    throw new ApiError(401, 'No refresh token provided');
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (err) {
    throw new ApiError(401, 'Invalid or expired refresh token');
  }

  const user = await User.findById(decoded.userId).select('+refreshTokenHash');
  if (!user || !user.refreshTokenHash) {
    throw new ApiError(401, 'Invalid refresh session');
  }

  const tokenHashed = hashToken(refreshToken);
  if (user.refreshTokenHash !== tokenHashed) {
    // Possible token reuse detected: revoke
    user.refreshTokenHash = null;
    await user.save();
    res.clearCookie('refreshToken', getRefreshCookieOptions());
    throw new ApiError(401, 'Session invalid or reused, please log in again');
  }

  // Rotate tokens
  const newAccessToken = signAccessToken({ userId: user._id });
  const newRefreshToken = signRefreshToken({ userId: user._id });

  user.refreshTokenHash = hashToken(newRefreshToken);
  await user.save();

  res.cookie('refreshToken', newRefreshToken, getRefreshCookieOptions());

  res.json({
    success: true,
    data: {
      accessToken: newAccessToken,
    },
  });
});

// @desc    Logout user
// @route   POST /api/v1/auth/logout
exports.logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  if (refreshToken) {
    try {
      const decoded = verifyRefreshToken(refreshToken);
      await User.findByIdAndUpdate(decoded.userId, { refreshTokenHash: null });
    } catch (err) {
      // Ignore token verification errors during logout
    }
  }

  res.clearCookie('refreshToken', getRefreshCookieOptions());

  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

// @desc    Get current user and their workspaces
// @route   GET /api/v1/auth/me
exports.getMe = asyncHandler(async (req, res) => {
  const user = req.user;
  const workspaces = await Workspace.find({
    $or: [{ owner: user._id }, { 'members.user': user._id }],
  }).populate('owner', 'name email avatarUrl');

  res.json({
    success: true,
    data: {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        lastActiveWorkspace: user.lastActiveWorkspace,
      },
      workspaces,
    },
  });
});

// @desc    Update profile
// @route   PATCH /api/v1/auth/me
exports.updateProfile = asyncHandler(async (req, res) => {
  const { name, avatarUrl, lastActiveWorkspace } = req.body;
  const user = req.user;

  if (name) user.name = name.trim();
  if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
  if (lastActiveWorkspace) user.lastActiveWorkspace = lastActiveWorkspace;

  await user.save();

  res.json({
    success: true,
    message: 'Profile updated',
    data: {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        lastActiveWorkspace: user.lastActiveWorkspace,
      },
    },
  });
});

// @desc    Change password
// @route   PATCH /api/v1/auth/password
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new ApiError(400, 'Please provide current and new password');
  }

  if (newPassword.length < 8 || !/\d/.test(newPassword)) {
    throw new ApiError(400, 'New password must be at least 8 characters long and contain at least one number');
  }

  const user = await User.findById(req.user._id).select('+passwordHash');
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new ApiError(400, 'Current password is incorrect');
  }

  user.passwordHash = await User.hashPassword(newPassword);
  await user.save();

  res.json({
    success: true,
    message: 'Password changed successfully',
  });
});

// @desc    Forgot password
// @route   POST /api/v1/auth/forgot-password
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw new ApiError(400, 'Please provide email');
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    // Return success to avoid email enumeration
    return res.json({
      success: true,
      message: 'If that email is registered, password reset instructions have been logged to the console.',
    });
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  await user.save();

  console.log('----------------------------------------------------');
  console.log(`[DEV ONLY] Password reset token for ${user.email}:`);
  console.log(`Token: ${resetToken}`);
  console.log(`Reset link: http://localhost:5173/reset-password?token=${resetToken}`);
  console.log('----------------------------------------------------');

  res.json({
    success: true,
    message: 'If that email is registered, password reset instructions have been generated.',
    // In dev, include resetToken for ease of testing
    ...(process.env.NODE_ENV !== 'production' && { devResetToken: resetToken }),
  });
});

// @desc    Reset password
// @route   POST /api/v1/auth/reset-password
exports.resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    throw new ApiError(400, 'Token and new password are required');
  }

  if (password.length < 8 || !/\d/.test(password)) {
    throw new ApiError(400, 'Password must be at least 8 characters long and contain at least one number');
  }

  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new ApiError(400, 'Invalid or expired password reset token');
  }

  user.passwordHash = await User.hashPassword(password);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  user.refreshTokenHash = null;
  await user.save();

  res.json({
    success: true,
    message: 'Password reset successful. You can now log in.',
  });
});
