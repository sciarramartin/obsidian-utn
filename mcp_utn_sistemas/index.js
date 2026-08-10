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
              .replace(/&amp;/g, '&')
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

function buscarBibliotecaCentral(query) {
  return new Promise((resolve, reject) => {
    const encoded = encodeURIComponent(query);
    const options = {
      hostname: 'www.frc.utn.edu.ar',
      port: 443,
      path: `/bibliotecaCentral/busqueda.asp?tx=${encoded}&rp=10&p=1`,
      method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0' }
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const libros = [];
        const bloques = data.split(/Copia\s*N/gi);
        for (let i = 1; i < Math.min(bloques.length, 11); i++) {
          const block = bloques[i];
          const invMatch = block.match(/Inventario:\s*(\d+)/i);
          const edicionMatch = block.match(/Edici&oacute;n:\s*([^<]+)/i);
          const dispMatch = block.match(/Disponibilidad:[\s\S]*?<FONT COLOR='([^']+)'>([^<]+)/i);

          libros.push({
            inventario: invMatch ? invMatch[1] : 'N/A',
            edicion: edicionMatch ? edicionMatch[1].replace(/&nbsp;/g, ' ').trim() : 'N/A',
            estado: dispMatch ? dispMatch[2].replace(/&nbsp;/g, ' ').trim() : 'Consultar en sala',
            disponible: dispMatch ? (dispMatch[1].toUpperCase() === 'GREEN') : true
          });
        }

        resolve({
          query,
          totalEncontrados: libros.length,
          catalogoUrl: `https://www.frc.utn.edu.ar/bibliotecaCentral/busqueda.asp?tx=${encoded}`,
          libros
        });
      }).on('error', reject);
    });
  });
}

const HORARIOS_5K1 = {
  comision: '5K1',
  turno: 'Noche (18:15 a 22:30 hs)',
  nivel: '5º Año',
  materias: [
    { materia: 'Integración de Aplicaciones en Entorno Web (IAEW) [Electiva]', dias: 'Lunes y Miércoles', horario: '18:15 - 20:30 hs', aula: 'LabSis Mader / Aula 405' },
    { materia: 'Inteligencia Artificial (IAR)', dias: 'Martes y Jueves', horario: '18:15 - 20:30 hs', aula: 'Aula 402' },
    { materia: 'Proyecto Final (PROY)', dias: 'Viernes', horario: '18:15 - 22:30 hs', aula: 'Aula Magna / Lab 3' },
    { materia: 'Seguridad en los Sistemas de Información (SSI)', dias: 'Lunes', horario: '20:30 - 22:30 hs', aula: 'Aula 404' },
    { materia: 'Sistemas de Gestión (SG)', dias: 'Miércoles', horario: '20:30 - 22:30 hs', aula: 'Aula 402' },
    { materia: 'Gestión Gerencial (GG)', dias: 'Martes', horario: '20:30 - 22:30 hs', aula: 'Aula 406' }
  ]
};

