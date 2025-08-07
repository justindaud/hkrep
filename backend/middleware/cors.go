package middleware

import (
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func CORSMiddleware() gin.HandlerFunc {
	config := cors.DefaultConfig()
	config.AllowAllOrigins = true
	config.AllowMethods = []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"}
	config.AllowHeaders = []string{
		"Origin",
		"Content-Type",
		"Accept",
		"Authorization",
		"X-Requested-With",
		"Range",
		"Content-Range",
		"Accept-Ranges",
		"Content-Length",
	}
	config.AllowCredentials = true
	config.ExposeHeaders = []string{
		"Content-Length",
		"Content-Range",
		"Accept-Ranges",
		"Content-Type",
	}

	return cors.New(config)
}
