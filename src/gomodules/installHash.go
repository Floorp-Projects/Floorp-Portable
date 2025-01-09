package gomodules

import (
	"cityhash"
	"fmt"

	"golang.org/x/text/encoding/unicode"
	"golang.org/x/text/transform"
)

func GetInstallHash(path string) string {
	encoder := unicode.UTF16(unicode.LittleEndian, unicode.IgnoreBOM).NewEncoder()
	path_bytes, _, _ := transform.Bytes(encoder, []byte(path))
	path_size := uint32(len(path_bytes))

	hash := cityhash.WrappedCityHash64(path_bytes, path_size)

	return fmt.Sprintf("%X", hash)
}
