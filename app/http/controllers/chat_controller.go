package controllers

import (
	"context"
	"encoding/json"
	"fmt"
	"net"
	"net/http"
	"net/url"
	"os"
	"reflect"
	"strings"
	"time"

	"golang.org/x/net/proxy"

	"github.com/869413421/chatgpt-web/config"
	"github.com/869413421/chatgpt-web/pkg/logger"
	"github.com/869413421/chatgpt-web/pkg/model/chat"
	"github.com/869413421/chatgpt-web/pkg/model/user"
	"github.com/gin-gonic/gin"
	gogpt "github.com/sashabaranov/go-openai"
)

const customErrorCode = 280
const subjectMaxLength = 15

// ChatController 首页控制器
type ChatController struct {
	BaseController
}

type ChatRequest struct {
	UserID  uint64 `json:"userid"`
	ChatID  string `json:"chatid"`
	Subject string `json:"subject"`
	gogpt.ChatCompletionRequest
}

// NewChatController 创建控制器
func NewChatController() *ChatController {
	return &ChatController{}
}

// Index 首页
func (c *ChatController) Index(ctx *gin.Context) {
	ctx.HTML(http.StatusOK, "index.html", gin.H{
		"title": "ChatGPT首页",
	})
}

// 获取登录用户信息
func GetLoginUser(ctx *gin.Context) *user.User {
	authUser, ok := ctx.Get("authUser")
	if ok {
		userInfo, ok := authUser.(*user.User)
		if ok {
			return userInfo
		}
	}
	return nil
}

// GetConfig 获取配置信息
func (c *ChatController) GetConfig(ctx *gin.Context) {
	userInfo := GetLoginUser(ctx)
	if userInfo == nil {
		c.ResponseJson(ctx, http.StatusUnauthorized, "未登录", nil)
		return
	}
	cnf := config.LoadConfig()

	c.ResponseJson(ctx, http.StatusOK, "", gin.H{
		"ApiKey":           cnf.ApiKey,
		"ApiURL":           cnf.ApiURL,
		"Port":             cnf.Port,
		"Listen":           cnf.Listen,
		"BotDesc":          cnf.BotDesc,
		"Proxy":            cnf.Proxy,
		"Model":            cnf.Model,
		"MaxTokens":        cnf.MaxTokens,
		"Temperature":      cnf.Temperature,
		"TopP":             cnf.TopP,
		"FrequencyPenalty": cnf.FrequencyPenalty,
		"PresencePenalty":  cnf.PresencePenalty,
	})
}

// SetConfig 设置配置信息
func (c *ChatController) SetConfig(ctx *gin.Context) {
	var request config.Configuration
	err := ctx.BindJSON(&request)
	if err != nil {
		c.ResponseJson(ctx, customErrorCode, err.Error(), nil)
		return
	}

	userInfo := GetLoginUser(ctx)
	if userInfo == nil {
		c.ResponseJson(ctx, http.StatusUnauthorized, "未登录", nil)
		return
	} else if !userInfo.IsAdmin {
		c.ResponseJson(ctx, customErrorCode, "不是管理员不能进行系统设置", nil)
		return
	}

	cnf := config.LoadConfig()
	cnf.ApiKey = request.ApiKey
	cnf.ApiURL = request.ApiURL
	cnf.Port = request.Port
	cnf.Listen = request.Listen
	cnf.BotDesc = request.BotDesc
	cnf.Proxy = request.Proxy
	cnf.Model = request.Model
	cnf.MaxTokens = request.MaxTokens
	cnf.Temperature = request.Temperature
	cnf.TopP = request.TopP
	cnf.FrequencyPenalty = request.FrequencyPenalty
	cnf.PresencePenalty = request.PresencePenalty

	NewConfigJson, _ := json.MarshalIndent(cnf, "", "  ")
	os.WriteFile("config.json", NewConfigJson, 0666)

	c.ResponseJson(ctx, http.StatusOK, "", nil)
}

// UserChatRecord 获取当前登录用户的聊天记录
func (c *ChatController) UserChatRecord(ctx *gin.Context) {
	userInfo := GetLoginUser(ctx)
	if userInfo == nil {
		c.ResponseJson(ctx, http.StatusUnauthorized, "未登录", nil)
		return
	} else {
		records, err := chat.SelectRecordByUserId(userInfo.ID)
		if err != nil {
			c.ResponseJson(ctx, customErrorCode, err.Error(), nil)
			return
		} else {
			var chatRecord []gin.H
			for _, item := range records {
				chatRecord = append(chatRecord, gin.H{"ID": item.ID, "Subject": item.Subject, "ChatID": item.ChatID, "CreatedAt": item.CreatedAt, "UpdatedAt": item.UpdatedAt})
			}
			c.ResponseJson(ctx, http.StatusOK, "", gin.H{
				"UserID":     userInfo.ID,
				"UserName":   userInfo.Name,
				"IsAdmin":    userInfo.IsAdmin,
				"ChatRecord": chatRecord,
			})
			return
		}
	}
}

