# Changelog 

![Weekly Data Update](https://github.com/mohammedarab1/ThaqalaynAPI/actions/workflows/main.yml/badge.svg)

## 2026-10

Search now uses PostgreSQL full-text search instead of substring matching. Changes include:
- Word-based matching with relevance ranking — results are sorted best-first and each item includes a `score`
- New `lang` query parameter (`en`, `ar`, or `any`) on V3 search endpoints to scope a search to one language
- Opt-in highlighting via `highlight=true`, returning `ts_headline` snippets with matched words wrapped in `<b>` tags
- The pipe (`|`) separator in `q` now works as documented: an OR between multiple queries
- V2, V3, and GraphQL search share the same full-text implementation, backed by new GIN indexes

## 2025-07

The API now provides more fine-grained volume and grading information for relevant hadiths. This came as a result of Thaqalayn team updating their API. Changes include:
- Volume count in the `/allBooks` endpoint
- More detailed gradings under each individual hadith with the `gradingsFull` field
As a result of this API change, the `BookName` field in the `/allBooks` endpoint lost volume information, now being stored in the `volume` field. 

## 2024-10

The API now has a new endpoint that allows for the retrieval of some ingredients in foods and their Islamic rulings as fetched from [Al Maarif](https://al-m.ca/halalguide/). The endpoint can be reached at `.../api/v2/ingredients`


## 2024-04

- the API now has V2 endpoints. The old endpoints are still available but will no longer be updated. All new Thaqalayn hadiths will be reflected in the V2 endpoints. All examples below use the V2 endpoints. The old endpoints can be accessed by replacing `.../api/v2/...` in the URL with `.../api/...` in the URL. Data returned in V2 is very similar to what was returned in the original endpoints. One breaking change is that the `behdudiGrading` field has been changed to `behbudiGrading` to reflect the correct spelling. Also, because the data that is retrieved is now formatted in a different way (ex. gradings are are better formatted), it is hard to know what is an application breaking change and what isn't. So I decided to separate this update into it's own version. Developers are encouraged to migrate to the V2 endpoints to fetch all the latest data. Migration should be relatively seemless, with the only expected change being the `behdudiGrading`->`behbudiGrading`. The old endpoints will still be available for the foreseeable future.

- The API now relies on a Go script as opposed to a python script to fetch all the data. All relevant code is found in the V2 directory.
