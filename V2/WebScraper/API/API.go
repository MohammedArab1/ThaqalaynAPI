// Package API provides types and functions for working with result served by this API
package API

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"slices"
	"strconv"
	"strings"
	"time"

	"github.com/mohammedarab1/thaqalaynapi/v2/webscraper/config"
	"github.com/mohammedarab1/thaqalaynapi/v2/webscraper/files"
	stringsLocal "github.com/mohammedarab1/thaqalaynapi/v2/webscraper/strings"
	webappAPI "github.com/mohammedarab1/thaqalaynapi/v2/webscraper/webappAPI"
	"github.com/mohammedarab1/thaqalaynapi/v2/webscraper/webappAPI/services"
)

type WebAppApiService interface {
	FetchAllBookIds() (*webappAPI.Books, error)
	FetchBook(bookId int) (*webappAPI.Book, error)
	FetchHadithsByChapter(bookId int, chapter int, bookSection int) (*webappAPI.Hadiths, error)
}

type APIClient struct {
	WebAppApiService WebAppApiService
}

// NewAPIClient creates a new API client with the given webapp API service
func NewAPIClient(webAppApiService WebAppApiService) *APIClient {
	return &APIClient{
		WebAppApiService: webAppApiService,
	}
}

// GetBookId takes a [github.com/mohammedarab1/thaqalaynapi/v2/webscraper/webappAPI.Book] and returns the BookID used by this API
// ex. Al-Khisal-Saduq
func GetBookId(book webappAPI.BookItem) string {
	bookId := *book.NameEn
	bookId = strings.Replace(bookId, " ", "-", -1)
	bookId = strings.Replace(bookId, "--", "", -1)
	bookId = strings.Replace(bookId, "`", "", -1)
	bookId = strings.Replace(bookId, "'", "", -1)
	bookId = strings.Replace(bookId, "ʿ", "", -1)
	bookId = strings.Replace(bookId, "ʾ", "", -1)
	if book.CurrentVolume != nil && book.VolumeCount != nil && *book.VolumeCount > 1 {
		bookId = bookId + "-Volume-" + strconv.Itoa(*book.CurrentVolume)
	}
	bookId = bookId + "-" + book.GetAuthorLastName()
	bookId = stringsLocal.NormalizeString(bookId)
	return bookId
}

// GetBookInfo takes a list of hadiths for a particular object and returns a BookInfo object
func (a *APIClient) GetBookInfo(thaqalaynBookUrlPointer int, hadiths []APIV2) (*BookInfo, error) {
	book, _ := a.WebAppApiService.FetchBook(thaqalaynBookUrlPointer)
	imageId := thaqalaynBookUrlPointer
	if *book.Book.CurrentVolume > 1 {
		imageId = thaqalaynBookUrlPointer - (*book.Book.CurrentVolume-1)
	}
	bookInfo := BookInfo{
		BookId:          GetBookId(*book.Book),
		BookName:        *book.Book.NameEn,
		BookDescription: *book.Book.BlurbEn,
		BookCover:       fmt.Sprintf("https://thaqalayn.net/css/images/%d-round.jpeg",imageId),
		EnglishName:     *book.Book.NameEnTl,
		Translator:      *book.Book.Translator.NameEn,
		Author:          *book.Book.Author.NameEn,
		IdRangeMin:      1,
		IdRangeMax:      len(hadiths),
		Volume:          *book.Book.CurrentVolume,
	}
	return &bookInfo, nil
}

