//go:build linux

package main

import (
	"os/exec"
	"log"
)

func getAvailableZenityCommand() string {
	// zenity or its fallback
	for _, command := range []string{"zenity", "matedialog", "qarma"} {
		err := exec.Command(command, "-h").Run()
		if err == nil {
			return command
		}
	}
	return ""
}

func showFatalError(title string, message string) {
	command := getAvailableZenityCommand()
	if command != "" {
		err := exec.Command(command, "--error", "--title", title, "--text", message).Run()
		if err == nil {
			return
		}
	}
	log.Println("[FATAL]", title, message)
}

func showConfirmDialog(title string, message string) bool {
	command := getAvailableZenityCommand()
	if command != "" {
		err := exec.Command(command, "--question", "--title", title, "--text", message).Run()
		return (err == nil)
	}
	return false
}
