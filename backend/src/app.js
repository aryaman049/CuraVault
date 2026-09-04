const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get('/api/v1/health', (req, res) => res.json({ status: 'ok' }));

app.use('/api/v1/documents', require('./modules/documents/documents.routes'));
app.use('/api/v1/search', require('./modules/search/search.routes'));
app.use('/api/v1/share/sessions', require('./modules/sharing/sharing.routes'));
app.use('/api/v1/reminders', require('./modules/reminders/reminders.routes'));

module.exports = app;
