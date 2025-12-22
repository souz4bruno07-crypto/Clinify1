
import { ChatMessage, ChatContact } from '../types';

export interface EvolutionConfig {
  apiUrl: string;
  apiKey: string;
  instance: string;
}

let cachedExactName: string | null = null;

export const getEvolutionConfig = (): EvolutionConfig | null => {
  const saved = localStorage.getItem('clinify_evolution_config');
  if (!saved) return null;
  try {
    const config = JSON.parse(saved);
    let cleanUrl = (config.apiUrl || '').trim()
      .replace(/\/+$/, '')
      .replace(/\/manager$/, '')
      .replace(/\/instance$/, '');
    
    return {
      apiUrl: cleanUrl,
      instance: (config.instance || '').trim(),
      apiKey: (config.apiKey || '').trim()
    };
  } catch (e) {
    return null;
  }
};

const resolveInstanceName = async (config: EvolutionConfig): Promise<string> => {
  if (cachedExactName) return cachedExactName;
  try {
    const response = await fetch(`${config.apiUrl}/instance/fetchInstances`, {
      headers: { 'apikey': config.apiKey }
    });
    if (response.ok) {
      const data = await response.json();
      const list = Array.isArray(data) ? data : (data.instances || []);
      const found = list.find((i: any) => (i.instanceName || i.name || i.instance?.instanceName || '').toLowerCase() === config.instance.toLowerCase());
      if (found) {
        cachedExactName = found.instanceName || found.name || found.instance?.instanceName;
        return cachedExactName!;
      }
    }
  } catch (e) {}
  return config.instance;
};

export const fetchEvolutionChats = async (): Promise<ChatContact[]> => {
  const config = getEvolutionConfig();
  if (!config?.apiUrl) return [];
  try {
    const instanceName = await resolveInstanceName(config);
    const headers = { 'apikey': config.apiKey };
    const response = await fetch(`${config.apiUrl}/chat/getChats/${encodeURIComponent(instanceName)}`, { headers });
    
    if (!response.ok) return [];
    const data = await response.json();
    const chats = Array.isArray(data) ? data : (data.chats || []);
    
    return chats.map((c: any) => {
        const remoteJid = c.id || c.remoteJid || '';
        const phone = remoteJid.split('@')[0];
        return {
            id: remoteJid,
            clinicId: 'wa-inbox',
            name: c.name || phone,
            phone: phone,
            lastMessage: c.lastMessage?.message?.conversation || 
                         c.lastMessage?.message?.extendedTextMessage?.text || 
                         'Mídia ou Mensagem',
            lastMessageTime: c.lastMessage?.messageTimestamp ? c.lastMessage.messageTimestamp * 1000 : Date.now(),
            unreadCount: c.unreadCount || 0,
            avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name || 'U')}&background=random`
        };
    }).filter((c: any) => !c.id.includes('@g.us')); 
  } catch (e) {
    return [];
  }
};

export const logoutEvolutionInstance = async (): Promise<boolean> => {
  const config = getEvolutionConfig();
  if (!config) return false;
  try {
    const instanceName = await resolveInstanceName(config);
    const response = await fetch(`${config.apiUrl}/instance/logout/${encodeURIComponent(instanceName)}`, {
      method: 'DELETE',
      headers: { 'apikey': config.apiKey }
    });
    return response.ok;
  } catch (e) {
    return false;
  }
};

export const getEvolutionQrCode = async (): Promise<{ code: string | null; error?: string }> => {
  const config = getEvolutionConfig();
  if (!config?.apiUrl) return { code: null, error: 'Configuração incompleta.' };
  try {
    const instanceName = await resolveInstanceName(config);
    const response = await fetch(`${config.apiUrl}/instance/connect/${encodeURIComponent(instanceName)}`, {
      headers: { 'apikey': config.apiKey }
    });
    const data = await response.json();
    if (!response.ok) {
      if (data.message?.includes('already connected')) return { code: 'CONNECTED_ALREADY' };
      return { code: null, error: data.message || `Erro ${response.status}` };
    }
    const code = data.base64 || data.qrcode?.base64 || data.code || (data.qrcode && typeof data.qrcode === 'string' ? data.qrcode : null);
    if (code && typeof code === 'string' && code.length > 50) {
      return { code: code.startsWith('data:') ? code : `data:image/png;base64,${code}` };
    }
    if (data.status === 'open' || data.instance?.state === 'open') return { code: 'CONNECTED_ALREADY' };
    return { code: null, error: 'Aguardando QR Code do servidor...' };
  } catch (e) {
    return { code: null, error: 'Falha de rede.' };
  }
};

export const getEvolutionStatus = async (): Promise<string> => {
  const config = getEvolutionConfig();
  if (!config?.apiUrl) return 'disconnected';
  try {
    const instanceName = await resolveInstanceName(config);
    const headers = { 'apikey': config.apiKey };
    // Tentativa 1: ConnectionState
    let response = await fetch(`${config.apiUrl}/instance/connectionState/${encodeURIComponent(instanceName)}`, { headers });
    if (response.ok) {
      const data = await response.json();
      const state = (data.instance?.state || data.state || data.status || '').toLowerCase();
      if (['open', 'connected', 'conectado'].includes(state)) return 'connected';
      if (['connecting', 'connecting...'].includes(state)) return 'connecting';
      if (['close', 'closed', 'disconnected'].includes(state)) return 'disconnected';
    }
    
    // Tentativa 2: Listar instâncias se a primeira falhar
    const listResponse = await fetch(`${config.apiUrl}/instance/fetchInstances`, { headers });
    if (listResponse.ok) {
        const listData = await listResponse.json();
        const list = Array.isArray(listData) ? listData : (listData.instances || []);
        const found = list.find((i: any) => (i.instanceName || i.name || i.instance?.instanceName || '').toLowerCase() === instanceName.toLowerCase());
        if (found) {
            const state = (found.instance?.state || found.status || found.state || '').toLowerCase();
            if (['open', 'connected', 'conectado'].includes(state)) return 'connected';
            if (['connecting'].includes(state)) return 'connecting';
        }
    }
    
    return 'disconnected';
  } catch (e) {
    return 'offline';
  }
};

export const fetchEvolutionMessages = async (number: string): Promise<ChatMessage[]> => {
  const config = getEvolutionConfig();
  if (!config?.apiUrl) return [];
  try {
    const instanceName = await resolveInstanceName(config);
    let cleanNumber = number.replace(/\D/g, '');
    
    // Auto-fix para números brasileiros: Garante 55 se não houver
    if (cleanNumber.length >= 10 && !cleanNumber.startsWith('55')) {
        cleanNumber = '55' + cleanNumber;
    }

    const headers = { 'Content-Type': 'application/json', 'apikey': config.apiKey };
    const response = await fetch(`${config.apiUrl}/chat/findMessages/${encodeURIComponent(instanceName)}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ 
        where: { remoteJid: `${cleanNumber}@s.whatsapp.net` }, 
        take: 30 
      })
    });
    
    if (!response.ok) return [];
    const data = await response.json();
    const messages = data.messages || data || [];
    if (!Array.isArray(messages)) return [];

    return messages.map((m: any) => {
      const content = 
        m.message?.conversation || 
        m.message?.extendedTextMessage?.text || 
        m.message?.imageMessage?.caption ||
        m.message?.videoMessage?.caption ||
        (m.message?.imageMessage ? '📷 Foto' : null) ||
        (m.message?.audioMessage ? '🎤 Áudio' : null) ||
        'Mensagem';

      return {
        id: m.key?.id || Math.random().toString(),
        patientId: number,
        direction: (m.key?.fromMe ? 'outbound' : 'inbound') as 'outbound' | 'inbound',
        content,
        timestamp: (m.messageTimestamp || Date.now() / 1000) * 1000,
        status: (m.status === 'READ' ? 'read' : 'delivered') as 'read' | 'delivered'
      } as ChatMessage;
    }).reverse(); 
  } catch (e) { return []; }
};

