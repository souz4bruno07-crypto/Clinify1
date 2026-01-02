// Cliente HTTP para comunicação com o backend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const TOKEN_KEY = 'clinify_token';
const STORAGE_TYPE_KEY = 'clinify_storage_type';

class ApiClient {
  private token: string | null = null;

  constructor() {
    // Recuperar token do storage apropriado ao inicializar
    // Primeiro verifica qual storage foi usado originalmente
    const storageType = localStorage.getItem(STORAGE_TYPE_KEY);
    
    if (storageType === 'local') {
      this.token = localStorage.getItem(TOKEN_KEY);
    } else if (storageType === 'session') {
      this.token = sessionStorage.getItem(TOKEN_KEY);
    } else {
      // Fallback para verificar ambos (migração de tokens antigos)
      this.token = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
    }
  }

  setToken(token: string | null, rememberMe: boolean = true) {
    this.token = token;
    
    if (token) {
      if (rememberMe) {
        // Persistir por 30 dias usando localStorage
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(STORAGE_TYPE_KEY, 'local');
        // Limpar sessionStorage caso exista token antigo
        sessionStorage.removeItem(TOKEN_KEY);
      } else {
        // Usar sessionStorage - expira ao fechar navegador
        sessionStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(STORAGE_TYPE_KEY, 'session');
        // Limpar localStorage caso exista token antigo
        localStorage.removeItem(TOKEN_KEY);
      }
    } else {
      // Limpar ambos os storages
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(STORAGE_TYPE_KEY);
      sessionStorage.removeItem(TOKEN_KEY);
    }
  }

  getToken() {
    return this.token;
  }
  
  // Método para verificar o tipo de storage atual
  getStorageType(): 'local' | 'session' | null {
    const type = localStorage.getItem(STORAGE_TYPE_KEY);
    return type === 'local' || type === 'session' ? type : null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_URL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
    }

    // Log apenas em desenvolvimento
    if (import.meta.env.DEV) {
      console.log(`[apiClient] ${options.method || 'GET'} ${url}`);
    }
    
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Log apenas em desenvolvimento
    if (import.meta.env.DEV) {
      console.log(`[apiClient] Response status: ${response.status} ${response.statusText}`);
    }

    if (!response.ok) {
      let errorData: any;
      try {
        const errorText = await response.text();
        if (import.meta.env.DEV) {
          console.error(`[apiClient] Error response text:`, errorText);
        }
        errorData = errorText ? JSON.parse(errorText) : { error: `HTTP error! status: ${response.status}` };
      } catch (parseError) {
        if (import.meta.env.DEV) {
          console.error(`[apiClient] Error parsing error response:`, parseError);
        }
        errorData = { error: `HTTP error! status: ${response.status}` };
      }
      const errorMessage = errorData.error || errorData.details || errorData.message || `HTTP error! status: ${response.status}`;
      const error = new Error(errorMessage);
      (error as any).status = response.status;
      (error as any).response = { data: errorData };
      throw error;
    }

    // Handle empty responses
    const text = await response.text();
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/7018d877-4b16-4a68-9ee6-6d7d4c606105',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'apiClient.ts:113',message:'Response text recebido',data:{textLength:text?.length,textValue:text?.substring(0,100),isEmpty:!text||text.trim()===''},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'H3'})}).catch(()=>{});
    // #endregion agent log
    
    if (!text || text.trim() === '') {
      return {} as T;
    }
    
    try {
      const parsed = JSON.parse(text);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/7018d877-4b16-4a68-9ee6-6d7d4c606105',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'apiClient.ts:121',message:'JSON parse sucesso',data:{parsedType:typeof parsed,isNull:parsed===null,isObject:typeof parsed==='object'},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'H3'})}).catch(()=>{});
      // #endregion agent log
      return parsed;
    } catch (parseError) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/7018d877-4b16-4a68-9ee6-6d7d4c606105',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'apiClient.ts:126',message:'JSON parse erro',data:{errorMessage:(parseError as Error)?.message,textValue:text?.substring(0,100)},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'H4'})}).catch(()=>{});
      // #endregion agent log
      if (import.meta.env.DEV) {
        console.error(`[apiClient] Error parsing JSON:`, parseError);
        console.error(`[apiClient] Text that failed to parse:`, text);
      }
      throw new Error(`Invalid JSON response: ${parseError}`);
    }
  }

  // GET request
  async get<T>(endpoint: string): Promise<T> {
    // Adicionar headers para evitar cache
    return this.request<T>(endpoint, { 
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  }

  // POST request
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT request
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient();
export default api;

