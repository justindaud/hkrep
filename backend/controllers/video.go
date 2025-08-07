package controllers

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"trialuploadhk/backend/config"
	"trialuploadhk/backend/models"

	"github.com/gin-gonic/gin"
)

// UploadVideo handles video upload
func UploadVideo(c *gin.Context) {
	userID := c.GetUint("user_id")

	// Parse multipart form
	if err := c.Request.ParseMultipartForm(config.AppConfig.Upload.MaxFileSize); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File too large"})
		return
	}

	// Get uploaded file
	file, header, err := c.Request.FormFile("video")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No video file provided"})
		return
	}
	defer file.Close()

	// Get room ID
	roomIDStr := c.PostForm("room_id")
	if roomIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Room ID is required"})
		return
	}

	roomID, err := strconv.ParseUint(roomIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid room ID"})
		return
	}

	// Check if room exists
	var room models.Room
	if err := config.DB.First(&room, roomID).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Room not found"})
		return
	}

	// Create upload directory structure
	now := time.Now()
	year := strconv.Itoa(now.Year())
	month := fmt.Sprintf("%02d", now.Month())
	uploadPath := filepath.Join(config.AppConfig.Upload.Dir, year, month, fmt.Sprintf("room_%s", room.RoomNumber))

	if err := os.MkdirAll(uploadPath, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create upload directory"})
		return
	}

	// Generate unique filename
	timestamp := now.Format("20060102_150405")
	filename := fmt.Sprintf("video_%s_%s%s", timestamp, room.RoomNumber, filepath.Ext(header.Filename))
	filePath := filepath.Join(uploadPath, filename)

	// Create file
	dst, err := os.Create(filePath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create file"})
		return
	}
	defer dst.Close()

	// Copy file content
	fileSize, err := io.Copy(dst, file)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save file"})
		return
	}

	// Save video record to database
	video := models.Video{
		Filename:         filename,
		OriginalFilename: header.Filename,
		FilePath:         filePath,
		FileSize:         fileSize,
		RoomID:           &room.ID,
		UploadedBy:       userID,
		UploadDate:       now,
		Metadata:         fmt.Sprintf(`{"content_type": "%s", "room_number": "%s"}`, header.Header.Get("Content-Type"), room.RoomNumber),
	}

	if err := config.DB.Create(&video).Error; err != nil {
		// Clean up file if database save fails
		os.Remove(filePath)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save video record"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Video uploaded successfully",
		"video": gin.H{
			"id":       video.ID,
			"filename": video.Filename,
			"size":     video.FileSize,
			"room":     room.RoomNumber,
		},
	})
}

// GetVideos returns all videos for the authenticated user
func GetVideos(c *gin.Context) {
	userID := c.GetUint("user_id")
	userRole := c.GetString("user_role")

	// Debug logging - VERY PROMINENT
	fmt.Println("=== DEBUG: GetVideos ===")
	fmt.Printf("User ID: %d, Role: %s\n", userID, userRole)
	fmt.Println("========================")

	var videos []models.Video
	query := config.DB

	// Show all videos for all users - no filtering
	fmt.Printf("SHOWING ALL: All videos for all users\n")

	if err := query.Find(&videos).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch videos"})
		return
	}

	fmt.Printf("FOUND: %d videos\n", len(videos))

	// Manually load room information for each video
	for i := range videos {
		if videos[i].RoomID != nil {
			var room models.Room
			if err := config.DB.Where("id = ?", *videos[i].RoomID).First(&room).Error; err == nil {
				videos[i].Room = &room
			}
		}
		// Manually load Uploader information
		var uploader models.User
		if err := config.DB.Where("id = ?", videos[i].UploadedBy).First(&uploader).Error; err == nil {
			videos[i].User = uploader
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"videos": videos,
	})
}

// GetVideo returns specific video details
func GetVideo(c *gin.Context) {
	videoID := c.Param("id")

	var video models.Video
	query := config.DB.Where("id = ?", videoID)

	// No filtering - allow access to all videos
	if err := query.First(&video).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Video not found"})
		return
	}

	// Manually load room information
	if video.RoomID != nil {
		var room models.Room
		if err := config.DB.Where("id = ?", *video.RoomID).First(&room).Error; err == nil {
			video.Room = &room
		}
	}
	// Manually load uploader information
	var uploader models.User
	if err := config.DB.Where("id = ?", video.UploadedBy).First(&uploader).Error; err == nil {
		video.User = uploader
	}

	c.JSON(http.StatusOK, gin.H{
		"video": video,
	})
}

// DeleteVideo deletes a video
func DeleteVideo(c *gin.Context) {
	videoID := c.Param("id")
	userID := c.GetUint("user_id")
	userRole := c.GetString("user_role")

	var video models.Video
	query := config.DB.Where("id = ?", videoID)

	// If user is not supervisor or manager, only allow deletion of their own videos
	if userRole != "supervisor" && userRole != "manager" {
		query = query.Where("uploaded_by = ?", userID)
	}

	if err := query.First(&video).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Video not found"})
		return
	}

	// Delete file from filesystem
	if err := os.Remove(video.FilePath); err != nil {
		// Log error but continue with database deletion
		fmt.Printf("Failed to delete file %s: %v\n", video.FilePath, err)
	}

	// Delete from database
	if err := config.DB.Delete(&video).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete video"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Video deleted successfully",
	})
}

// StreamVideo streams video content
func StreamVideo(c *gin.Context) {
	videoID := c.Param("id")

	var video models.Video
	if err := config.DB.Where("id = ?", videoID).First(&video).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Video not found"})
		return
	}

	// Check if file exists
	if _, err := os.Stat(video.FilePath); os.IsNotExist(err) {
		c.JSON(http.StatusNotFound, gin.H{"error": "Video file not found"})
		return
	}

	// Set appropriate headers for video streaming
	c.Header("Content-Type", "video/mp4")
	c.Header("Accept-Ranges", "bytes")
	c.Header("Cache-Control", "no-cache")
	c.Header("Access-Control-Allow-Origin", "*")
	c.Header("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS")
	c.Header("Access-Control-Allow-Headers", "Range, Content-Range, Accept-Ranges")

	// Handle preflight requests
	if c.Request.Method == "OPTIONS" {
		c.Status(http.StatusOK)
		return
	}

	// Stream video file
	c.File(video.FilePath)
}
