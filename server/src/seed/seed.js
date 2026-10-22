const mongoose = require('mongoose');
const config = require('../config/env');
const connectDB = require('../config/db');
const User = require('../models/User');
const Workspace = require('../models/Workspace');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Comment = require('../models/Comment');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');

const seedData = async () => {
  try {
    console.log('🌱 Starting WorkSphere database seeding...');
    await connectDB();

    // Clear existing collections
    await User.deleteMany({});
    await Workspace.deleteMany({});
    await Project.deleteMany({});
    await Task.deleteMany({});
    await Comment.deleteMany({});
    await Activity.deleteMany({});
    await Notification.deleteMany({});
    console.log('🧹 Cleared existing database records.');

    // 1. Create Users (password: Password123)
    const passwordHash = await User.hashPassword('Password123');

    const usersData = [
      {
        name: 'Alex Rivers',
        email: 'alex@worksphere.io',
        passwordHash,
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      },
      {
        name: 'Sarah Chen',
        email: 'sarah@worksphere.io',
        passwordHash,
        avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
      },
      {
        name: 'Marcus Vance',
        email: 'marcus@worksphere.io',
        passwordHash,
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      },
      {
        name: 'Elena Rostova',
        email: 'elena@worksphere.io',
        passwordHash,
        avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      },
    ];

    const users = await User.insertMany(usersData);
    const [alex, sarah, marcus, elena] = users;
    console.log(`👤 Created ${users.length} demo users.`);

    // 2. Create Workspace
    const workspace = new Workspace({
      name: 'Acme Product Studio',
      description: 'Collaborative space for product design, engineering, and growth initiatives.',
      accentColor: '#6366f1',
      owner: alex._id,
      members: [
        { user: alex._id, role: 'owner' },
        { user: sarah._id, role: 'admin' },
        { user: marcus._id, role: 'member' },
        { user: elena._id, role: 'member' },
      ],
      invites: [
        {
          email: 'designer@partner.com',
          token: 'demo-invite-token-designer-partner',
          role: 'member',
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          status: 'pending',
        },
      ],
    });
    await workspace.save();

    // Set lastActiveWorkspace for all users
    await User.updateMany({}, { lastActiveWorkspace: workspace._id });
    console.log(`🏢 Created workspace "${workspace.name}".`);

    // 3. Create Projects
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000);
    const inThreeDays = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
    const inOneWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    const inTwoWeeks = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);

    const projectsData = [
      {
        workspace: workspace._id,
        name: 'Mobile App Redesign',
        description: 'Next-generation iOS & Android application overhaul with offline-first sync.',
        color: '#6366F1',
        icon: '📱',
        status: 'active',
        startDate: twoDaysAgo,
        dueDate: inTwoWeeks,
        members: [alex._id, sarah._id, marcus._id, elena._id],
        createdBy: alex._id,
      },
      {
        workspace: workspace._id,
        name: 'Q4 Growth Campaign',
        description: 'Multi-channel acquisition sprint focusing on self-serve product onboarding.',
        color: '#EC4899',
        icon: '🚀',
        status: 'active',
        startDate: yesterday,
        dueDate: inOneWeek,
        members: [alex._id, sarah._id, marcus._id],
        createdBy: sarah._id,
      },
      {
        workspace: workspace._id,
        name: 'Design System 2.0',
        description: 'Comprehensive tokenization, accessible components, and Figma UI kit parity.',
        color: '#10B981',
        icon: '🎨',
        status: 'completed',
        startDate: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
        dueDate: yesterday,
        members: [alex._id, sarah._id, elena._id],
        createdBy: alex._id,
      },
    ];

    const projects = await Project.insertMany(projectsData);
    const [mobileApp, marketing, designSystem] = projects;
    console.log(`📁 Created ${projects.length} projects.`);

    // 4. Create ~30 Tasks across projects, statuses, priorities, due dates
    const tasksData = [
      // Mobile App Project Tasks (14 tasks)
      {
        workspace: workspace._id,
        project: mobileApp._id,
        title: 'Conduct user interviews on prototype navigation',
        description: 'Interview 5 beta testers to observe thumb-zone reachability on modern devices.',
        status: 'in_progress',
        priority: 'high',
        assignees: [sarah._id, elena._id],
        labels: ['Research', 'UX'],
        dueDate: today,
        subtasks: [
          { title: 'Draft interview script', done: true },
          { title: 'Schedule 5 user sessions', done: true },
          { title: 'Synthesize feedback insights', done: false },
        ],
        order: 0,
        createdBy: alex._id,
      },
      {
        workspace: workspace._id,
        project: mobileApp._id,
        title: 'Fix biometric auth biometric prompt crashing on Android 14',
        description: 'Resolve unhandled null safety check in Keystore biometric cipher generation.',
        status: 'in_progress',
        priority: 'urgent',
        assignees: [marcus._id],
        labels: ['Bug', 'Mobile'],
        dueDate: yesterday, // Overdue
        subtasks: [
          { title: 'Reproduce on Pixel 8 emulator', done: true },
          { title: 'Update BiometricPrompt compat version', done: true },
          { title: 'Write integration regression test', done: false },
        ],
        order: 1,
        createdBy: sarah._id,
      },
      {
        workspace: workspace._id,
        project: mobileApp._id,
        title: 'Refactor state management to Zustand slice pattern',
        description: 'Decouple cache invalidation and unify offline optimistic write queues.',
        status: 'todo',
        priority: 'medium',
        assignees: [marcus._id],
        labels: ['Architecture'],
        dueDate: inThreeDays,
        subtasks: [
          { title: 'Define workspace slice', done: false },
          { title: 'Define task slice', done: false },
        ],
        order: 0,
        createdBy: alex._id,
      },
      {
        workspace: workspace._id,
        project: mobileApp._id,
        title: 'Implement Dark Mode HSL color token mapping',
        description: 'Verify WCAG AA contrast standards across all modal overlays and chips.',
        status: 'todo',
        priority: 'low',
        assignees: [elena._id],
        labels: ['UI', 'A11y'],
        dueDate: inOneWeek,
        subtasks: [],
        order: 1,
        createdBy: alex._id,
      },
      {
        workspace: workspace._id,
        project: mobileApp._id,
        title: 'Design interactive push notification payload handler',
        description: 'Allow users to accept invites or snooze task reminders directly from notifications.',
        status: 'todo',
        priority: 'medium',
        assignees: [alex._id],
        labels: ['Feature'],
        dueDate: inTwoWeeks,
        subtasks: [],
        order: 2,
        createdBy: alex._id,
      },
      {
        workspace: workspace._id,
        project: mobileApp._id,
        title: 'Review pull request for swipe-to-archive gesture',
        description: 'Check haptic feedback smoothness and threshold tolerance on iOS 17.',
        status: 'in_review',
        priority: 'high',
        assignees: [alex._id, marcus._id],
        labels: ['Code Review'],
        dueDate: today,
        subtasks: [
          { title: 'Verify test coverage on PR #142', done: true },
          { title: 'Test on physical iPhone 15 device', done: false },
        ],
        order: 0,
        createdBy: sarah._id,
      },
      {
        workspace: workspace._id,
        project: mobileApp._id,
        title: 'Audit App Store submission metadata and screenshots',
        description: 'Prepare localized strings for EN, ES, DE, JA app store listing assets.',
        status: 'in_review',
        priority: 'medium',
        assignees: [sarah._id],
        labels: ['Release'],
        dueDate: inThreeDays,
        subtasks: [],
        order: 1,
        createdBy: alex._id,
      },
      {
        workspace: workspace._id,
        project: mobileApp._id,
        title: 'Setup Sentry performance monitoring and tracing',
        description: 'Configured transaction profiling on critical task drag & drop gestures.',
        status: 'done',
        priority: 'medium',
        assignees: [marcus._id],
        labels: ['DevOps'],
        dueDate: yesterday,
        completedAt: yesterday,
        subtasks: [
          { title: 'Install Sentry SDK', done: true },
          { title: 'Add sampling rate configuration', done: true },
        ],
        order: 0,
        createdBy: alex._id,
      },
      {
        workspace: workspace._id,
        project: mobileApp._id,
        title: 'Publish beta build 1.4.0 to TestFlight',
        description: 'Included new board layout and optimistic status transition animations.',
        status: 'done',
        priority: 'high',
        assignees: [marcus._id, sarah._id],
        labels: ['Release'],
        dueDate: twoDaysAgo,
        completedAt: twoDaysAgo,
        subtasks: [
          { title: 'Bump build number', done: true },
          { title: 'Verify release notes', done: true },
        ],
        order: 1,
        createdBy: sarah._id,
      },
      {
        workspace: workspace._id,
        project: mobileApp._id,
        title: 'Setup automated end-to-end Cypress tests in CI',
        description: 'Runs headless browser tests on PR commit triggers.',
        status: 'done',
        priority: 'medium',
        assignees: [marcus._id],
        labels: ['Testing'],
        dueDate: twoDaysAgo,
        completedAt: twoDaysAgo,
        subtasks: [],
        order: 2,
        createdBy: alex._id,
      },
      {
        workspace: workspace._id,
        project: mobileApp._id,
        title: 'Optimize offline SQLite indexing for task search',
        description: 'Reduced search query latency from 140ms to under 8ms.',
        status: 'done',
        priority: 'high',
        assignees: [marcus._id],
        labels: ['Performance'],
        dueDate: yesterday,
        completedAt: yesterday,
        subtasks: [],
        order: 3,
        createdBy: alex._id,
      },

      // Marketing Campaign Tasks (9 tasks)
      {
        workspace: workspace._id,
        project: marketing._id,
        title: 'Finalize copy for product launch newsletter',
        description: 'Highlight real-time collaboration features and seamless drag & drop board.',
        status: 'in_progress',
        priority: 'high',
        assignees: [sarah._id],
        labels: ['Copywriting'],
        dueDate: today,
        subtasks: [
          { title: 'Draft header hook', done: true },
          { title: 'Review with product manager', done: false },
        ],
        order: 0,
        createdBy: sarah._id,
      },
      {
        workspace: workspace._id,
        project: marketing._id,
        title: 'Record 60-second product demo walkthrough video',
        description: 'Record crisp 4K screencast demonstrating task assignment and realtime notifications.',
        status: 'in_progress',
        priority: 'urgent',
        assignees: [alex._id, sarah._id],
        labels: ['Video', 'Design'],
        dueDate: inThreeDays,
        subtasks: [
          { title: 'Script key user story beats', done: true },
          { title: 'Record screen captures', done: false },
          { title: 'Sound engineering and bg music', done: false },
        ],
        order: 1,
        createdBy: alex._id,
      },
      {
        workspace: workspace._id,
        project: marketing._id,
        title: 'Configure Google Analytics 4 conversion event funnels',
        description: 'Track signup step completion rates and first workspace task creation.',
        status: 'todo',
        priority: 'medium',
        assignees: [sarah._id],
        labels: ['Analytics'],
        dueDate: inOneWeek,
        subtasks: [],
        order: 0,
        createdBy: sarah._id,
      },
      {
        workspace: workspace._id,
        project: marketing._id,
        title: 'Coordinate Product Hunt launch teaser campaign',
        description: 'Prepare maker comments, gallery banners, and first day response schedule.',
        status: 'todo',
        priority: 'urgent',
        assignees: [alex._id],
        labels: ['Marketing'],
        dueDate: inTwoWeeks,
        subtasks: [],
        order: 1,
        createdBy: alex._id,
      },
      {
        workspace: workspace._id,
        project: marketing._id,
        title: 'Review landing page SEO metadata and OpenGraph tags',
        description: 'Ensure social preview cards render correctly on X, LinkedIn, and Slack unfurl.',
        status: 'in_review',
        priority: 'medium',
        assignees: [marcus._id],
        labels: ['SEO'],
        dueDate: yesterday, // Overdue
        subtasks: [],
        order: 0,
        createdBy: sarah._id,
      },
      {
        workspace: workspace._id,
        project: marketing._id,
        title: 'Design vector badge assets for partner affiliate tier',
        description: 'Create high-res SVG badges for verified consultant profile display.',
        status: 'done',
        priority: 'low',
        assignees: [elena._id],
        labels: ['Design'],
        dueDate: twoDaysAgo,
        completedAt: twoDaysAgo,
        subtasks: [],
        order: 0,
        createdBy: alex._id,
      },
      {
        workspace: workspace._id,
        project: marketing._id,
        title: 'Deploy customer onboarding email sequence in loops',
        description: 'Configured automated day-1 and day-3 engagement check-ins.',
        status: 'done',
        priority: 'high',
        assignees: [sarah._id],
        labels: ['Automation'],
        dueDate: yesterday,
        completedAt: yesterday,
        subtasks: [],
        order: 1,
        createdBy: sarah._id,
      },

      // Design System Tasks (8 tasks)
      {
        workspace: workspace._id,
        project: designSystem._id,
        title: 'Audit color contrast ratios across dark mode components',
        description: 'Verified minimum 4.5:1 ratio for all body typography against dark background.',
        status: 'done',
        priority: 'urgent',
        assignees: [elena._id],
        labels: ['A11y'],
        dueDate: twoDaysAgo,
        completedAt: twoDaysAgo,
        subtasks: [{ title: 'Verify text-muted contrast', done: true }],
        order: 0,
        createdBy: alex._id,
      },
      {
        workspace: workspace._id,
        project: designSystem._id,
        title: 'Build accessible Modal and Drawer primitives',
        description: 'Integrated focus-trap, ESC listener, and aria-expanded accessibility tags.',
        status: 'done',
        priority: 'high',
        assignees: [elena._id, alex._id],
        labels: ['Components'],
        dueDate: twoDaysAgo,
        completedAt: twoDaysAgo,
        subtasks: [
          { title: 'Keyboard focus trapping', done: true },
          { title: 'Smooth slide-in animations', done: true },
        ],
        order: 1,
        createdBy: alex._id,
      },
      {
        workspace: workspace._id,
        project: designSystem._id,
        title: 'Export standardized Figma icon component library',
        description: 'Cleaned up 24px icon vectors and mapped naming conventions to lucide-react.',
        status: 'done',
        priority: 'medium',
        assignees: [elena._id],
        labels: ['Figma'],
        dueDate: yesterday,
        completedAt: yesterday,
        subtasks: [],
        order: 2,
        createdBy: alex._id,
      },
      {
        workspace: workspace._id,
        project: designSystem._id,
        title: 'Document keyboard shortcut standards and cheat sheet',
        description: 'Cataloged Cmd+K, Quick-add (C), search (/), and global navigation sequences.',
        status: 'done',
        priority: 'low',
        assignees: [alex._id],
        labels: ['Documentation'],
        dueDate: yesterday,
        completedAt: yesterday,
        subtasks: [],
        order: 3,
        createdBy: alex._id,
      },
    ];

    const tasks = await Task.insertMany(tasksData);
    console.log(`✅ Created ${tasks.length} tasks across projects.`);

    // 5. Create Comments with @mentions
    const firstTask = tasks[0]; // User interviews
    const secondTask = tasks[1]; // Android bug

    const commentsData = [
      {
        task: firstTask._id,
        author: sarah._id,
        body: 'I finished reviewing the interview questions! @Alex Rivers, can you look over the thumb-zone criteria?',
        mentions: [alex._id],
      },
      {
        task: firstTask._id,
        author: alex._id,
        body: 'Looks fantastic Sarah! Let us ensure we test on smaller displays like the iPhone 13 mini as well.',
        mentions: [sarah._id],
      },
      {
        task: secondTask._id,
        author: alex._id,
        body: '@Marcus Vance check the BiometricPrompt crash on Android 14. We need this patch in the staging build tonight.',
        mentions: [marcus._id],
      },
      {
        task: secondTask._id,
        author: marcus._id,
        body: 'Identified the issue. The Cipher initialization failed when strongbox keystore is unavailable. PR is up!',
        mentions: [alex._id],
      },
    ];

    await Comment.insertMany(commentsData);
    console.log(`💬 Created sample task comments.`);

    // 6. Create Activity Feed
    const activityData = [
      {
        workspace: workspace._id,
        project: mobileApp._id,
        task: firstTask._id,
        actor: alex._id,
        action: 'created_task',
        meta: { title: firstTask.title, status: 'in_progress' },
        createdAt: twoDaysAgo,
      },
      {
        workspace: workspace._id,
        project: mobileApp._id,
        task: secondTask._id,
        actor: sarah._id,
        action: 'status_changed',
        meta: { from: 'todo', to: 'in_progress', title: secondTask.title },
        createdAt: yesterday,
      },
      {
        workspace: workspace._id,
        project: mobileApp._id,
        task: firstTask._id,
        actor: sarah._id,
        action: 'commented',
        meta: { taskTitle: firstTask.title, snippet: 'I finished reviewing the interview questions!' },
        createdAt: yesterday,
      },
      {
        workspace: workspace._id,
        project: designSystem._id,
        actor: alex._id,
        action: 'updated_project',
        meta: { name: 'Design System 2.0', status: 'completed' },
        createdAt: yesterday,
      },
    ];

    await Activity.insertMany(activityData);
    console.log(`📜 Created sample activity records.`);

    // 7. Create Notifications
    const notificationsData = [
      {
        user: alex._id,
        type: 'mentioned',
        task: firstTask._id,
        project: mobileApp._id,
        actor: sarah._id,
        message: 'Sarah Chen mentioned you in a comment on "Conduct user interviews on prototype navigation"',
        read: false,
      },
      {
        user: alex._id,
        type: 'assigned',
        task: tasks[4]._id,
        project: mobileApp._id,
        actor: sarah._id,
        message: 'Sarah Chen assigned you to task "Design interactive push notification payload handler"',
        read: false,
      },
      {
        user: marcus._id,
        type: 'assigned',
        task: secondTask._id,
        project: mobileApp._id,
        actor: sarah._id,
        message: 'Sarah Chen assigned you to task "Fix biometric auth biometric prompt crashing on Android 14"',
        read: false,
      },
    ];

    await Notification.insertMany(notificationsData);
    console.log(`🔔 Created sample user notifications.`);

    console.log('\n======================================================');
    console.log('🎉 WorkSphere database seeded successfully!');
    console.log('Demo Login Credentials:');
    console.log('  Alex Rivers (Owner):   alex@worksphere.io   / Password123');
    console.log('  Sarah Chen  (Admin):   sarah@worksphere.io  / Password123');
    console.log('  Marcus Vance(Member):  marcus@worksphere.io / Password123');
    console.log('  Elena Rostova(Member): elena@worksphere.io  / Password123');
    console.log('======================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedData();
