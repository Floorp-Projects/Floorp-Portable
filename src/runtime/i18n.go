package main

import (
	"embed"
	"encoding/json"

	"github.com/nicksnyder/go-i18n/v2/i18n"
	"golang.org/x/text/language"
)

//go:embed l10n-asset-dir/*.json
var LocaleFS embed.FS

var localizer *i18n.Localizer

func getLocalizer() *i18n.Localizer {
	bundle := i18n.NewBundle(language.AmericanEnglish)
	bundle.RegisterUnmarshalFunc("json", json.Unmarshal)

	_, err := bundle.LoadMessageFileFS(LocaleFS, "l10n-asset-dir/en-US.json")
	if err != nil {
		panic(err)
	}
	_, err = bundle.LoadMessageFileFS(LocaleFS, "l10n-asset-dir/ja.json")
	if err != nil {
		panic(err)
	}

	locale := getSystemLocale()

	return i18n.NewLocalizer(bundle, locale)
}

func localize(id string) string {
	if localizer == nil {
		localizer = getLocalizer()
	}

	return localizer.MustLocalize(&i18n.LocalizeConfig{MessageID: id})
}
