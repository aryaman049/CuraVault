export const store = {
  documents: [
    {
      documentId: 'doc-1001',
      category: 'lab_report',
      status: 'completed',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      entities: {
        provider: { name: 'City General Hospital', doctor: 'Dr. Sarah Jenkins' },
        issuedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        findings: [
          { test: 'Hemoglobin', value: '14.2', unit: 'g/dL' },
          { test: 'WBC', value: '6.5', unit: '10^9/L' },
          { test: 'Platelets', value: '250', unit: '10^9/L' }
        ]
      }
    },
    {
      documentId: 'doc-1002',
      category: 'prescription',
      status: 'completed',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      entities: {
        provider: { name: 'Downtown Clinic', doctor: 'Dr. Marcus Webb' },
        issuedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        findings: [
          { test: 'Amoxicillin', value: '500', unit: 'mg' },
          { test: 'Ibuprofen', value: '400', unit: 'mg' }
        ]
      }
    },
    {
      documentId: 'doc-1003',
      category: 'scan_report',
      status: 'completed',
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      entities: {
        provider: { name: 'Radiology Partners', doctor: 'Dr. Emily Chen' },
        issuedDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        findings: [
          { test: 'MRI Brain', value: 'Normal', unit: 'Observation' },
          { test: 'Contrast', value: 'None', unit: 'N/A' }
        ]
      }
    },
    {
      documentId: 'doc-1004',
      category: 'discharge_summary',
      status: 'completed',
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      entities: {
        provider: { name: 'St. Jude Medical', doctor: 'Dr. Robert Hale' },
        issuedDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        findings: [
          { test: 'Diagnosis', value: 'Appendicitis', unit: 'Primary' },
          { test: 'Procedure', value: 'Appendectomy', unit: 'Surgical' }
        ]
      }
    },
    {
      documentId: 'doc-1005',
      category: 'lab_report',
      status: 'completed',
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      entities: {
        provider: { name: 'Quest Diagnostics', doctor: 'Dr. Sarah Jenkins' },
        issuedDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        findings: [
          { test: 'Cholesterol', value: '185', unit: 'mg/dL' },
          { test: 'Triglycerides', value: '110', unit: 'mg/dL' },
          { test: 'HDL', value: '55', unit: 'mg/dL' }
        ]
      }
    }
  ] as any[],
  sessions: [] as any[],
};