// ChatMessages 获取当前登录用户的指定聊天的消息
func (c *ChatController) ChatMessages(ctx *gin.Context) {
	userInfo := GetLoginUser(ctx)
	if userInfo == nil {
		c.ResponseJson(ctx, http.StatusUnauthorized, "未登录", nil)
		return
	} else {
		var request ChatRequest
		err := ctx.BindJSON(&request)
		if err != nil {
			c.ResponseJson(ctx, customErrorCode, err.Error(), nil)
			return
		}
		record, err := chat.SelectRecordByChatId(request.ChatID)
		if err != nil {
			c.ResponseJson(ctx, customErrorCode, err.Error(), nil)
			return
		} else if userInfo.ID != record.UserID {
			c.ResponseJson(ctx, customErrorCode, "不是当前登录用户的会话记录", nil)
			return
		} else {
			c.ResponseJson(ctx, http.StatusOK, "", gin.H{
				"messages": record.Messages,
			})
			return
		}
	}
}

// RenameSubject 重命名聊天主题
func (c *ChatController) RenameSubject(ctx *gin.Context) {
	userInfo := GetLoginUser(ctx)
	if userInfo == nil {
		c.ResponseJson(ctx, http.StatusUnauthorized, "未登录", nil)
		return
	} else {
		var request ChatRequest
		err := ctx.BindJSON(&request)
		if err != nil {
			c.ResponseJson(ctx, customErrorCode, err.Error(), nil)
			return
		}
		_, err = chat.UpdateRecord(userInfo.ID, request.ChatID, request.Subject, "")
		if err != nil {
			c.ResponseJson(ctx, customErrorCode, err.Error(), nil)
			return
		} else {
			c.ResponseJson(ctx, http.StatusOK, "", nil)
			return
		}
	}
}

// DeleteChat 删除聊天记录
func (c *ChatController) DeleteChat(ctx *gin.Context) {
	userInfo := GetLoginUser(ctx)
	if userInfo == nil {
		c.ResponseJson(ctx, http.StatusUnauthorized, "未登录", nil)
		return
	} else {
		var request ChatRequest
		err := ctx.BindJSON(&request)
		if err != nil {
			c.ResponseJson(ctx, customErrorCode, err.Error(), nil)
			return
		}
		_, err = chat.DeleteRecordByChatId(userInfo.ID, request.ChatID)
		if err != nil {
			c.ResponseJson(ctx, customErrorCode, err.Error(), nil)
			return
		} else {
			c.ResponseJson(ctx, http.StatusOK, "", nil)
			return
		}
	}
}

// Completion 回复
func (c *ChatController) Completion(ctx *gin.Context) {
	var request ChatRequest
	err := ctx.BindJSON(&request)
	if err != nil {
		c.ResponseJson(ctx, customErrorCode, err.Error(), nil)
		return
	}
	// 强制设置用户ID
	userInfo := GetLoginUser(ctx)
	if userInfo != nil {
		request.UserID = userInfo.ID
	}
	chatRecord, err := chat.SelectRecordByChatId(request.ChatID)
	// 如果没有聊天记录，就创建一个
	if err != nil {
		// 使用第一条消息作为问题自动获取关键信息作为主题
		var req gogpt.ChatCompletionRequest
		req.Messages = append(req.Messages, request.Messages[0])
		req.Messages[0].Content = fmt.Sprintf("从“%s”这段文字中提验%d字内的关键信息", req.Messages[0].Content, subjectMaxLength)
		resp, err := CreateChatCompletion(ctx, req)
		if err != nil {
			request.Subject = request.Messages[0].Content
		} else {
			// 判断resp是不是gogpt.ChatCompletionResponse类型
			if reflect.TypeOf(resp) == reflect.TypeOf(gogpt.ChatCompletionResponse{}) {
				request.Subject = resp.(gogpt.ChatCompletionResponse).Choices[0].Message.Content
			} else {
				request.Subject = resp.(gogpt.CompletionResponse).Choices[0].Text
			}
		}
	} else {
		chatMessage := request.Messages[0]
		json.Unmarshal([]byte(chatRecord.Messages), &request.Messages)

		request.Messages = append(request.Messages, chatMessage)
	}
	logger.Info(request)
	if len(request.Messages) == 0 {
		c.ResponseJson(ctx, customErrorCode, "需要输入问话内容", nil)
		return
	}

	// 调用GPT3生成回复
	resp, err := CreateChatCompletion(ctx, request.ChatCompletionRequest)
	if err != nil {
		c.ResponseJson(ctx, customErrorCode, err.Error(), nil)
		return
	} else {
		var newMessage gogpt.ChatCompletionMessage
		// 判断resp是不是gogpt.ChatCompletionResponse类型
		if reflect.TypeOf(resp) == reflect.TypeOf(gogpt.ChatCompletionResponse{}) {
			newMessage = resp.(gogpt.ChatCompletionResponse).Choices[0].Message
		} else {
			newMessage = gogpt.ChatCompletionMessage{Role: "assistant", Content: resp.(gogpt.CompletionResponse).Choices[0].Text}
		}
		newMessagesJson, err := json.Marshal(append(request.Messages, newMessage))
		if err != nil {
			c.ResponseJson(ctx, customErrorCode, err.Error(), nil)
			return
		}
		item, err := chat.UpdateRecord(request.UserID, request.ChatID, request.Subject, string(newMessagesJson))
		if err != nil {
			c.ResponseJson(ctx, customErrorCode, err.Error(), nil)
			return
		}

		var chatRecord []gin.H
		chatRecord = append(chatRecord, gin.H{"ID": item.ID, "Subject": item.Subject, "ChatID": item.ChatID, "CreatedAt": item.CreatedAt, "UpdatedAt": item.UpdatedAt})
		c.ResponseJson(ctx, http.StatusOK, "", gin.H{
			"Reply":      newMessage.Content,
			"UserID":     userInfo.ID,
			"UserName":   userInfo.Name,
			"ChatRecord": chatRecord,
		})
	}
}