func (a *APIClient) FetchHadiths(bookUrlPointer int) ([]APIV2, *BookInfo, []webappAPI.Volume, error) {
	var APIV1Hadiths []APIV2
	hadithCount := 1

	/*
		Iterating through JSON object retrieved from WebApp API representing single book.
		Logic:
			For every booksection, iterate through all chapters in it.
			For every chapter, iterate through all hadiths in it.
			For every hadith, create an APIV2 object and set the appropriate fields.
		Essentially we are translating data given from webapp API to API in the V2 format.
	*/
	// bookIdInt, err := strconv.Atoi(bookUrlPointer)
	// if err != nil {
	// 	return nil, nil, err
	// }
	book, err := a.WebAppApiService.FetchBook(bookUrlPointer)
	if err != nil {
		return nil, nil, nil, err
	}

	if book.Book.BlurbEn == nil {
		ptrEmptyString := ""
		book.Book.BlurbEn = &ptrEmptyString
	} //todo review this functionality

	for _, bookSection := range book.Book.BookSections {
		for _, chapter := range bookSection.Chapters {
			chapterHadiths, err := a.WebAppApiService.FetchHadithsByChapter(bookUrlPointer, *chapter.Number, *bookSection.SectionNumber)
			if err != nil {
				return nil, nil, nil, fmt.Errorf("error fetching hadiths for book %d, chapter %d, book section %d: %w", bookUrlPointer, *chapter.Number, *bookSection.SectionNumber, err)
			}
			for _, hadith := range chapterHadiths.Hadiths {
				if hadith.TextEn == nil || hadith.TextAr == nil {
					continue //skip hadiths that do not have any text
				}

				//getting narrators and narration
				var narrators string
				var narration string
				if hadith.MatnIndexEn != nil {
					runes := []rune(*hadith.TextEn)
					narrators = string(runes[0:*hadith.MatnIndexEn])
					narration = string(runes[*hadith.MatnIndexEn:])
				}

				//create the APIV2 object based on what was unmarshalled
				var h APIV2 = APIV2{
					Id:                  hadithCount,
					BookId:              GetBookId(*book.Book),
					Book:                *book.Book.NameEn,
					Volume:              *book.Book.CurrentVolume,
					Category:            *bookSection.Name,
					CategoryId:          *bookSection.SectionNumber,
					Chapter:             *chapter.Name,
					Author:              *book.Book.Author.NameEn,
					Translator:          *book.Book.Translator.NameEn,
					URL:                 fmt.Sprintf(`https://thaqalayn.net/hadith/%d/%d/%d/%d`, *book.Book.Number, *bookSection.SectionNumber, *chapter.Number, *hadith.Number),
					ArabicText:          *hadith.TextAr,
					EnglishText:         *hadith.TextEn,
					ChapterInCategoryId: *chapter.Number,
					ThaqalaynSanad:      narrators,
					ThaqalaynMatn:       narration,
					GradingsFull:        hadith.Gradings,
				}
				hadithCount++
				h.BehbudiGrading, h.MajlisiGrading, h.MohseniGrading = hadith.GetGradings()
				APIV1Hadiths = append(APIV1Hadiths, h)
			}
		}
	}
	// bookInfo.IdRangeMax = len(APIV1Hadiths)
	bookInfo, err := a.GetBookInfo(bookUrlPointer, APIV1Hadiths)
	if err != nil {
		return nil, nil, nil, err
	}
	return APIV1Hadiths, bookInfo, book.Book.Volumes, nil
}

