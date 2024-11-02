//go:build windows

package main

import (
	"unicode/utf16"
	"unsafe"

	"golang.org/x/sys/windows"
)

func getSystemLocale() string {
	buf := make([]uint16, 85)
	ret, _, err := windows.NewLazySystemDLL("kernel32.dll").
		NewProc("GetUserDefaultLocaleName").
		Call(uintptr(unsafe.Pointer(&buf[0])), uintptr(len(buf)))
	if err != nil {
		panic(err)
	}
	return string(utf16.Decode(buf[:ret]))
}
