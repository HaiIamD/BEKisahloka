const jwt = require('jsonwebtoken');

const UserMiddleware = async (req, res, next) => {
  try {
    let token = req.header('Authorization');

    if (!token) return res.status(403).json('Login User Only');

    if (token.startsWith('kisahloka ')) {
      token = token.slice(10, token.lenght).trimLeft();
    }

    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Error Authenticaition' });
  }
};

const guestMiddleware = async (req, res, next) => {
  try {
    let header = req.header('Authorization');

    if (!header) return res.status(403).json('Wrong Header');

    if (header === 'guestKisahloka') {
      next();
    } else {
      return res.status(403).json('Wrong Header');
    }
  } catch (error) {
    res.status(500).json({ error: 'Error Authenticaition' });
  }
};

module.exports = { UserMiddleware, guestMiddleware };
