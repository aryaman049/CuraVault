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
    }
  ] as any[],
  sessions: [] as any[],
};
