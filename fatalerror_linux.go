// +build linux

package main

import (
	"os/exec"
	"log"
)

func showFatalError(title string, message string) {
	err := exec.Command("zenity", "--error", "--title", title, "--text", message).Run()
	if err == nil {
		return
	}
	log.Println("[ERROR]", err)
	// Substitution methods are needed.
}
