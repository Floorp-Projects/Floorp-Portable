// +build linux

package main

import (
	"os/exec"
	"log"
)

func showFatalError(title string, message string) {
	// zenity or its fallback
	zenity_command := ""
	for _, command := range []string{"zenity", "matedialog", "qarma"} {
		if _, err := exec.LookPath(command); err != nil {
			log.Println("[ERROR]", err)
		} else {
			zenity_command = command
			break
		}
	}
	if zenity_command != "" {
		err := exec.Command(zenity_command, "--error", "--title", title, "--text", message).Run()
		if err == nil {
			return
		}
		log.Println("[ERROR]", err)
	}
	// Substitution methods are needed.
}
