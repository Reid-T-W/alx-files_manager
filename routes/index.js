const { Router } = require('express');
const { getStatus, getStats } = require('../controllers/AppController');
const { createUser } = require('../controllers/UserController');

const router = Router();

router.get('/status', getStatus);

router.get('/stats', getStats);

router.post('/users', createUser);

module.exports = router;
