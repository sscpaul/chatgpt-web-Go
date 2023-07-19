package chat

import (
	"fmt"

	"github.com/869413421/chatgpt-web/pkg/model"
)

type Record struct {
	model.BaseModel
	UserID   uint64 `gorm:"column:user_id;type:bigint(20);not null" valid:"user_id"`
	ChatID   string `gorm:"column:chat_id;type:varchar(255);not null;unique" valid:"chat_id"`
	Subject  string `gorm:"column:subject;type:varchar(255);not null" valid:"subject"`
	Messages string `gorm:"column:messages" valid:"messages"`
}

// SelectRecordByChatId 根据chatId查询数据
func SelectRecordByChatId(chatId string) (record *Record, err error) {
	record = &Record{}
	err = model.DB.Where("chat_id = ?", chatId).First(record).Error
	return
}

// SelectRecordByUserId 根据userId查询指定用户的数据，按照创建时间倒序排列
func SelectRecordByUserId(userId uint64) (records []*Record, err error) {
	err = model.DB.Where("user_id = ?", userId).Order("created_at DESC").Find(&records).Error
	return
}

// UpdateRecord 更新聊天记录，如果不存在则创建
func UpdateRecord(userId uint64, chatId string, subject string, messages string) (record *Record, err error) {
	record = &Record{}
	// 判断该聊天是否存在
	err = model.DB.Where("chat_id = ?", chatId).First(record).Error
	if err == nil {
		if userId != 0 && userId != record.UserID {
			err = fmt.Errorf("该聊天记录不属于当前用户")
			return
		}
		if subject != "" {
			record.Subject = subject
		}
		if messages != "" {
			record.Messages = messages
		}
		err = model.DB.Updates(record).Error
	} else {
		record.UserID = userId
		record.ChatID = chatId
		record.Subject = subject
		record.Messages = messages
		err = model.DB.Create(record).Error
	}
	return
}

// DeleteRecordByChatId 删除聊天记录
func DeleteRecordByChatId(userId uint64, chatId string) (record *Record, err error) {
	record = &Record{}
	err = model.DB.Where("chat_id = ?", chatId).First(record).Error
	if err == nil {
		if userId != 0 && userId != record.UserID {
			err = fmt.Errorf("该聊天记录不属于当前用户")
			return
		}
		err = model.DB.Delete(record).Error
	}
	return
}
