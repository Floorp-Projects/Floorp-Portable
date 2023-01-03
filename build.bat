@echo off
echo Building redirector...
go build -ldflags="-H windowsgui"
echo Building patcher...
cd patcher
go build
copy patcher.exe ..
cd ..
