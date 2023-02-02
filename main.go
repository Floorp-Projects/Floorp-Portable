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

	if _, err := os.Stat(pathJoin(exe_dir, "update_tmp", "CORE_UPDATE_READY")); err == nil {
		fmt.Println("Updates found.")

		var used bool
		if runtime.GOOS == "windows" {
			used = fileInUse(pathJoin(exe_dir, "core"))
		} else if runtime.GOOS == "linux" {
			used = fileInUse(pathJoin(exe_dir, "core", "floorp"))
		} else {
			panic("Not supported!!!")
		}

		if !used {
			err := os.Rename(pathJoin(exe_dir, "core"), pathJoin(exe_dir, "core_old"))
			if err != nil {
				showFatalError("Update failed.", "Failed to prepare to start update.")
				panic(err)
			}
			err = os.Remove(pathJoin(exe_dir, "update_tmp", "CORE_UPDATE_READY"))
			if err != nil {
				showFatalError("Update failed.", "Failed to prepare to start update.")
				panic(err)
			}
			err = os.Rename(pathJoin(exe_dir, "update_tmp", "core"), pathJoin(exe_dir, "core"))
			if err != nil {
				showFatalError("Update failed.", "Failed to replace with new file.")
				panic(err)
			}
			err = os.RemoveAll(pathJoin(exe_dir, "core_old"))
			if err != nil {
				showFatalError("Update failed.", "Failed to delete old file.")
				panic(err)
			}
			file, err := os.Create(pathJoin(exe_dir, "update_tmp", "REDIRECTOR_UPDATE_READY"))
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
		err = exec.Command(pathJoin(exe_dir, "core", "floorp"), args...).Run()
	} else if runtime.GOOS == "linux" {
		if !fileInUse(pathJoin(exe_dir, "core", "floorp")) {
			textcontent := "// DO NOT REMOVE THIS FILE\n" + stringPrefCodeGen("browser.cache.disk.parent_directory", pathJoin(exe_dir, "cache/")) + "\n";
			file, err := os.Create(pathJoin(exe_dir, "core", "defaults", "pref", "portable-cache-prefs.js"))
			if err != nil {
				showFatalError("core is broken!!!", "Failed to write settings.")
				panic(err)
			}
			_, err = file.Write([]byte(textcontent))
			if err != nil {
				showFatalError("core is broken!!!", "Failed to write settings.")
				panic(err)
			}
		}
		os.Mkdir(pathJoin(exe_dir, "Profile"), 0777);
		args_linux := []string{"-profile", pathJoin(exe_dir, "Profile")}
		args_linux = append(args_linux, args...)
		err = exec.Command(pathJoin(exe_dir, "core", "floorp"), args_linux...).Run()
	} else {
		panic("Not supported!!!")
	}
	if err != nil {
		showFatalError("core is broken!!!", "Failed to start Floorp.")
		panic(err)
	}
}
