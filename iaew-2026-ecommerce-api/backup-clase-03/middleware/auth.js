const usuariosDemo = {
  'cliente-demo': {
    id: 'usr-1',
    nombre: 'Cliente Demo',
    rol: 'cliente'
  },
  'admin-demo': {
    id: 'usr-2',
    nombre: 'Admin Demo',
    rol: 'admin'
  }
};

function requireApiKey(req, res, next) {
  const apiKey = req.header('x-api-key');
  const expectedApiKey = process.env.INTERNAL_API_KEY;

  if (!expectedApiKey) {
    return res.status(500).json({ error: 'API key interna no configurada' });
  }

  if (!apiKey || apiKey !== expectedApiKey) {
    return res.status(401).json({ error: 'API key inválida o ausente' });
  }

  next();
}

function requireAuth(req, res, next) {
  const authorization = req.header('authorization');

  if (!authorization || !authorization.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token ausente' });
  }

  const token = authorization.replace('Bearer ', '').trim();
  const usuario = usuariosDemo[token];

  if (!usuario) {
    return res.status(401).json({ error: 'Token inválido' });
  }

  req.user = usuario;
  next();
}

function requireRole(rolPermitido) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    if (req.user.rol !== rolPermitido) {
      return res.status(403).json({ error: 'Permisos insuficientes' });
    }

    next();
  };
}

module.exports = {
  requireApiKey,
  requireAuth,
  requireRole
};
