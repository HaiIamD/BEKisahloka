const db = require('../mysqlConnection.js');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const checkUserQuery = 'SELECT * FROM user WHERE email = ?';
    const [userData] = await db.query(checkUserQuery, [email]);

    if (userData.length !== 0) {
      return res.status(409).json({ error: 'User Already Exists' });
    }

    // Generate salt and hash password
    const salt = await bcrypt.genSalt();
    const encryption = await bcrypt.hash(password, salt);

    // Insert user into database
    const insertUserQuery = 'INSERT INTO user (username, email, password) VALUES (?, ?, ?)';
    await db.query(insertUserQuery, [username, email, encryption]);

    res.status(200).json('User registered successfully');
  } catch (error) {
    res.status(500).json({ error: 'Sorry, something went wrong on the server' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user already exists
    const checkUserQuery = 'SELECT * FROM user WHERE email = ?';
    const [userData] = await db.query(checkUserQuery, [email]);
    const user = userData[0];

    if (!user) {
      return res.status(409).json({ error: 'Sorry, the email you entered is incorrect.' });
    }
    if (user.email !== email) return res.status(404).json({ error: ' Invalid Email ' });

    const matchingPassword = await bcrypt.compare(password, user.password);
    if (!matchingPassword) return res.status(404).json({ error: ' Invalid Credential , Please Try Again ' });

    const Token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);

    res.status(200).json({
      token: Token,
      user: {
        _id: user.id,
        userName: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Sorry, something went wrong on the server' });
  }
};

module.exports = { register, login };
