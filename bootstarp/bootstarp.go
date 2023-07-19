package bootstrap

import (
	"net/http"
	"os"
	"strconv"

	"github.com/869413421/chatgpt-web/config"
	"github.com/869413421/chatgpt-web/pkg/logger"
	"github.com/gin-gonic/gin"
)

var isRelease = false

func StartWebServer() {
	// 通过获取website目录是否存在来判断是否为发布模式
	_, err1 := os.Stat("website")
	if err1 == nil {
		isRelease = true
		gin.SetMode(gin.ReleaseMode)
	} else {
		isRelease = false
		gin.SetMode(gin.DebugMode)
	}

	// 注册启动所需各类参数
	SetUpRoute()
	SetupDB()
	initTemplateDir()
	initStaticServer()

	// 启动服务
	port := config.LoadConfig().Port
	portString := strconv.Itoa(port)
	// 自定义监听地址
	listen := config.LoadConfig().Listen
	err := router.Run(listen + ":" + portString)
	if err != nil {
		logger.Danger("run webserver error " + err.Error())
		return
	}
}

// initTemplate 初始化HTML模板加载路径
func initTemplateDir() {
	if isRelease {
		router.LoadHTMLGlob("website/*.html")
	}
}

// initStaticServer 初始化静态文件处理
func initStaticServer() {
	if isRelease {
		router.StaticFS("/assets", http.Dir("website/assets"))
		router.StaticFile("addMessage1.png", "website/addMessage1.png")
		router.StaticFile("addMessage2.png", "website/addMessage2.png")
		router.StaticFile("background.jpg", "website/background.jpg")
		router.StaticFile("favicon.ico", "website/favicon.ico")
		router.StaticFile("logo192.png", "website/logo192.png")
		router.StaticFile("logo512.png", "website/logo512.png")
		router.StaticFile("person.jpg", "website/person.jpg")
		router.StaticFile("setting.png", "website/setting.png")
		router.StaticFile("sscpaul.png", "website/sscpaul.png")
		router.StaticFile("manifest.json", "website/manifest.json")
	}
}
