export function requireAdmin(req, res, next) {
  if (req.auth && req.auth.role === 'admin') {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Forbidden: Admin access required.' });
}

export function requireDoctor(req, res, next) {
  if (req.auth && req.auth.role === 'doctor') {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Forbidden: Doctor access required.' });
}

export function requireUser(req, res, next) {
  if (req.auth && req.auth.role === 'user') {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Forbidden: User access required.' });
}
