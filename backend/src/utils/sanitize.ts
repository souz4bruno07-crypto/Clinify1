/**
 * Utilitários para sanitização de inputs
 * Previne XSS e outros ataques de injeção
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitiza uma string removendo HTML e scripts
 */
export const sanitizeInput = (input: string): string => {
  if (typeof input !== 'string') {
    return input;
  }
  
  // Remove HTML tags e scripts
  return DOMPurify.sanitize(input, { 
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  }).trim();
};

/**
 * Sanitiza um objeto recursivamente
 */
export const sanitizeObject = <T extends Record<string, any>>(obj: T): T => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const sanitized = { ...obj } as T;
  
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      (sanitized as any)[key] = sanitizeInput(sanitized[key] as string);
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      if (Array.isArray(sanitized[key])) {
        (sanitized as any)[key] = (sanitized[key] as any[]).map((item: any) => 
          typeof item === 'string' ? sanitizeInput(item) : 
          typeof item === 'object' ? sanitizeObject(item) : item
        );
      } else {
        (sanitized as any)[key] = sanitizeObject(sanitized[key] as Record<string, any>);
      }
    }
  }
  
  return sanitized;
};

/**
 * Sanitiza apenas campos específicos de um objeto
 */
export const sanitizeFields = <T extends Record<string, any>>(
  obj: T,
  fields: (keyof T)[]
): T => {
  const sanitized = { ...obj };
  
  for (const field of fields) {
    if (typeof sanitized[field] === 'string') {
      sanitized[field] = sanitizeInput(sanitized[field] as string) as T[keyof T];
    }
  }
  
  return sanitized;
};
