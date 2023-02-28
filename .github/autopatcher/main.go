//////////////autopatcher-v1.0//////////////
/*Author: creeper-0910                    */
/*contributor: typeling1578,Comamoca      */
/*Thanks again!                           */
////////////////////////////////////////////
package main

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/schollz/progressbar/v3"
)

var exename string

func main() {
	value := "https://github.com/Floorp-Projects/Floorp/releases/latest/download/floorp-win64.installer.exe"
	exename = strings.Split(value, "/")[8]
	fmt.Printf("[found] %s\n", exename)
	resp, err := http.Get(value)
	if err != nil {
		panic(err)
	}

	out, err := os.Create(exename)
	if err != nil {
		panic(err)
	}
	bar := progressbar.NewOptions(int(resp.ContentLength),
		progressbar.OptionSetWriter(os.Stdout),
		progressbar.OptionEnableColorCodes(true),
		progressbar.OptionSetDescription("[downloading] "+exename),
		progressbar.OptionShowBytes(true))
	io.Copy(io.MultiWriter(out, bar), resp.Body)
	if err != nil {
		log.Fatal(err)
	}
	resp.Body.Close()
	out.Close()
	z7resp, err := http.Get("https://www.7-zip.org/a/7zr.exe")
	if err != nil {
		panic(err)
	}
	z7out, err := os.Create("7zr.exe")
	if err != nil {
		panic(err)
	}
	_, err = io.Copy(io.MultiWriter(z7out, bar), z7resp.Body)
	if err != nil {
		log.Fatal(err)
	}
	z7resp.Body.Close()
	z7out.Close()

	exe, err := os.Executable()
	if err != nil {
		panic(err)
	}
	exe_dir := filepath.Dir(exe)

	if err = exec.Command(exe_dir+"/7zr.exe", "x", exename, "-x!setup.exe").Run(); err != nil {
		panic(err)
	}

	if err = exec.Command(exe_dir + "/patcher.exe").Run(); err != nil {
		panic(err)
	}
}
