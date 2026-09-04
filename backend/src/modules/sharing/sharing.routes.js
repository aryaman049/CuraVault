const express = require('express');
const router = express.Router();
const controller = require('./sharing.controller');
router.post('/', controller.createSession);
router.get('/', controller.getSessions);
router.delete('/:id', controller.deleteSession);
module.exports = router;
