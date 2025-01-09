package main

import (
	"cityhash"
	"fmt"
	"gomodules"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"

	"golang.org/x/text/encoding/unicode"
	"golang.org/x/text/transform"
)

func getInstallHash(path string) string {
	encoder := unicode.UTF16(unicode.LittleEndian, unicode.IgnoreBOM).NewEncoder()
	path_bytes, _, _ := transform.Bytes(encoder, []byte(path))
	path_size := uint32(len(path_bytes))

	hash := cityhash.WrappedCityHash64(path_bytes, path_size)

	return fmt.Sprintf("%X", hash)
}

func do_update(exe_dir string) {
	core_path := filepath.Join(exe_dir, "core")
	core_old_path := filepath.Join(exe_dir, "core_old")
	update_tmp_path := filepath.Join(exe_dir, "update_tmp")

	if !gomodules.FileInUse(core_path) {
		update_failed_lc := gomodules.Localize("native-updater-failed")

		err := os.Rename(core_path, core_old_path)
		if err != nil {
			gomodules.ShowFatalError(
				update_failed_lc,
				gomodules.Localize("native-updater-failed-to-prepare-to-start-update-description"),
			)
			panic(err)
		}
		err = os.Remove(filepath.Join(update_tmp_path, "CORE_UPDATE_READY"))
		if err != nil {
			gomodules.ShowFatalError(
				update_failed_lc,
				gomodules.Localize("native-updater-failed-to-prepare-to-start-update-description"),
			)
			panic(err)
		}
		err = os.Rename(filepath.Join(update_tmp_path, "core"), core_path)
		if err != nil {
			gomodules.ShowFatalError(
				update_failed_lc,
				gomodules.Localize("native-updater-failed-to-replace-with-new-file-description"),
			)
			panic(err)
		}
		err = os.RemoveAll(core_old_path)
		if err != nil {
			gomodules.ShowFatalError(
				update_failed_lc,
				gomodules.Localize("native-updater-failed-to-delete-old-file-description"),
			)
			panic(err)
		}
		err = os.RemoveAll(update_tmp_path)
		if err != nil {
			gomodules.ShowFatalError(
				update_failed_lc,
				gomodules.Localize("native-updater-failed-to-delete-old-file-description"),
			)
			panic(err)
		}

		log.Println("[INFO]", "Update succeeded.")
	} else {
		log.Println("[INFO]", "Floorp is running.")
	}
}

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

	core_path := filepath.Join(exe_dir, "core")

	install_hash := getInstallHash(core_path)
	log.Println("[INFO]", "Install ID:", install_hash)

	if _, err := os.Stat(filepath.Join(exe_dir, "update_tmp", "CORE_UPDATE_READY")); err == nil {
		log.Println("[INFO]", "Updates found.")
		do_update(exe_dir)
	}

	if runtime.GOOS == "windows" {
		cmd := exec.Command(filepath.Join(core_path, "floorp"), args...)
		cmd.Stdin = os.Stdin
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		err := cmd.Run()
		if err != nil {
			gomodules.ShowFatalError(
				gomodules.Localize("native-runner-failed"),
				gomodules.Localize("native-runner-failed-description"),
			)
			panic(err)
		}
	} else if runtime.GOOS == "linux" {
		container_path := filepath.Join(core_path, "container-linux")

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
			gomodules.ShowFatalError(
				gomodules.Localize("native-runner-failed"),
				gomodules.Localize("native-runner-failed-description"),
			)
			panic(err)
		}
	}
}
