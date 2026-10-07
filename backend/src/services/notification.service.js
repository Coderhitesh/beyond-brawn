const logger = require('../utils/logger');
const { Notification } = require('../models');

// Notifications are best-effort: never let them fail the calling flow.
const safe = (promise) => promise.catch((e) => logger.error('Notification failed:', e.message));

const notifyAdmin = (type, title, message, link) => safe(Notification.create({ audience: 'admin', type, title, message, link }));
const notifyCustomer = (userId, type, title, message, link) => (userId ? safe(Notification.create({ audience: 'customer', user: userId, type, title, message, link })) : Promise.resolve());

module.exports = { notifyAdmin, notifyCustomer };
