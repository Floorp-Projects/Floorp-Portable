@echo off
echo Building redirector...
go build -ldflags="-H windowsgui -s -w"
echo Building patcher...
cd patcher
go build -ldflags="-s -w"
copy patcher.exe ..
cd ..
