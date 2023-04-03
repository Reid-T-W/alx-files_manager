const { Router } = require('express');
const { getStatus, getStats } = require('../controllers/AppController');
const UsersController = require('../controllers/UsersController');

const router = Router();

router.get('/status', getStatus);

router.get('/stats', getStats);

router.post('/users', UsersController.postNew);

module.exports = router;
