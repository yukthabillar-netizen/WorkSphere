const crypto = require('crypto');
const Workspace = require('../models/Workspace');
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { logActivity } = require('../services/activityService');

// @desc    List my workspaces
// @route   GET /api/v1/workspaces
exports.getMyWorkspaces = asyncHandler(async (req, res) => {
  const workspaces = await Workspace.find({
    $or: [{ owner: req.user._id }, { 'members.user': req.user._id }],
  })
    .populate('owner', 'name email avatarUrl')
    .populate('members.user', 'name email avatarUrl');

  res.json({
    success: true,
    data: workspaces,
  });
});

// @desc    Create new workspace
// @route   POST /api/v1/workspaces
exports.createWorkspace = asyncHandler(async (req, res) => {
  const { name, description, accentColor } = req.body;

  if (!name || !name.trim()) {
    throw new ApiError(400, 'Workspace name is required');
  }

  const workspace = new Workspace({
    name: name.trim(),
    description: description || '',
    accentColor: accentColor || '#6366f1',
    owner: req.user._id,
    members: [{ user: req.user._id, role: 'owner' }],
  });

  await workspace.save();

  // Set as last active
  req.user.lastActiveWorkspace = workspace._id;
  await req.user.save();

  await logActivity({
    workspace: workspace._id,
    actor: req.user._id,
    action: 'created_workspace',
    meta: { name: workspace.name },
  });

  res.status(201).json({
    success: true,
    message: 'Workspace created',
    data: workspace,
  });
});

// @desc    Get workspace by id
// @route   GET /api/v1/workspaces/:id
exports.getWorkspaceById = asyncHandler(async (req, res) => {
  const workspace = await Workspace.findById(req.params.id)
    .populate('owner', 'name email avatarUrl')
    .populate('members.user', 'name email avatarUrl');

  if (!workspace) {
    throw new ApiError(404, 'Workspace not found');
  }

  res.json({
    success: true,
    data: workspace,
  });
});

// @desc    Update workspace
// @route   PATCH /api/v1/workspaces/:id
exports.updateWorkspace = asyncHandler(async (req, res) => {
  const { name, description, accentColor } = req.body;
  const workspace = req.workspace;

  if (name) workspace.name = name.trim();
  if (description !== undefined) workspace.description = description;
  if (accentColor) workspace.accentColor = accentColor;

  await workspace.save();

  await logActivity({
    workspace: workspace._id,
    actor: req.user._id,
    action: 'updated_workspace_settings',
    meta: { name: workspace.name },
  });

  res.json({
    success: true,
    message: 'Workspace updated',
    data: workspace,
  });
});

// @desc    Delete workspace (Owner only)
// @route   DELETE /api/v1/workspaces/:id
exports.deleteWorkspace = asyncHandler(async (req, res) => {
  const workspace = req.workspace;

  if (req.userRole !== 'owner') {
    throw new ApiError(403, 'Only the workspace owner can delete this workspace');
  }

  // Delete all tasks, projects associated with workspace
  await Task.deleteMany({ workspace: workspace._id });
  await Project.deleteMany({ workspace: workspace._id });
  await Workspace.findByIdAndDelete(workspace._id);

  // If user had this workspace active, update lastActiveWorkspace
  if (req.user.lastActiveWorkspace?.toString() === workspace._id.toString()) {
    const nextWs = await Workspace.findOne({
      $or: [{ owner: req.user._id }, { 'members.user': req.user._id }],
    });
    req.user.lastActiveWorkspace = nextWs ? nextWs._id : null;
    await req.user.save();
  }

  res.json({
    success: true,
    message: 'Workspace deleted successfully',
  });
});

// @desc    Invite member by email
// @route   POST /api/v1/workspaces/:id/invites
exports.createInvite = asyncHandler(async (req, res) => {
  const { email, role = 'member' } = req.body;
  const workspace = req.workspace;

  if (!email || !email.trim()) {
    throw new ApiError(400, 'Email is required');
  }

  const cleanEmail = email.toLowerCase().trim();

  // Check if already a member
  const existingUser = await User.findOne({ email: cleanEmail });
  if (existingUser) {
    const isMember = workspace.members.some(
      (m) => m.user.toString() === existingUser._id.toString()
    );
    if (isMember) {
      throw new ApiError(400, 'This user is already a member of this workspace');
    }
  }

  // Check if pending invite already exists
  const existingInvite = workspace.invites.find(
    (inv) => inv.email === cleanEmail && inv.status === 'pending' && inv.expiresAt > new Date()
  );

  let token;
  if (existingInvite) {
    token = existingInvite.token;
  } else {
    token = crypto.randomBytes(24).toString('hex');
    workspace.invites.push({
      email: cleanEmail,
      token,
      role,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      status: 'pending',
    });
    await workspace.save();
  }

  const inviteLink = `http://localhost:5173/invite/${token}`;

  await logActivity({
    workspace: workspace._id,
    actor: req.user._id,
    action: 'invited_member',
    meta: { email: cleanEmail, role },
  });

  res.status(201).json({
    success: true,
    message: 'Invite generated successfully',
    data: {
      email: cleanEmail,
      role,
      token,
      inviteLink,
    },
  });
});