// CreateChatCompletion 创建聊天回复
func CreateChatCompletion(ctx *gin.Context, request gogpt.ChatCompletionRequest) (any, error) {
	cnf := config.LoadConfig()
	gptConfig := gogpt.DefaultConfig(cnf.ApiKey)

	if cnf.Proxy != "" {
		transport := &http.Transport{}

		if strings.HasPrefix(cnf.Proxy, "socks5h://") {
			// 创建一个 DialContext 对象，并设置代理服务器
			dialContext, err := newDialContext(cnf.Proxy[10:])
			if err != nil {
				panic(err)
			}
			transport.DialContext = dialContext
		} else {
			// 创建一个 HTTP Transport 对象，并设置代理服务器
			proxyUrl, err := url.Parse(cnf.Proxy)
			if err != nil {
				panic(err)
			}
			transport.Proxy = http.ProxyURL(proxyUrl)
		}
		// 创建一个 HTTP 客户端，并将 Transport 对象设置为其 Transport 字段
		gptConfig.HTTPClient = &http.Client{
			Transport: transport,
		}
	}

	// 自定义gptConfig.BaseURL
	if cnf.ApiURL != "" {
		gptConfig.BaseURL = cnf.ApiURL
	}

	client := gogpt.NewClientWithConfig(gptConfig)
	// 如果第一条消息不是系统消息，就添加一条系统消息
	if request.Messages[0].Role != "system" {
		newMessage := append([]gogpt.ChatCompletionMessage{
			{Role: "system", Content: cnf.BotDesc},
		}, request.Messages...)
		request.Messages = newMessage
	}

	if elementExists[string](cnf.Model, []string{
		gogpt.GPT432K0613, gogpt.GPT432K0314, gogpt.GPT432K, gogpt.GPT40613, gogpt.GPT40314, gogpt.GPT4,
		gogpt.GPT3Dot5Turbo0613, gogpt.GPT3Dot5Turbo0301, gogpt.GPT3Dot5Turbo16K, gogpt.GPT3Dot5Turbo16K0613,
		gogpt.GPT3Dot5Turbo, gogpt.GPT3Dot5TurboInstruct}) {
		request.Model = cnf.Model
		return client.CreateChatCompletion(ctx, request)
	} else {
		prompt := ""
		for _, item := range request.Messages {
			prompt += item.Content + "/n"
		}
		prompt = strings.Trim(prompt, "/n")

		logger.Info("request prompt is", prompt)
		req := gogpt.CompletionRequest{
			Model:            cnf.Model,
			MaxTokens:        cnf.MaxTokens,
			TopP:             cnf.TopP,
			FrequencyPenalty: cnf.FrequencyPenalty,
			PresencePenalty:  cnf.PresencePenalty,
			Prompt:           prompt,
		}
		return client.CreateCompletion(ctx, req)
	}
}

type dialContextFunc func(ctx context.Context, network, address string) (net.Conn, error)

func newDialContext(socks5 string) (dialContextFunc, error) {
	baseDialer := &net.Dialer{
		Timeout:   60 * time.Second,
		KeepAlive: 60 * time.Second,
	}

	if socks5 != "" {
		// split socks5 proxy string [username:password@]host:port
		var auth *proxy.Auth = nil

		if strings.Contains(socks5, "@") {
			proxyInfo := strings.SplitN(socks5, "@", 2)
			proxyUser := strings.Split(proxyInfo[0], ":")
			if len(proxyUser) == 2 {
				auth = &proxy.Auth{
					User:     proxyUser[0],
					Password: proxyUser[1],
				}
			}
			socks5 = proxyInfo[1]
		}

		dialSocksProxy, err := proxy.SOCKS5("tcp", socks5, auth, baseDialer)
		if err != nil {
			return nil, err
		}

		contextDialer, ok := dialSocksProxy.(proxy.ContextDialer)
		if !ok {
			return nil, err
		}

		return contextDialer.DialContext, nil
	} else {
		return baseDialer.DialContext, nil
	}
}

// elementExists 判断元素是否存在于数组中
func elementExists[T comparable](element T, arr []T) bool {
	for _, item := range arr {
		if item == element {
			return true
		}
	}
	return false
}
