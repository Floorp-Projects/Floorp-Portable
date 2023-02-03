//go:build linux

package main

import (
	"os/exec"
	"log"
)

func showFatalError(title string, message string) {
	// zenity or its fallback
	for _, command := range []string{"zenity", "matedialog", "qarma"} {
		err := exec.Command(command, "--error", "--title", title, "--text", message).Run()
		if err == nil {
			return
		}
		log.Println("[INFO]", err)
	}
	// Substitution methods are needed.
	log.Println("[FATAL]", title, message)
}
