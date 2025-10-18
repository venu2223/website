import React, { useState } from 'react';
import { videoService } from '../services/videoService';
import { courseService } from '../services/courseService';

const VideoUploadModal = ({ courseId, isOpen, onClose, onVideoAdded }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    orderIndex: 0
  });
  const [videoFile, setVideoFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('video/')) {
        setError('Please select a valid video file (MP4, WebM, MOV, etc.)');
        return;
      }

      // Validate file size (100MB limit)
      if (file.size > 100 * 1024 * 1024) {
        setError('Video file must be less than 100MB');
        return;
      }

      setVideoFile(file);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!videoFile) {
      setError('Please select a video file');
      return;
    }

    if (!formData.title.trim()) {
      setError('Please enter a title for the video');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('Starting video upload process...');
      
      // Step 1: Upload video to Cloudinary
      console.log('Uploading video to Cloudinary...');
      const uploadResponse = await videoService.uploadVideo(videoFile);
      
      if (!uploadResponse.success) {
        throw new Error(uploadResponse.message || 'Upload failed');
      }

      console.log('Cloudinary upload successful:', uploadResponse.video);

      // Step 2: Add video content to course using courseService
      const contentData = {
        title: formData.title,
        description: formData.description,
        video_url: uploadResponse.video.secure_url,
        video_public_id: uploadResponse.video.public_id,
        video_duration: uploadResponse.video.duration || 0,
        order_index: formData.orderIndex
      };

      console.log('Adding video content to course:', contentData);
      const contentResponse = await courseService.addVideoContent(courseId, contentData);

      if (contentResponse.success) {
        console.log('Video content added successfully:', contentResponse.content);
        onVideoAdded(contentResponse.content);
        resetForm();
        onClose();
      } else {
        throw new Error(contentResponse.message || 'Failed to add video content');
      }

    } catch (error) {
      console.error('Video upload process error:', error);
      
      // Handle specific error types
      if (error.type === 'UPLOAD_ERROR' || error.type === 'CONTENT_ERROR') {
        setError(error.message || 'Failed to upload video. Please try again.');
      } else if (error.response?.status === 413) {
        setError('Video file is too large. Please select a file smaller than 100MB.');
      } else if (error.response?.status === 415) {
        setError('Unsupported video format. Please use MP4, WebM, or MOV files.');
      } else {
        setError(error.message || 'Failed to upload video. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  // Simulate upload progress (in real implementation, this would come from axios interceptors)
  const simulateProgress = () => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return prev;
        }
        return prev + 10;
      });
    }, 500);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      orderIndex: 0
    });
    setVideoFile(null);
    setError('');
    setUploadProgress(0);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Format file size for display
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get video duration (this would be extracted after upload in real implementation)
  const getVideoInfo = (file) => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      
      video.onloadedmetadata = function() {
        window.URL.revokeObjectURL(video.src);
        resolve({
          duration: Math.round(video.duration),
          width: video.videoWidth,
          height: video.videoHeight
        });
      };
      
      video.onerror = function() {
        window.URL.revokeObjectURL(video.src);
        resolve({
          duration: 0,
          width: 0,
          height: 0
        });
      };
      
      video.src = URL.createObjectURL(file);
    });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h2>📹 Upload Video Content</h2>
          <button className="close-button" onClick={handleClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="video-upload-form">
          {error && (
            <div className="api-error UPLOAD_ERROR">
              <div className="error-icon">⚠️</div>
              <div className="error-content">
                <p className="error-message">{error}</p>
                <p className="error-suggestion">
                  Please check the file format and size, then try again.
                </p>
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="videoFile">
              Video File *
              <span className="field-info">(MP4, WebM, MOV - Max 100MB)</span>
            </label>
            <input
              type="file"
              id="videoFile"
              accept="video/mp4,video/webm,video/quicktime,video/x-m4v,video/*"
              onChange={handleFileChange}
              disabled={loading}
            />
            {videoFile && (
              <div className="file-info">
                <div className="file-details">
                  <span className="file-icon">📹</span>
                  <div className="file-meta">
                    <strong>{videoFile.name}</strong>
                    <span>{formatFileSize(videoFile.size)}</span>
                    <span className="file-type">{videoFile.type}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="title">Video Title *</label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              placeholder="e.g., Introduction to React, Advanced JavaScript Concepts..."
              disabled={loading}
              maxLength={255}
            />
            <div className="character-count">
              {formData.title.length}/255 characters
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">
              Description
              <span className="field-info">(Optional)</span>
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Describe what students will learn in this video..."
              rows="3"
              disabled={loading}
              maxLength={1000}
            />
            <div className="character-count">
              {formData.description.length}/1000 characters
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="orderIndex">
              Display Order
              <span className="field-info">(Optional)</span>
            </label>
            <input
              type="number"
              id="orderIndex"
              value={formData.orderIndex}
              onChange={(e) => setFormData({...formData, orderIndex: parseInt(e.target.value) || 0})}
              min="0"
              placeholder="0"
              disabled={loading}
            />
            <div className="field-help">
              Lower numbers appear first in the course content list
            </div>
          </div>

          {uploadProgress > 0 && (
            <div className="upload-progress">
              <div className="progress-header">
                <span>Uploading to Cloudinary...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <div className="progress-info">
                <span>☁️ Storing video securely in the cloud</span>
              </div>
            </div>
          )}

          {loading && uploadProgress === 0 && (
            <div className="upload-status">
              <div className="loading-spinner"></div>
              <span>Preparing upload...</span>
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !videoFile || !formData.title.trim()}
            >
              {loading ? (
                <>
                  <span className="loading-spinner-small"></span>
                  Uploading...
                </>
              ) : (
                '📹 Upload Video'
              )}
            </button>
          </div>

          <div className="upload-tips">
            <h4>💡 Upload Tips:</h4>
            <ul>
              <li>Use MP4 format for best compatibility</li>
              <li>Keep videos under 15 minutes for better engagement</li>
              <li>Ensure good audio quality</li>
              <li>Add descriptive titles and descriptions</li>
            </ul>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VideoUploadModal;