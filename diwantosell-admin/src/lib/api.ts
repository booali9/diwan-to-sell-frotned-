const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://diwantosell-backend.onrender.com'

export async function apiCall(endpoint: string, methodOrOptions: string | RequestInit = 'GET', body?: any) {
  const token = localStorage.getItem('adminToken')
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  let config: RequestInit;

  if (typeof methodOrOptions === 'object') {
    config = {
      ...methodOrOptions,
      headers: {
        ...headers,
        ...(methodOrOptions.headers as Record<string, string>),
      },
    }
  } else {
    config = {
      method: methodOrOptions,
      headers,
    }

    if (body && methodOrOptions !== 'GET') {
      config.body = typeof body === 'string' ? body : JSON.stringify(body)
    }
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || `API error: ${response.status}`)
  }

  return response.json()
}
