package main

import (
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"bytes"
	"log"
	"strings"
	"archive/zip"
	"github.com/bluekeyes/go-gitdiff/gitdiff"
)

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
			if err := os.MkdirAll(path, fileInZip.Mode()); err != nil {
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
	/*
	exe, err := os.Executable()
	if err != nil {
		panic(err)
	}
	exe_dir := filepath.Dir(exe)
	*/

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
		_, err = io.Copy(dst, src)
		if  err != nil {
			panic(err)
		}
		src.Close()
		dst.Close()

		src, err = os.Open("config/portable.ini")
		if err != nil {
			panic(err)
		}
		dst, err = os.Create("core/portable.ini")
		if err != nil {
			panic(err)
		}
		_, err = io.Copy(dst, src)
		if  err != nil {
			panic(err)
		}
		src.Close()
		dst.Close()
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
	_, err = io.Copy(dst, src)
	if  err != nil {
		panic(err)
	}
	src.Close()
	dst.Close()

	src, err = os.Open("config/portable-prefs.js")
	if err != nil {
		panic(err)
	}
	dst, err = os.Create("core/defaults/pref/portable-prefs.js")
	if err != nil {
		panic(err)
	}
	_, err = io.Copy(dst, src)
	if  err != nil {
		panic(err)
	}
	src.Close()
	dst.Close()

	if runtime.GOOS == "windows" {
		err := os.Remove("core/updater.exe")
		if  err != nil {
			panic(err)
		}
		err = os.Remove("core/default-browser-agent.exe")
		if  err != nil {
			panic(err)
		}
		err = os.RemoveAll("core/uninstall")
		if  err != nil {
			panic(err)
		}
	}


	unzip("core/omni.ja", "omni_tmp_root")
	unzip("core/browser/omni.ja", "omni_tmp_browser")

	err = filepath.Walk("patches", func(path string, info os.FileInfo, err error) error {
		if info.IsDir() {
			return nil
		}
		var rootDir string
		if strings.HasPrefix(filepath.ToSlash(path), "patches/root/") {
			rootDir = "omni_tmp_root"
		} else if strings.HasPrefix(filepath.ToSlash(path), "patches/browser/") {
			rootDir = "omni_tmp_browser"
		} else {
			return nil
		}
		log.Println("Applying \"" + path + "\"")
		patchfile, err := os.Open(path)
		if err != nil {
			panic(err)
		}
		files, _, err := gitdiff.Parse(patchfile)
		if err != nil {
			panic(err)
		}
		for _, file := range files {
			codefileRO, err := os.Open(rootDir + "/" + file.OldName)
			if err != nil {
				panic(err)
			}
			var output bytes.Buffer
			if err := gitdiff.Apply(&output, codefileRO, file); err != nil {
				panic(err)
			}
			codefileRO.Close()
			codefileW, err := os.Create(rootDir + "/" + file.OldName)
			if err != nil {
				panic(err)
			}
			codefileW.Write(output.Bytes())
			codefileW.Close()
		}
		return nil
	})
	if err != nil {
		panic(err)
	}

	createzip("omni_tmp_root", "core/omni.ja")
	createzip("omni_tmp_browser", "core/browser/omni.ja")
}
