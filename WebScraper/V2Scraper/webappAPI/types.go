package webappAPI

type ThaqalaynTopLevel struct {
	Data Data `json:"data"`
}

type Data struct {
	Book Book `json:"book"`
}

type Book struct {
	AuthorName   string        `json:"authorName"`
	Translator   string        `json:"translator"`
	EnglishName  string        `json:"englishName"`
	Id           int           `json:"id"`
	BookSections []BookSection `json:"bookSections"`
	Name         string        `json:"name"`
	Volume       int           `json:"volume"`
}

type BookSection struct {
	Id            int       `json:"id"`
	Name          string    `json:"name"`
	SectionNumber int       `json:"sectionNumber"`
	Chapters      []Chapter `json:"chapters"`
}

type Chapter struct {
	Id         int      `json:"id"`
	Name       string   `json:"name"`
	NumHadiths int      `json:"numHadiths"`
	Number     int      `json:"number"`
	Hadiths    []Hadith `json:"hadiths"`
}

type Hadith struct {
	Content               string `json:"content"`
	Id                    int    `json:"id"`
	Language              string `json:"language"`
	Number                int    `json:"number"`
	JsonChains            string `json:"jsonChains"`
	GradingWithReferences string `json:gradingWithReferences`
}
