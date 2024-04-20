// Package API provides types and functions for working with result served by this API
package API

import (
	"strings"

	stringsLocal "github.com/mohammedarab1/thaqalaynapi/v2/webscraper/strings"
	webappAPI "github.com/mohammedarab1/thaqalaynapi/v2/webscraper/webappAPI"
)

// GetBookId takes a [github.com/mohammedarab1/thaqalaynapi/v2/webscraper/webappAPI.Book] and returns the BookID used by this API
// ex. Al-Khisal-Saduq
func GetBookId(book webappAPI.Book) string {
	bookId := *book.Name
	bookId = strings.Replace(bookId, " ", "-", -1)
	bookId = strings.Replace(bookId, "--", "", -1)
	bookId = strings.Replace(bookId, "`", "", -1)
	bookId = strings.Replace(bookId, "'", "", -1)
	bookId = strings.Replace(bookId, "ʿ", "", -1)
	bookId = strings.Replace(bookId, "ʾ", "", -1)
	bookId = bookId + "-" + book.GetAuthorLastName()
	bookId = stringsLocal.NormalizeString(bookId)
	return bookId
}

// GetBookInfo takes a list of hadiths for a particular object and returns a BookInfo object
func GetBookInfo(hadiths []APIV2) BookInfo {
	return BookInfo{
		BookId:     hadiths[0].BookId,
		BookName:   hadiths[0].Book,
		Author:     hadiths[0].Author,
		IdRangeMin: 1,
		IdRangeMax: len(hadiths),
	}
}
