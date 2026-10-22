const Task = require('../models/Task');
const Project = require('../models/Project');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Global search across tasks and projects
// @route   GET /api/v1/search?q=&workspaceId=
exports.search = asyncHandler(async (req, res) => {
  const { q, workspaceId } = req.query;

  if (!q || !q.trim()) {
    return res.json({
      success: true,
      data: {
        projects: [],
        tasks: [],
      },
    });
  }

  const queryRegex = new RegExp(q.trim(), 'i');
  const wsFilter = workspaceId ? { workspace: workspaceId } : {};

  const [projects, tasks] = await Promise.all([
    Project.find({
      ...wsFilter,
      $or: [{ name: queryRegex }, { description: queryRegex }],
    })
      .limit(8)
      .select('name description color icon status workspace'),
    Task.find({
      ...wsFilter,
      deletedAt: null,
      $or: [{ title: queryRegex }, { description: queryRegex }, { labels: queryRegex }],
    })
      .populate('project', 'name color icon')
      .populate('assignees', 'name avatarUrl')
      .limit(12)
      .select('title status priority dueDate project workspace assignees'),
  ]);

  res.json({
    success: true,
    data: {
      projects,
      tasks,
    },
  });
});