// @desc    Accept invite
// @route   POST /api/v1/invites/:token/accept
exports.acceptInvite = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const workspace = await Workspace.findOne({
    'invites.token': token,
  });

  if (!workspace) {
    throw new ApiError(404, 'Invite not found or invalid');
  }

  const invite = workspace.invites.find((inv) => inv.token === token);
  if (!invite || invite.status !== 'pending' || invite.expiresAt < new Date()) {
    throw new ApiError(400, 'Invite has expired or has already been used');
  }

  const user = req.user;
  // Check if user is already a member
  const alreadyMember = workspace.members.some(
    (m) => m.user.toString() === user._id.toString()
  );

  if (!alreadyMember) {
    workspace.members.push({
      user: user._id,
      role: invite.role,
    });
  }

  invite.status = 'accepted';
  await workspace.save();

  user.lastActiveWorkspace = workspace._id;
  await user.save();

  await logActivity({
    workspace: workspace._id,
    actor: user._id,
    action: 'joined_workspace',
    meta: { role: invite.role },
  });

  res.json({
    success: true,
    message: 'You have joined the workspace!',
    data: {
      workspaceId: workspace._id,
      role: invite.role,
    },
  });
});

// @desc    Change member role
// @route   PATCH /api/v1/workspaces/:id/members/:userId
exports.changeMemberRole = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;
  const workspace = req.workspace;

  if (!['admin', 'member', 'viewer'].includes(role)) {
    throw new ApiError(400, 'Invalid role. Must be admin, member, or viewer');
  }

  if (workspace.owner.toString() === userId) {
    throw new ApiError(400, 'Cannot change role of workspace owner');
  }

  const member = workspace.members.find((m) => m.user.toString() === userId);
  if (!member) {
    throw new ApiError(404, 'Member not found in this workspace');
  }

  member.role = role;
  await workspace.save();

  await logActivity({
    workspace: workspace._id,
    actor: req.user._id,
    action: 'changed_member_role',
    meta: { userId, newRole: role },
  });

  res.json({
    success: true,
    message: 'Member role updated',
    data: member,
  });
});

// @desc    Remove member
// @route   DELETE /api/v1/workspaces/:id/members/:userId
exports.removeMember = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const workspace = req.workspace;

  if (workspace.owner.toString() === userId) {
    throw new ApiError(400, 'Cannot remove the workspace owner');
  }

  workspace.members = workspace.members.filter((m) => m.user.toString() !== userId);
  await workspace.save();

  await logActivity({
    workspace: workspace._id,
    actor: req.user._id,
    action: 'removed_member',
    meta: { userId },
  });

  res.json({
    success: true,
    message: 'Member removed from workspace',
  });
});

// @desc    Join workspace using a 6-char Workspace Code (e.g. WS-9X42A)
// @route   POST /api/v1/workspaces/join-by-code
exports.joinWorkspaceByCode = asyncHandler(async (req, res) => {
  const { code } = req.body;

  if (!code || !code.trim()) {
    throw new ApiError(400, 'Please provide a workspace code');
  }

  const cleanCode = code.trim().toUpperCase();
  const normalizedCode = cleanCode.startsWith('WS-') ? cleanCode : `WS-${cleanCode}`;

  const workspace = await Workspace.findOne({
    $or: [{ joinCode: cleanCode }, { joinCode: normalizedCode }],
  }).populate('owner', 'name email avatarUrl');

  if (!workspace) {
    throw new ApiError(404, 'No workspace found with that code. Please check the code and try again.');
  }

  const user = req.user;
  const isMember = workspace.members.some(
    (m) => m.user.toString() === user._id.toString()
  );

  if (!isMember) {
    workspace.members.push({
      user: user._id,
      role: 'member',
    });
    await workspace.save();

    await logActivity({
      workspace: workspace._id,
      actor: user._id,
      action: 'joined_workspace',
      meta: { code: workspace.joinCode, role: 'member' },
    });
  }

  // Update user's active workspace
  user.lastActiveWorkspace = workspace._id;
  await user.save();

  // Return populated workspace
  const updatedWorkspace = await Workspace.findById(workspace._id)
    .populate('owner', 'name email avatarUrl')
    .populate('members.user', 'name email avatarUrl');

  res.json({
    success: true,
    message: isMember
      ? `Switched to workspace: ${workspace.name}`
      : `Successfully joined "${workspace.name}" as a Member!`,
    data: {
      workspace: updatedWorkspace,
      role: isMember
        ? workspace.members.find((m) => m.user.toString() === user._id.toString())?.role
        : 'member',
    },
  });
});

// @desc    Regenerate workspace join code (Owner or Admin only)
// @route   POST /api/v1/workspaces/:id/regenerate-join-code
exports.regenerateJoinCode = asyncHandler(async (req, res) => {
  const workspace = req.workspace;
  workspace.joinCode = Workspace.generateJoinCode();
  await workspace.save();

  res.json({
    success: true,
    message: 'New workspace code generated successfully',
    data: {
      joinCode: workspace.joinCode,
    },
  });
});
