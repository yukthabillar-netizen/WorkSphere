const express = require('express');
const router = express.Router();
const workspaceController = require('../controllers/workspaceController');
const auth = require('../middleware/auth');

router.use(auth);

router.post('/:token/accept', workspaceController.acceptInvite);

module.exports = router;
