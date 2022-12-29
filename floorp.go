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

    if _, err := os.Stat(exe_dir + "/update_tmp/UPDATE_READY"); err == nil {
        fmt.Println("Updates found.")
        if err := os.Rename(exe_dir + "/core", exe_dir + "/core_old"); err == nil {
            err := os.Remove(exe_dir + "/update_tmp/UPDATE_READY")
            if err != nil {
                panic(err)
            }
            err = os.Rename(exe_dir + "/update_tmp/core", exe_dir + "/core")
            if err != nil {
                panic(err)
            }
            err = os.RemoveAll(exe_dir + "/core_old")
            if err != nil {
                panic(err)
            }
            err = os.RemoveAll(exe_dir + "/update_tmp")
            if err != nil {
                panic(err)
            }
        } else {
            fmt.Println("Floorp is running.")
        }
    }

    err = exec.Command(exe_dir + "/core/floorp", args...).Run()
    if err != nil {
        panic(err)
    }
}
