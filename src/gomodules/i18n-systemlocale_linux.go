//go:build linux

package gomodules

import (
	"os"
	"strings"
)

func getSystemLocale() string {
	return strings.ReplaceAll(strings.Split(os.Getenv("LANG"), ".")[0], "_", "-")
}
