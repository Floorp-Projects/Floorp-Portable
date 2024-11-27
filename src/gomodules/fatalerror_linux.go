//go:build linux

package gomodules

import (
	"log"
	"os/exec"
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

func ShowFatalError(title string, message string) {
	command := getAvailableZenityCommand()
	if command != "" {
		err := exec.Command(command, "--error", "--title", title, "--text", message).Run()
		if err == nil {
			return
		}
	}
	log.Printf("[FATAL] %s %s\n", title, message)
}

func ShowConfirmDialog(title string, message string) bool {
	command := getAvailableZenityCommand()
	if command != "" {
		err := exec.Command(command, "--question", "--title", title, "--text", message).Run()
		return (err == nil)
	}
	return false
}
