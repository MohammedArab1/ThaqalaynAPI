package gql

import (
	"context"
	"github.com/joho/godotenv"
	graphql "github.com/machinebox/graphql"
	"os"
)

var client *graphql.Client

func init() {
	err := godotenv.Load()
	if err != nil {
		panic("Error loading .env file")
	}
	client = graphql.NewClient(os.Getenv("WEBAPP_URL"))
}

func MakeGQLRequest[T any](query string, variables ...[]string) T {
	req := graphql.NewRequest(query)
	req.Header.Set("apiKey", os.Getenv("WEBAPP_API_KEY"))
	if len(variables) > 0 {
		for _, v := range variables {
			req.Var(v[0], v[1])
		}
	}
	ctx := context.Background()
	var respData T
	if err := client.Run(ctx, req, &respData); err != nil {
		panic(err)
	}
	return respData
}
