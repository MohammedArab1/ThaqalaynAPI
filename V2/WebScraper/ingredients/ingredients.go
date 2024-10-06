package ingredients

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"reflect"
	"slices"
	"strings"
	"time"

	"github.com/mohammedarab1/thaqalaynapi/v2/webscraper/config"
	"github.com/mohammedarab1/thaqalaynapi/v2/webscraper/files"
)

type HalalGuideItem struct {
	Ingredient string   `json:"ingredient"`
	Statuses   []string `json:"statuses"`
	Info       []string `json:"info"`
	OtherNames []string `json:"otherNames"`
	Unknown    []string `json:"unknown"`
}

func FetchIngredientsAlMaarif(config *config.Config) {
	fmt.Println("In fetch Ingredients goroutine, starting to fetch ingredients")
	// first fetch the rawIngredients from Almaarif.com. rawIngredients is what's scraped from the website without much modification 
	// or categorization
	rawIngredients := fetchAlmaarif()

	// Check if we have existing local files of ingredients. If so we might not need to use gem API if nothing's changed since last scrape
	rawIngredientsFileExists, _ := files.Exists(config.Flags.DataPath + "/rawIngredients.json")
	ingredientsFileExists, _ := files.Exists(config.Flags.DataPath + "/Ingredients.json")
	var existingRawIngredients []IngredientStatus
	var existingIngredients []HalalGuideItem
	if rawIngredientsFileExists {
		currentRawIngredientsFile, _ := os.ReadFile(config.Flags.DataPath + "/rawIngredients.json")
		if err := json.Unmarshal(currentRawIngredientsFile, &existingRawIngredients); err != nil {
			panic(err)
		}
	}
	if ingredientsFileExists {
		currentIngredientsFile, _ := os.ReadFile(config.Flags.DataPath + "/Ingredients.json")
		if err := json.Unmarshal(currentIngredientsFile, &existingIngredients); err != nil {
			panic(err)
		}
	}

	var allItems []HalalGuideItem
	for _, ingredientStatus := range rawIngredients {
		fmt.Println("In fetch Ingredients goroutine, on ingredient: " + ingredientStatus.Ingredient)
		// if we already have existing ingredients file, go through it and see if what was fetched from the website is the same
		// as what we have. If so, no need to call gem AI API to categorize. Instead, use the file we already have
		if len(existingRawIngredients) != 0 {
			//if the ingredient we got from Al maarif is already found in the existing ingredients file we have
			if slices.ContainsFunc(existingRawIngredients, func(i IngredientStatus) bool {
				return i.Ingredient == ingredientStatus.Ingredient && reflect.DeepEqual(i.Statuses, ingredientStatus.Statuses) && reflect.DeepEqual(i.OtherNames, ingredientStatus.OtherNames)
			}) && slices.ContainsFunc(existingIngredients, func(h HalalGuideItem) bool {
				return h.Ingredient == ingredientStatus.Ingredient
			}) {
				//continue because we know what we have in existing file is same as whats from al maarif
				halalGuideItemIndex := slices.IndexFunc(existingIngredients, func(i HalalGuideItem) bool {
					return i.Ingredient == ingredientStatus.Ingredient
				})
				allItems = append(allItems, existingIngredients[halalGuideItemIndex])
				continue
			}
		}

		halalGuideItem := HalalGuideItem{
			Ingredient: ingredientStatus.Ingredient,
			OtherNames: ingredientStatus.OtherNames,
		}
		// if i > 1 {
		// 	break
		// }

		// if we don't have the ingredient in an existing file, go through each status we got from the website and categorize it
		// (i.e either it's a status, extra info, unknown, etc.) using google gemini AI api. 
		for _, status := range ingredientStatus.Statuses {
			time.Sleep(5 * time.Second)
			newGemAiPrompt := gemAiPrompt + status
			aiCategory, err := gemAi(newGemAiPrompt)
			if err != nil {
				log.Fatal("error using gem ai to categorize: ", err)
			}
			categorize(string(aiCategory), &halalGuideItem, status)
		}
		allItems = append(allItems, halalGuideItem)
	}

	// Write the data to files.
	files.WriteStructToFile(allItems, config.Flags.DataPath+"/Ingredients.json")
	files.WriteStructToFile(rawIngredients, config.Flags.DataPath+"/rawIngredients.json")
	fmt.Println("In fetch Ingredients goroutine, finished fetching ingredients")
}

func categorize(category string, item *HalalGuideItem, textToAppend string) *HalalGuideItem {
	newCategory := strings.TrimSpace(strings.ToLower(category))
	if newCategory == "status" {
		item.Statuses = append(item.Statuses, textToAppend)
	} else if newCategory == "information" {
		item.Info = append(item.Info, textToAppend)
	} else if newCategory == "other" {
		item.OtherNames = append(item.OtherNames, textToAppend)
	} else if newCategory == "error" {
		item.Unknown = append(item.Unknown, textToAppend)
	}
	return item
}
