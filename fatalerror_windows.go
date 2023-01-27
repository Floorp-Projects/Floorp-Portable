//go:build windows

package main

import (
	"syscall"
	"unsafe"
)

func showFatalError(title string, message string) {
	const (
		NULL = 0x00000000
		MB_OK = 0x00000000
		MB_ICONERROR = 0x00000010
	)
	syscall.NewLazyDLL("user32.dll").NewProc("MessageBoxW").Call(
		NULL,
		uintptr(unsafe.Pointer(syscall.StringToUTF16Ptr(message))),
		uintptr(unsafe.Pointer(syscall.StringToUTF16Ptr(title))),
		MB_OK + MB_ICONERROR,
	)
}
