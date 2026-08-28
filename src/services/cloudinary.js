// src/services/cloudinary.js
// Cloudinary upload configuration and utilities

export const CLOUDINARY_CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || 'your_cloud_name';
export const CLOUDINARY_UPLOAD_PRESET = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET || 'your_preset';

/**
 * Upload a file to Cloudinary
 * @param {File} file - File to upload
 * @param {string} folder - Cloudinary folder name (optional)
 * @param {string} resourceType - Resource type: 'image', 'video', 'raw', 'auto'
 * @returns {Promise<{url: string, publicId: string}>}
 */
export async function uploadToCloudinary(file, folder = 'makkaylee', resourceType = 'auto') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', folder);
  formData.append('resource_type', resourceType);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`,
      {
        method: 'POST',
        body: formData
      }
    );

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      url: data.secure_url,
      publicId: data.public_id,
      resourceType: data.resource_type,
      duration: data.duration // for videos
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
}

/**
 * Delete a file from Cloudinary
 * @param {string} publicId - Public ID of the file to delete
 * @param {string} resourceType - Resource type: 'image', 'video', 'raw'
 */
export async function deleteFromCloudinary(publicId, resourceType = 'image') {
  try {
    // Note: Deletion requires backend API key. This is typically done server-side
    // For frontend, we'll just log a warning
    console.warn('File deletion should be done server-side with API key');
    return true;
  } catch (error) {
    console.error('Cloudinary deletion error:', error);
    throw error;
  }
}

/**
 * Get optimized Cloudinary URL with transformations
 * @param {string} url - Cloudinary URL
 * @param {Object} options - Transformation options
 * @returns {string}
 */
export function getOptimizedUrl(url, options = {}) {
  if (!url || !url.includes('cloudinary')) {
    return url;
  }

  const {
    width,
    height,
    quality = 'auto',
    format = 'auto',
    crop = 'fill',
    gravity = 'auto'
  } = options;

  let transformations = [];
  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  transformations.push(`q_${quality}`);
  transformations.push(`f_${format}`);
  if (crop) transformations.push(`c_${crop}`);
  if (gravity) transformations.push(`g_${gravity}`);

  const transformationString = transformations.join(',');
  return url.replace('/upload/', `/upload/${transformationString}/`);
}

/**
 * Extract public ID from Cloudinary URL
 * @param {string} url - Cloudinary URL
 * @returns {string}
 */
export function getPublicIdFromUrl(url) {
  if (!url || !url.includes('cloudinary')) {
    return null;
  }
  
  const match = url.match(/\/([^/]+)\/upload\/(.+?)(\.[^.]+)?$/);
  if (match) {
    return match[2]; // folder/filename
  }
  return null;
}

const cloudinaryService = {
  uploadToCloudinary,
  deleteFromCloudinary,
  getOptimizedUrl,
  getPublicIdFromUrl,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_UPLOAD_PRESET
};

export default cloudinaryService;
