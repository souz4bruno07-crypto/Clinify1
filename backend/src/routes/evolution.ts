import { Router, Response } from 'express';
import prisma from '../config/database.js';
import { authMiddleware, AuthRequest } from '../middlewares/auth.js';
import { logger } from '../config/logger.js';

const router = Router();

router.use(authMiddleware);

interface EvolutionConfig {
  apiUrl: string;
  apiKey: string;
  instance?: string;
}

// Função auxiliar para fazer requisições ao Evolution API
async function evolutionRequest(
  config: EvolutionConfig,
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const cleanUrl = config.apiUrl.trim().replace(/\/+$/, '');
  const url = `${cleanUrl}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    'apikey': config.apiKey,
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json() as any;
    
    if (!response.ok) {
      throw new Error((data as { message?: string })?.message || `Erro ${response.status}`);
    }

    return data;
  } catch (error: any) {
    logger.error('Erro na requisição Evolution API:', error);
    throw error;
  }
}

// GET /api/evolution/config - Obter configuração do Evolution do usuário
router.get('/config', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const config = await prisma.evolutionConfig.findUnique({
      where: { userId: req.userId! }
    });

    if (!config) {
      res.json({ config: null });
      return;
    }

    res.json({
      config: {
        apiUrl: config.apiUrl,
        instance: config.instance,
        // Não retornar apiKey por segurança
      }
    });
  } catch (error) {
    logger.error('Erro ao buscar config Evolution:', error);
    res.status(500).json({ error: 'Erro ao buscar configuração' });
  }
});

// POST /api/evolution/config - Salvar configuração do Evolution
router.post('/config', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { apiUrl, apiKey, instance } = req.body;

    if (!apiUrl || !apiKey) {
      res.status(400).json({ error: 'apiUrl e apiKey são obrigatórios' });
      return;
    }

    // Validar conexão com a API antes de salvar
    try {
      const cleanUrl = apiUrl.trim().replace(/\/+$/, '');
      const testResponse = await fetch(`${cleanUrl}/instance/fetchInstances`, {
        headers: { 'apikey': apiKey }
      });

      if (!testResponse.ok) {
        res.status(400).json({ error: 'Não foi possível conectar à API Evolution. Verifique a URL e a API Key.' });
        return;
      }
    } catch (error) {
      res.status(400).json({ error: 'Erro ao validar conexão com Evolution API' });
      return;
    }

    // Salvar configuração (criptografar apiKey em produção seria ideal)
    await prisma.evolutionConfig.upsert({
      where: { userId: req.userId! },
      update: {
        apiUrl: apiUrl.trim(),
        apiKey: apiKey.trim(), // Em produção, criptografar isso
        instance: instance?.trim() || null,
      },
      create: {
        userId: req.userId!,
        apiUrl: apiUrl.trim(),
        apiKey: apiKey.trim(),
        instance: instance?.trim() || null,
      }
    });

    res.json({ success: true });
  } catch (error) {
    logger.error('Erro ao salvar config Evolution:', error);
    res.status(500).json({ error: 'Erro ao salvar configuração' });
  }
});

// GET /api/evolution/instances - Listar instâncias disponíveis
router.get('/instances', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const config = await prisma.evolutionConfig.findUnique({
      where: { userId: req.userId! }
    });

    if (!config) {
      res.status(404).json({ error: 'Configuração do Evolution não encontrada' });
      return;
    }

    const instances = await evolutionRequest(
      { apiUrl: config.apiUrl, apiKey: config.apiKey },
      '/instance/fetchInstances',
      { method: 'GET' }
    );

    const list = Array.isArray(instances) ? instances : (instances.instances || []);
    
    res.json({ instances: list });
  } catch (error: any) {
    logger.error('Erro ao listar instâncias:', error);
    res.status(500).json({ error: error.message || 'Erro ao listar instâncias' });
  }
});

// POST /api/evolution/instance/create - Criar nova instância
router.post('/instance/create', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { instanceName } = req.body;

    if (!instanceName || typeof instanceName !== 'string' || instanceName.trim().length === 0) {
      res.status(400).json({ error: 'Nome da instância é obrigatório' });
      return;
    }

    const config = await prisma.evolutionConfig.findUnique({
      where: { userId: req.userId! }
    });

    if (!config) {
      res.status(404).json({ error: 'Configuração do Evolution não encontrada. Configure primeiro a API URL e Key.' });
      return;
    }

    // Verificar se já existe uma instância com esse nome
    try {
      const instances = await evolutionRequest(
        { apiUrl: config.apiUrl, apiKey: config.apiKey },
        '/instance/fetchInstances',
        { method: 'GET' }
      );

      const list = Array.isArray(instances) ? instances : (instances.instances || []);
      const existing = list.find((i: any) => 
        (i.instanceName || i.name || i.instance?.instanceName || '').toLowerCase() === instanceName.toLowerCase()
      );

      if (existing) {
        // Se já existe e está conectada, retornar sucesso
        const state = (existing.instance?.state || existing.status || existing.state || '').toLowerCase();
        if (['open', 'connected', 'conectado'].includes(state)) {
          // Atualizar a instância na configuração
          await prisma.evolutionConfig.update({
            where: { userId: req.userId! },
            data: { instance: instanceName }
          });

          res.json({ 
            success: true, 
            message: 'Instância já existe e está conectada',
            instanceName,
            alreadyExists: true
          });
          return;
        }

        // Se existe mas não está conectada, tentar conectar
        const connectResult = await evolutionRequest(
          { apiUrl: config.apiUrl, apiKey: config.apiKey, instance: instanceName },
          `/instance/connect/${encodeURIComponent(instanceName)}`,
          { method: 'GET' }
        );

        await prisma.evolutionConfig.update({
          where: { userId: req.userId! },
          data: { instance: instanceName }
        });

        res.json({ 
          success: true, 
          message: 'Instância encontrada, tentando conectar...',
          instanceName,
          alreadyExists: true,
          qrCode: connectResult.base64 || connectResult.qrcode?.base64 || null
        });
        return;
      }
    } catch (error) {
      // Continuar para criar nova instância
    }

    // Criar nova instância
    const result = await evolutionRequest(
      { apiUrl: config.apiUrl, apiKey: config.apiKey },
      '/instance/create',
      {
        method: 'POST',
        body: JSON.stringify({
          instanceName: instanceName.trim(),
          token: instanceName.trim(), // Token geralmente é o mesmo que instanceName
          qrcode: true,
          integration: 'WHATSAPP-BAILEYS',
        })
      }
    );

    // Atualizar configuração com o nome da instância
    await prisma.evolutionConfig.update({
      where: { userId: req.userId! },
      data: { instance: instanceName.trim() }
    });

    // Obter QR Code
    const qrCode = result.qrcode?.base64 || result.base64 || null;

    res.json({
      success: true,
      instanceName: instanceName.trim(),
      qrCode: qrCode ? (qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`) : null,
      message: 'Instância criada com sucesso. Escaneie o QR Code para conectar.'
    });
  } catch (error: any) {
    logger.error('Erro ao criar instância:', error);
    res.status(500).json({ error: error.message || 'Erro ao criar instância' });
  }
});

