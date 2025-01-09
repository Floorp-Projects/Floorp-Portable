package main

import (
	"gomodules"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
)

func doUpdate(exe_dir string) {
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
		log.Println("[INFO]", "core is running.")
	}
}

func replaceInstallHash(exe_dir string) error {
	toml_path := filepath.Join(exe_dir, "data", "preferences.toml")

	toml_data, err := gomodules.GetPreferences(toml_path)
	if err != nil {
		return err
	}

	old_install_hash := toml_data.ProfilePrefs.OldInstallHash
	current_install_hash := gomodules.GetInstallHash(filepath.Join(exe_dir, "core"))
	log.Println("[INFO]", "Old Install ID:", old_install_hash)
	log.Println("[INFO]", "Current Install ID:", current_install_hash)
	if old_install_hash == current_install_hash {
		return nil
	}

	toml_data.ProfilePrefs.OldInstallHash = current_install_hash
	if err := gomodules.WritePreferences(toml_path, toml_data); err != nil {
		return err
	}

	installs_ini_path := filepath.Join(exe_dir, "data", "."+gomodules.AppName, "installs.ini")
	profiles_ini_path := filepath.Join(exe_dir, "data", "."+gomodules.AppName, "profiles.ini")

	if _, err := os.Stat(installs_ini_path); err != nil {
		return nil
	}
	if _, err := os.Stat(profiles_ini_path); err != nil {
		return nil
	}

	installs_ini_bytes, err := os.ReadFile(installs_ini_path)
	if err != nil {
		return err
	}
	profiles_ini_bytes, err := os.ReadFile(profiles_ini_path)
	if err != nil {
		return err
	}

	installs_ini := string(installs_ini_bytes)
	profiles_ini := string(profiles_ini_bytes)

	installs_ini = strings.ReplaceAll(installs_ini, "["+old_install_hash+"]", "["+current_install_hash+"]")
	profiles_ini = strings.ReplaceAll(profiles_ini, "[Install"+old_install_hash+"]", "[Install"+current_install_hash+"]")

	if err := os.WriteFile(installs_ini_path, []byte(installs_ini), 0755); err != nil {
		return err
	}
	if err := os.WriteFile(profiles_ini_path, []byte(profiles_ini), 0755); err != nil {
		return err
	}

	return nil
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

	os.Mkdir(filepath.Join(exe_dir, "data"), 0755)

	if err := replaceInstallHash(exe_dir); err != nil {
		gomodules.ShowFatalError(
			gomodules.Localize("native-runner-failed"),
			gomodules.Localize("native-runner-failed-description"),
		)
		panic(err)
	}

	if _, err := os.Stat(filepath.Join(exe_dir, "update_tmp", "CORE_UPDATE_READY")); err == nil {
		log.Println("[INFO]", "Updates found.")
		doUpdate(exe_dir)
	}

	if runtime.GOOS == "windows" {
		cmd := exec.Command(filepath.Join(core_path, gomodules.AppName), args...)
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
