package gql

// import (
// 	"context"
// 	"github.com/joho/godotenv"
// 	graphql "github.com/machinebox/graphql"
// 	"os"
// 	config "github.com/mohammedarab1/thaqalaynapi/v2/webscraper/config"
// )

// // client stores gql client
// var client *graphql.Client

// // init constructor creates a new client with WEBAPP_URL env variable
// func newGqlClient(*config.Config) {
// 	godotenv.Load()
// 	if os.Getenv("WEBAPP_URL") == "" {
// 		panic("WEBAPP_URL DOES NOT  EXIST. NEEDS TO BE SET.")
// 	}
// 	client = graphql.NewClient(os.Getenv("WEBAPP_URL"))
// }

// MakeGQLRequest takes a query and any variables required and makes the gql request
// func MakeGQLRequest[T any](query string, variables ...[]string) T {
// 	req := graphql.NewRequest(query)
// 	req.Header.Set("apiKey", os.Getenv("WEBAPP_API_KEY"))
// 	if len(variables) > 0 {
// 		for _, v := range variables {
// 			req.Var(v[0], v[1])
// 		}
// 	}
// 	ctx := context.Background()
// 	var respData T
// 	if err := config..Run(ctx, req, &respData); err != nil {
// 		panic(err)
// 	}
// 	return respData
// }
