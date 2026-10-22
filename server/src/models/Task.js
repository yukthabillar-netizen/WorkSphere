const mongoose = require('mongoose');

const subtaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    done: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const taskSchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'in_review', 'done'],
      default: 'todo',
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
      index: true,
    },
    assignees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true,
      },
    ],
    labels: [
      {
        type: String,
        trim: true,
      },
    ],
    dueDate: {
      type: Date,
      index: true,
    },
    subtasks: [subtaskSchema],
    order: {
      type: Number,
      default: 0,
    },
    completedAt: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    deletedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index specified in PRD §6
taskSchema.index({ project: 1, status: 1, order: 1 });
taskSchema.index({ workspace: 1, deletedAt: 1 });

module.exports = mongoose.model('Task', taskSchema);
