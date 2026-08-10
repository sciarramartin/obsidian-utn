const https = require('https');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function main() {
  const html = await fetchUrl('https://www.institucional.frc.utn.edu.ar/sistemas/Areas/Academica/Novedades.asp');
  console.log("Buscar 5K1 en Novedades Académicas:");
  const matches = html.match(/.*5K1.*/gi) || [];
  console.log("Matches:", matches);

  // Search in GetNoticiaPorPagina.asp for 5K1
  const querystring = require('querystring');
  const postData = querystring.stringify({ id: 2 }); // 2 = Académica
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
        const json = JSON.parse(data);
        const noticias5k1 = json.filter(item => {
          const desc = JSON.stringify(item);
          return desc.includes('5K1') || desc.includes('5k1') || desc.includes('Horario') || desc.includes('horario');
        });
        console.log("\nNoticias con 5K1 u Horarios en Académica:", noticias5k1.length);
        noticias5k1.forEach(n => {
          const obj = n.NoticiaObject || {};
          console.log(`\n- Título: ${obj.titulo}`);
          console.log(`  Fecha: ${n.fechaPublicacion}`);
          console.log(`  Enlace: https://www.institucional.frc.utn.edu.ar/sistemas/Areas/noticias/Detalle.asp?${n.codNoticia}`);
        });
      } catch (e) {
        console.error(e);
      }
    });
  });
  req.write(postData);
  req.end();
}

main().catch(console.error);
