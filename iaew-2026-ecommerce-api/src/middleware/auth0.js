require('dotenv').config();
const { auth, requiredScopes } = require('express-oauth2-jwt-bearer');

const isRealAuth0 =
  process.env.AUTH0_DOMAIN &&
  process.env.AUTH0_DOMAIN !== 'tu-tenant.us.auth0.com' &&
  !process.env.AUTH0_DOMAIN.includes('tu-tenant');

let validateAccessToken;
let requireScope;

if (isRealAuth0) {
  validateAccessToken = auth({
    issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}`,
    audience: process.env.AUTH0_AUDIENCE,
    tokenSigningAlg: 'RS256'
  });

  requireScope = function (scope) {
    return [validateAccessToken, requiredScopes(scope)];
  };
} else {
  // Modo desarrollo local: permite realizar pruebas y demostraciones de A5
  validateAccessToken = (req, res, next) => {
    const authHeader = req.header('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const err = new Error('Token ausente');
      err.status = 401;
      return next(err);
    }
    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) {
      const err = new Error('Token inválido');
      err.status = 401;
      return next(err);
    }

    req.auth = {
      payload: {
        iss: 'https://demo-local.auth0.com/',
        aud: process.env.AUTH0_AUDIENCE || 'https://iaew-pedidos-api',
        sub: 'estudiante-demo',
        scope: token === 'sin-permisos' ? '' : 'read:pedidos write:pedidos confirm:pedidos'
      }
    };
    next();
  };

  requireScope = function (scope) {
    return [
      validateAccessToken,
      (req, res, next) => {
        const userScopes = (req.auth?.payload?.scope || '').split(' ');
        if (!userScopes.includes(scope)) {
          const err = new Error(`Permisos insuficientes para el scope ${scope}`);
          err.status = 403;
          return next(err);
        }
        next();
      }
    ];
  };
}

module.exports = { validateAccessToken, requireScope };
