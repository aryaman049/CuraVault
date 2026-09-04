const express = require('express');
const router = express.Router();
const controller = require('./reminders.controller');
router.get('/', controller.getReminders);
module.exports = router;
