@echo off

echo Installing goversioninfo...
go install github.com/josephspurrier/goversioninfo/cmd/goversioninfo
if %errorlevel% neq 0 (
    exit /b 1
)

echo Generating resource.syso ...
go generate
if %errorlevel% neq 0 (
    exit /b 1
)

echo Building redirector...
go build -ldflags="-H windowsgui -s -w"
if %errorlevel% neq 0 (
    exit /b 1
)

echo Building patcher...
cd patcher_src
go build -ldflags="-s -w"
if %errorlevel% neq 0 (
    exit /b 1
)
copy patcher.exe ..
if %errorlevel% neq 0 (
    exit /b 1
)
cd ..
