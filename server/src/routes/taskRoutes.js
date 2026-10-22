const express = require('express');
const router = express.Router({ mergeParams: true });
const taskController = require('../controllers/taskController');
const commentController = require('../controllers/commentController');
const auth = require('../middleware/auth');
const { requireWorkspaceMember } = require('../middleware/role');

router.use(auth);

// When mounted on /api/v1/projects/:pid/tasks
router.get('/', requireWorkspaceMember(), taskController.getProjectTasks);
router.post('/', requireWorkspaceMember(['owner', 'admin', 'member']), taskController.createTask);

// When mounted on /api/v1/tasks
router.get('/mine', taskController.getMyTasks);
router.get('/:id', requireWorkspaceMember(), taskController.getTaskById);
router.patch('/:id', requireWorkspaceMember(['owner', 'admin', 'member']), taskController.updateTask);
router.patch('/:id/move', requireWorkspaceMember(['owner', 'admin', 'member']), taskController.moveTask);
router.delete('/:id', requireWorkspaceMember(['owner', 'admin', 'member']), taskController.deleteTask);
router.post('/:id/restore', requireWorkspaceMember(['owner', 'admin', 'member']), taskController.restoreTask);

// Comments for task
router.get('/:id/comments', requireWorkspaceMember(), commentController.getTaskComments);
router.post('/:id/comments', requireWorkspaceMember(['owner', 'admin', 'member']), commentController.addComment);

module.exports = router;
