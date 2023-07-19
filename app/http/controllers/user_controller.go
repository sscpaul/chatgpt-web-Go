package controllers

import (
	"net/http"

	"github.com/869413421/chatgpt-web/pkg/model/user"
	"github.com/gin-gonic/gin"
)

// UserController 用户控制器
type UserController struct {
	BaseController
}

func NewUserController() *UserController {
	return &UserController{}
}

// userRequest 用户请求
type userRequest struct {
	Name        string `json:"username"`
	Password    string `json:"password"`
	NewPassword string `json:"newpassword"`
}

// 修改密码
func (c *UserController) UpdatePassword(ctx *gin.Context) {
	var req userRequest
	err := ctx.BindJSON(&req)
	if err != nil {
		c.ResponseJson(ctx, customErrorCode, err.Error(), nil)
		return
	}

	if req.Name == "" && (req.Password == "" || req.NewPassword == "") {
		c.ResponseJson(ctx, customErrorCode, "用户旧密码和新密码不能为空", nil)
		return
	} else if req.Name != "" && req.NewPassword == "" {
		c.ResponseJson(ctx, customErrorCode, "用户密码不能为空", nil)
		return
	}

	// 判断用户密码是否符合复杂性要求
	if !user.IsComplexPassword(req.NewPassword) {
		c.ResponseJson(ctx, customErrorCode, "用户新密码至少8位，且包含大小写字母、数字", nil)
		return
	}

	loginUser := GetLoginUser(ctx)
	if loginUser == nil {
		c.ResponseJson(ctx, http.StatusUnauthorized, "未登录", nil)
		return
	}
	userInfo, err := user.GetByName(loginUser.Name)
	if err != nil {
		c.ResponseJson(ctx, customErrorCode, "获取用户信息失败"+err.Error(), nil)
		return
	}

	// 更新自己的密码
	if req.Name == "" {
		if !userInfo.ComparePassword(req.Password) {
			c.ResponseJson(ctx, customErrorCode, "输入的旧密码错误", nil)
			return
		}
		_, err = user.UpdatePassword(userInfo.Name, req.NewPassword)
	} else if userInfo.IsAdmin {
		// 管理员修改他人密码
		_, err = user.UpdatePassword(req.Name, req.NewPassword)
	} else {
		c.ResponseJson(ctx, customErrorCode, "您不是管理员，不能修改他人密码", nil)
		return
	}

	if err != nil {
		c.ResponseJson(ctx, customErrorCode, err.Error(), nil)
		return
	} else {
		c.ResponseJson(ctx, http.StatusOK, "", nil)
		return
	}
}

// 新建用户
func (c *UserController) CreateUser(ctx *gin.Context) {
	var req userRequest
	err := ctx.BindJSON(&req)
	if err != nil {
		c.ResponseJson(ctx, customErrorCode, err.Error(), nil)
		return
	}

	if req.Name == "" || req.Password == "" {
		c.ResponseJson(ctx, customErrorCode, "用户名和密码不能为空", nil)
		return
	}

	// 判断用户密码是否符合复杂性要求
	if !user.IsComplexPassword(req.Password) {
		c.ResponseJson(ctx, customErrorCode, "用户密码至少8位，且包含大小写字母、数字", nil)
		return
	}

	userInfo := GetLoginUser(ctx)
	if userInfo == nil {
		c.ResponseJson(ctx, http.StatusUnauthorized, "未登录", nil)
		return
	}

	// 不是管理员不能新增用户
	if !userInfo.IsAdmin {
		c.ResponseJson(ctx, customErrorCode, "您不是管理员，不能新增用户", nil)
		return
	}

	// 新增用户
	_, err = user.CreateUser(req.Name, req.Password, false)
	if err != nil {
		c.ResponseJson(ctx, customErrorCode, err.Error(), nil)
		return
	} else {
		c.ResponseJson(ctx, http.StatusOK, "", nil)
		return
	}
}
