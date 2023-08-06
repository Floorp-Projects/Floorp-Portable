#!/bin/sh -e

echo Building redirector...
go build -ldflags="-s -w" -buildvcs=false

echo Building patcher...
cd patcher_src
go build -ldflags="-s -w" -buildvcs=false
cp patcher ..
cd ..
