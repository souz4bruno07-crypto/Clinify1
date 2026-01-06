// Cliente HTTP para comunicação com o backend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const ACCESS_TOKEN_KEY = 'clinify_access_token';
const REFRESH_TOKEN_KEY = 'clinify_refresh_token';
const STORAGE_TYPE_KEY = 'clinify_storage_type';

class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private isRefreshing = false;
  private refreshPromise: Promise<string> | null = null;

  constructor() {
    // Recuperar tokens do storage apropriado ao inicializar
    // Suporte para migração de token antigo (backward compatibility)
    try {
      const storageType = localStorage.getItem(STORAGE_TYPE_KEY);
      const storage = storageType === 'session' ? sessionStorage : localStorage;
      
      // Tentar recuperar novos tokens (accessToken e refreshToken)
      this.accessToken = storage.getItem(ACCESS_TOKEN_KEY);
      this.refreshToken = storage.getItem(REFRESH_TOKEN_KEY);
      
      // Se não encontrou novos tokens, tentar migrar do token antigo
      if (!this.accessToken) {
        const oldToken = storage.getItem('clinify_token') || localStorage.getItem('clinify_token') || sessionStorage.getItem('clinify_token');
        if (oldToken) {
          // Migrar token antigo para accessToken (compatibilidade)
          this.accessToken = oldToken;
          storage.setItem(ACCESS_TOKEN_KEY, oldToken);
          // Limpar token antigo
          try {
            localStorage.removeItem('clinify_token');
            sessionStorage.removeItem('clinify_token');
          } catch (e) {
            // Ignorar erro
          }
        }
      }
      
      if (this.accessToken) {
        console.log('[apiClient] Tokens recuperados do storage:', {
          storageType: storageType || 'local',
          hasAccessToken: !!this.accessToken,
          hasRefreshToken: !!this.refreshToken
        });
      }
    } catch (error) {
      console.error('[apiClient] Erro ao recuperar tokens:', error);
      try {
        this.accessToken = localStorage.getItem(ACCESS_TOKEN_KEY) || sessionStorage.getItem(ACCESS_TOKEN_KEY) || null;
        this.refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY) || sessionStorage.getItem(REFRESH_TOKEN_KEY) || null;
      } catch (e) {
        this.accessToken = null;
        this.refreshToken = null;
      }
    }
  }

  setTokens(accessToken: string | null, refreshToken: string | null, rememberMe: boolean = true) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    
    try {
      const shouldUseLocalStorage = rememberMe || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const storage = shouldUseLocalStorage ? localStorage : sessionStorage;
      
      if (accessToken && refreshToken) {
        try {
          storage.setItem(ACCESS_TOKEN_KEY, accessToken);
          storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
          storage.setItem(STORAGE_TYPE_KEY, shouldUseLocalStorage ? 'local' : 'session');
          
          // Limpar tokens antigos e do outro storage
          const otherStorage = shouldUseLocalStorage ? sessionStorage : localStorage;
          try {
            otherStorage.removeItem(ACCESS_TOKEN_KEY);
            otherStorage.removeItem(REFRESH_TOKEN_KEY);
            otherStorage.removeItem('clinify_token'); // Limpar token antigo
          } catch (e) {
            // Ignorar erro
          }
        } catch (e) {
          // Se storage principal falhar, tentar o outro
          const fallbackStorage = shouldUseLocalStorage ? sessionStorage : localStorage;
          try {
            fallbackStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
            fallbackStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
            fallbackStorage.setItem(STORAGE_TYPE_KEY, shouldUseLocalStorage ? 'session' : 'local');
          } catch (e2) {
            console.error('[apiClient] Erro ao salvar tokens:', e2);
          }
        }
      } else {
        // Limpar todos os tokens
        try {
          localStorage.removeItem(ACCESS_TOKEN_KEY);
          localStorage.removeItem(REFRESH_TOKEN_KEY);
          localStorage.removeItem(STORAGE_TYPE_KEY);
          localStorage.removeItem('clinify_token'); // Limpar token antigo
        } catch (e) {
          // Ignorar erro
        }
        try {
          sessionStorage.removeItem(ACCESS_TOKEN_KEY);
          sessionStorage.removeItem(REFRESH_TOKEN_KEY);
          sessionStorage.removeItem('clinify_token'); // Limpar token antigo
        } catch (e) {
          // Ignorar erro
        }
      }
    } catch (error) {
      console.error('[apiClient] Erro ao salvar tokens:', error);
    }
  }

  // Método para compatibilidade (aceita token antigo ou accessToken)
  setToken(token: string | null, rememberMe: boolean = true) {
    // Se receber apenas um token, tratar como accessToken (compatibilidade)
    this.setTokens(token, this.refreshToken, rememberMe);
  }

  getToken() {
    return this.accessToken;
  }

  getAccessToken() {
    return this.accessToken;
  }

  getRefreshToken() {
    return this.refreshToken;
  }

  /**
   * Renova o access token usando o refresh token
   */
  async refreshAccessToken(): Promise<string> {
    // Se já está renovando, retornar a promise existente
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        const response = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken: this.refreshToken }),
        });

        if (!response.ok) {
          // Refresh token expirado ou inválido
          this.setTokens(null, null);
          throw new Error('Refresh token expired');
        }

        const data = await response.json();
        this.setTokens(data.accessToken, data.refreshToken);
        
        return data.accessToken;
      } catch (error) {
        this.setTokens(null, null);
        throw error;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
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

    if (this.accessToken) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.accessToken}`;
    }

    // Log apenas em desenvolvimento
    if (import.meta.env.DEV) {
      console.log(`[apiClient] ${options.method || 'GET'} ${url}`);
    }
    
    // Adicionar timeout de 60 segundos para requisições (especialmente importante para mobile)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    
    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      // Log apenas em desenvolvimento
      if (import.meta.env.DEV) {
        console.log(`[apiClient] Response status: ${response.status} ${response.statusText}`);
      }

      if (!response.ok) {
        // Se for 401 (não autorizado), tentar renovar o token
        if (response.status === 401 && this.refreshToken && endpoint !== '/auth/refresh') {
          try {
            const newAccessToken = await this.refreshAccessToken();
            // Tentar novamente com o novo token
            (headers as Record<string, string>)['Authorization'] = `Bearer ${newAccessToken}`;
            const retryResponse = await fetch(url, {
              ...options,
              headers,
              signal: controller.signal,
            });
            clearTimeout(timeoutId);
            
            if (!retryResponse.ok) {
              // Se ainda falhar após refresh, lançar erro
              const errorText = await retryResponse.text();
              const errorData = errorText ? JSON.parse(errorText) : { error: `HTTP error! status: ${retryResponse.status}` };
              const error = new Error(errorData.error || errorData.details || errorData.message || `HTTP error! status: ${retryResponse.status}`);
              (error as any).status = retryResponse.status;
              (error as any).response = { data: errorData };
              throw error;
            }
            
            // Se sucesso após refresh, processar resposta normalmente
            const text = await retryResponse.text();
            if (!text || text.trim() === '') {
              return {} as T;
            }
            return JSON.parse(text);
          } catch (refreshError: any) {
            // Se refresh falhar, limpar tokens e lançar erro
            this.setTokens(null, null);
            clearTimeout(timeoutId);
            const error = new Error('Sessão expirada. Por favor, faça login novamente.');
            (error as any).status = 401;
            throw error;
          }
        }
        
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
    } catch (error: any) {
      clearTimeout(timeoutId);
      // Tratar erro de timeout ou abort
      if (error.name === 'AbortError' || error.message?.includes('aborted')) {
        const timeoutError = new Error('Requisição cancelada por timeout (60 segundos). Verifique sua conexão.');
        (timeoutError as any).status = 408;
        throw timeoutError;
      }
      // Re-throw outros erros
      throw error;
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

