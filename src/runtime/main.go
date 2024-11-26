package main

import (
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
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

		if !fileInUse(pathJoin(exe_dir, "core")) {
			update_failed_lc := localize("native-updater-failed")

			err := os.Rename(pathJoin(exe_dir, "core"), pathJoin(exe_dir, "core_old"))
			if err != nil {
				showFatalError(
					update_failed_lc,
					localize("native-updater-failed-to-prepare-to-start-update-description"),
				)
				panic(err)
			}
			err = os.Remove(pathJoin(exe_dir, "update_tmp", "CORE_UPDATE_READY"))
			if err != nil {
				showFatalError(
					update_failed_lc,
					localize("native-updater-failed-to-prepare-to-start-update-description"),
				)
				panic(err)
			}
			err = os.Rename(pathJoin(exe_dir, "update_tmp", "core"), pathJoin(exe_dir, "core"))
			if err != nil {
				showFatalError(
					update_failed_lc,
					localize("native-updater-failed-to-replace-with-new-file-description"),
				)
				panic(err)
			}
			err = os.RemoveAll(pathJoin(exe_dir, "core_old"))
			if err != nil {
				showFatalError(
					update_failed_lc,
					localize("native-updater-failed-to-delete-old-file-description"),
				)
				panic(err)
			}
			file, err := os.Create(pathJoin(exe_dir, "update_tmp", "PORTABLE_RUNTIME_UPDATE_READY"))
			if err != nil {
				showFatalError(
					update_failed_lc,
					localize("native-updater-failed-to-prepare-for-runtime-update-description"),
				)
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
			showFatalError(
				localize("native-runner-failed"),
				localize("native-runner-failed-description"),
			)
			panic(err)
		}
	} else if runtime.GOOS == "linux" {
		cache_dir := pathJoin(exe_dir, "cache")
		profiles_dir := pathJoin(exe_dir, "profiles")

		os.Mkdir(cache_dir, 0777)
		os.Mkdir(profiles_dir, 0777)

		container_path := pathJoin(exe_dir, "core", "container-linux")

		args_linux := append([]string{"run"}, args...)
		cmd := exec.Command(container_path, args_linux...)
		if os.Getenv("XDG_SESSION_TYPE") == "wayland" {
			cmd.Env = append(
				os.Environ(),
				"MOZ_ENABLE_WAYLAND=1",
			)
		}
		cmd.Stdin = os.Stdin
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		err := cmd.Run()
		if err != nil {
			showFatalError(
				localize("native-runner-failed"),
				localize("native-runner-failed-description"),
			)
			panic(err)
		}
	}
}
