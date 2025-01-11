package gomodules

import (
	"os"

	"github.com/BurntSushi/toml"
)

type Data struct {
	ProfilePrefs ProfilePrefs `toml:"profile-prefs"`
}

type ProfilePrefs struct {
	OldInstallHash string `toml:"old_install_hash"`
}

func GetPreferences(toml_path string) (Data, error) {
	var data Data

	if _, err := os.Stat(toml_path); err != nil {
		file, err := os.Create(toml_path)
		if err != nil {
			return data, err
		}
		if err := file.Close(); err != nil {
			return data, err
		}
	}

	if _, err := toml.DecodeFile(toml_path, &data); err != nil {
		return data, err
	}

	return data, nil
}

func WritePreferences(toml_path string, data Data) error {
	bytes, err := toml.Marshal(data)
	if err != nil {
		return err
	}

	if err := os.WriteFile(toml_path, bytes, 0755); err != nil {
		return err
	}

	return nil
}
