package config

import (
	"log"

	"trialuploadhk/backend/models"
	"trialuploadhk/backend/utils"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func InitDatabase() {
	var err error
	DB, err = gorm.Open(sqlite.Open("trialuploadhk.db"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})

	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	log.Println("Database connected successfully")

	// Auto migrate tables
	err = DB.AutoMigrate(
		&models.User{},
		&models.Room{},
		&models.Video{},
	)

	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	log.Println("Database migration completed")

	// Create default admin user if not exists
	createDefaultAdmin()

	// Create sample rooms if not exists
	createSampleRooms()
}

func createDefaultAdmin() {
	var count int64
	DB.Model(&models.User{}).Count(&count)

	if count == 0 {
		// Create default admin user
		passwordHash, err := utils.HashPassword("password")
		if err != nil {
			log.Printf("Failed to hash password: %v", err)
			return
		}

		adminUser := models.User{
			Username:     "admin",
			Email:        "admin@raroomreport.com",
			PasswordHash: passwordHash,
			Role:         "supervisor",
			IsActive:     true,
		}

		result := DB.Create(&adminUser)
		if result.Error != nil {
			log.Printf("Failed to create default admin user: %v", result.Error)
		} else {
			log.Println("Default admin user created successfully")
			log.Println("Username: admin")
			log.Println("Password: password")
		}
	}
}

func createSampleRooms() {
	var count int64
	DB.Model(&models.Room{}).Count(&count)
	if count == 0 {
		sampleRooms := []models.Room{
			{RoomNumber: "101"},
			{RoomNumber: "102"},
			{RoomNumber: "201"},
			{RoomNumber: "202"},
			{RoomNumber: "301"},
		}

		for _, room := range sampleRooms {
			if err := DB.Create(&room).Error; err != nil {
				log.Printf("Failed to create sample room %s: %v", room.RoomNumber, err)
			}
		}
		log.Printf("Sample rooms created")
	}
}
