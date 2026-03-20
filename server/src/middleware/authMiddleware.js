import { verifyToken } from '../utils/jwt.js';

export default function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ success: false, code: 'unauthorized', message: 'Missing or invalid token.' });
  }

  try {
    const payload = verifyToken(token);
    req.auth = payload;
    return next();
  } catch {
    return res.status(401).json({ success: false, code: 'unauthorized', message: 'Invalid or expired token.' });
  }
}

