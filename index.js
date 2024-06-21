require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 6002;

app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }));
app.use(morgan('common'));
app.use(cors());

// Route Configuration
const authRoute = require('./routes/auth.js');
const ceritaRoute = require('./routes/cerita.js');

app.use('/auth', authRoute);
app.use('/cerita', ceritaRoute);

app.use('*', (req, res) => {
  res.status(500).json('Undifined Url , Try Again');
});

app.listen(PORT, () => {
  console.log(`Server Running in PORT ${PORT}`);
});
