/**
 * IAEW 2026 - Single Page Application OIDC con PKCE
 * Implementación nativa de RFC 7636 usando Web Crypto API
 * Client: spa-69650-martinsciarra (Público, sin client_secret)
 */

// ==========================================
// 1. CONFIGURACIÓN DEL IDENTITY PROVIDER
// ==========================================
const CONFIG = {
  get clientId() {
    return document.getElementById('inputClientId')?.value || 'spa-69650-martinsciarra';
  },
  get redirectUri() {
    return document.getElementById('inputRedirectUri')?.value || 'http://localhost:4200/login-callback';
  },
  get realmUrl() {
    return document.getElementById('inputRealmUrl')?.value || 'https://labsys.frc.utn.edu.ar/aim/realms/dds-materia';
  },
  get authEndpoint() {
    return `${this.realmUrl}/protocol/openid-connect/auth`;
  },
  get tokenEndpoint() {
    return `${this.realmUrl}/protocol/openid-connect/token`;
  },
  get userInfoEndpoint() {
    return `${this.realmUrl}/protocol/openid-connect/userinfo`;
  },
  get logoutEndpoint() {
    return `${this.realmUrl}/protocol/openid-connect/logout`;
  },
  scope: 'openid email profile'
};

// ==========================================
// 2. UTILIDADES CRIPTOGRÁFICAS PKCE (RFC 7636)
// ==========================================

// Genera una cadena aleatoria de alta entropía (code_verifier)
function generateRandomString(length = 64) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const randomValues = new Uint8Array(length);
  window.crypto.getRandomValues(randomValues);
  return Array.from(randomValues).map(v => charset[v % charset.length]).join('');
}

// Convierte un ArrayBuffer a formato Base64URL
function bufferToBase64Url(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Calcula el code_challenge = Base64Url(SHA256(code_verifier))
async function generateCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return bufferToBase64Url(digest);
}

// Decodifica el payload de un JWT
function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Error parseando JWT', e);
    return null;
  }
}

// ==========================================
// 3. LOGGING VISUAL DE EVENTOS
// ==========================================
function log(msg, type = 'info') {
  const terminal = document.getElementById('terminalLogs');
  if (!terminal) return;
  const now = new Date().toLocaleTimeString();
  const entry = document.createElement('div');
  entry.className = 'log-entry';
  entry.innerHTML = `<span class="log-time">[${now}]</span> <span class="log-msg log-${type}">${msg}</span>`;
  terminal.appendChild(entry);
  terminal.scrollTop = terminal.scrollHeight;
  console.log(`[${type.toUpperCase()}] ${msg}`);
}

function updateStepper(activeStep, completedSteps = []) {
  for (let i = 1; i <= 5; i++) {
    const stepEl = document.getElementById(`step${i}`);
    if (!stepEl) continue;
    stepEl.classList.remove('active', 'completed');
    if (completedSteps.includes(i)) {
      stepEl.classList.add('completed');
    } else if (i === activeStep) {
      stepEl.classList.add('active');
    }
  }
}

// ==========================================
// 4. FLUJO DE AUTENTICACIÓN PKCE
// ==========================================

// Iniciar sesión
async function login(corruptVerifier = false) {
  try {
    log('1. Iniciando proceso de Login Delegado con PKCE...', 'info');
    updateStepper(1);

    // 1. Generar verifier y state
    const codeVerifier = generateRandomString(64);
    const state = generateRandomString(32);
    const nonce = generateRandomString(32);

    // 2. Generar challenge
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    log(`Verifier generado: ${codeVerifier.substring(0, 15)}... (longitud: ${codeVerifier.length})`, 'info');
    log(`Challenge (SHA-256): ${codeChallenge}`, 'info');

    // Almacenar en sessionStorage para el callback
    if (corruptVerifier) {
      // Caso de prueba para simular ataque / error
      sessionStorage.setItem('pkce_code_verifier', codeVerifier + '_CORRUPTED_BY_ATTACKER');
      log('⚠️ MODO SIMULACIÓN DE ATAQUE: Guardando code_verifier adulterado en sessionStorage...', 'warn');
    } else {
      sessionStorage.setItem('pkce_code_verifier', codeVerifier);
    }
    sessionStorage.setItem('pkce_state', state);

    updateStepper(2, [1]);
    log(`2. Redirigiendo a Keycloak: ${CONFIG.authEndpoint}`, 'info');

    // Construir URL de autorización
    const params = new URLSearchParams({
      client_id: CONFIG.clientId,
      redirect_uri: CONFIG.redirectUri,
      response_type: 'code',
      scope: CONFIG.scope,
      state: state,
      nonce: nonce,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256'
    });

    const fullAuthUrl = `${CONFIG.authEndpoint}?${params.toString()}`;
    
    // Pequeño delay de 400ms para que se visualice el log
    setTimeout(() => {
      window.location.href = fullAuthUrl;
    }, 400);

  } catch (err) {
    log(`Error al iniciar login: ${err.message}`, 'error');
  }
}

