# PG-API
<span class="badge-npmversion"><a href="https://npmjs.org/package/linkfuture-pg-api" title="View this project on NPM"><img src="https://img.shields.io/npm/v/linkfuture-pg-api.svg" alt="NPM version" /></a></span>
<span class="badge-npmdownloads"><a href="https://npmjs.org/package/linkfuture-pg-api" title="View this project on NPM"><img src="https://img.shields.io/npm/dm/linkfuture-pg-api.svg" alt="NPM downloads" /></a></span>

RESTful API for PostgreSQL  
<span style="color:gray; font-size: 10px;">An easier way to query database</span>

Table of Contents
- [Installation](#installation)
- [Usage](#usage)
- [Query](#query)
- [Configuration](#configuration)
- [Events](#events) 
- [KeyWords](#keywords)
- [Notice](#notice)

## Installation

The easiest way to install linkfuture-pg-api is with [`npm`][npm].

[npm]: https://www.npmjs.com/

```sh
npm install linkfuture-pg-api
```

## Usage

``` js
const $config = {
    "connection":"postgres://<user>:<password>@<host>:<port>/<dbname>",
    "tables":{
        "user":{
            delete:false,//disable delete operation on user table, other operation will be available as default. 
         }
    }
}
const $pgConnector = require("linkfuture-pg-api");
// access through Restful API
const $pgApi = $pgConnector.api($config);
app.use("/api/db/",$pgApi);  
// access through NodeJs
const $pgQuery = $pgConnector.query($config);
let result = await $pgQuery.select("user",{$where:{user_id:1}}); 
```

## Query

### SELECT (GET)
- Select by Primary Key
``` HTTP
    GET http://[host]/api/db/[table-name or view-name]/[id]
    GET http://[host]/api/db/user/1
``` 

- Select by JSON Query
``` HTTP
    GET http://[host]/api/db/[table-name or view-name]?$q=[JSON QUERY]
    GET http://[host]/api/db/user?$q={"$where":{"id":{"$any":[1,2,3]}}}
``` 

- Select by Query String
``` HTTP
    GET http://[host]/api/db/[table-name or view-name]?[ColumnName]=[ColumnValue]&$limit=10
    GET http://[host]/api/db/user?age={"$gt":5,"$lt":50}&is_active=1&$limit=1
``` 

- Select in Node
``` js
    const $pgQuery = $pgConnector.query($config);
    let result = await $pgQuery.select("user",{$where:{user_id:1}});
    let result = await $pgQuery.selectOne("user",{$where:{user_id:1}});
``` 

- JSON Query Example  
  Normal Query
``` js
{
  "*":true
  ,"unknown_field2": {"$multiply":["age","price","price"]}
  ,"unknown_field3": {"$multiply":["age",{"$divide":["age","price"]}]}
  ,"unknown_field4": {"$divide":["age","price"]}
  ,"unknown_field5": {"$plus":["age","price"]}
  ,"unknown_field6": {"$minus":["age","price"]}
  ,"unknown_field7": {"$module":["age","price"]}
  ,"$where":{
      "display_name": "UNIT TEST",
      "account": {"$similar":"account%"},
      "age":{"$gt":5,"$lt":50},
      "is_active":1,
      "roles":[1,2],
      "price":{"$between":[300,500]},
      "account_id":{"$any": [4,3]},
      "meta":{"$contain":{"b":4}},
      "$or":[
          { "account":"test_1"},
          { "account":"test_2"}
       ]
  }
  ,"$sort":{"data_registered":"DESC","account_id":"ASC"  }
  ,"$limit":10
  ,"$offset":0
}
```
   Group by Query
``` js
{
  "gender":true
  ,"sum_operation": {"$sum":"age"}
  ,"sum_multiply_operation": {"$sum":{"$multiply":["age","price"]}}
  ,"count_operation": {"$count":1}
  ,"min_operation": {"$min":"age"}
  ,"max_operation": {"$max":"age"}
  ,"avg_operation": {"$avg":"age"}
  ,"$where":{
    "display_name": {"$like":"% display %"}
    ,"data_registered":{"$gt":"2015-09-30 21:21:31.647424+00"}
    ,"$or":[
        { "account":"account_1"}
      ,{ "account":"account_2"}
      ,{"display_name": {"$similar":"my display name"}}
    ]
  }
  ,"$limit":10
  ,"$offset":0
  ,"$group":["gender","age"]
}
```
  Distinct Query
``` js
{
  "$distinct":["price",{"unknown_field2":{"$multiply":["age","price","price"]}}]
  ,"$limit":10
  ,"$offset":0
}
```

### INSERT (POST)
- INSERT by JSON Query
``` HTTP
    POST http://[host]/api/db/[table-name]
    POST http://[host]/api/db/user
    {
         "account":"my_account_1"
        ,"password":"my passowrd"
        ,"display_name":"my display name"
        ,"gender":"male"
        ,"date_registered":"2015-10-30 14:21:31.647424 -07:00:00"
        ,"struct":{"name":"full update","supplier_id":[10,50],"price":1.99} 
        ,"age":10
        ,"price":50
        ,"roles":[1,2]
        ,"is_active":true
        ,"struct":null
        ,"meta":null
      }
``` 
- BULK INSERT by JSON Query
``` HTTP
    POST http://[host]/api/db/[table-name]
    POST http://[host]/api/db/user
    [
      {
         "account":"my_account_1"
        ,"password":"my passowrd"
        ,"display_name":"my display name"
        ,"gender":"male"
        ,"date_registered":"2015-10-30 14:21:31.647424 -07:00:00"
        ,"age":10
        ,"price":50
        ,"roles":[1,2]
        ,"is_active":true
        ,"struct":null
        ,"meta":null
      }
      ,{
         "account":"my_account_2"
        ,"password":"my passowrd"
        ,"gender":"female"
        ,"price":50
        ,"age":10
        ,"display_name":"my display name"
        ,"date_registered":"2015-10-30 14:21:31.647424 -07:00:00"
        ,"meta":
        {
          "img":"https://scontent-ord1-1.xx.fbcdn.net/v/t1.0-1/c9.0.40.40/p40x40/1618502_10203352692842640_430525865_n.jpg?oh=10b7e45293509d2b667a27f21985891f&oe=582C74C9"
        ,"gender":"male"
        ,"languages":"english"
        }
      }
    ]
``` 

- Insert in Node
``` js
    const $pgQuery = $pgConnector.query($config);
    let result = await $pgQuery.insert("user",[{"account":"my_account_1",,"password":"my passowrd"}}]);
``` 

### UPDATE (PUT)
TBD

### PARTIALLY UPDATES (PATCH)
- Update by JSON Query
``` HTTP
    PATCH http://[host]/api/db/[table-name]
    PATCH http://[host]/api/db/user
    {
        "display_name":"new name",
        "age":10,
        "$where":{
            "id":{"$any":[1,2,3]}
        }
    }
``` 

- Update in Node
``` js
    const $pgQuery = $pgConnector.query($config);
    let result = await $pgQuery.update("user",{"display_name":"new name","$where":{"id":{"$any":[1,2,3]}}}});
``` 

### DELETE (DELETE)
- Delete by Primary Key
``` HTTP
    DELETE http://[host]/api/db/[table-name or view-name]/[id]
    DELETE http://[host]/api/db/user/1
``` 

- Delete by JSON Query (no need [$where])
``` HTTP
    DELETE http://[host]/api/db/[table-name]?$q=[JSON QUERY]
    DELETE http://[host]/api/db/user?$q={"id":{"$any":[1,2,3]}}
``` 

- Delete by Query String
``` HTTP
    DELETE http://[host]/api/db/[table-name]?[ColumnName]=[ColumnValue]
    DELETE http://[host]/api/db/user?age={"$gt":5,"$lt":50}&is_active=1
``` 

- Delete in Node
``` js
    const $pgQuery = $pgConnector.query($config);
    let result = await $pgQuery.delete("user",{"id":{"$any":[1,2,3]}});
``` 

## Configuration
For security reason, sometimes you may want to disable the operation on specific table, like disable delete operation on user table. You can leverage following configuration to reslove this issue.  
By default, the API will enable all operations(select,delete,insert,update) on all tables and views
``` js
const $config = {
    "connection":"postgres://<user>:<password>@<host>:<port>/<dbname>",
    "tables":{
        "user":{ 
            select:true,
            delete:false,//disable delete operation on user table
         }
    },
    "events":{
        onRequest:function () {
            $logger.info("onRequest =>",JSON.stringify(arguments));
        },
        on_select_city_request:function () {
            $logger.info("on_select_city_request =>",JSON.stringify(arguments));
        },
    }
    "custom":{ //custom query, you can define your own script with transaction 
            "find-user":{
                "query":[
                    "select * from public.user where account_id=${id};",
                    "select * from public.city where id=${cityId}",
                    "insert into public.user(account,display_name) VALUES(${name1},${display_name1}),(${name2},${display_name2}) returning account_id",
                    "update public.user set display_name = ${updated_display_name} where account=${name1}",
                    "delete from public.user where account=${deletename}",
                ],
                "method":["GET","post"]
            }
     }
}
``` 

## Events
Events life cycle, you can catch on either global level (i.e onRequest) or specific action level(i.e on_select_city_request).  
Request => Build => Query => Complete
- Request: when api load
- Build: before build TSQL and verify column and parameters
- Query: before db operation
- Complete: after DB operation

``` js
        "events":{
            onRequest:function () {
                $logger.info("onRequest =>",JSON.stringify(arguments));
            },
            on_select_city_request:function () {
                $logger.info("on_select_city_request =>",JSON.stringify(arguments));
            },
            onBuild:function () {
                $logger.info("onBuild =>",JSON.stringify(arguments));
            },
            on_select_city_build:function () {
                $logger.info("on_select_city_build =>",JSON.stringify(arguments));
            },
            onQuery:function () {
                $logger.info("onQuery =>",JSON.stringify(arguments));
            },
            on_select_city_query:function () {
                $logger.info("on_select_city_query =>",JSON.stringify(arguments));
            },
            onComplete:function () {
                $logger.info("onComplete =>",JSON.stringify(arguments));
            },
            on_select_city_complete:function () {
                $logger.info("on_select_city_complete =>",JSON.stringify(arguments));
            },
            on_delete_city_complete:function () {
                $logger.info("on_delete_city_complete =>",JSON.stringify(arguments));
            },
        },
``` 

## KeyWords
- $q 
- $or 
- $where
- $sort
- $limit
- $offset
- $group
- $gt
- $gte
- $lt
- $lte
- $ne
- $like
- $similar
- $contain
- $any
- $between
- $in
- $multiply
- $divide
- $plus
- $minus
- $module
- $sum
- $count
- $min
- $max
- $avg
- $distinct


## Notice
- Column name
  it will be ignore if the column name does not exist in current table, but the query will be continue.
    
- Bit
  Bool type will auto convert to bit if the column type is bit.   
 