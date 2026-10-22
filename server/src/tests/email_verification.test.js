const request = require('supertest');
const mongoose = require('mongoose');
const crypto = require('crypto');
const app = require('../app');
const config = require('../config/env');
const User = require('../models/User');
const Workspace = require('../models/Workspace');
const VerificationCode = require('../models/VerificationCode');

describe('Email Verification Registration Flow', () => {
  const testEmail = 'verify_flow_test@example.com';
  const knownTestCode = '849201';

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(config.mongoUri);
    }
    await User.deleteMany({ email: testEmail });
    await VerificationCode.deleteMany({ email: testEmail });
  });

  afterAll(async () => {
    await User.deleteMany({ email: testEmail });
    await VerificationCode.deleteMany({ email: testEmail });
    await mongoose.connection.close();
  });

  it('Step 1: should send verification code to valid email and NEVER expose code in response', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register-send-code')
      .send({
        name: 'Email Verify User',
        email: testEmail,
        password: 'Password123',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(testEmail);
    // Security check: devCode must NOT be present in API response
    expect(res.body.data.devCode).toBeUndefined();

    // Verify record exists in database
    const record = await VerificationCode.findOne({ email: testEmail, purpose: 'registration' });
    expect(record).not.toBeNull();
    expect(record.payload.name).toBe('Email Verify User');
    expect(record.codeHash).toBeDefined();

    // Set a known test code hash to verify in Step 2
    record.codeHash = crypto.createHash('sha256').update(knownTestCode).digest('hex');
    await record.save();
  });

  it('Step 1 (validation): should reject if password is too short or missing numbers', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register-send-code')
      .send({
        name: 'Short Pass User',
        email: 'shortpass@example.com',
        password: 'pass',
      });

    expect(res.status).toBe(400);
  });

  it('Step 2 (invalid code): should reject verification with incorrect code', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register-verify-code')
      .send({
        email: testEmail,
        code: '000000',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('Step 2 (valid code): should verify code, create user & personal workspace, and issue tokens', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register-verify-code')
      .send({
        email: testEmail,
        code: knownTestCode,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testEmail);
    expect(res.body.data.user.name).toBe('Email Verify User');
    expect(res.body.data.workspace.name).toBe("Email Verify User's Workspace");
    expect(res.body.data.accessToken).toBeDefined();

    // Verify user exists in DB
    const userInDb = await User.findOne({ email: testEmail });
    expect(userInDb).not.toBeNull();

    // Verify verification code is deleted
    const record = await VerificationCode.findOne({ email: testEmail, purpose: 'registration' });
    expect(record).toBeNull();
  });

  it('Step 1 (duplicate): should prevent sending registration code for an already existing user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register-send-code')
      .send({
        name: 'Duplicate User',
        email: testEmail,
        password: 'Password123',
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toContain('already exists');
  });
});