// Manejar el retorno del Identity Provider
async function handleCallback() {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  const state = urlParams.get('state');
  const error = urlParams.get('error');
  const errorDescription = urlParams.get('error_description');

  if (error) {
    log(`Error devuelto por Keycloak: ${error} - ${errorDescription}`, 'error');
    cleanUrl();
    return;
  }

  if (!code) {
    // Si no hay código en la URL, verificamos si ya había sesión guardada
    restoreSession();
    return;
  }

  log('3. ¡Callback recibido exitosamente desde Keycloak!', 'success');
  log(`Authorization Code: ${code.substring(0, 25)}...`, 'info');
  updateStepper(3, [1, 2]);

  // Validar State CSRF
  const savedState = sessionStorage.getItem('pkce_state');
  if (state && savedState && state !== savedState) {
    log('❌ Error de seguridad CSRF: El parámetro state devuelto no coincide con el guardado', 'error');
    cleanUrl();
    return;
  }

  // Obtener el code_verifier original
  const codeVerifier = sessionStorage.getItem('pkce_code_verifier');
  if (!codeVerifier) {
    log('❌ Error: No se encontró el code_verifier en sessionStorage. La sesión pudo haber expirado.', 'error');
    cleanUrl();
    return;
  }

  log('4. Enviando petición POST a /token con code + code_verifier...', 'info');
  updateStepper(4, [1, 2, 3]);

  try {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: CONFIG.clientId,
      redirect_uri: CONFIG.redirectUri,
      code: code,
      code_verifier: codeVerifier
    });

    const response = await fetch(CONFIG.tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body.toString()
    });

    const data = await response.json();

    if (!response.ok) {
      log(`❌ Error en canje de tokens (HTTP ${response.status}): ${data.error} - ${data.error_description || ''}`, 'error');
      if (data.error === 'invalid_grant' && data.error_description?.includes('PKCE')) {
        log('🛡️ PROTECCIÓN PKCE ACTIVA: Keycloak rechazó el intercambio porque el verifier no produjo el challenge original.', 'warn');
      }
      cleanUrl();
      return;
    }

    log('5. ¡Tokens obtenidos exitosamente! (200 OK)', 'success');
    updateStepper(5, [1, 2, 3, 4, 5]);

    // Guardar tokens en sessionStorage
    sessionStorage.setItem('access_token', data.access_token);
    sessionStorage.setItem('id_token', data.id_token);
    if (data.refresh_token) {
      sessionStorage.setItem('refresh_token', data.refresh_token);
    }

    // Limpiar parámetros de la URL
    cleanUrl();

    // Renderizar dashboard de usuario
    renderAuthenticated(data);

  } catch (err) {
    log(`Fallo de conexión en petición de token: ${err.message}`, 'error');
    cleanUrl();
  }
}

// Limpia la barra de direcciones eliminando query params (?code=...) sin recargar
function cleanUrl() {
  window.history.replaceState({}, document.title, window.location.pathname);
}

// Renderizar usuario y tokens
function renderAuthenticated(tokens) {
  const unauthView = document.getElementById('unauthenticatedView');
  const authView = document.getElementById('authenticatedView');
  
  if (unauthView) unauthView.classList.add('hidden');
  if (authView) authView.classList.remove('hidden');

  const accessToken = tokens.access_token;
  const idToken = tokens.id_token;
  const refreshToken = tokens.refresh_token;

  // Decodificar JWT
  const accessClaims = parseJwt(accessToken) || {};
  const idClaims = idToken ? parseJwt(idToken) : {};

  // Perfil del usuario
  const username = accessClaims.preferred_username || idClaims.preferred_username || 'Usuario';
  const name = accessClaims.name || idClaims.name || username;
  const email = accessClaims.email || idClaims.email || 'Sin correo asociado';

  document.getElementById('userNameDisplay').textContent = name;
  document.getElementById('userEmailDisplay').textContent = email;
  document.getElementById('userAvatar').textContent = username.charAt(0).toUpperCase();

  // Roles
  const rolesContainer = document.getElementById('rolesList');
  rolesContainer.innerHTML = '';
  const realmRoles = accessClaims.realm_access?.roles || [];
  if (realmRoles.length === 0) {
    rolesContainer.innerHTML = '<span class="text-muted">Ningún rol explícito</span>';
  } else {
    realmRoles.forEach(role => {
      const badge = document.createElement('span');
      badge.className = 'role-badge';
      badge.textContent = role;
      rolesContainer.appendChild(badge);
    });
  }

  // Visores de claims
  document.getElementById('accessTokenClaimsJson').textContent = JSON.stringify(accessClaims, null, 2);
  document.getElementById('idTokenClaimsJson').textContent = JSON.stringify(idClaims, null, 2);
  document.getElementById('rawAccessToken').value = accessToken;
  document.getElementById('rawIdToken').value = idToken || 'No recibido';

  log(`Sesión iniciada como '${username}' (${email})`, 'success');
}

