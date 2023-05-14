//go:build windows

package main

import (
	"syscall"
	"unsafe"
)

const (
	NULL = 0x00000000

	MB_ABORTRETRYIGNORE = 0x00000002
	MB_CANCELTRYCONTINUE = 0x00000006
	MB_HELP = 0x00004000
	MB_OK = 0x00000000
	MB_OKCANCEL = 0x00000001
	MB_RETRYCANCEL = 0x00000005
	MB_YESNO = 0x00000004
	MB_YESNOCANCEL = 0x00000003

	MB_ICONEXCLAMATION = 0x00000030
	MB_ICONWARNING = 0x00000030
	MB_ICONINFORMATION = 0x00000040
	MB_ICONASTERISK = 0x00000040
	MB_ICONQUESTION = 0x00000020
	MB_ICONSTOP = 0x00000010
	MB_ICONERROR = 0x00000010
	MB_ICONHAND = 0x00000010
)

func showFatalError(title string, message string) {
	syscall.NewLazyDLL("user32.dll").NewProc("MessageBoxW").Call(
		NULL,
		uintptr(unsafe.Pointer(syscall.StringToUTF16Ptr(message))),
		uintptr(unsafe.Pointer(syscall.StringToUTF16Ptr(title))),
		MB_OK + MB_ICONERROR,
	)
}

func showConfirmDialog(title string, message string) bool {
	result, _, _ := syscall.NewLazyDLL("user32.dll").NewProc("MessageBoxW").Call(
		NULL,
		uintptr(unsafe.Pointer(syscall.StringToUTF16Ptr(message))),
		uintptr(unsafe.Pointer(syscall.StringToUTF16Ptr(title))),
		MB_YESNO + MB_ICONINFORMATION,
	)
	return (int(result) == 6)
}
