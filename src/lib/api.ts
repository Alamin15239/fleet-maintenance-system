// API utility function that includes authentication
export async function apiFetch(url: string, options: RequestInit = {}) {
  // Get token from localStorage
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  // Add authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const config: RequestInit = {
    ...options,
    headers,
  }

  try {
    const response = await fetch(url, config)
    return response
  } catch (error) {
    console.error('API request failed:', error)
    throw error
  }
}

// Helper function for GET requests
export async function apiGet(url: string) {
  return apiFetch(url, { method: 'GET' })
}

// Helper function for POST requests
export async function apiPost(url: string, data: any) {
  return apiFetch(url, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// Helper function for PUT requests
export async function apiPut(url: string, data: any) {
  return apiFetch(url, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

// Helper function for DELETE requests
export async function apiDelete(url: string) {
  return apiFetch(url, { method: 'DELETE' })
}