// scrapeAll fetches books from the webapi
func ScrapeAll(config *config.Config) error {
	start := time.Now()
	fmt.Println("Starting fetching Thaqalayn Hadiths. This will take a while.")

	var allHadithsArray []APIV2
	var allBookNamesArray []BookInfo
	if config.WEBAPP_URL == "" {
		return errors.New("WEBAPP_URL needs to be set. Either through env variables or flags. See Readme")
	}

	service := services.NewTrpc(config.WEBAPP_URL)
	apiClient := NewAPIClient(service)

	webAppAPIBookIds, err := service.FetchAllBookIds()
	if err != nil {
		return fmt.Errorf("error fetching all book ids: %w", err)
	}

	//check if singleBookId is given, if so, only scrape that book
	if config.Flags.SingleBook != 0 {
		bookIdsString := []string{}
		for _, i := range webAppAPIBookIds.Books {
			bookIdsString = append(bookIdsString, strconv.Itoa(*i.Number))
		}
		//only scrape the given singleBookId if it is part of the list of Ids that can be scraped.
		if !slices.Contains(bookIdsString, fmt.Sprint(config.Flags.SingleBook)) {
			return errors.New("book id provided does not exist in available book ids")
		}
		webAppAPIBookIds = &webappAPI.Books{Books: []webappAPI.BookId{
			{
				Number: &config.Flags.SingleBook,
			},
		}}
	}
	for i := 0; i < len(webAppAPIBookIds.Books); i++ {
		v := webAppAPIBookIds.Books[i]
		fmt.Println("on book: ", *v.Number)
		APIV1Hadiths, bookInfo, volumes, err := apiClient.FetchHadiths(*v.Number)
		//volumes are not returned in the thaqalayn API allBooks endpoint but we need to treat them as separate books
		// so we look to see if the Book endpoint returned any volumes, and we add their url_pointer to the allBooks.
		for _, volume := range volumes {
			bookIdsString := []string{}
			for _, b := range webAppAPIBookIds.Books {
				bookIdsString = append(bookIdsString, strconv.Itoa(*b.Number))
			}
			if !slices.Contains(bookIdsString, *volume.UrlPointer) {
				num, _ := strconv.Atoi(*volume.UrlPointer)
				webAppAPIBookIds.Books = append(webAppAPIBookIds.Books, webappAPI.BookId{Number: &num})
			}
		}

		if err != nil {
			return fmt.Errorf("Error retrieving hadiths for book %d: %w", *v.ID, err)
		}
		files.WriteStructToFile(APIV1Hadiths, config.Flags.DataPath+"/"+strconv.Itoa(*v.Number)+".json")
		allHadithsArray = append(allHadithsArray, APIV1Hadiths...)
		allBookNamesArray = append(allBookNamesArray, *bookInfo)
		time.Sleep(10 * time.Second)
	}
	files.WriteStructToFile(allHadithsArray, config.Flags.DataPath+"/allBooks.json")
	files.WriteStructToFile(allBookNamesArray, config.Flags.DataPath+"/BookNames.json")
	fmt.Println("Finished fetching Thaqalayn hadiths, time taken: ", time.Since(start))
	return nil
}

// onlyBooksAndBookNames runs through all the .json files in a directory and creates allBooks and BookNames from there.
// Can be used if we don't want to run the scraper to generate these file (i.e files already exist)
// ex parameter: ../../ThaqalaynData
func OnlyBooksAndBookNames(config *config.Config) error {
	var allBooks []APIV2
	var currentBook []APIV2
	var allBookNames []BookInfo
	// var currentBookName API.BookInfo
	bookNamesOnly := config.Flags.BookNamesOnly
	//if given directory does not exist, default to ../../ThaqalaynData
	if v, _ := files.Exists(bookNamesOnly); !v {
		fmt.Println("given bookNamesOnly directory does not exist. Defaulting to ../../ThaqalaynData")
		bookNamesOnly = "../../ThaqalaynData"
	}

	// first remove any existing booknames or allbooks json files to recreate new ones.
	err := os.Remove(bookNamesOnly + "/allBooks.json")
	if err != nil {
		return err
	}
	err = os.Remove(bookNamesOnly + "/BookNames.json")
	if err != nil {
		return err
	}
	for _, s := range files.Find(bookNamesOnly, ".json") {
		dat, _ := os.ReadFile(s)
		if err := json.Unmarshal(dat, &currentBook); err != nil {
			return err
		}
		parts := strings.Split(s, "\\")
		filename := parts[len(parts)-1]
		thaqalaynBookId := strings.TrimSuffix(filename, ".json")

		service := services.NewTrpc(config.WEBAPP_URL)
		apiClient := NewAPIClient(service)
		bookIdInt, err := strconv.Atoi(thaqalaynBookId)
		if err != nil {
			return err
		}
		currentBookName, err := apiClient.GetBookInfo(bookIdInt, currentBook)
		if err != nil {
			return err
		}
		allBooks = append(allBooks, currentBook...)
		allBookNames = append(allBookNames, *currentBookName)
	}
	files.WriteStructToFile(allBooks, bookNamesOnly+"/allBooks.json")
	files.WriteStructToFile(allBookNames, bookNamesOnly+"/BookNames.json")
	return nil
}
