package files

import (
	"encoding/json"
	"io/fs"
	"os"
	"path/filepath"
)

// exists returns whether the given file or directory exists
func Exists(path string) (bool, error) {
	_, err := os.Stat(path)
	if err == nil {
		return true, nil
	}
	if os.IsNotExist(err) {
		return false, nil
	}
	return false, err
}

// WriteStructToFile takes a struct and writes it to a file (usually json)
func WriteStructToFile(structure any, filename string) {
	file, err := json.MarshalIndent(structure, "", "	")
	if err != nil {
		panic(err)
	}
	err = os.WriteFile(filename, file, 0644)
	if err != nil {
		panic(err)
	}
}

// Find finds all files of a specific extension in a directory
func Find(root, ext string) []string {
	var a []string
	filepath.WalkDir(root, func(s string, d fs.DirEntry, e error) error {
		if e != nil {
			return e
		}
		if filepath.Ext(d.Name()) == ext {
			a = append(a, s)
		}
		return nil
	})
	return a
}
