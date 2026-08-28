// src/components/common/CloudinaryUpload.js
// Reusable Cloudinary file upload component

import React, { useState } from 'react';
import { uploadToCloudinary } from '../../services/cloudinary';

export default function CloudinaryUpload({
  onUploadSuccess,
  onUploadError,
  accept = 'image/*',
  resourceType = 'image',
  maxSize = 5242880, // 5MB
  label = 'Upload File',
  folder = 'makkaylee'
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSize) {
      const maxMB = (maxSize / 1024 / 1024).toFixed(1);
      const error = `File size must be less than ${maxMB}MB`;
      setError(error);
      onUploadError?.(error);
      return;
    }

    setError('');
    setIsUploading(true);
    setUploadProgress(10);

    try {
      setUploadProgress(50);
      const result = await uploadToCloudinary(file, folder, resourceType);
      setUploadProgress(100);
      
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
        onUploadSuccess?.(result);
      }, 500);
    } catch (err) {
      setError(err.message || 'Upload failed');
      onUploadError?.(err.message);
      setIsUploading(false);
      setUploadProgress(0);
    }

    // Reset file input
    event.target.value = '';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <label style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        cursor: isUploading ? 'not-allowed' : 'pointer',
        opacity: isUploading ? 0.6 : 1
      }}>
        <input
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          disabled={isUploading}
          style={{ display: 'none' }}
        />
        <span style={{
          padding: '8px 14px',
          backgroundColor: isUploading ? '#ccc' : '#1a7c9e',
          color: 'white',
          borderRadius: '4px',
          fontWeight: 700,
          fontSize: '13px',
          whiteSpace: 'nowrap'
        }}>
          {isUploading ? `Uploading... ${uploadProgress}%` : label}
        </span>
      </label>
      
      {isUploading && (
        <div style={{
          width: '100%',
          height: '4px',
          backgroundColor: '#e0e0e0',
          borderRadius: '2px',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            width: `${uploadProgress}%`,
            backgroundColor: '#1a7c9e',
            transition: 'width 0.3s ease'
          }} />
        </div>
      )}
      
      {error && (
        <div style={{ color: 'red', fontSize: '12px' }}>
          {error}
        </div>
      )}
    </div>
  );
}
