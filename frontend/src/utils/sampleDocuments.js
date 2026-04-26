
export const getSampleDocuments = () => {
  return [
    {
      id: 'sample-1',
      name: 'Case Law Analysis Template',
      type: 'pdf',
      size: '452 KB',
      uploadedAt: new Date('2025-01-15'),
      path: '/Case_Law_Analysis_Template.pdf',
      isSample: true,
      description: 'Template for analyzing case law and legal precedents'
    },
    {
      id: 'sample-2',
      name: 'Compliance Checklist',
      type: 'pdf',
      size: '328 KB',
      uploadedAt: new Date('2025-01-10'),
      path: '/Compliance_Checklist.pdf',
      isSample: true,
      description: 'Comprehensive compliance checklist for legal operations'
    },
    {
      id: 'sample-3',
      name: 'Contract Review Guidelines',
      type: 'pdf',
      size: '567 KB',
      uploadedAt: new Date('2025-01-20'),
      path: '/Contract_Review_Guidelines.pdf',
      isSample: true,
      description: 'Guidelines for reviewing and analyzing contracts'
    },
    {
      id: 'sample-4',
      name: 'Employment Law Guide',
      type: 'pdf',
      size: '421 KB',
      uploadedAt: new Date('2025-01-12'),
      path: '/Employment_Law_Guide.pdf',
      isSample: true,
      description: 'Quick reference guide for employment law matters'
    },
    {
      id: 'sample-5',
      name: 'Intellectual Property Rights',
      type: 'pdf',
      size: '634 KB',
      uploadedAt: new Date('2025-01-18'),
      path: '/Intellectual_Property_Rights.pdf',
      isSample: true,
      description: 'Overview of intellectual property rights and protections'
    },
  ]
}

// Get sample document as embedded content
export const getSampleDocumentContent = async (path) => {
  try {
    const response = await fetch(path)
    const blob = await response.blob()
    return URL.createObjectURL(blob)
  } catch (error) {
    console.error('Error loading sample document:', error)
    return null
  }
}
