//go:build linux

package main

import (
	"log"
	"os"
	"os/exec"
)

func fileInUse(path string) bool {
	_, err := os.Stat(path)
	if err != nil {
		log.Printf("[ERROR] %w\n", err)
		return false
	}

	cmd := exec.Command("lsof", "-w", path)
	out, err := cmd.CombinedOutput()
	if err != nil {
		log.Printf("[FATAL] %s\n", out)
		showFatalError("An unexpected error occurred", "An unexpected error occurred while executing the \"lsof\" command.")
		panic(err)
	}

	return len(out) > 0
}
