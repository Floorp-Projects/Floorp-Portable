//go:build linux

package main

import (
	"os/exec"
	"log"
	"os"
)

func fileInUse(path string) bool {
	_, err := os.Stat(path)
	if err != nil {
		log.Println("[ERROR]", err)
		return false
	}
	out, err := exec.Command("lsof", path).CombinedOutput()
	if string(out) != "" && err != nil {
		log.Println("[FATAL]", string(out))
		showFatalError("An unexpected error occurred", "An unexpected error occurred while executing the \"lsof\" command.")
		panic(err)
	}
	return string(out) != ""
}