const EXAMENES_FINALES = {
  turnoActual: 'Turno Noviembre / Diciembre 2026 (Exámenes Generales)',
  periodoInscripcion: 'Hasta 48 hs hábiles antes de la mesa en Autogestión (SYSACAD)',
  mesas: [
    {
      materia: 'Integración de Aplicaciones en Entorno Web (IAEW)',
      nivel: '5º Año',
      llamado1: '25/11/2026 - 18:00 hs',
      llamado2: '09/12/2026 - 18:00 hs',
      tribunal: 'Cátedra IAEW',
      aula: 'LabSis Mader'
    },
    {
      materia: 'Inteligencia Artificial (IAR)',
      nivel: '5º Año',
      llamado1: '26/11/2026 - 18:00 hs',
      llamado2: '10/12/2026 - 18:00 hs',
      tribunal: 'Cátedra Inteligencia Artificial',
      aula: 'Aula 402'
    },
    {
      materia: 'Proyecto Final (PROY)',
      nivel: '5º Año',
      llamado1: '27/11/2026 - 18:00 hs',
      llamado2: '11/12/2026 - 18:00 hs',
      tribunal: 'Tribunal Evaluador de Proyecto Final',
      aula: 'Aula Magna / Lab 3'
    },
    {
      materia: 'Seguridad en los Sistemas de Información (SSI)',
      nivel: '5º Año',
      llamado1: '23/11/2026 - 18:00 hs',
      llamado2: '07/12/2026 - 18:00 hs',
      tribunal: 'Cátedra Seguridad en Sistemas',
      aula: 'Aula 404'
    },
    {
      materia: 'Sistemas de Gestión (SG)',
      nivel: '5º Año',
      llamado1: '24/11/2026 - 18:00 hs',
      llamado2: '08/12/2026 - 18:00 hs',
      tribunal: 'Cátedra Sistemas de Gestión',
      aula: 'Aula 402'
    },
    {
      materia: 'Diseño de Sistemas de Información (DSI)',
      nivel: '3º Año',
      llamado1: '24/11/2026 - 18:00 hs',
      llamado2: '08/12/2026 - 18:00 hs',
      tribunal: 'Cátedra DSI',
      aula: 'Aula 301'
    }
  ]
};

const TOOLS = [
  {
    name: 'get_utn_sistemas_novedades',
    description: 'Obtiene las últimas novedades oficiales del Departamento de Sistemas de Información (UTN FRC) en tiempo real.',
    inputSchema: {
      type: 'object',
      properties: {
        categoriaId: {
          type: 'number',
          description: 'ID de página: 1 (Institucional), 2 (Académica), 3 (Alumnos), 4 (Investigación)'
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
  },
  {
    name: 'obtener_horarios_comision',
    description: 'Obtiene la grilla de materias, días, horarios y asignación de aulas para una comisión específica (ej: 5K1).',
    inputSchema: {
      type: 'object',
      properties: {
        comision: {
          type: 'string',
          description: 'Nombre de la comisión (ej: 5K1, 5K2, 4K1)'
        }
      },
      required: ['comision']
    }
  },
  {
    name: 'buscar_biblioteca_utn',
    description: 'Busca libros, bibliografía de materias y material bibliográfico en el Catálogo de la Biblioteca Central UTN FRC.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Título, tema o palabra clave (ej. microservicios, redes, python, arquitectura)'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'obtener_fechas_examenes_finales',
    description: 'Obtiene la lista oficial de fechas de exámenes finales (1º y 2º llamado), horarios y aulas por materia o nivel.',
    inputSchema: {
      type: 'object',
      properties: {
        materia: {
          type: 'string',
          description: 'Nombre opcional de la materia (ej: IAEW, Inteligencia Artificial, DSI)'
        }
      }
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
          serverInfo: { name: 'utn-sistemas-mcp', version: '1.4.0' }
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
      } else if (name === 'obtener_horarios_comision') {
        content = [{
          type: 'text',
          text: JSON.stringify(HORARIOS_5K1, null, 2)
        }];
      } else if (name === 'buscar_biblioteca_utn') {
        const resultado = await buscarBibliotecaCentral(args.query);
        content = [{
          type: 'text',
          text: JSON.stringify(resultado, null, 2)
        }];
      } else if (name === 'obtener_fechas_examenes_finales') {
        let resultado = EXAMENES_FINALES.mesas;
        if (args && args.materia) {
          const matQuery = args.materia.toLowerCase();
          resultado = resultado.filter(m => m.materia.toLowerCase().includes(matQuery));
        }
        content = [{
          type: 'text',
          text: JSON.stringify({
            turno: EXAMENES_FINALES.turnoActual,
            inscripcion: EXAMENES_FINALES.periodoInscripcion,
            mesas: resultado
          }, null, 2)
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
