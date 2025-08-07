package controllers

import (
	"net/http"

	"trialuploadhk/backend/config"
	"trialuploadhk/backend/models"

	"github.com/gin-gonic/gin"
)

type CreateRoomRequest struct {
	RoomNumber string `json:"room_number" binding:"required"`
}

type UpdateRoomRequest struct {
	RoomNumber string `json:"room_number" binding:"required"`
}

// GetRooms returns list of rooms
func GetRooms(c *gin.Context) {
	var rooms []models.Room
	if err := config.DB.Find(&rooms).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch rooms"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"rooms": rooms,
	})
}

// CreateRoom creates a new room
func CreateRoom(c *gin.Context) {
	var req CreateRoomRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	// Check if room number already exists
	var existingRoom models.Room
	if err := config.DB.Where("room_number = ?", req.RoomNumber).First(&existingRoom).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Room number already exists"})
		return
	}

	room := models.Room{
		RoomNumber: req.RoomNumber,
	}

	if err := config.DB.Create(&room).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create room"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Room created successfully",
		"room":    room,
	})
}

// UpdateRoom updates a room
func UpdateRoom(c *gin.Context) {
	roomID := c.Param("id")

	var req UpdateRoomRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	var room models.Room
	if err := config.DB.First(&room, roomID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Room not found"})
		return
	}

	// Check if new room number conflicts with existing room
	var existingRoom models.Room
	if err := config.DB.Where("room_number = ? AND id != ?", req.RoomNumber, roomID).First(&existingRoom).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Room number already exists"})
		return
	}

	room.RoomNumber = req.RoomNumber

	if err := config.DB.Save(&room).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update room"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Room updated successfully",
		"room":    room,
	})
}

// DeleteRoom deletes a room
func DeleteRoom(c *gin.Context) {
	roomID := c.Param("id")

	var room models.Room
	if err := config.DB.First(&room, roomID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Room not found"})
		return
	}

	// Check if room has videos
	var videoCount int64
	config.DB.Model(&models.Video{}).Where("room_id = ?", roomID).Count(&videoCount)
	if videoCount > 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot delete room with existing videos"})
		return
	}

	if err := config.DB.Delete(&room).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete room"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Room deleted successfully",
	})
}
