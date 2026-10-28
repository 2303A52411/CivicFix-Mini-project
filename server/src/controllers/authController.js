import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { signToken } from '../utils/token.js';
import { asyncHandler } from '../utils/asyncHandler.js';
const publicUser = u => ({ id: u._id, name: u.name, email: u.email, role: u.role });
export const register = asyncHandler(async (req, res) => {
  if (await User.exists({ email: req.body.email })) return res.status(409).json({ message: 'An account with that email already exists' });
  const user = await User.create({ name: req.body.name, email: req.body.email, role: 'reporter', passwordHash: await bcrypt.hash(req.body.password, 12) });
  res.status(201).json({ token: signToken(user), user: publicUser(user) });
});
export const login = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email }).select('+passwordHash');
  if (!user || !await bcrypt.compare(req.body.password, user.passwordHash)) return res.status(401).json({ message: 'Invalid email or password' });
  res.json({ token: signToken(user), user: publicUser(user) });
});
export const me = (req, res) => res.json({ user: publicUser(req.user) });
export const logout = (req, res) => res.json({ message: 'Logged out successfully' });
