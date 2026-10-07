const multer = require('multer');
const ApiError = require('../utils/ApiError');

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

const build = ({ maxSizeMb, maxFiles }) =>
  multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxSizeMb * 1024 * 1024, files: maxFiles },
    fileFilter: (req, file, cb) => (IMAGE_TYPES.includes(file.mimetype) ? cb(null, true) : cb(new ApiError(400, 'Only JPG, PNG, WEBP or AVIF images are allowed', null, 'UPLOAD_ERROR'))),
  });

module.exports = {
  adminImages: build({ maxSizeMb: 5, maxFiles: 10 }).array('files', 10),
  reviewImage: build({ maxSizeMb: 3, maxFiles: 1 }).single('file'),
};
