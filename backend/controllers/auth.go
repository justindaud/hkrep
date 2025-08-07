package controllers

import (
	"net/http"

	"trialuploadhk/backend/config"
	"trialuploadhk/backend/middleware"
	"trialuploadhk/backend/models"
	"trialuploadhk/backend/utils"

	"github.com/gin-gonic/gin"
)

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// Login handles traditional username/password authentication
func Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request data"})
		return
	}

	// Find user by username
	var user models.User
	result := config.DB.Where("username = ? AND is_active = ?", req.Username, true).First(&user)
	if result.Error != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Check password
	if !utils.CheckPasswordHash(req.Password, user.PasswordHash) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid credentials"})
		return
	}

	// Generate JWT token
	token, err := middleware.GenerateToken(user.ID, user.Username, user.Role)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Login successful",
		"token":   token,
		"user": gin.H{
			"id":       user.ID,
			"username": user.Username,
			"email":    user.Email,
			"role":     user.Role,
		},
	})
}

// Logout handles user logout
func Logout(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"message": "Logout successful"})
}

// AuthMiddleware wrapper for middleware
func AuthMiddleware() gin.HandlerFunc {
	return middleware.AuthMiddleware()
}

// RoleMiddleware wrapper for middleware
func RoleMiddleware(roles ...string) gin.HandlerFunc {
	return middleware.RoleMiddleware(roles...)
}
