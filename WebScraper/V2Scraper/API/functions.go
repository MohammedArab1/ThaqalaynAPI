// Package API provides types and functions for working with result served by this API
package API

import (
	stringsLocal "github.com/mohammedarab1/thaqalaynapi/webscraper/V2Scraper/strings"
	webappAPI "github.com/mohammedarab1/thaqalaynapi/webscraper/V2Scraper/webappAPI"
	"strings"
)

// GetBookId takes a [github.com/mohammedarab1/thaqalaynapi/webscraper/V2Scraper/webappAPI.Book] and returns the BookID used by this API
// ex. Al-Khisal-Saduq
func GetBookId(book webappAPI.Book) string {
	bookId := *book.Name
	bookId = strings.Replace(bookId, " ", "-", -1)
	bookId = strings.Replace(bookId, "--", "", -1)
	bookId = strings.Replace(bookId, "`", "", -1)
	bookId = strings.Replace(bookId, "'", "", -1)
	bookId = bookId + "-" + book.GetAuthorLastName()
	bookId = stringsLocal.NormalizeString(bookId)
	return bookId
}
