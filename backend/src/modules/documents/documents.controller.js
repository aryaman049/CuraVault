const multer = require('multer');
const upload = multer({ dest: 'tmp-uploads/' });

let mockDocs = {};

exports.uploadDocument = (req, res) => {
  const docId = Date.now().toString();
  mockDocs[docId] = {
    documentId: docId,
    patientId: "mock-patient-123",
    status: "processing",
    category: "lab_report",
    createdAt: new Date().toISOString(),
    entities: null
  };
  
  // mock background process
  setTimeout(() => {
    mockDocs[docId].status = "completed";
    mockDocs[docId].entities = {
      documentType: "lab_report",
      issuedDate: "2026-08-28",
      provider: { name: "Apollo Diagnostics", doctor: "Dr. Rao" },
      findings: [
        { test: "Hemoglobin", value: "13.2", unit: "g/dL", referenceRange: "13-17" }
      ],
      medications: [],
      prescribedTests: []
    };
  }, 3000);

  res.json({ success: true, data: { documentId: docId, status: "processing" }});
};

exports.getDocument = (req, res) => {
  const doc = mockDocs[req.params.id];
  if (!doc) return res.status(404).json({ success: false, error: "Not found" });
  res.json({ success: true, data: doc });
};

exports.getTimeline = (req, res) => {
  res.json({ success: true, data: { documents: Object.values(mockDocs) } });
};
