package models

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	ID           uint           `json:"id" gorm:"primaryKey"`
	Username     string         `json:"username" gorm:"uniqueIndex;not null;size:50"`
	Email        string         `json:"email" gorm:"uniqueIndex;not null;size:100"`
	PasswordHash string         `json:"-" gorm:"not null;size:255"`
	Role         string         `json:"role" gorm:"not null;default:'user';size:20"`
	IsActive     bool           `json:"is_active" gorm:"default:true"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `json:"-" gorm:"index"`

	// Relationships
	Videos []Video `json:"videos,omitempty" gorm:"foreignKey:UploadedBy"`
}

type Room struct {
	ID         uint           `json:"id" gorm:"primaryKey"`
	RoomNumber string         `json:"room_number" gorm:"uniqueIndex;not null;size:20"`
	IsActive   bool           `json:"is_active" gorm:"default:true"`
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `json:"-" gorm:"index"`

	// Relationships
	Videos []Video `json:"videos,omitempty" gorm:"foreignKey:RoomID"`
}

type Video struct {
	ID               uint           `json:"id" gorm:"primaryKey"`
	Filename         string         `json:"filename" gorm:"not null;size:255"`
	OriginalFilename string         `json:"original_filename" gorm:"not null;size:255"`
	FilePath         string         `json:"file_path" gorm:"not null;size:500"`
	FileSize         int64          `json:"file_size" gorm:"not null"`
	Duration         *int           `json:"duration"` // in seconds
	RoomID           *uint          `json:"room_id"`
	UploadedBy       uint           `json:"uploaded_by" gorm:"not null"`
	UploadDate       time.Time      `json:"upload_date" gorm:"default:CURRENT_TIMESTAMP"`
	IsDeleted        bool           `json:"is_deleted" gorm:"default:false"`
	Metadata         string         `json:"metadata" gorm:"type:jsonb"`
	CreatedAt        time.Time      `json:"created_at"`
	UpdatedAt        time.Time      `json:"updated_at"`
	DeletedAt        gorm.DeletedAt `json:"-" gorm:"index"`

	// Relationships
	Room *Room `json:"room,omitempty" gorm:"foreignKey:RoomID"`
	User User  `json:"user,omitempty" gorm:"foreignKey:UploadedBy"`
}