export const sendEvolutionMessage = async (number: string, text: string) => {
  const config = getEvolutionConfig();
  if (!config?.apiUrl) return null;
  try {
    const instanceName = await resolveInstanceName(config);
    let cleanNumber = number.replace(/\D/g, '');
    
    // Auto-fix DDI Brasil
    if (cleanNumber.length >= 10 && !cleanNumber.startsWith('55')) {
        cleanNumber = '55' + cleanNumber;
    }

    const headers = { 'Content-Type': 'application/json', 'apikey': config.apiKey };
    const response = await fetch(`${config.apiUrl}/message/sendText/${encodeURIComponent(instanceName)}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ 
        number: cleanNumber, 
        text: text, 
        delay: 1500,
        linkPreview: true
      })
    });
    return await response.json();
  } catch (e) { return null; }
};

export const testEvolutionConnection = async (config: EvolutionConfig): Promise<{ success: boolean; message: string }> => {
  if (!config.apiUrl || !config.apiKey || !config.instance) {
    return { success: false, message: 'Preencha todos os campos.' };
  }
  try {
    const cleanUrl = config.apiUrl.trim().replace(/\/+$/, '');
    const response = await fetch(`${cleanUrl}/instance/fetchInstances`, {
      headers: { 'apikey': config.apiKey }
    });
    if (!response.ok) return { success: false, message: `Erro API (${response.status})` };
    const data = await response.json();
    const list = Array.isArray(data) ? data : (data.instances || []);
    const found = list.find((i: any) => (i.instanceName || i.name || i.instance?.instanceName || '').toLowerCase() === config.instance.toLowerCase());
    if (!found) return { success: false, message: 'Instância não encontrada no servidor.' };
    
    const state = (found.instance?.state || found.status || found.state || found.connectionStatus || 'desconectado').toLowerCase();
    if (['open', 'connected', 'conectado'].includes(state)) return { success: true, message: 'Sucesso! WhatsApp Conectado.' };
    return { success: true, message: `Conectado à API, mas o WhatsApp está: ${state.toUpperCase()}.` };
  } catch (e: any) {
    return { success: false, message: `Erro de Rede/CORS: ${e.message}` };
  }
};
