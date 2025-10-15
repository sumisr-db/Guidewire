// API client wrapper with error handling
// In production (Databricks Apps), use relative URLs to same origin
// In development, use localhost:8000
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.MODE === 'production' ? '' : 'http://localhost:8000');

class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public body?: any
  ) {
    super(`HTTP ${status}: ${statusText}`);
    this.name = 'ApiError';
  }
}

export const apiClient = {
  GET: async (path: string, options?: { params?: { path?: Record<string, string> } }) => {
    let url = `${API_BASE_URL}${path}`;

    // Replace path parameters
    if (options?.params?.path) {
      Object.entries(options.params.path).forEach(([key, value]) => {
        url = url.replace(`{${key}}`, value);
      });
    }

    const response = await fetch(url, {
      credentials: 'include', // Include cookies for Databricks Apps OAuth
    });

    // Check for HTTP errors
    if (!response.ok) {
      let errorBody;
      try {
        errorBody = await response.json();
      } catch {
        errorBody = await response.text();
      }
      throw new ApiError(response.status, response.statusText, errorBody);
    }

    const data = await response.json();
    return { data, response };
  },

  POST: async (path: string, options?: { body?: any; params?: { query?: Record<string, any> } }) => {
    let url = `${API_BASE_URL}${path}`;

    // Add query parameters
    if (options?.params?.query) {
      const params = new URLSearchParams();
      Object.entries(options.params.query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
      const queryString = params.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(options?.body),
      credentials: 'include', // Include cookies for Databricks Apps OAuth
    });

    // Check for HTTP errors
    if (!response.ok) {
      let errorBody;
      try {
        errorBody = await response.json();
      } catch {
        errorBody = await response.text();
      }
      throw new ApiError(response.status, response.statusText, errorBody);
    }

    const data = await response.json();
    return { data, response };
  },

  DELETE: async (path: string, options?: { params?: { path?: Record<string, string> } }) => {
    let url = `${API_BASE_URL}${path}`;

    // Replace path parameters
    if (options?.params?.path) {
      Object.entries(options.params.path).forEach(([key, value]) => {
        url = url.replace(`{${key}}`, value);
      });
    }

    const response = await fetch(url, {
      method: 'DELETE',
      credentials: 'include', // Include cookies for Databricks Apps OAuth
    });

    // Check for HTTP errors
    if (!response.ok) {
      let errorBody;
      try {
        errorBody = await response.json();
      } catch {
        errorBody = await response.text();
      }
      throw new ApiError(response.status, response.statusText, errorBody);
    }

    return { response };
  },
};

export { ApiError };
