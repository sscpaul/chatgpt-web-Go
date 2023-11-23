package bootstrap

import (
	"github.com/869413421/chatgpt-web/config"
	"github.com/869413421/chatgpt-web/pkg/logger"
	"github.com/869413421/chatgpt-web/pkg/model"
	"github.com/869413421/chatgpt-web/pkg/model/chat"
	"github.com/869413421/chatgpt-web/pkg/model/user"
	"gorm.io/gorm"
)

// SetupDB 启动数据库
func SetupDB() {
	// 载入配置信息
	cf := config.LoadConfig()
	// 建立连接池
	db := model.ConnectDB(cf.DBURL)

	migration(db)

	insertAdmin(cf.AuthUser, cf.AuthPassword)
}

// migration 迁移
func migration(db *gorm.DB) {
	err := db.AutoMigrate(&user.User{}, &chat.Record{})
	if err != nil {
		logger.Danger("migration model error:", err)
	}
}

// 插入管理用户
func insertAdmin(adminUser string, adminPass string) {
	if adminUser != "" {
		_, err := user.GetByName(adminUser)
		if err != nil && err != gorm.ErrRecordNotFound {
			logger.Danger("insert admin error:", err)
		}
		if err == gorm.ErrRecordNotFound {
			_, err = user.CreateUser(adminUser, adminPass, true)
			if err != nil {
				logger.Danger("create admin error:", err)
			}
		}
	}
}
