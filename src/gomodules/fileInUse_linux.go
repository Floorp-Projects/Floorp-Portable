//go:build linux

package gomodules

import (
	"log"
	"os"
	"os/exec"
)

func FileInUse(path string) bool {
	info, err := os.Stat(path)
	if err != nil {
		log.Printf("[ERROR] %w\n", err)
		return false
	}

	var cmd *exec.Cmd
	if info.IsDir() {
		cmd = exec.Command("lsof", "-w", "+D", path)
	} else {
		cmd = exec.Command("lsof", "-w", path)
	}
	out, err := cmd.CombinedOutput()
	if err != nil {
		if cmd.ProcessState.ExitCode() == 1 && len(out) == 0 {
			return false
		}
		log.Printf("[FATAL] %s\n", out)
		ShowFatalError("An unexpected error occurred", "An unexpected error occurred while executing the \"lsof\" command.")
		panic(err)
	}

	return len(out) > 0
}
