package main

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
)

func main() {
	args := os.Args[1:]

	exe, err := os.Executable()
	if err != nil {
		panic(err)
	}
	exe_dir := filepath.Dir(exe)

	if _, err := os.Stat(exe_dir + "/update_tmp/CORE_UPDATE_READY"); err == nil {
		fmt.Println("Updates found.")
		if err := os.Rename(exe_dir + "/core", exe_dir + "/core_old"); err == nil {
			err := os.Remove(exe_dir + "/update_tmp/CORE_UPDATE_READY")
			if err != nil {
				showFatalError("Update failed.", "Failed to prepare to start update.")
				panic(err)
			}
			err = os.Rename(exe_dir + "/update_tmp/core", exe_dir + "/core")
			if err != nil {
				showFatalError("Update failed.", "Failed to replace with new file.")
				panic(err)
			}
			err = os.RemoveAll(exe_dir + "/core_old")
			if err != nil {
				showFatalError("Update failed.", "Failed to delete old file.")
				panic(err)
			}
			file, err := os.Create(exe_dir + "/update_tmp/REDIRECTOR_UPDATE_READY")
			if err != nil {
				showFatalError("Update failed.", "Failed to prepare for redirector update.")
				panic(err)
			}
			file.Close()
		} else {
			fmt.Println("Floorp is running.")
		}
	}

	if runtime.GOOS == "windows" {
		err = exec.Command(exe_dir + "/core/floorp", args...).Run()
	} else if runtime.GOOS == "linux" {
		os.Mkdir(exe_dir + "/Profile", 0777);
		args_linux := []string{}
		args_linux = append(args_linux, "-profile", exe_dir + "/Profile")
		args_linux = append(args_linux, args...)
		err = exec.Command(exe_dir + "/core/floorp", args_linux...).Run()
	} else {
		panic("Not supported!!!")
	}
	if err != nil {
		showFatalError("core is broken!!!", "Failed to start Floorp.")
		panic(err)
	}
}
