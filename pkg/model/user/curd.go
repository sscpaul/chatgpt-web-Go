package user

import (
	"regexp"

	"github.com/869413421/chatgpt-web/pkg/model"
)

// GetByName 根据名称获取用户
func GetByName(name string) (user *User, err error) {
	user = &User{}
	err = model.DB.Where("name = ?", name).First(user).Error
	return
}

// CreateUser 创建用户
func CreateUser(name, password string, isadmin bool) (user *User, err error) {
	user = &User{}
	user.Name = name
	user.Password = password
	user.IsAdmin = isadmin
	result := model.DB.Create(user)
	err = result.Error
	return
}

// UpdatePassword 更新密码
func UpdatePassword(name string, password string) (user *User, err error) {
	user = &User{}
	err = model.DB.Where("name = ?", name).First(user).Error
	if err != nil {
		return
	}
	user.Password = password
	err = model.DB.Updates(user).Error
	return
}

// IsComplexPassword 检查密码是否符合复杂性要求，至少8位，且包含大小写字母、数字
func IsComplexPassword(_password string) bool {
	// 定义多个正则表达式来判断密码是否符合要求
	length := len(_password)
	upper := regexp.MustCompile(`[A-Z]`).MatchString(_password)
	lower := regexp.MustCompile(`[a-z]`).MatchString(_password)
	number := regexp.MustCompile(`[\d]`).MatchString(_password)
	// special := regexp.MustCompile(`[$@$!%*#?&]`).MatchString(_password)

	return length >= 8 && upper && lower && number //&& special
}
