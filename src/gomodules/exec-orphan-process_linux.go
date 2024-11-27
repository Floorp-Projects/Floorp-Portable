//go:build linux

package gomodules

import (
	"os/exec"
)

func ExecOrphanProcess(command string, args ...string) *exec.Cmd {
	cmd := exec.Command(command, args...)
	return cmd
}
