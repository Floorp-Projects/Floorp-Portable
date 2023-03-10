package main

import (
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
)

func main() {
	exe, err := os.Executable()
	if err != nil {
		panic(err)
	}
	exe_dir := filepath.Dir(exe)

	if runtime.GOOS == "windows" {
		out, err := exec.Command(exe_dir + "/utils/setdll64.exe", "/d:portable64.dll", exe_dir + "/core/mozglue.dll").Output()
		fmt.Println(string(out))
		if err != nil {
			panic(err)
		}

		src, err := os.Open(exe_dir + "/utils/portable64.dll")
		if err != nil {
			panic(err)
		}
		dst, err := os.Create(exe_dir + "/core/portable64.dll")
		if err != nil {
			panic(err)
		}
		if _, err = io.Copy(dst, src); err != nil {
			panic(err)
		}
		if err := src.Close(); err != nil {
			panic(err)
		}
		if err := dst.Close(); err != nil {
			panic(err)
		}

		src, err = os.Open(exe_dir + "/config/portable.ini")
		if err != nil {
			panic(err)
		}
		dst, err = os.Create(exe_dir + "/core/portable.ini")
		if err != nil {
			panic(err)
		}
		if _, err = io.Copy(dst, src); err != nil {
			panic(err)
		}
		if err := src.Close(); err != nil {
			panic(err)
		}
		if err := dst.Close(); err != nil {
			panic(err)
		}
	}

	if _, err := os.Stat(exe_dir + "/core/distribution"); err != nil {
		err := os.Mkdir(exe_dir + "/core/distribution", 0777)
		if err != nil {
			panic(err)
		}
	}

	src, err := os.Open(exe_dir + "/config/policies.json")
	if err != nil {
		panic(err)
	}
	dst, err := os.Create(exe_dir + "/core/distribution/policies.json")
	if err != nil {
		panic(err)
	}
	if _, err = io.Copy(dst, src); err != nil {
		panic(err)
	}
	if err := src.Close(); err != nil {
		panic(err)
	}
	if err := dst.Close(); err != nil {
		panic(err)
	}

	src, err = os.Open(exe_dir + "/config/portable-prefs.js")
	if err != nil {
		panic(err)
	}
	dst, err = os.Create(exe_dir + "/core/defaults/pref/portable-prefs.js")
	if err != nil {
		panic(err)
	}
	if _, err = io.Copy(dst, src); err != nil {
		panic(err)
	}
	if err := src.Close(); err != nil {
		panic(err)
	}
	if err := dst.Close(); err != nil {
		panic(err)
	}

	if runtime.GOOS == "windows" {
		err := os.Remove(exe_dir + "/core/updater.exe")
		if err != nil {
			panic(err)
		}
		err = os.Remove(exe_dir + "/core/default-browser-agent.exe")
		if err != nil {
			panic(err)
		}
		err = os.RemoveAll(exe_dir + "/core/uninstall")
		if err != nil {
			panic(err)
		}
	}
}
