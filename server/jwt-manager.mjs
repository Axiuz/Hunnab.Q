import crypto from 'node:crypto';

/**
 * Gestor JWT minimalista (HS256) sin dependencias externas.
 * - Firma tokens de acceso
 * - Valida tokens Bearer
 * - Expone middlewares de autenticacion para Express
 */
class JWTManager {
  constructor({
    secret = '',
    issuer = 'hunnab-api',
    audience = 'hunnab-web',
    expiresInSeconds = 24 * 60 * 60,
  } = {}) {
    this.secret = String(secret || '').trim() || 'hunnab_dev_secret_change_me';
    this.issuer = String(issuer || 'hunnab-api').trim();
    this.audience = String(audience || 'hunnab-web').trim();
    this.expiresInSeconds = Number.parseInt(expiresInSeconds, 10) > 0
      ? Number.parseInt(expiresInSeconds, 10)
      : 24 * 60 * 60;
  }

  base64UrlEncode(value) {
    return Buffer.from(value)
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  }

  base64UrlDecode(value) {
    const normalized = String(value || '')
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    const padding = normalized.length % 4;
    const padded = padding === 0 ? normalized : normalized + '='.repeat(4 - padding);
    return Buffer.from(padded, 'base64').toString('utf8');
  }

  signHmacSha256(content) {
    return crypto
      .createHmac('sha256', this.secret)
      .update(content)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  }

  timingSafeCompare(left, right) {
    const l = Buffer.from(String(left || ''));
    const r = Buffer.from(String(right || ''));
    if (l.length !== r.length) {
      return false;
    }
    return crypto.timingSafeEqual(l, r);
  }

  createAccessToken({ id, usuario, tipoUsuario }, customExpiresInSeconds = null) {
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = Number.parseInt(customExpiresInSeconds, 10) > 0
      ? Number.parseInt(customExpiresInSeconds, 10)
      : this.expiresInSeconds;
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload = {
      sub: String(id || ''),
      uid: Number.parseInt(id, 10) || 0,
      usr: String(usuario || '').trim(),
      rol: String(tipoUsuario || 'CUENTA').trim().toUpperCase(),
      iat: now,
      exp: now + expiresIn,
      iss: this.issuer,
      aud: this.audience,
    };

    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));
    const signature = this.signHmacSha256(`${encodedHeader}.${encodedPayload}`);
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  verifyAccessToken(token) {
    const rawToken = String(token || '').trim();
    if (!rawToken) {
      return { ok: false, error: 'Token JWT requerido.' };
    }

    const parts = rawToken.split('.');
    if (parts.length !== 3) {
      return { ok: false, error: 'Formato de token JWT invalido.' };
    }

    const [encodedHeader, encodedPayload, signature] = parts;
    const expectedSignature = this.signHmacSha256(`${encodedHeader}.${encodedPayload}`);
    if (!this.timingSafeCompare(signature, expectedSignature)) {
      return { ok: false, error: 'Firma JWT invalida.' };
    }

    let header;
    let payload;
    try {
      header = JSON.parse(this.base64UrlDecode(encodedHeader));
      payload = JSON.parse(this.base64UrlDecode(encodedPayload));
    } catch (error) {
      return { ok: false, error: 'Contenido JWT corrupto.' };
    }

    if (String(header?.alg || '') !== 'HS256') {
      return { ok: false, error: 'Algoritmo JWT no permitido.' };
    }

    const now = Math.floor(Date.now() / 1000);
    if (Number(payload?.exp || 0) <= now) {
      return { ok: false, error: 'Token JWT expirado.' };
    }
    if (String(payload?.iss || '') !== this.issuer || String(payload?.aud || '') !== this.audience) {
      return { ok: false, error: 'Token JWT invalido para esta API.' };
    }

    const authUser = {
      id: Number.parseInt(payload?.uid, 10) || Number.parseInt(payload?.sub, 10) || 0,
      usuario: String(payload?.usr || '').trim(),
      tipoUsuario: String(payload?.rol || 'CUENTA').trim().toUpperCase(),
    };
    if (!authUser.id || !authUser.usuario) {
      return { ok: false, error: 'Payload JWT incompleto.' };
    }

    return { ok: true, payload, user: authUser };
  }

  extractBearerToken(req) {
    const authorization = String(req?.headers?.authorization || '').trim();
    if (!authorization) {
      return '';
    }
    const match = authorization.match(/^Bearer\s+(.+)$/i);
    return match ? String(match[1] || '').trim() : '';
  }

  authenticateRequired() {
    return (req, res, next) => {
      const token = this.extractBearerToken(req);
      const verification = this.verifyAccessToken(token);
      if (!verification.ok || !verification.user) {
        res.status(401).json({ ok: false, error: verification.error || 'No autorizado.' });
        return;
      }
      req.authUser = verification.user;
      req.authPayload = verification.payload;
      next();
    };
  }

  getRequestUser(req) {
    return req?.authUser || null;
  }

  isAdmin(user) {
    const role = String(user?.tipoUsuario || '').trim().toUpperCase();
    return role === 'ADMIN' || role === 'ADMINISTRADOR';
  }
}

export default JWTManager;
