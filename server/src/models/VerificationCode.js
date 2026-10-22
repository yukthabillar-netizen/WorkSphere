const mongoose = require('mongoose');

const verificationCodeSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    codeHash: {
      type: String,
      required: true,
    },
    purpose: {
      type: String,
      enum: ['registration', 'password_reset'],
      default: 'registration',
    },
    payload: {
      name: { type: String, trim: true },
      passwordHash: { type: String },
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL index: auto delete upon expiry
    },
    attempts: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('VerificationCode', verificationCodeSchema);
