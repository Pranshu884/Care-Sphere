import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('Missing JWT_SECRET');

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export function signToken(user) {
  // Keep payload small; client can fetch profile for full details.
  return jwt.sign(
    {
      userId: String(user._id),
      email: user.email,
      name: user.name,
      emailVerified: user.emailVerified,
      role: user.role,
      doctorProfileId: user.doctorProfileId ? String(user.doctorProfileId) : undefined,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}

