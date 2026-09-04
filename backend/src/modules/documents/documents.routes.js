const express = require('express');
const router = express.Router();
const controller = require('./documents.controller');
const multer = require('multer');
const upload = multer({ dest: 'tmp-uploads/' });

router.post('/', upload.single('file'), controller.uploadDocument);
router.get('/', controller.getTimeline);
router.get('/:id', controller.getDocument);

module.exports = router;
