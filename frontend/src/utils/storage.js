

export const storageKeys = {
  USER: 'legalbuddy_user',           // Stores current logged-in user
  THEME: 'legalbuddy_theme',         // Stores theme preference (dark/light)
}


//  (Login/Logout)

export const setUser = (user) => {
  localStorage.setItem(storageKeys.USER, JSON.stringify(user))
}

export const getUser = () => {
  const user = localStorage.getItem(storageKeys.USER)
  return user ? JSON.parse(user) : null
}

export const removeUser = () => {
  const user = getUser()
  localStorage.removeItem(storageKeys.USER)
  if (user) {
    const userFilesKey = `files_${user.email}`
    localStorage.removeItem(userFilesKey)
  }
}



export const getFiles = () => {
  // Get current user
  const user = getUser()
  if (!user) return [] // If no user logged in, return empty
  
  // Get files for this specific user using their email
  const userFilesKey = `files_${user.email}`
  const files = localStorage.getItem(userFilesKey)
  return files ? JSON.parse(files) : []
}

export const addFile = (file) => {
  // Get current user
  const user = getUser()
  if (!user) {
    console.error('No user logged in')
    return null
  }

  // Get user's existing files
  const files = getFiles()
  
  // Create new file object
  const newFile = {
    id: Date.now(),
    name: file.name,
    size: file.size,
    type: file.type,
    uploadedAt: new Date().toISOString(),
    content: file.content,
  }
  
  // Add to user's files
  files.push(newFile)
  
  // Save to localStorage with user-specific key
  const userFilesKey = `files_${user.email}`
  localStorage.setItem(userFilesKey, JSON.stringify(files))
  
  return newFile
}

export const removeFile = (id) => {
  // Get current user
  const user = getUser()
  if (!user) return
  
  // Get user's files and remove the one with matching id
  const files = getFiles()
  const filteredFiles = files.filter((file) => file.id !== id)
  
  // Save updated files to localStorage
  const userFilesKey = `files_${user.email}`
  localStorage.setItem(userFilesKey, JSON.stringify(filteredFiles))
}

// Get recent files (last 5 uploaded)
export const getRecentFiles = () => {
  const files = getFiles()
  return files.slice(-5).reverse()
}

// Download a file
export const downloadFile = (file) => {
  if (!file.content) return
  
  // Create link and download
  const link = document.createElement('a')
  link.href = file.content
  link.download = file.name
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}


// (Dark/Light Mode)

export const setTheme = (theme) => {
  localStorage.setItem(storageKeys.THEME, theme)
}

export const getTheme = () => {
  return localStorage.getItem(storageKeys.THEME) || 'light'
}


// (Sample Files from Public Folder)

export const dummyFiles = [
  {
    id: 'dummy_1',
    name: 'Contract_Review_Guidelines.pdf',
    size: 2.4,
    type: 'application/pdf',
    uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    isDummy: true,
    label: 'Contract',
  },
  {
    id: 'dummy_2',
    name: 'Case_Law_Analysis_Template.pdf',
    size: 1.8,
    type: 'application/pdf',
    uploadedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    isDummy: true,
    label: 'Analysis',
  },
  {
    id: 'dummy_3',
    name: 'Intellectual_Property_Rights.pdf',
    size: 3.1,
    type: 'application/pdf',
    uploadedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    isDummy: true,
    label: 'IP Law',
  },
  {
    id: 'dummy_4',
    name: 'Compliance_Checklist.pdf',
    size: 0.9,
    type: 'application/pdf',
    uploadedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    isDummy: true,
    label: 'Compliance',
  },
  {
    id: 'dummy_5',
    name: 'Employment_Law_Guide.pdf',
    size: 2.5,
    type: 'application/pdf',
    uploadedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    isDummy: true,
    label: 'Employment',
  },
]
