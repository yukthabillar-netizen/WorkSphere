const Task = require('../models/Task');
const Project = require('../models/Project');
const Activity = require('../models/Activity');
const Workspace = require('../models/Workspace');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get dashboard metrics, charts, activity & projects for a workspace
// @route   GET /api/v1/workspaces/:id/dashboard
exports.getWorkspaceDashboard = asyncHandler(async (req, res) => {
  const workspaceId = req.params.id;
  const userId = req.user._id;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  // Start of this week (Monday)
  const day = startOfToday.getDay();
  const diffToMonday = startOfToday.getDate() - day + (day === 0 ? -6 : 1);
  const startOfWeek = new Date(startOfToday.setDate(diffToMonday));
  const endOfWeek = new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);

  // 1. Stat cards
  // My open tasks
  const myOpenTasksCount = await Task.countDocuments({
    workspace: workspaceId,
    assignees: userId,
    status: { $ne: 'done' },
    deletedAt: null,
  });

  // Due this week (across workspace or assigned to user)
  const dueThisWeekCount = await Task.countDocuments({
    workspace: workspaceId,
    dueDate: { $gte: startOfWeek, $lte: endOfWeek },
    status: { $ne: 'done' },
    deletedAt: null,
  });

  // Overdue tasks
  const overdueCount = await Task.countDocuments({
    workspace: workspaceId,
    dueDate: { $lt: startOfToday },
    status: { $ne: 'done' },
    deletedAt: null,
  });

  // Completed this week
  const completedThisWeekCount = await Task.countDocuments({
    workspace: workspaceId,
    status: 'done',
    completedAt: { $gte: startOfWeek },
    deletedAt: null,
  });

  // 2. Tasks by status (Donut chart data)
  const statusCountsRaw = await Task.aggregate([
    { $match: { workspace: req.workspace._id, deletedAt: null } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const statusMap = { todo: 0, in_progress: 0, in_review: 0, done: 0 };
  statusCountsRaw.forEach((sc) => {
    if (statusMap[sc._id] !== undefined) {
      statusMap[sc._id] = sc.count;
    }
  });

  const tasksByStatus = [
    { name: 'To Do', key: 'todo', count: statusMap.todo, color: '#94A3B8' },
    { name: 'In Progress', key: 'in_progress', count: statusMap.in_progress, color: '#38BDF8' },
    { name: 'In Review', key: 'in_review', count: statusMap.in_review, color: '#FBBF24' },
    { name: 'Done', key: 'done', count: statusMap.done, color: '#34D399' },
  ];

  // 3. Completion trend over last 14 days
  const fourteenDaysAgo = new Date(startOfToday.getTime() - 13 * 24 * 60 * 60 * 1000);
  const completionAgg = await Task.aggregate([
    {
      $match: {
        workspace: req.workspace._id,
        status: 'done',
        completedAt: { $gte: fourteenDaysAgo },
        deletedAt: null,
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } },
        completed: { $sum: 1 },
      },
    },
  ]);

  const completionDayMap = {};
  completionAgg.forEach((item) => {
    completionDayMap[item._id] = item.completed;
  });

  const completionTrend = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(startOfToday.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().split('T')[0];
    const shortLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    completionTrend.push({
      date: dateStr,
      label: shortLabel,
      completed: completionDayMap[dateStr] || 0,
    });
  }

  // 4. Workload per member (open tasks)
  const workspace = await Workspace.findById(workspaceId).populate('members.user', 'name email avatarUrl');
  const memberWorkload = await Promise.all(
    workspace.members.map(async (m) => {
      const openCount = await Task.countDocuments({
        workspace: workspaceId,
        assignees: m.user._id,
        status: { $ne: 'done' },
        deletedAt: null,
      });
      return {
        userId: m.user._id,
        name: m.user.name,
        avatarUrl: m.user.avatarUrl,
        openTasks: openCount,
      };
    })
  );

  // 5. My tasks due soon (top 5)
  const myDueSoonTasks = await Task.find({
    workspace: workspaceId,
    assignees: userId,
    status: { $ne: 'done' },
    deletedAt: null,
  })
    .sort({ dueDate: 1 })
    .limit(5)
    .populate('project', 'name color icon');

  // 6. Recent activity (last 10)
  const recentActivity = await Activity.find({ workspace: workspaceId })
    .populate('actor', 'name email avatarUrl')
    .populate('task', 'title')
    .populate('project', 'name color icon')
    .sort({ createdAt: -1 })
    .limit(10);

  // 7. Projects at a glance (with computed progress)
  const projects = await Project.find({ workspace: workspaceId, status: { $ne: 'archived' } })
    .populate('members', 'name email avatarUrl')
    .sort({ updatedAt: -1 })
    .limit(6);

  const projectsAtGlance = await Promise.all(
    projects.map(async (proj) => {
      const totalTasks = await Task.countDocuments({ project: proj._id, deletedAt: null });
      const doneTasks = await Task.countDocuments({ project: proj._id, status: 'done', deletedAt: null });
      const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
      return {
        ...proj.toObject(),
        totalTasks,
        doneTasks,
        progress,
      };
    })
  );

  res.json({
    success: true,
    data: {
      stats: {
        myOpenTasks: myOpenTasksCount,
        dueThisWeek: dueThisWeekCount,
        overdue: overdueCount,
        completedThisWeek: completedThisWeekCount,
      },
      charts: {
        tasksByStatus,
        completionTrend,
        memberWorkload,
      },
      myDueSoonTasks,
      recentActivity,
      projects: projectsAtGlance,
    },
  });
});
