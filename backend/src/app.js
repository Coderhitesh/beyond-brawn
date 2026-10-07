const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const hpp = require('hpp');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const morgan = require('morgan');

const env = require('./config/env');
const limit = require('./middlewares/rateLimiters');
const { notFound, errorHandler } = require('./middlewares/error');
const paymentController = require('./controllers/payment.controller');

const app = express();
app.disable('x-powered-by');
if (env.trustProxy) app.set('trust proxy', env.trustProxy);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: (origin, cb) => (!origin || env.clientUrls.includes(origin) ? cb(null, true) : cb(null, false)),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    exposedHeaders: ['Content-Disposition'],
  })
);
app.use(compression());
if (!env.isProd) app.use(morgan('dev'));

// Razorpay signs the raw body, so this route must come before express.json().
app.post('/api/payments/webhook', express.raw({ type: '*/*', limit: '1mb' }), paymentController.webhook);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '100kb' }));
app.use(cookieParser());
app.use(mongoSanitize()); // strips $ and . keys from body / query / params
app.use(hpp({ whitelist: ['brand', 'type', 'dietary'] }));

// State-changing requests must come from an allowed origin (CSRF defence alongside SameSite cookies).
app.use('/api', (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const { origin } = req.headers;
  if (origin && !env.clientUrls.includes(origin)) return res.status(403).json({ success: false, message: 'Origin not allowed', error: { code: 'BAD_ORIGIN' } });
  return next();
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads'), { maxAge: '30d', index: false, dotfiles: 'ignore' }));
app.use('/api', limit.global, require('./routes'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;
