//go:build windows

package main

import (
	"syscall"
	"unsafe"
)

func getSystemLocale() string {
	buf := make([]uint16, 85)

	r, _, err := syscall.NewLazyDLL("kernel32.dll").NewProc("GetUserDefaultLocaleName").Call(
		uintptr(unsafe.Pointer(&buf[0])),
		uintptr(len(buf)),
	)
	if r == 0 {
		panic(err)
	}

	return syscall.UTF16ToString(buf)
}
