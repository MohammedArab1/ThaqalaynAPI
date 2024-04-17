// Package strings provides functions to work with strings specific to this project
package strings

import (
	"golang.org/x/text/runes"
	"golang.org/x/text/transform"
	"golang.org/x/text/unicode/norm"
	"unicode"
)

//note for future me: understand what is going on here. From: https://pkg.go.dev/golang.org/x/text/runes#Remove

// NormalizeString removes accents from a string. Useful for removing diacritics.
func NormalizeString(txt string) string {
	t := transform.Chain(norm.NFD, runes.Remove(runes.In(unicode.Mn)), norm.NFC)
	s, _, _ := transform.String(t, txt)
	return s
}
