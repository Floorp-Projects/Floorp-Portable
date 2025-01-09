//go:build linux

package main

import (
	"crypto/md5"
	"encoding/hex"
	"fmt"
	"gomodules"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"syscall"
)

func container_parent() error {
	exe, err := os.Executable()
	if err != nil {
		return err
	}

	parent_uid := os.Getuid()
	parent_gid := os.Getgid()

	cmd := exec.Command(exe, append([]string{"child"}, os.Args[2:]...)...)
	cmd.Env = append(
		os.Environ(),
		fmt.Sprintf("CONTAINER_UID=%d", parent_uid),
		fmt.Sprintf("CONTAINER_GID=%d", parent_gid),
	)
	cmd.SysProcAttr = &syscall.SysProcAttr{
		Cloneflags: syscall.CLONE_NEWUSER |
			syscall.CLONE_NEWIPC |
			syscall.CLONE_NEWNS |
			syscall.CLONE_NEWUTS,
		UidMappings: []syscall.SysProcIDMap{
			{ContainerID: 0, HostID: parent_uid, Size: 1},
		},
		GidMappings: []syscall.SysProcIDMap{
			{ContainerID: 0, HostID: parent_gid, Size: 1},
		},
	}

	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Run(); err != nil {
		return err
	}

	return nil
}

func container_child() error {
	exe, err := os.Executable()
	if err != nil {
		return err
	}

	homedir, err := os.UserHomeDir()
	if err != nil {
		return err
	}

	parent_uid, err := strconv.Atoi(os.Getenv("CONTAINER_UID"))
	if err != nil {
		return fmt.Errorf("Invalid CONTAINER_UID")
	}
	parent_gid, err := strconv.Atoi(os.Getenv("CONTAINER_GID"))
	if err != nil {
		return fmt.Errorf("Invalid CONTAINER_GID")
	}

	exe_dir := filepath.Dir(exe)
	exe_dir_parent := filepath.Dir(exe_dir)

	exe_target := filepath.Join(exe_dir, gomodules.AppName)

	profile_dir := filepath.Join(exe_dir_parent, "data", "profiles")
	cache_dir := filepath.Join(exe_dir_parent, "data", "cache")
	ns_profile_dir := filepath.Join(homedir, "."+gomodules.AppName)
	ns_cache_dir := filepath.Join(homedir, ".cache")

	os.MkdirAll(profile_dir, 0755)
	os.MkdirAll(cache_dir, 0755)
	os.MkdirAll(ns_profile_dir, 0755)
	os.MkdirAll(ns_cache_dir, 0755)

	if err := syscall.Mount(profile_dir, ns_profile_dir, "", syscall.MS_BIND, ""); err != nil {
		return fmt.Errorf("Failed to bind mount: %v", err)
	}

	if err := syscall.Mount(cache_dir, ns_cache_dir, "", syscall.MS_BIND, ""); err != nil {
		return fmt.Errorf("Failed to bind mount: %v", err)
	}

	install_hash := md5.Sum([]byte(exe))
	install_hash_hex := hex.EncodeToString(install_hash[:])

	cmd := exec.Command(exe_target, os.Args[2:]...)
	cmd.Env = append(
		os.Environ(),
		fmt.Sprintf("MOZ_APP_REMOTINGNAME=%s-portable-%s", gomodules.AppName, install_hash_hex[:16]),
	)
	cmd.SysProcAttr = &syscall.SysProcAttr{
		Cloneflags: syscall.CLONE_NEWUSER |
			syscall.CLONE_NEWNS |
			syscall.CLONE_NEWUTS,
		UidMappings: []syscall.SysProcIDMap{
			{ContainerID: parent_uid, HostID: os.Getuid(), Size: 1},
		},
		GidMappings: []syscall.SysProcIDMap{
			{ContainerID: parent_gid, HostID: os.Getgid(), Size: 1},
		},
	}
	cmd.Stdin = os.Stdin
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Run(); err != nil {
		return err
	}

	return nil
}

func main() {
	switch os.Args[1] {
	case "run":
		if err := container_parent(); err != nil {
			panic(err)
		}
		break
	case "child":
		if err := container_child(); err != nil {
			panic(err)
		}
		break
	default:
		break
	}
}
