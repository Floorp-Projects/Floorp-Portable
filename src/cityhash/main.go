package cityhash

/*
#include "city.h"
*/
import "C"
import (
	"unsafe"
)

func WrappedCityHash64(s []byte, len uint32) uint64 {
	s_cstr := (*C.char)(unsafe.Pointer(&s[0]))
	len_size_t := C.size_t(len)

	return uint64(C.CityHash64(s_cstr, len_size_t))
}
