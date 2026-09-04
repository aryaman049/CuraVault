exports.search = (req, res) => {
  const q = req.query.q || '';
  res.json({ 
    success: true, 
    data: { 
      results: [
        { documentId: 'mock-1', category: 'lab_report', snippet: `Found match for "${q}": Hemoglobin 13.2 g/dL (28 Aug 2026)`, score: 0.92 }
      ] 
    } 
  });
};
