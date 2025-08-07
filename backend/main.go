package main

import (
	"log"
	"os"
	"path/filepath"

	"trialuploadhk/backend/config"
	"trialuploadhk/backend/middleware"
	"trialuploadhk/backend/routes"

	"github.com/gin-gonic/gin"
)

func main() {
	// Load configuration
	config.LoadConfig()

	// Initialize database
	config.InitDatabase()

	// Create upload directory if it doesn't exist
	if err := os.MkdirAll(config.AppConfig.Upload.Dir, 0755); err != nil {
		log.Fatal("Failed to create upload directory:", err)
	}

	// Set Gin mode
	gin.SetMode(gin.ReleaseMode)

	// Create router
	router := gin.Default()

	// Apply middleware
	router.Use(middleware.CORSMiddleware())

	// Setup routes
	routes.SetupRoutes(router)

	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	log.Printf("Server starting on %s:%s", config.AppConfig.Server.Host, config.AppConfig.Server.Port)
	log.Printf("Health check available at http://%s:%s/health", config.AppConfig.Server.Host, config.AppConfig.Server.Port)

	// Check if HTTPS certificates exist
	certFile := filepath.Join("certificates", "localhost.pem")
	keyFile := filepath.Join("certificates", "localhost-key.pem")

	if _, err := os.Stat(certFile); err == nil {
		if _, err := os.Stat(keyFile); err == nil {
			// HTTPS certificates exist, use HTTPS
			log.Printf("HTTPS certificates found, starting HTTPS server")
			if err := router.RunTLS(config.AppConfig.Server.Host+":"+config.AppConfig.Server.Port, certFile, keyFile); err != nil {
				log.Fatal("Failed to start HTTPS server:", err)
			}
		}
	}

	// Fallback to HTTP
	if err := router.Run(config.AppConfig.Server.Host + ":" + config.AppConfig.Server.Port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
