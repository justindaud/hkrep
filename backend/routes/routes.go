package routes

import (
	"trialuploadhk/backend/controllers"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {
	// API routes
	api := r.Group("/api")
	{
		// Auth routes
		auth := api.Group("/auth")
		{
			auth.POST("/login", controllers.Login)
			auth.POST("/logout", controllers.Logout)
		}

		// Protected routes
		protected := api.Group("/")
		protected.Use(controllers.AuthMiddleware())
		{
			// Video routes
			videos := protected.Group("/videos")
			{
				videos.POST("/upload", controllers.UploadVideo)
				videos.GET("", controllers.GetVideos)
				videos.GET("/:id", controllers.GetVideo)
				videos.DELETE("/:id", controllers.DeleteVideo)
			}

			// Room routes - GET for all users, others for Manager/Supervisor only
			rooms := protected.Group("/rooms")
			{
				rooms.GET("", controllers.GetRooms) // All authenticated users can view rooms
			}

			// Room management routes (Manager/Supervisor only)
			roomManagement := protected.Group("/rooms")
			roomManagement.Use(controllers.RoleMiddleware("manager", "supervisor"))
			{
				roomManagement.POST("", controllers.CreateRoom)
				roomManagement.PUT("/:id", controllers.UpdateRoom)
				roomManagement.DELETE("/:id", controllers.DeleteRoom)
			}

			// User routes (Manager/Supervisor only)
			users := protected.Group("/users")
			users.Use(controllers.RoleMiddleware("manager", "supervisor"))
			{
				users.GET("", controllers.GetUsers)
				users.POST("", controllers.CreateUser)
				users.PUT("/:id", controllers.UpdateUser)
				users.DELETE("/:id", controllers.DeleteUser)
			}
		}

		// Public video streaming route (no auth required)
		api.GET("/videos/:id/stream", controllers.StreamVideo)
	}
}
