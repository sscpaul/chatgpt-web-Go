package model

import (
	"strings"
	"time"

	"github.com/glebarez/sqlite"
	"gorm.io/driver/mysql"
	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlserver"
	"gorm.io/gorm"
	gloger "gorm.io/gorm/logger"

	"github.com/869413421/chatgpt-web/pkg/logger"
	"github.com/869413421/chatgpt-web/pkg/types"
)

// BaseModel 主模型
type BaseModel struct {
	ID        uint64    `gorm:"column:id;primaryKey;autoIncrement;not null"`
	CreatedAt time.Time `gorm:"column:created_at;index"`
	UpdatedAt time.Time `gorm:"column:updated_at;index"`
}

// GetStringID 获取主键字符串
func (model BaseModel) GetStringID() string {
	return types.UInt64ToString(model.ID)
}

// CreatedAtDate 获取创建时间
func (model BaseModel) CreatedAtDate() string {
	return model.CreatedAt.Format("2006-01-02")
}

var DB *gorm.DB

func ConnectDB(dbUrl string) *gorm.DB {
	var err error
	DB, err = gorm.Open(getDialector(dbUrl), &gorm.Config{
		Logger: gloger.Default.LogMode(gloger.Info),
	})
	if err != nil {
		logger.Danger("open sqlite error:", err)
	}
	return DB
}

func getDialector(dbUrl string) gorm.Dialector {
	var dbType, dsn string

	iPos := strings.Index(dbUrl, "://")
	if iPos < 0 {
		dbType = "sqlite"
		dsn = dbUrl
	} else {
		dbType = dbUrl[:iPos]
		dsn = dbUrl[iPos+3:]
	}

	switch dbType {
	case "sqlite":
		return sqlite.Open(dsn)
	case "mysql":
		return mysql.Open(dsn)
	case "postgre":
		return postgres.Open(dsn)
	case "sqlserver":
		return sqlserver.Open(dsn)
	default:
		return nil
	}
}
