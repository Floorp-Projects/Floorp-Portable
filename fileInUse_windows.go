//go:build windows

package main

import (
	"log"
	"os"
	"crypto/rand"
	"math/big"
	"path/filepath"
)

func randomString(length int) string {
	letters := "1234567890abcdefghijklmnopqrstuvwxyz"

	buf := make([]byte, length)
	max := new(big.Int)
	max.SetInt64(int64(len(letters)))
	for i := range buf {
		r, err := rand.Int(rand.Reader, max)
		if err != nil {
			showFatalError("An unexpected error occurred", "Generation of random numbers failed.")
			panic(err)
		}
		buf[i] = letters[r.Int64()]
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
	tmppath := parent + "/" + randomString(12)
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
