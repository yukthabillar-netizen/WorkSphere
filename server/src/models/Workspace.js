const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member', 'viewer'],
      default: 'member',
      required: true,
    },
  },
  { _id: false }
);

const inviteSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    token: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'member', 'viewer'],
      default: 'member',
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'revoked'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

const workspaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    accentColor: {
      type: String,
      default: '#6366f1',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    joinCode: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
    },
    members: [memberSchema],
    invites: [inviteSchema],
  },
  {
    timestamps: true,
  }
);

// Helper to generate a clean, unambiguous 6-char workspace code (e.g. WS-9X42A)
workspaceSchema.statics.generateJoinCode = function () {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `WS-${code}`;
};

workspaceSchema.pre('save', function () {
  if (!this.joinCode) {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    this.joinCode = `WS-${code}`;
  }
});

module.exports = mongoose.model('Workspace', workspaceSchema);
