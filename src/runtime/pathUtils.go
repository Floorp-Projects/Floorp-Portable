package main

import (
	"runtime"
	"strings"
)

func pathJoin(args ...string) string {
	var separator string
	if runtime.GOOS == "windows" {
		separator = "\\"
	} else {
		separator = "/"
	}

	var parts []string
	for _, arg := range args {
		parts = append(parts, strings.ReplaceAll(arg, "\\", separator), separator)
	}

	return strings.TrimSuffix(strings.Join(parts, ""), separator)
}
