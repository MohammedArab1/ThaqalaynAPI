package ingredients

import (
	"context"
	"errors"
	"strings"
	stringsLocal "github.com/mohammedarab1/thaqalaynapi/v2/webscraper/strings"
	"github.com/gocolly/colly/v2"
	"github.com/google/generative-ai-go/genai"
	"google.golang.org/api/option"
)

type IngredientStatus struct {
	Ingredient string   `json:"ingredient"`
	Statuses   []string `json:"statuses"`
	OtherNames []string `json:"otherNames"`
}

var gemAiPrompt = `
Here is some text. I want you to answer which category this text falls in. There are 3 categories:

1. Status
2. Information
3. Other name

Here are examples of each category to help you categorize better:
1. examples of status: "Halal Fish Source: Halal", "Halal", "Haram – biproduct of wine-making barrels", "Unknown Source: Halal but advisable to avoid"
2. examples of information: "Not necessarily the same as doughnut glaze", "Confectioner’s Glaze is primarily produced from Shellac, which is haram.", "(Different from ‘Chocolate Liquer’ which is Haram)", "Cheese contains enzymes and/or rennet", "Refer to ‘Rennet’ and ‘Enzymes’ sections for more details"
3. examples of other name: "(AKA monkey, gorilla, etc)", "(AKA Crayfish)"

Your answer should be a single word, one of 3 options: "status" or "information" or "other". If there is an issue, answer only with "error" and do not say anything else.


Now give me the category of the following:

	`

func fetchAlmaarif() []IngredientStatus {
	c := colly.NewCollector()

	var items []IngredientStatus

	c.OnHTML("dl.hg-item", func(e *colly.HTMLElement) {
		ingredient := e.ChildText("dt.hg-item-title")
		rawDescription, _ := e.DOM.Find("dd.hg-item-description").Html()
		lines := strings.Split(rawDescription, "<br/>")
		var statuses []string
		var scholarOpinion string
		collectingOpinion := false
		appendCount := 0
		var otherNames []string
		for i, line := range lines {
			line = strings.TrimSpace(line)
			if line == "–" || line == "—" {
				continue
			}

			if strings.HasPrefix(line, "Ay") && strings.HasSuffix(line, ":") {
				scholarOpinion = line
				collectingOpinion = true
				appendCount = 0
			} else if collectingOpinion {
				if strings.Contains(line, "–") || strings.Contains(line, "—") || i == len(lines)-1 {
					collectingOpinion = false
					scholarOpinion += " " + line
					statuses = append(statuses, scholarOpinion)
					scholarOpinion = ""
				} else {
					if appendCount > 0 {
						scholarOpinion += "; " + line
					} else {
						scholarOpinion += " " + line
					}
					appendCount++
				}
			} else if strings.HasPrefix(line, "(AKA") && strings.HasSuffix(line, ")") {
				line = stringsLocal.GetStringInBetweenTwoString(line, "(AKA", ")")
				otherNames = strings.Split(line, ",")
				for i, name := range otherNames {
					otherNames[i] = strings.TrimSpace(name)
				}

			} else {
				statuses = append(statuses, line)
			}
		}

		items = append(items, IngredientStatus{
			Ingredient: ingredient,
			Statuses:   statuses,
			OtherNames: otherNames,
		})
	})

	c.Visit("https://al-m.ca/halalguide/")
	return items
}

func gemAi(prompt string) (genai.Text, error) {
	ctx := context.Background()
	client, err := genai.NewClient(ctx, option.WithAPIKey("AIzaSyA3oOFQi0oSrMlwhLKyKei_OaKTp8Rl6G8"))
	if err != nil {
		return "", err
	}
	defer client.Close()

	model := client.GenerativeModel("gemini-1.5-flash")
	model.SafetySettings = []*genai.SafetySetting{
		{
			Category:  genai.HarmCategoryHateSpeech,
			Threshold: genai.HarmBlockNone,
		},
		{
			Category:  genai.HarmCategoryHarassment,
			Threshold: genai.HarmBlockNone,
		},
		{
			Category:  genai.HarmCategorySexuallyExplicit,
			Threshold: genai.HarmBlockNone,
		},
		{
			Category:  genai.HarmCategoryDangerousContent,
			Threshold: genai.HarmBlockNone,
		},
	}
	resp, err := model.GenerateContent(ctx, genai.Text(prompt))
	if err != nil {
		return "", err
	}
	for _, part := range resp.Candidates[0].Content.Parts {
		if txt, ok := part.(genai.Text); ok {
			return txt, nil
		}
	}
	return "", errors.New("error getting content")
}
