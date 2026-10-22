const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    color: {
      type: String,
      default: '#6366f1',
    },
    icon: {
      type: String,
      default: '📁',
    },
    status: {
      type: String,
      enum: ['active', 'on_hold', 'completed', 'archived'],
      default: 'active',
      index: true,
    },
    startDate: {
      type: Date,
    },
    dueDate: {
      type: Date,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Project', projectSchema);
