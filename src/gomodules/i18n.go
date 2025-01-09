package gomodules

import (
	"embed"
	"encoding/json"
	"regexp"
	"strings"

	"github.com/nicksnyder/go-i18n/v2/i18n"
	"golang.org/x/text/language"
)

//go:embed l10n-asset-dir/*.json
var LocaleFS embed.FS

var localizer *i18n.Localizer

func getLocalizer() *i18n.Localizer {
	bundle := i18n.NewBundle(language.AmericanEnglish)
	bundle.RegisterUnmarshalFunc("json", json.Unmarshal)

	entries, err := LocaleFS.ReadDir("l10n-asset-dir")
	if err != nil {
		panic(err)
	}

	for _, v := range entries {
		_, err := bundle.LoadMessageFileFS(LocaleFS, "l10n-asset-dir/"+v.Name())
		if err != nil {
			panic(err)
		}
	}

	locale := getSystemLocale()

	return i18n.NewLocalizer(bundle, locale)
}

func replacePlaceHolder(value string) string {
	result := value

	r := regexp.MustCompile(`{\s([0-9a-z-]+)\s}`)

	placeholders := []string{}
	placeholders_index := r.FindAllStringIndex(value, -1)
	for _, index := range placeholders_index {
		if index[0] > 0 {
			before := string(value[index[0]-1])
			if before == `\` {
				continue
			}
		}
		placeholders = append(placeholders, string(value[index[0]:index[1]]))
	}

	for _, placeholder := range placeholders {
		key := r.FindStringSubmatch(placeholder)[1]

		target := ""
		switch key {
		case "-brand-full-name":
			target = AppBaseName + " Portable"
			break
		case "-brand-short-name":
			target = AppBaseName + " Portable"
			break
		case "-brand-shorter-name":
			target = AppBaseName
			break
		}

		result = strings.ReplaceAll(result, placeholder, target)
	}

	return result
}

func Localize(id string) string {
	if localizer == nil {
		localizer = getLocalizer()
	}

	value := localizer.MustLocalize(&i18n.LocalizeConfig{MessageID: id})

	return replacePlaceHolder(value)
}
