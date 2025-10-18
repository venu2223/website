import api from './api';

export const videoService = {
  // Upload video to Cloudinary
  async uploadVideo(videoFile) {
    try {
      const formData = new FormData();
      formData.append('video', videoFile);

      const response = await api.post('/videos/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 300000, // 5 minutes timeout for large videos
      });

      return response.data;
    } catch (error) {
      console.error('Video upload error:', error);
      throw {
        type: 'UPLOAD_ERROR',
        message: error.response?.data?.message || 'Failed to upload video',
        suggestion: 'Please check your internet connection and try again.'
      };
    }
  },

  // Add video content to course
  async addVideoContent(contentData) {
    try {
      const response = await api.post('/videos/content', contentData);
      return response.data;
    } catch (error) {
      console.error('Add video content error:', error);
      throw {
        type: 'CONTENT_ERROR',
        message: error.response?.data?.message || 'Failed to add video content',
        suggestion: 'Please check your data and try again.'
      };
    }
  },

  // Get course videos
  async getCourseVideos(courseId) {
    try {
      const response = await api.get(`/videos/course/${courseId}`);
      return response.data;
    } catch (error) {
      console.error('Get course videos error:', error);
      throw {
        type: 'FETCH_ERROR',
        message: error.response?.data?.message || 'Failed to fetch course videos',
        suggestion: 'Please try again later.'
      };
    }
  },

  // Delete video content
  async deleteVideoContent(contentId) {
    try {
      const response = await api.delete(`/videos/content/${contentId}`);
      return response.data;
    } catch (error) {
      console.error('Delete video content error:', error);
      throw {
        type: 'DELETE_ERROR',
        message: error.response?.data?.message || 'Failed to delete video content',
        suggestion: 'Please try again.'
      };
    }
  }
};

export default videoService;