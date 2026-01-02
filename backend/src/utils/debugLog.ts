import { appendFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';

const LOG_PATH = join(process.cwd(), '.cursor', 'debug.log');

export async function debugLog(payload: {
  location: string;
  message: string;
  data?: any;
  timestamp?: number;
  sessionId?: string;
  runId?: string;
  hypothesisId?: string;
}): Promise<void> {
  try {
    // Criar diretório se não existir
    await mkdir(dirname(LOG_PATH), { recursive: true });
    
    const logEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: payload.timestamp || Date.now(),
      location: payload.location,
      message: payload.message,
      data: payload.data || {},
      sessionId: payload.sessionId || 'debug-session',
      runId: payload.runId || 'run1',
      hypothesisId: payload.hypothesisId || 'A'
    };
    
    await appendFile(LOG_PATH, JSON.stringify(logEntry) + '\n', 'utf8');
  } catch (error) {
    // Silenciosamente falha se não conseguir escrever (ex: permissões)
    // Não queremos que logs quebrem a aplicação
  }
}