// Restaurar sesión activa de sessionStorage
function restoreSession() {
  const accessToken = sessionStorage.getItem('access_token');
  const idToken = sessionStorage.getItem('id_token');
  const refreshToken = sessionStorage.getItem('refresh_token');

  if (accessToken) {
    const claims = parseJwt(accessToken);
    const now = Math.floor(Date.now() / 1000);

    if (claims && claims.exp && claims.exp > now) {
      log('Sesión previa recuperada desde sessionStorage.', 'info');
      updateStepper(5, [1, 2, 3, 4, 5]);
      renderAuthenticated({
        access_token: accessToken,
        id_token: idToken,
        refresh_token: refreshToken
      });
    } else {
      log('El token almacenado expiró. Por favor iniciá sesión nuevamente.', 'warn');
      sessionStorage.clear();
    }
  }
}

// Consultar endpoint /userinfo
async function fetchUserInfo() {
  const accessToken = sessionStorage.getItem('access_token');
  if (!accessToken) {
    log('No hay access_token disponible', 'error');
    return;
  }

  log('Consultando GET /protocol/openid-connect/userinfo con Bearer Token...', 'info');

  try {
    const res = await fetch(CONFIG.userInfoEndpoint, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const data = await res.json();
    log(`UserInfo respuesta (HTTP ${res.status}): ${JSON.stringify(data)}`, res.ok ? 'success' : 'error');

    document.getElementById('userInfoJson').textContent = JSON.stringify(data, null, 2);
    // Cambiar a la pestaña de userinfo
    switchTab('tab-userinfo');

  } catch (err) {
    log(`Error al consultar userinfo: ${err.message}`, 'error');
  }
}

// Refrescar Token
async function refreshToken() {
  const refToken = sessionStorage.getItem('refresh_token');
  if (!refToken) {
    log('No hay refresh_token disponible en esta sesión', 'warn');
    return;
  }

  log('Renovando tokens usando grant_type=refresh_token...', 'info');

  try {
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: CONFIG.clientId,
      refresh_token: refToken
    });

    const res = await fetch(CONFIG.tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString()
    });

    const data = await res.json();
    if (!res.ok) {
      log(`Error al refrescar token: ${data.error} - ${data.error_description}`, 'error');
      return;
    }

    log('✅ Token renovado con éxito! Se actualizó el access_token.', 'success');
    sessionStorage.setItem('access_token', data.access_token);
    if (data.refresh_token) {
      sessionStorage.setItem('refresh_token', data.refresh_token);
    }
    if (data.id_token) {
      sessionStorage.setItem('id_token', data.id_token);
    }

    renderAuthenticated(data);

  } catch (err) {
    log(`Fallo al refrescar token: ${err.message}`, 'error');
  }
}

// Cerrar sesión
function logout() {
  log('Cerrando sesión local y en Keycloak...', 'info');
  const idToken = sessionStorage.getItem('id_token');
  sessionStorage.clear();

  // Redirigir a Keycloak logout
  const params = new URLSearchParams({
    client_id: CONFIG.clientId,
    post_logout_redirect_uri: window.location.origin
  });
  if (idToken) {
    params.set('id_token_hint', idToken);
  }

  window.location.href = `${CONFIG.logoutEndpoint}?${params.toString()}`;
}

// Utilidad para copiar al portapapeles
window.copyToClipboard = function(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.select();
  navigator.clipboard.writeText(el.value);
  log('📋 Token copiado al portapapeles.', 'info');
};

// Manejador de tabs
function switchTab(tabId) {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
  });
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.toggle('active', content.id === tabId);
  });
}

// ==========================================
// 5. INICIALIZACIÓN Y EVENT LISTENERS
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  log('🚀 SPA lista en http://localhost:4200. Flujo PKCE listo para ejecutar.', 'info');

  // Botón Login
  document.getElementById('btnLogin')?.addEventListener('click', () => login(false));

  // Botón Simular Ataque
  document.getElementById('btnSimulateAttack')?.addEventListener('click', () => login(true));

  // Botón UserInfo
  document.getElementById('btnUserInfo')?.addEventListener('click', fetchUserInfo);

  // Botón Refresh Token
  document.getElementById('btnRefreshToken')?.addEventListener('click', refreshToken);

  // Botón Logout
  document.getElementById('btnLogout')?.addEventListener('click', logout);

  // Botón Limpiar Terminal
  document.getElementById('btnClearLogs')?.addEventListener('click', () => {
    const terminal = document.getElementById('terminalLogs');
    if (terminal) terminal.innerHTML = '';
  });

  // Tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      switchTab(btn.getAttribute('data-tab'));
    });
  });

  // Procesar posible callback
  handleCallback();
});
