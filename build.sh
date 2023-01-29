#!/bin/sh -e

echo Building redirector...
go build -ldflags="-s -w"

echo Building patcher...
cd patcher_src
go build -ldflags="-s -w"
cp patcher ..
cd ..
