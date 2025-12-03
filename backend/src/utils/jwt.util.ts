import jwt, { SignOptions } from 'jsonwebtoken';

export const generateToken = (payload: {
  id: string;
  email: string;
  role: string;
  schoolId: string;
}): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }
  const options: SignOptions = {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  };
  return jwt.sign(payload, secret, options);
};

export const verifyToken = (token: string) => {
  return jwt.verify(token, process.env.JWT_SECRET!);
};

