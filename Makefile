.PHONY: docker
docker:
	docker build . -t ./build/chatgpt-web:latest

# 编译到 Linux
.PHONY: build-linux
build-linux:
    CGO_ENABLED=0 GOOS=linux GOARCH=arm64 GIN_MODE=release go build -a -installsuffix cgo -ldflags '-w' -o ./build/chatgpt-web/chatgpt-web ./main.go
# Cmd 命令行
    cd F:\开发程序\学习项目\ChatGPT\chatgpt-web-Go
    F:
    set CGO_ENABLED=0
    set GOOS=linux
    set GOARCH=arm64
    set GIN_MODE=release
    go build -o ./build/chatgpt-web/chatgpt-web ./main.go

# PowerShell 代码
    $env:CGO_ENABLED=0
    $env:GOOS="linux"
    $env:GOARCH="arm64"
    $env:GIN_MODE="release"
    go build -o ./build/chatgpt-web/chatgpt-web ./main.go


# 编译到 macOS
.PHONY: build-darwin
build-darwin:
    CGO_ENABLED=0 GOOS=darwin GOARCH=arm64 GIN_MODE=release go build -a -installsuffix cgo -ldflags '-w' -o ./build/chatgpt-web ./main.go

# 编译到 windows
.PHONY: build-windows
build-windows:
    CGO_ENABLED=0 GOOS=windows GOARCH=arm64 GIN_MODE=release go build -a -installsuffix cgo -ldflags '-w' -o ./build/chatgpt-web ./main.go

# 编译到 全部平台
.PHONY: build-all
build-all:
    make clean
    mkdir -p ./build
    make build-linux
    make build-darwin
    make build-windows

.PHONY: clean
clean:
    rm -rf ./build
