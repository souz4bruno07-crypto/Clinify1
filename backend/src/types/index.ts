/**
 * Tipos TypeScript compartilhados
 */

export interface UserPayload {
  id: string;
  role: string;
  type?: 'access' | 'refresh';
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface PaginationParams {
  page?: number;
  limit: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page?: number;
    limit: number;
    total: number;
    totalPages?: number;
    offset?: number;
  };
}

export interface ApiError {
  error: string;
  code: string;
  details?: any;
}
