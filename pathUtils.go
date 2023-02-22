package main

import (
	"runtime"
	"strings"
)

func pathJoin(args ...string) string {
	var separate string
	if runtime.GOOS == "windows" {
		separate = "\\"
	} else {
		separate = "/"
	}

	join := ""
	for _, arg := range args {
		arg_replaced := strings.Replace(arg, "\\", separate, -1)
		arg_replaced = strings.Replace(arg_replaced, "/", separate, -1)
		if join == "" {
			join = arg_replaced
		} else if join[len(join) - 1:] == separate && arg_replaced[0:1] == separate {
			join += arg_replaced[1:]
		} else if join[len(join) - 1:] == separate || arg_replaced[0:1] == separate {
			join += arg_replaced
		} else {
			join += (separate + arg_replaced)
		}
	}
	return join
}
