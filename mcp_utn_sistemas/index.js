#!/usr/bin/env node
const https = require('https');
const readline = require('readline');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (!redirectUrl.startsWith('http')) {
          redirectUrl = 'https://www.institucional.frc.utn.edu.ar' + redirectUrl;
        }
        return fetchUrl(redirectUrl).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function parseNews(html) {
  const news = [];
  const regex = /<a[^>]+href=["']([^"']*Detalle\.asp\?[^"']+)["'][^>]*>(.*?)<\/a>/gi;
  let match;
  const seen = new Set();

  while ((match = regex.exec(html)) !== null) {
    let link = match[1];
    if (!link.startsWith('http')) {
      link = 'https://www.institucional.frc.utn.edu.ar' + (link.startsWith('/') ? '' : '/sistemas/') + link;
    }
    const title = match[2].replace(/<[^>]+>/g, '').trim();
    if (title && !seen.has(link)) {
      seen.add(link);
      news.push({ title, url: link });
    }
  }
  return news;
}

const TOOLS = [
  {
    name: 'get_utn_sistemas_novedades',
    description: 'Obtiene las últimas novedades e institucionales del Departamento de Ingeniería en Sistemas de Información (UTN FRC).',
    inputSchema: {
      type: 'object',
      properties: {
        categoria: {
          type: 'string',
          description: 'Categoría opcional: institucional, academica, alumnos, investigacion'
        }
      }
    }
  },
  {
    name: 'buscar_novedades_utn',
    description: 'Busca novedades y anuncios en la web del Departamento de Sistemas de Información (UTN FRC) por palabra clave.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Término de búsqueda (ej. examen, horarios, electiva, proyecto final)'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'obtener_detalle_noticia_utn',
    description: 'Obtiene el texto completo de una noticia o aviso del Departamento de Sistemas por su URL.',
    inputSchema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'URL de la noticia en la UTN FRC'
        }
      },
      required: ['url']
    }
  }
];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

rl.on('line', async (line) => {
  if (!line.trim()) return;
  try {
    const req = JSON.parse(line);
    const { id, method, params } = req;

    if (method === 'initialize') {
      sendJson({
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {} },
          serverInfo: { name: 'utn-sistemas-mcp', version: '1.0.0' }
        }
      });
    } else if (method === 'notifications/initialized') {
      // Notification
    } else if (method === 'tools/list') {
      sendJson({
        jsonrpc: '2.0',
        id,
        result: { tools: TOOLS }
      });
    } else if (method === 'tools/call') {
      const { name, arguments: args } = params;
      let content = [];

      if (name === 'get_utn_sistemas_novedades') {
        const cat = (args && args.categoria) ? args.categoria.toLowerCase() : 'institucional';
        let targetUrl = 'https://www.institucional.frc.utn.edu.ar/Sistemas/';
        if (cat === 'academica') targetUrl = 'https://www.institucional.frc.utn.edu.ar/sistemas/Areas/Academica/Novedades.asp';
        if (cat === 'alumnos') targetUrl = 'https://www.institucional.frc.utn.edu.ar/sistemas/Areas/Alumnos/Novedades.asp';
        if (cat === 'investigacion') targetUrl = 'https://www.institucional.frc.utn.edu.ar/sistemas/Areas/Investigacion/Novedades.asp';

        const html = await fetchUrl(targetUrl);
        const news = parseNews(html);
        content = [{
          type: 'text',
          text: JSON.stringify({ total: news.length, categoria: cat, novedades: news }, null, 2)
        }];
      } else if (name === 'buscar_novedades_utn') {
        const query = args.query.toLowerCase();
        const html = await fetchUrl('https://www.institucional.frc.utn.edu.ar/Sistemas/');
        const news = parseNews(html);
        const filtered = news.filter(n => n.title.toLowerCase().includes(query));
        content = [{
          type: 'text',
          text: JSON.stringify({ query, resultados: filtered.length, novedades: filtered }, null, 2)
        }];
      } else if (name === 'obtener_detalle_noticia_utn') {
        const html = await fetchUrl(args.url);
        const cleanText = html.replace(/<script\b[^<]*>([\s\S]*?)<\/script>/gi, '')
                              .replace(/<style\b[^<]*>([\s\S]*?)<\/style>/gi, '')
                              .replace(/<[^>]+>/g, ' ')
                              .replace(/\s+/g, ' ')
                              .trim();
        content = [{
          type: 'text',
          text: cleanText.substring(0, 4000)
        }];
      } else {
        throw new Error(`Tool unknown: ${name}`);
      }

      sendJson({
        jsonrpc: '2.0',
        id,
        result: { content }
      });
    } else {
      sendJson({
        jsonrpc: '2.0',
        id,
        error: { code: -32601, message: 'Method not found' }
      });
    }
  } catch (err) {
    console.error('MCP Error:', err);
  }
});

function sendJson(obj) {
  process.stdout.write(JSON.stringify(obj) + '\n');
}
