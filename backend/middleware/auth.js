const jwt = require('jsonwebtoken');
const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
  try {
    const token = authHeader.split(' ')[1];
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Token invalid or expired' });
  }
};

// Any WASAC staff member but not a citizen account
const staffOnly = (req, res, next) => {
  if (req.user?.role === 'citizen' || !req.user?.role) {
    return res.status(403).json({ message: 'WASAC staff access required' });
  }
  next();
};

// Admin staff only
const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// The logged-in citizen only
const citizenOnly = (req, res, next) => {
  if (req.user?.role !== 'citizen') {
    return res.status(403).json({ message: 'Citizen access required' });
  }
  next();
};

module.exports = { protect, staffOnly, adminOnly, citizenOnly };