// GET /api/evolution/qrcode - Obter QR Code da instância
router.get('/qrcode', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const config = await prisma.evolutionConfig.findUnique({
      where: { userId: req.userId! }
    });

    if (!config || !config.instance) {
      res.status(404).json({ error: 'Instância não configurada' });
      return;
    }

    const result = await evolutionRequest(
      { apiUrl: config.apiUrl, apiKey: config.apiKey, instance: config.instance },
      `/instance/connect/${encodeURIComponent(config.instance)}`,
      { method: 'GET' }
    );

    // Verificar se já está conectado
    if (result.status === 'open' || result.instance?.state === 'open') {
      res.json({ 
        code: 'CONNECTED_ALREADY',
        connected: true 
      });
      return;
    }

    const qrCode = result.base64 || result.qrcode?.base64 || result.code || null;

    if (qrCode && typeof qrCode === 'string' && qrCode.length > 50) {
      res.json({
        code: qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`,
        connected: false
      });
    } else {
      res.json({
        code: null,
        error: 'Aguardando QR Code do servidor...',
        connected: false
      });
    }
  } catch (error: any) {
    logger.error('Erro ao obter QR Code:', error);
    
    if (error.message?.includes('already connected')) {
      res.json({ code: 'CONNECTED_ALREADY', connected: true });
      return;
    }

    res.status(500).json({ error: error.message || 'Erro ao obter QR Code' });
  }
});

// GET /api/evolution/status - Verificar status da conexão
router.get('/status', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const config = await prisma.evolutionConfig.findUnique({
      where: { userId: req.userId! }
    });

    if (!config || !config.instance) {
      res.json({ status: 'disconnected', message: 'Instância não configurada' });
      return;
    }

    try {
      const result = await evolutionRequest(
        { apiUrl: config.apiUrl, apiKey: config.apiKey, instance: config.instance },
        `/instance/connectionState/${encodeURIComponent(config.instance)}`,
        { method: 'GET' }
      );

      const state = (result.instance?.state || result.state || result.status || '').toLowerCase();
      
      if (['open', 'connected', 'conectado'].includes(state)) {
        res.json({ status: 'connected', message: 'WhatsApp conectado' });
        return;
      }
      
      if (['connecting', 'connecting...'].includes(state)) {
        res.json({ status: 'connecting', message: 'Conectando...' });
        return;
      }

      res.json({ status: 'disconnected', message: 'WhatsApp desconectado' });
    } catch (error) {
      // Tentar método alternativo
      const instances = await evolutionRequest(
        { apiUrl: config.apiUrl, apiKey: config.apiKey },
        '/instance/fetchInstances',
        { method: 'GET' }
      );

      const list = Array.isArray(instances) ? instances : (instances.instances || []);
      const found = list.find((i: any) => 
        (i.instanceName || i.name || i.instance?.instanceName || '').toLowerCase() === config.instance!.toLowerCase()
      );

      if (found) {
        const state = (found.instance?.state || found.status || found.state || '').toLowerCase();
        if (['open', 'connected', 'conectado'].includes(state)) {
          res.json({ status: 'connected', message: 'WhatsApp conectado' });
          return;
        }
        if (['connecting'].includes(state)) {
          res.json({ status: 'connecting', message: 'Conectando...' });
          return;
        }
      }

      res.json({ status: 'disconnected', message: 'WhatsApp desconectado' });
    }
  } catch (error: any) {
    logger.error('Erro ao verificar status:', error);
    res.json({ status: 'offline', message: 'Erro ao verificar status' });
  }
});

// DELETE /api/evolution/instance - Deletar instância
router.delete('/instance', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const config = await prisma.evolutionConfig.findUnique({
      where: { userId: req.userId! }
    });

    if (!config || !config.instance) {
      res.status(404).json({ error: 'Instância não configurada' });
      return;
    }

    await evolutionRequest(
      { apiUrl: config.apiUrl, apiKey: config.apiKey, instance: config.instance },
      `/instance/delete/${encodeURIComponent(config.instance)}`,
      { method: 'DELETE' }
    );

    // Limpar instância da configuração
    await prisma.evolutionConfig.update({
      where: { userId: req.userId! },
      data: { instance: null }
    });

    res.json({ success: true, message: 'Instância deletada com sucesso' });
  } catch (error: any) {
    logger.error('Erro ao deletar instância:', error);
    res.status(500).json({ error: error.message || 'Erro ao deletar instância' });
  }
});

export default router;
