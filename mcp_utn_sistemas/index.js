#!/usr/bin/env node
const https = require('https');
const querystring = require('querystring');
const readline = require('readline');

function fetchNoticiasFromApi(paginaId = 1) {
  return new Promise((resolve, reject) => {
    const postData = querystring.stringify({ id: paginaId });
    const options = {
      hostname: 'www.institucional.frc.utn.edu.ar',
      port: 443,
      path: '/Sistemas/Admin/Core/Rules/GetNoticiaPorPagina.asp',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'Mozilla/5.0'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const raw = JSON.parse(data);
          const formatted = raw.map(item => {
            const obj = item.NoticiaObject || {};
            const cleanDesc = (obj.descripcion || '')
              .replace(/<[^>]+>/g, ' ')
              .replace(/&nbsp;/g, ' ')
              .replace(/&iacute;/g, 'í')
              .replace(/&oacute;/g, 'ó')
              .replace(/&aacute;/g, 'á')
              .replace(/&eacute;/g, 'é')
              .replace(/&uacute;/g, 'ú')
              .replace(/&ntilde;/g, 'ñ')
              .replace(/\s+/g, ' ')
              .trim();

            return {
              id: item.codNoticia,
              titulo: obj.titulo || 'Sin título',
              fecha: item.fechaPublicacion || obj.fechaCreacion || 'Reciente',
              resumen: cleanDesc.substring(0, 300) + (cleanDesc.length > 300 ? '...' : ''),
              link: `https://www.institucional.frc.utn.edu.ar/sistemas/Areas/noticias/Detalle.asp?${item.codNoticia}`
            };
          });
          resolve(formatted);
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

const TOOLS = [
  {
    name: 'get_utn_sistemas_novedades',
    description: 'Obtiene las últimas novedades oficiales del Departamento de Sistemas de Información (UTN FRC) en tiempo real.',
    inputSchema: {
      type: 'object',
      properties: {
        categoriaId: {
          type: 'number',
          description: 'ID de página: 1 (Institucional/General), 2 (Académica), 3 (Alumnos), 4 (Investigación)'
        }
      }
    }
  },
  {
    name: 'buscar_novedades_utn',
    description: 'Busca entre todas las publicaciones oficiales de la UTN FRC por palabra clave.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Término de búsqueda (ej: intensivo, examen, electiva, horarios)'
        }
      },
      required: ['query']
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
          serverInfo: { name: 'utn-sistemas-mcp', version: '1.1.0' }
        }
      });
    } else if (method === 'notifications/initialized') {
      // Handshake initialized
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
        const catId = (args && args.categoriaId) ? args.categoriaId : 1;
        const noticias = await fetchNoticiasFromApi(catId);
        content = [{
          type: 'text',
          text: JSON.stringify({ total: noticias.length, novedades: noticias }, null, 2)
        }];
      } else if (name === 'buscar_novedades_utn') {
        const query = args.query.toLowerCase();
        const noticias = await fetchNoticiasFromApi(1);
        const filtradas = noticias.filter(n => 
          n.titulo.toLowerCase().includes(query) || n.resumen.toLowerCase().includes(query)
        );
        content = [{
          type: 'text',
          text: JSON.stringify({ query, totalResultados: filtradas.length, resultados: filtradas }, null, 2)
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
    console.error('MCP Server Error:', err);
  }
});

function sendJson(obj) {
  process.stdout.write(JSON.stringify(obj) + '\n');
}
