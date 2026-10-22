const express = require('express');
const router = express.Router();
const workspaceController = require('../controllers/workspaceController');
const auth = require('../middleware/auth');
const { requireWorkspaceMember } = require('../middleware/role');

// All workspace routes require authentication
router.use(auth);

// Workspaces list, creation, and joining via code
router.get('/', workspaceController.getMyWorkspaces);
router.post('/', workspaceController.createWorkspace);
router.post('/join-by-code', workspaceController.joinWorkspaceByCode);

// Specific workspace routes
router.get('/:id', requireWorkspaceMember(), workspaceController.getWorkspaceById);
router.get('/:id/dashboard', requireWorkspaceMember(), require('../controllers/dashboardController').getWorkspaceDashboard);
router.patch('/:id', requireWorkspaceMember(['owner', 'admin']), workspaceController.updateWorkspace);
router.delete('/:id', requireWorkspaceMember(['owner']), workspaceController.deleteWorkspace);

// Invites & Codes
router.post('/:id/invites', requireWorkspaceMember(['owner', 'admin']), workspaceController.createInvite);
router.post('/:id/regenerate-join-code', requireWorkspaceMember(['owner', 'admin']), workspaceController.regenerateJoinCode);

// Member management
router.patch('/:id/members/:userId', requireWorkspaceMember(['owner', 'admin']), workspaceController.changeMemberRole);
router.delete('/:id/members/:userId', requireWorkspaceMember(['owner', 'admin']), workspaceController.removeMember);

module.exports = router;
