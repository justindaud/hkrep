package main

import (
	"log"
	"trialuploadhk/backend/config"
	"trialuploadhk/backend/models"
	"trialuploadhk/backend/utils"
)

func main() {
	// Initialize database
	config.InitDB()

	// Create test user with simple password
	password := "123456"
	hashedPassword, err := utils.HashPassword(password)
	if err != nil {
		log.Fatal("Failed to hash password:", err)
	}

	log.Printf("Original password: %s", password)
	log.Printf("Hashed password: %s", hashedPassword)

	user := models.User{
		Username:     "testuser",
		Email:        "test@example.com",
		PasswordHash: hashedPassword,
		Role:         "user",
		IsActive:     true,
	}

	// Check if user already exists
	var existingUser models.User
	if err := config.DB.Where("username = ?", user.Username).First(&existingUser).Error; err == nil {
		log.Println("User 'testuser' already exists")
		return
	}

	// Create user
	if err := config.DB.Create(&user).Error; err != nil {
		log.Fatal("Failed to create user:", err)
	}

	log.Println("Test user created successfully!")
	log.Println("Username: testuser")
	log.Println("Password: 123456")

	// Verify the user was created
	var createdUser models.User
	if err := config.DB.Where("username = ?", "testuser").First(&createdUser).Error; err != nil {
		log.Fatal("Failed to find created user:", err)
	}

	log.Printf("User found in database: %+v", createdUser)
}
