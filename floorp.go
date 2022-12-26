package main

import (
    "fmt"
    "os"
    "os/exec"
    "path/filepath"
)

func main() {
    args := os.Args[1:]

    exe, err := os.Executable()
    if err != nil {
        panic(err)
    }
    exe_dir := filepath.Dir(exe)

    err = exec.Command(exe_dir + "/core/floorp", args...).Run()
    if err != nil {
        panic(err)
    }
}
