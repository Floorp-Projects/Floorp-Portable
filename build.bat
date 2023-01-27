@echo off

echo Building redirector...
go build -ldflags="-H windowsgui -s -w"
if %errorlevel% neq 0 (
    exit /b 1
)

echo Building patcher...
cd patcher
go build -ldflags="-s -w"
if %errorlevel% neq 0 (
    exit /b 1
)
copy patcher.exe ..
if %errorlevel% neq 0 (
    exit /b 1
)
cd ..