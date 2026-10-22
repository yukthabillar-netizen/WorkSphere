const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');
const config = require('../config/env');
const User = require('../models/User');
const Workspace = require('../models/Workspace');
const Project = require('../models/Project');
const Task = require('../models/Task');

describe('WorkSphere Backend Core Tests', () => {
  let ownerToken;
  let memberToken;
  let workspaceId;
  let projectId;
  let taskId;
  let ownerUser;
  let memberUser;

  beforeAll(async () => {
    await mongoose.connect(config.mongoUri);

    // Clean up test records
    await User.deleteMany({ email: { $in: ['test_owner@test.com', 'test_member@test.com'] } });

    // Register Owner
    const ownerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Test Owner',
        email: 'test_owner@test.com',
        password: 'Password123',
      });

    expect(ownerRes.status).toBe(201);
    ownerToken = ownerRes.body.data.accessToken;
    workspaceId = ownerRes.body.data.workspace._id;
    ownerUser = ownerRes.body.data.user;

    // Register Member
    const memberRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Test Member',
        email: 'test_member@test.com',
        password: 'Password123',
      });

    console.log('memberRes status:', memberRes.status, 'body:', memberRes.body);
    expect(memberRes.status).toBe(201);
    memberToken = memberRes.body.data.accessToken;
    memberUser = memberRes.body.data.user;

    // Add Member to Owner's workspace
    await Workspace.findByIdAndUpdate(workspaceId, {
      $push: { members: { user: memberUser._id, role: 'member' } },
    });
  });

  afterAll(async () => {
    // Cleanup
    if (workspaceId) {
      await Task.deleteMany({ workspace: workspaceId });
      await Project.deleteMany({ workspace: workspaceId });
      await Workspace.findByIdAndDelete(workspaceId);
    }
    await User.deleteMany({ email: { $in: ['test_owner@test.com', 'test_member@test.com'] } });
    await mongoose.connection.close();
  });

  describe('Authentication & Profile', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test_owner@test.com',
          password: 'Password123',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('should reject login with wrong password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test_owner@test.com',
          password: 'WrongPassword99',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should get current user profile with valid token', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe('test_owner@test.com');
    });
  });

  describe('Projects & Permissions', () => {
    it('Owner can create a project in the workspace', async () => {
      const res = await request(app)
        .post(`/api/v1/workspaces/${workspaceId}/projects`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Core Platform v2',
          description: 'Test platform project',
          color: '#6366f1',
          icon: '🚀',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Core Platform v2');
      projectId = res.body.data._id;
    });

    it('Member should NOT be able to delete the workspace (Owner only)', async () => {
      const res = await request(app)
        .delete(`/api/v1/workspaces/${workspaceId}`)
        .set('Authorization', `Bearer ${memberToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('Tasks & Move Logic', () => {
    it('Should create a task in the project', async () => {
      const res = await request(app)
        .post(`/api/v1/projects/${projectId}/tasks`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          title: 'Initial architecture sprint',
          status: 'todo',
          priority: 'high',
          assignees: [memberUser._id],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.title).toBe('Initial architecture sprint');
      expect(res.body.data.status).toBe('todo');
      taskId = res.body.data._id;
    });

    it('Should move task status and order with optimistic move endpoint', async () => {
      const res = await request(app)
        .patch(`/api/v1/tasks/${taskId}/move`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          status: 'in_progress',
          order: 0,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('in_progress');
      expect(res.body.data.order).toBe(0);
    });

    it('Should calculate workspace dashboard metrics', async () => {
      const res = await request(app)
        .get(`/api/v1/workspaces/${workspaceId}/dashboard`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.stats).toBeDefined();
      expect(res.body.data.charts).toBeDefined();
      expect(res.body.data.charts.tasksByStatus).toBeDefined();
    });
  });
});
