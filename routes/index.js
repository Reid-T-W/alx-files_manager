const { Router } = require('express');
const { getStatus, getStats } = require('../controllers/AppController');

const router = Router();

router.get('/status', getStatus);

router.get('/stats', getStats);

module.exports = router;
