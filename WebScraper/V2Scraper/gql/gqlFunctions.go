package gql

import (
	"context"
	graphql "github.com/machinebox/graphql"
	"os"
)

func MakeGQLRequest[T any](query string, variables ...[]string) T {
	client := graphql.NewClient(os.Getenv("WEBAPP_URL"))
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
