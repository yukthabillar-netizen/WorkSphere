const express = require('express');
const router = express.Router({ mergeParams: true });
const projectController = require('../controllers/projectController');
const auth = require('../middleware/auth');
const { requireWorkspaceMember } = require('../middleware/role');

router.use(auth);

// When mounted on /api/v1/workspaces/:wid/projects
router.get('/', requireWorkspaceMember(), projectController.getWorkspaceProjects);
router.post('/', requireWorkspaceMember(['owner', 'admin']), projectController.createProject);

// When mounted on /api/v1/projects
router.get('/:id', requireWorkspaceMember(), projectController.getProjectById);
router.patch('/:id', requireWorkspaceMember(['owner', 'admin']), projectController.updateProject);
router.delete('/:id', requireWorkspaceMember(['owner', 'admin']), projectController.deleteProject);
router.get('/:id/activity', requireWorkspaceMember(), projectController.getProjectActivity);

module.exports = router;
