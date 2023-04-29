package main

import (
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"encoding/json"
	"log"
	"archive/zip"
)

type PatchesInfo []struct {
	Filename string `json:"filename"`
	Type     string `json:"type"`
	Platforms []string `json:"platforms"`
}

func unzip(src string, dest string) {
	zipFile, err := zip.OpenReader(src)
	if err != nil {
		panic(err)
	}

	if err := os.MkdirAll(dest, 0777); err != nil {
		panic(err)
	}

	for _, fileInZip := range zipFile.File {
		path := filepath.Join(dest, fileInZip.Name)
		if fileInZip.Mode().IsDir() {
			if err := os.MkdirAll(path, 0777); err != nil {
				panic(err)
			}
			continue
		}
		if err := os.MkdirAll(filepath.Dir(path), 0777); err != nil {
			panic(err)
		}
		file, err := fileInZip.Open()
		if err != nil {
			panic(err)
		}
		destFile, err := os.Create(path)
		if err != nil {
			panic(err)
		}
		if _, err := io.Copy(destFile, file); err != nil {
			panic(err)
		}
		file.Close()
		destFile.Close()
	}

	if err := zipFile.Close(); err != nil {
		panic(err)
	}
}

func createzip(src string, dest string) {
	zipFile, err := os.Create(dest)
	if err != nil {
		panic(err)
	}

	zipWriter := zip.NewWriter(zipFile)

	absSrc, err := filepath.Abs(src)
	if err != nil {
		panic(err)
	}
	err = filepath.Walk(absSrc, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			panic(err)
		}
		inPath, err := filepath.Rel(absSrc, path)
		inPath = filepath.ToSlash(inPath)
		if err != nil {
			panic(err)
		}
		if inPath == "." {
			return nil
		}
		if info.IsDir() {
			fileHeader := zip.FileHeader{
				Name: inPath + "/",
				Method: zip.Store,
			}
			if _, err := zipWriter.CreateHeader(&fileHeader); err != nil {
				panic(err)
			}
		} else {
			fileHeader := zip.FileHeader{
				Name: inPath,
				Method: zip.Store,
			}
			destFile, err := zipWriter.CreateHeader(&fileHeader)
			if err != nil {
				panic(err)
			}
			file, err := os.Open(path)
			if err != nil {
				panic(err)
			}
			if _, err := io.Copy(destFile, file); err != nil {
				panic(err)
			}
		}
		return nil
	})
	if err != nil {
		panic(err)
	}

	if err := zipWriter.Flush(); err != nil {
		panic(err)
	}
	if err := zipWriter.Close(); err != nil {
		panic(err)
	}
	if err := zipFile.Close(); err != nil {
		panic(err)
	}
}

func main() {
	if runtime.GOOS == "windows" {
		out, err := exec.Command("utils/setdll64.exe", "/d:portable64.dll", "core/mozglue.dll").Output()
		fmt.Println(string(out))
		if err != nil {
			panic(err)
		}

		src, err := os.Open("utils/portable64.dll")
		if err != nil {
			panic(err)
		}
		dst, err := os.Create("core/portable64.dll")
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

		src, err = os.Open("config/portable.ini")
		if err != nil {
			panic(err)
		}
		dst, err = os.Create("core/portable.ini")
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

	if _, err := os.Stat("core/distribution"); err != nil {
		err := os.Mkdir("core/distribution", 0777)
		if err != nil {
			panic(err)
		}
	}

	src, err := os.Open("config/policies.json")
	if err != nil {
		panic(err)
	}
	dst, err := os.Create("core/distribution/policies.json")
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

	src, err = os.Open("config/portable-prefs.js")
	if err != nil {
		panic(err)
	}
	dst, err = os.Create("core/defaults/pref/portable-prefs.js")
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
		err := os.Remove("core/updater.exe")
		if err != nil {
			panic(err)
		}
		err = os.Remove("core/default-browser-agent.exe")
		if err != nil {
			panic(err)
		}
		err = os.RemoveAll("core/uninstall")
		if err != nil {
			panic(err)
		}
	}


	log.Println("Unzipping \"core/omni.ja\"")
	unzip("core/omni.ja", "omni_tmp_root")
	log.Println("Unzipping \"core/browser/omni.ja\"")
	unzip("core/browser/omni.ja", "omni_tmp_browser")

	jsonfile, err := os.ReadFile("patches.json")
	if err != nil {
		panic(err)
	}
	var patchesInfo PatchesInfo
	if err := json.Unmarshal(jsonfile, &patchesInfo); err != nil {
		panic(err)
	}

	for _, patchInfo := range patchesInfo {
		matchedPlatform := (func(platforms []string) bool {
			for _, platform := range platforms {
				if platform == runtime.GOOS {
					return true
				}
			}
			return false
		})(patchInfo.Platforms)
		if !matchedPlatform {
			continue
		}
		path, err := filepath.Abs("patches/" + patchInfo.Filename)
		if err != nil {
			panic(err)
		}
		var rootDir string
		if patchInfo.Type == "root" {
			rootDir = "omni_tmp_root"
		} else if patchInfo.Type == "browser" {
			rootDir = "omni_tmp_browser"
		} else {
			continue
		}
		log.Println("Applying \"" + path + "\"")
		cmd := exec.Command("git", "--git-dir=", "apply", path)
		cmd.Dir = rootDir
		out, err := cmd.CombinedOutput()
		if err != nil {
			log.Println(string(out))
			panic(err)
		}
	}

	log.Println("Zipping \"omni_tmp_root\"")
	createzip("omni_tmp_root", "core/omni.ja")
	log.Println("Zipping \"omni_tmp_browser\"")
	createzip("omni_tmp_browser", "core/browser/omni.ja")

	err = os.RemoveAll("omni_tmp_root")
	if err != nil {
		panic(err)
	}
	err = os.RemoveAll("omni_tmp_browser")
	if err != nil {
		panic(err)
	}
}
