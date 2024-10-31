//go:build windows

package main

import (
	"log"
	"math/rand"
	"os"
	"path/filepath"
)

func randomString(length int) string {
	letters := "1234567890abcdefghijklmnopqrstuvwxyz"

	buf := make([]byte, length)
	for i := range buf {
		buf[i] = letters[rand.Intn(len(letters))]
	}
	return string(buf)
}

func fileInUse(path string) bool {
	_, err := os.Stat(path)
	if err != nil {
		log.Println("[ERROR]", err)
		return false
	}
	
	parent := filepath.Dir(path)
	tmppath := filepath.Join(parent, randomString(12))

	err = os.Rename(path, tmppath)
	if err != nil {
		return true
	}

	err = os.Rename(tmppath, path)
	if err != nil {
		showFatalError("An unexpected error occurred", "An unexpected error occurred while renaming the file.")
		panic(err)
	}

	return false
}
