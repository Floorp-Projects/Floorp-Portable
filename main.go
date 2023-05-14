package main

import (
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"io"
	"net/http"
)

func main() {
	if runtime.GOOS != "windows" && runtime.GOOS != "linux" {
		panic("Your platform is not supported.")
	}

	args := os.Args[1:]

	exe, err := os.Executable()
	if err != nil {
		panic(err)
	}
	exe_dir := filepath.Dir(exe)

	if _, err := os.Stat(pathJoin(exe_dir, "update_tmp", "CORE_UPDATE_READY")); err == nil {
		log.Println("[INFO]", "Updates found.")

		var used bool
		if runtime.GOOS == "windows" {
			used = fileInUse(pathJoin(exe_dir, "core"))
		} else if runtime.GOOS == "linux" {
			used = fileInUse(pathJoin(exe_dir, "core", "floorp"))
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
			log.Println("[INFO]", "Update succeeded.")
		} else {
			log.Println("[INFO]", "Floorp is running.")
		}
	}

	if runtime.GOOS == "windows" {
		err := exec.Command(pathJoin(exe_dir, "core", "floorp"), args...).Run()
		if err != nil {
			showFatalError("core is broken!!!", "Failed to start Floorp.")
			panic(err)
		}
	} else if runtime.GOOS == "linux" {
		homedir, err := os.UserHomeDir()
		if err != nil {
			panic(err)
		}

		cache_dir := pathJoin(exe_dir, "cache")
		profiles_dir := pathJoin(exe_dir, "profiles")

		os.Mkdir(cache_dir, 0777);
		os.Mkdir(profiles_dir, 0777);

		var bwrap_path string
		err = exec.Command("bwrap", "--help").Run()
		err2 := exec.Command(pathJoin(exe_dir, "bwrap"), "--help").Run()
		if err == nil {
			bwrap_path = "bwrap"
		} else if err2 == nil {
			bwrap_path = pathJoin(exe_dir, "bwrap")
		} else {
			bwrap_path = pathJoin(exe_dir, "bwrap")

			result := showConfirmDialog("Bubblewrap is not installed.", "Bubblewrap must be installed to run.\nDo you want to download binaries from a developer-controlled repository?")
			if !result {
				showFatalError("Bubblewrap is not installed.", "Bubblewrap must be installed to run.")
				panic(err)
			}
			bwrap_url_x86_64  := "https://github.com/typeling1578/bubblewrap/releases/latest/download/bwrap-x86_64"
			bwrap_url_aarch64 := "https://github.com/typeling1578/bubblewrap/releases/latest/download/bwrap-aarch64"
			var bwrap_url string
			if runtime.GOARCH == "amd64" {
				bwrap_url = bwrap_url_x86_64
			} else if runtime.GOARCH == "arm64" {
				bwrap_url = bwrap_url_aarch64
			}
			resp, err := http.Get(bwrap_url)
			if err != nil {
				showFatalError("Failed to download", "Failed to download Bubblewrap.")
				panic(err)
			}
			out, err := os.Create(bwrap_path)
			if err != nil {
				showFatalError("Failed to download", "Failed to download Bubblewrap.")
				panic(err)
			}
			_, err = io.Copy(out, resp.Body)
			if err != nil {
				showFatalError("Failed to download", "Failed to download Bubblewrap.")
				panic(err)
			}
			err = resp.Body.Close()
			if err != nil {
				showFatalError("Failed to download", "Failed to download Bubblewrap.")
				panic(err)
			}
			err = out.Close()
			if err != nil {
				showFatalError("Failed to download", "Failed to download Bubblewrap.")
				panic(err)
			}
			err = exec.Command("chmod", "+x", bwrap_path).Run()
			if err != nil {
				showFatalError("Failed to download", "Failed to download Bubblewrap.")
				panic(err)
			}
		}

		args_linux := []string{
			"--dev-bind", "/", "/",
			"--bind", cache_dir, homedir + "/.cache",
			"--bind", profiles_dir, homedir + "/.floorp",
		}
		if os.Getenv("XDG_SESSION_TYPE") == "wayland" {
			args_linux = append(
				args_linux,
				"--setenv", "MOZ_ENABLE_WAYLAND", "1",
			)
		}
		args_linux = append(
			args_linux,
			"--",
			pathJoin(exe_dir, "core", "floorp"),
		)
		args_linux = append(args_linux, args...)
		out, err := exec.Command(bwrap_path, args_linux...).CombinedOutput()
		if err != nil {
			log.Println(string(out))
			showFatalError("core is broken!!!", "Failed to start Floorp.")
			panic(err)
		}
	}
}
