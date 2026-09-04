let sessions = [];
exports.createSession = (req, res) => {
  const token = Math.random().toString(36).substring(2, 15);
  const session = {
    sessionId: Date.now().toString(),
    shareUrl: `http://localhost:3000/shared/${token}`,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 mins
    allowedCategories: req.body.allowedCategories || [],
    status: 'active'
  };
  sessions.push(session);
  res.json({ success: true, data: session });
};
exports.getSessions = (req, res) => {
  res.json({ success: true, data: { sessions } });
};
exports.deleteSession = (req, res) => {
  sessions = sessions.filter(s => s.sessionId !== req.params.id);
  res.json({ success: true });
};
