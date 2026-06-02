import cloudinary from '../config/cloudinary.js';

export const AUTH_FOLDER = 'despacho-juridico-auth';
export const LEGACY_FOLDER = 'despacho-juridico';
export const DEFAULT_SIGNED_URL_TTL_SECONDS = 60;

function isAuthenticatedPublicId(publicId) {
  return typeof publicId === 'string' && publicId.startsWith(`${AUTH_FOLDER}/`);
}

function cloudinaryTypeFor(publicId) {
  return isAuthenticatedPublicId(publicId) ? 'authenticated' : 'upload';
}

export function uploadDocument(buffer, publicIdSuffix) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        type: 'authenticated',
        folder: AUTH_FOLDER,
        public_id: publicIdSuffix,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    stream.end(buffer);
  });
}

export function signedUrl(publicId, { ttlSeconds = DEFAULT_SIGNED_URL_TTL_SECONDS } = {}) {
  const type = cloudinaryTypeFor(publicId);
  const expires_at = Math.floor(Date.now() / 1000) + ttlSeconds;

  if (type === 'authenticated') {
    return cloudinary.utils.private_download_url(publicId, '', {
      resource_type: 'raw',
      type: 'authenticated',
      expires_at,
    });
  }

  return cloudinary.url(publicId, {
    resource_type: 'raw',
    type: 'upload',
    secure: true,
  });
}

export async function fetchDocumentBuffer(publicId) {
  const url = signedUrl(publicId);
  const response = await fetch(url);
  if (!response.ok) {
    const err = new Error(`Cloudinary fetch falló (${response.status}) para ${publicId}`);
    err.statusCode = response.status;
    throw err;
  }
  return Buffer.from(await response.arrayBuffer());
}

export async function destroyDocument(publicId) {
  const type = cloudinaryTypeFor(publicId);
  return cloudinary.uploader.destroy(publicId, {
    resource_type: 'raw',
    type,
    invalidate: true,
  });
}

export { isAuthenticatedPublicId };
