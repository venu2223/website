const { cloudinary, upload, uploadToCloudinary, deleteVideo } = require('../config/cloudinary');
const CourseContent = require('../models/CourseContent');
const fs = require('fs');

// Test connection
exports.testConnection = async (req, res) => {
  try {
    const result = await cloudinary.api.ping();
    res.json({
      success: true,
      message: 'Cloudinary connected successfully!',
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      status: result.status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Cloudinary connection failed',
      error: error.message
    });
  }
};

// Upload video
exports.uploadVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No video file provided'
      });
    }

    // Upload to Cloudinary
    const cloudinaryResult = await uploadToCloudinary(req.file.path);
    
    // Clean up temp file
    fs.unlinkSync(req.file.path);

    const videoData = {
      public_id: cloudinaryResult.public_id,
      secure_url: cloudinaryResult.secure_url,
      format: cloudinaryResult.format,
      resource_type: cloudinaryResult.resource_type,
      bytes: cloudinaryResult.bytes,
      duration: Math.round(cloudinaryResult.duration),
      width: cloudinaryResult.width,
      height: cloudinaryResult.height
    };

    res.json({
      success: true,
      message: 'Video uploaded successfully',
      video: videoData
    });

  } catch (error) {
    // Clean up on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Upload failed',
      error: error.message
    });
  }
};

// Add video content
exports.addVideoContent = async (req, res) => {
  try {
    const { courseId, title, description, videoUrl, publicId, duration, orderIndex } = req.body;

    if (!courseId || !title || !videoUrl || !publicId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const content = await CourseContent.create({
      course_id: courseId,
      title: title.trim(),
      description: description || '',
      content_type: 'video',
      video_url: videoUrl,
      video_public_id: publicId,
      video_duration: duration || 0,
      order_index: orderIndex || 0,
      is_published: true
    });

    res.json({
      success: true,
      message: 'Video content added successfully',
      content: content
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add video content',
      error: error.message
    });
  }
};

// Get course videos
exports.getCourseVideos = async (req, res) => {
  try {
    const { courseId } = req.params;
    const videos = await CourseContent.findByCourseId(courseId);
    
    const videoContent = videos.filter(item => item.content_type === 'video');

    res.json({
      success: true,
      videos: videoContent
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get videos',
      error: error.message
    });
  }
};

// Delete video content
exports.deleteVideoContent = async (req, res) => {
  try {
    const { contentId } = req.params;
    const content = await CourseContent.findById(contentId);
    
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }

    // Delete from Cloudinary
    if (content.video_public_id) {
      await deleteVideo(content.video_public_id);
    }

    // Delete from database
    await CourseContent.delete(contentId);

    res.json({
      success: true,
      message: 'Video content deleted successfully'
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete video content',
      error: error.message
    });
  }
};

// Get upload signature
exports.getUploadSignature = async (req, res) => {
  try {
    const { folder = 'lms/courses/videos' } = req.body;
    const timestamp = Math.round(Date.now() / 1000);
    
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder },
      process.env.CLOUDINARY_API_SECRET
    );

    res.json({
      success: true,
      signature,
      timestamp,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      folder
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate signature',
      error: error.message
    });
  }
};