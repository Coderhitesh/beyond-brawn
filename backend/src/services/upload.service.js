const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const env = require('../config/env');
const logger = require('../utils/logger');
const { cloudinary, enabled } = require('../config/cloudinary');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/avif': 'avif' };

function toCloudinary(file, folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder: `${env.cloudinary.folder}/${folder}`, resource_type: 'image' }, (err, result) =>
      err ? reject(err) : resolve({ url: result.secure_url, publicId: result.public_id, width: result.width, height: result.height })
    );
    stream.end(file.buffer);
  });
}

async function toDisk(file, folder) {
  const dir = path.join(UPLOAD_DIR, folder);
  await fs.mkdir(dir, { recursive: true });
  const name = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${EXT[file.mimetype] || 'jpg'}`;
  await fs.writeFile(path.join(dir, name), file.buffer);
  return { url: `${env.apiPublicUrl}/uploads/${folder}/${name}`, publicId: `local:${folder}/${name}` };
}

// Cloudinary when configured, local disk otherwise (development).
const uploadImage = (file, folder = 'misc') => (enabled ? toCloudinary(file, folder) : toDisk(file, folder));
const uploadImages = (files = [], folder = 'misc') => Promise.all(files.map((f) => uploadImage(f, folder)));

async function removeImage(publicId) {
  if (!publicId) return;
  try {
    if (publicId.startsWith('local:')) {
      const rel = path.normalize(publicId.slice(6));
      if (rel.startsWith('..')) return;
      await fs.unlink(path.join(UPLOAD_DIR, rel));
    } else if (enabled) {
      await cloudinary.uploader.destroy(publicId);
    }
  } catch (e) {
    logger.warn(`Could not delete image ${publicId}: ${e.message}`);
  }
}

module.exports = { uploadImage, uploadImages, removeImage, UPLOAD_DIR, usingCloudinary: enabled };
