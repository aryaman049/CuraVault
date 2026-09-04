exports.getReminders = (req, res) => {
  res.json({ 
    success: true, 
    data: { 
      reminders: [
        { reminderId: "rem-1", type: "follow_up", dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0], status: "upcoming", note: "Follow-up with Dr. Rao regarding Hemoglobin levels" }
      ] 
    } 
  });
};
