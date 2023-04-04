const { Router } = require('express');
const { getStatus, getStats } = require('../controllers/AppController');
const UsersController = require('../controllers/UsersController');
const AuthController = require('../controllers/AuthController');
const FilesController = require('../controllers/FilesController');

const router = Router();

router.get('/status', getStatus);

router.get('/stats', getStats);

router.post('/users', UsersController.postNew);

router.get('/users/me', UsersController.getMe);

router.get('/connect', AuthController.getConnect);

router.get('/disconnect', AuthController.getDisconnect);

router.post('/files', FilesController.postUpload)

module.exports = router;
