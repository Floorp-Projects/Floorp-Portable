package main

import (
	"fmt"
	"strconv"
	"strings"
)

func prefCodeEscape(value string) string {
	value_escaped := strings.Replace(value, "\\", "\\\\", -1)
	value_escaped = strings.Replace(value_escaped, "\"", "\\\"", -1)
	return value_escaped
}

func boolPrefCodeGen(prefname string, value bool) string {
	return fmt.Sprintf(`pref("%s", %s);`, prefCodeEscape(prefname), strconv.FormatBool(value));
}

func intPrefCodeGen(prefname string, value int) string {
	return fmt.Sprintf(`pref("%s", %s);`, prefCodeEscape(prefname), strconv.Itoa(value));
}

func stringPrefCodeGen(prefname string, value string) string {
	return fmt.Sprintf(`pref("%s", "%s");`, prefCodeEscape(prefname), prefCodeEscape(value));
}
