https://www.postgresql.org/docs/9.5/static/functions-math.html
https://github.com/vitaly-t/pg-promise
https://postgrest.com/en/v0.4/api.html#http-status-codes

http://www.vinaysahni.com/best-practices-for-a-pragmatic-restful-api

# release to npm
npm version patch
npm publish --access=public

# local publish
npm pack
npm install D:\Codes\LinkFuture.pg-api\linkfuture-pg-api-0.0.15.tgz

npm deprecate linkfuture-pg-api@"< 0.0.36" "This project has been renamed to @linkfuture/pg-api. Install using @linkfuture/pg-api instead"

