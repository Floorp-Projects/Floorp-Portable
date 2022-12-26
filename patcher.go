package main

import (
    "fmt"
    "io"
    "os"
    "os/exec"
    "path/filepath"
)

func main() {
    exe, err := os.Executable()
    if err != nil {
        panic(err)
    }
    exe_dir := filepath.Dir(exe)


    out, err := exec.Command(exe_dir + "/utils/setdll64.exe", "/d:portable64.dll", exe_dir + "/core/mozglue.dll").Output()
    fmt.Println(string(out))
    if err != nil {
        panic(err)
    }


    src, err := os.Open(exe_dir + "/utils/portable64.dll")
    if err != nil {
        panic(err)
    }
    defer src.Close()

    dst, err := os.Create(exe_dir + "/core/portable64.dll")
    if err != nil {
        panic(err)
    }
    defer dst.Close()

    _, err = io.Copy(dst, src)
    if  err != nil {
        panic(err)
    }


    src, err = os.Open(exe_dir + "/config/portable.ini")
    if err != nil {
        panic(err)
    }
    defer src.Close()

    dst, err = os.Create(exe_dir + "/core/portable.ini")
    if err != nil {
        panic(err)
    }
    defer dst.Close()

    _, err = io.Copy(dst, src)
    if  err != nil {
        panic(err)
    }


    os.Remove(exe_dir + "/core/updater.exe")
    os.Remove(exe_dir + "/core/default-browser-agent.exe")
    os.RemoveAll(exe_dir + "/core/uninstall")
}
