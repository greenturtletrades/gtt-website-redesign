const jwt = require("jsonwebtoken");

function createAuthHelpers({
  staffPortalRoles = new Set(["ADMIN"]),
  staffWriteRoles = new Set(["ADMIN"]),
} = {}) {
  function parseCookies(req) {
    const header = req.headers.cookie;
    if (!header || typeof header !== "string") {
      return {};
    }

    return header.split(";").reduce((cookies, part) => {
      const [rawKey, ...rest] = part.split("=");
      const key = rawKey?.trim();
      if (!key) return cookies;
      cookies[key] = decodeURIComponent(rest.join("=").trim() || "");
      return cookies;
    }, {});
  }

  function shouldUseSecureCookies() {
    if (process.env.COOKIE_SECURE === "true") {
      return true;
    }

    const configuredOrigins = [
      process.env.APP_URL,
      process.env.FRONTEND_URL,
      process.env.PUBLIC_FRONTEND_URL,
    ].filter((value) => typeof value === "string" && value.trim());

    for (const origin of configuredOrigins) {
      try {
        const parsed = new URL(origin);
        const isLocalhost =
          parsed.hostname === "localhost" ||
          parsed.hostname === "127.0.0.1";
        if (parsed.protocol === "https:" && !isLocalhost) {
          return true;
        }
      } catch {
        // Ignore invalid URLs and keep evaluating.
      }
    }

    return process.env.NODE_ENV === "production";
  }

  function getSessionCookieName() {
    return "gtt_session";
  }

  function buildSessionCookie(token, maxAgeMs = 7 * 24 * 60 * 60 * 1000) {
    const parts = [
      `${getSessionCookieName()}=${encodeURIComponent(token)}`,
      "Path=/",
      "HttpOnly",
      `Max-Age=${Math.floor(maxAgeMs / 1000)}`,
    ];

    if (shouldUseSecureCookies()) {
      parts.push("Secure", "SameSite=None");
    } else {
      parts.push("SameSite=Lax");
    }

    return parts.join("; ");
  }

  function buildExpiredSessionCookie() {
    const parts = [
      `${getSessionCookieName()}=`,
      "Path=/",
      "HttpOnly",
      "Max-Age=0",
    ];

    if (shouldUseSecureCookies()) {
      parts.push("Secure", "SameSite=None");
    } else {
      parts.push("SameSite=Lax");
    }

    return parts.join("; ");
  }

  function setSessionCookie(res, token, maxAgeMs) {
    res.setHeader("Set-Cookie", buildSessionCookie(token, maxAgeMs));
  }

  function clearSessionCookie(res) {
    res.setHeader("Set-Cookie", buildExpiredSessionCookie());
  }

  function getJwtSecret() {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET is missing in .env");
    }
    return secret;
  }

  function signToken(user, roleOverride = null) {
    const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
    return jwt.sign(
      {
        sub: user.id,
        role: roleOverride || user.role,
        isSuperAdmin: Boolean(user?.isSuperAdmin),
      },
      getJwtSecret(),
      { expiresIn },
    );
  }

  function getHeaderValue(value) {
    if (Array.isArray(value)) {
      return value[0];
    }
    if (typeof value === "string") {
      return value;
    }
    return null;
  }

  function authRequired(req, res, next) {
    const cookies = parseCookies(req);
    const cookieToken = cookies[getSessionCookieName()];
    const authHeader = getHeaderValue(req.headers.authorization);
    const bearerToken =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.slice("Bearer ".length).trim()
        : null;
    const token = cookieToken || bearerToken;

    if (!token) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    try {
      const payload = jwt.verify(token, getJwtSecret());
      req.user = {
        id: payload.sub,
        role: payload.role,
        isSuperAdmin: Boolean(payload.isSuperAdmin),
      };
      return next();
    } catch {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }
  }

  function adminRequired(req, res, next) {
    if (!req.user || !staffPortalRoles.has(req.user.role)) {
      return res.status(403).json({ ok: false, error: "Forbidden" });
    }
    return next();
  }

  function staffWriteRequired(req, res, next) {
    if (!req.user || !staffWriteRoles.has(req.user.role)) {
      return res.status(403).json({ ok: false, error: "Forbidden" });
    }
    return next();
  }

  function superAdminRequired(req, res, next) {
    if (!req.user || !req.user.isSuperAdmin) {
      return res.status(403).json({ ok: false, error: "Super admin access required" });
    }
    return next();
  }

  function getTrustedRequestOrigin(req, allowedOrigins) {
    const origin = getHeaderValue(req.headers.origin);
    if (origin && allowedOrigins.includes(origin)) {
      return origin;
    }

    const referer = getHeaderValue(req.headers.referer);
    if (referer) {
      try {
        const refererOrigin = new URL(referer).origin;
        if (allowedOrigins.includes(refererOrigin)) {
          return refererOrigin;
        }
      } catch {
        return null;
      }
    }

    return null;
  }

  return {
    parseCookies,
    getSessionCookieName,
    setSessionCookie,
    clearSessionCookie,
    signToken,
    authRequired,
    adminRequired,
    staffWriteRequired,
    superAdminRequired,
    getHeaderValue,
    getTrustedRequestOrigin,
  };
}

module.exports = {
  createAuthHelpers,
};
