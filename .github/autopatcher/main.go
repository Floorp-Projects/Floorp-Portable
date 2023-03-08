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
	value := "https://f005.backblazeb2.com/file/Floorp/floorp-112.0a1.en-US.win64.installer.exe"
	exename = strings.Split(value, "/")[5]
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

	outputcl, err := exec.Command(exe_dir + "/7zr.exe", "x", exename, "-x!setup.exe").Output()
	fmt.Println(string(outputcl))
	if err != nil {
		panic(err)
	}

	outputcl, err = exec.Command(exe_dir + "/patcher.exe").Output()
	fmt.Println(string(outputcl))
	if err != nil {
		panic(err)
	}
}
