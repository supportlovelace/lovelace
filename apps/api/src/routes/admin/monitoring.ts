import { Hono } from 'hono';
import axios from 'axios';
import { io } from '../../index';

const app = new Hono();

// Endpoint pour recevoir les webhooks de Keep
app.post('/alerts/webhook', async (c) => {
  try {
    const data = await c.req.json();
    
    // On émet l'événement via Socket.io pour l'Admin
    io.emit('new-alert', data);

    return c.json({ success: true });
  } catch (error: any) {
    console.error('[Monitoring-Webhook] Erreur:', error.message);
    return c.json({ error: 'Invalid payload' }, 400);
  }
});

app.get('/alerts', async (c) => {
  const apiUrl = process.env.MONITORING_API_URL;
  const apiKey = process.env.MONITORING_API_KEY;

  if (!apiUrl) {
    return c.json({ error: 'Monitoring API URL non configurée' }, 500);
  }

  try {
    const response = await axios.get(`${apiUrl}/alerts`, {
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 5000,
    });

    return c.json({ alerts: response.data });
  } catch (error: any) {
    console.error('[Monitoring] Erreur lors de la récupération des alertes:', error.message);
    return c.json({ 
      error: 'Impossible de récupérer les alertes',
      details: error.response?.data || error.message 
    }, 500);
  }
});

app.get('/alerts/:id', async (c) => {
  const { id } = c.req.param();
  const apiUrl = process.env.MONITORING_API_URL;
  const apiKey = process.env.MONITORING_API_KEY;

  if (!apiUrl) return c.json({ error: 'Config manquante' }, 500);

  try {
    const response = await axios.get(`${apiUrl.replace(/\/+$/, '')}/alerts/${id}`, {
      headers: {
        'X-API-KEY': apiKey,
        'Accept': 'application/json',
      },
    });

    return c.json({ alert: response.data });
  } catch (error: any) {
    return c.json({ error: 'Impossible de récupérer le détail' }, 500);
  }
});

app.get('/alerts/:fingerprint/events', async (c) => {
  const { fingerprint } = c.req.param();
  const apiUrl = process.env.MONITORING_API_URL;
  const apiKey = process.env.MONITORING_API_KEY;

  if (!apiUrl) return c.json({ error: 'Config manquante' }, 500);

  const fullUrl = `${apiUrl.replace(/\/+$/, '')}/alerts/${fingerprint}/history`;

  try {
    const response = await axios.get(fullUrl, {
      headers: {
        'X-API-KEY': apiKey,
        'Accept': 'application/json',
      },
    });

    return c.json({ events: response.data });
  } catch (error: any) {
    console.error(`[Monitoring] Erreur history pour ${fingerprint}:`, error.message);
    return c.json({ error: 'Impossible de récupérer l\'historique' }, 500);
  }
});

export default app;
