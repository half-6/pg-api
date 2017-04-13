/**
 * Module Name:
 * Project Name: LinkFuture.NodeJS
 * Created by Cyokin on 3/4/2017
 */
const $util = require('util');
const $myUtil = require('./../utility/util');
const $logger = require('./../utility/logger');

const $OR = "$or";
const $WHERE = "$where";
const $SORT = "$sort";
const $LIMIT = "$limit";
const $OFFSET = "$offset";
const $GROUP = "$group";
const $TOTAL_COUNT = "__pg_total_count";

const $COMPARE_FUNCTIONS = {
    "$gt":">",
    "$gte":">=",
    "$lt":"<",
    "$lte":"<=",
    "$ne":"!=",
    "$eq":"=",
    "$like":"LIKE",
    "$similar":"SIMILAR TO",
    "$contain":"@>",
};
const $LOGIC_FUNCTIONS = {
    "$any":"ANY",
    "$between":"BETWEEN",
    "$in":"IN",
};
const $ARITHMETIC_FUNCTIONS = {
    "$multiply":"*",
    "$divide":"/",
    "$plus":"+",
    "$minus":"-",
    "$module":"%"
};
const $AGGREGATE_FUNCTIONS = {
    "$sum":"sum",
    "$count":"count",
    "$min":"min",
    "$max":"max",
    "$avg":"avg"
};

const $WHERE_FUNCTIONS = Object.assign({},$COMPARE_FUNCTIONS,$LOGIC_FUNCTIONS);


//region WHERE
function buildWhereEx(columnList,jsonWhere,where,parameters) {
    for(let name in jsonWhere){
        let column = columnList[name];
        if(column)
        {
            let value = jsonWhere[name];
            //it is column
            if($util.isObject(value) && !$util.isArray(value))
            {
                //let fun = $myUtil.getFirstKey(value);
                for(let fun in value)
                {
                    if($WHERE_FUNCTIONS[fun])
                    {
                        if($COMPARE_FUNCTIONS[fun])
                        {
                            let parameterName = addParameter(parameters,name,value[fun]);
                            where.push(buildCompare(column,parameterName,$COMPARE_FUNCTIONS[fun]));
                            continue;
                        }
                        if($LOGIC_FUNCTIONS[fun])
                        {
                            //let parameterName = addParameter(parameters,name,value[fun]);
                            where.push(buildLogic(column,parameters,name,fun,value));
                            continue;
                        }
                    }
                    $logger.info(`Specific function ${fun} doesn't support`);
                }
            }
            else
            {
                //normal case
                if(value)
                {
                    let parameterName = addParameter(parameters,name,value);
                    where.push(buildCompare(column,parameterName,"="))
                }
                else
                {
                    where.push(`${name} is null`)
                }
            }
        }
        else if(name.equalsIgnoreCase($OR))
        {
            let orArray = jsonWhere[name];
            let orOutput =[];
            for(let orIndex in orArray)
            {
                let orWhere = buildWhere(columnList,orArray[orIndex],parameters);
                orWhere && orOutput.push(`( ${orWhere})`);
            }
            where.push(orOutput.join(" OR "));
        }
    }
}
function buildWhere(columnList,jsonWhere,parameters) {
    let where=[];
    buildWhereEx(columnList,jsonWhere,where,parameters);
    return where.join(" AND ");
}
function buildCompare(column,parameterName,operator) {
    return `${column.column_name} ${operator} \$[${parameterName}]::${column.type}`;
}
function buildLogic(column,parameters,name,fun,value) {
    let operator = $LOGIC_FUNCTIONS[fun];
    switch (operator){
        case $LOGIC_FUNCTIONS.$in:
        case $LOGIC_FUNCTIONS.$any:
            let parameterName = addParameter(parameters,name,value[fun]);
            return `${column.column_name} = ANY(\$[${parameterName}])`;
        case $LOGIC_FUNCTIONS.$between:
            let parameterName1 = addParameter(parameters,name,value[fun][0]);
            let parameterName2 = addParameter(parameters,name,value[fun][1]);
            return `${column.column_name} BETWEEN \$[${parameterName1}]::${column.type} AND \$[${parameterName2}]::${column.type}`;
    }
    throw new Error(`specific function ${fun} not support yet`)
}
//endregion

//region SELECT
function buildSelect(table,jsonQuery) {
    jsonQuery  = jsonQuery || {};
    let sql = [];
    let parameters = {};
    let limit = (jsonQuery[$LIMIT] && jsonQuery[$LIMIT]<1000)?jsonQuery[$LIMIT]:10;
    let offset = jsonQuery[$OFFSET]  || 0;
    sql.push("SELECT");
    sql.push(buildQuery(table.columns,jsonQuery) || "*");
    sql.push(`,count(1) OVER() AS ${$TOTAL_COUNT}`);
    sql.push("FROM");
    sql.push(`${table.schema}.${table.name}`);
    if(jsonQuery[$WHERE])
    {
        let where = buildWhere(table.columns,jsonQuery[$WHERE],parameters);
        where && sql.push(`WHERE ${where}`);
    }
    if(jsonQuery[$GROUP])
    {
        let group = buildGroup(table.columns,jsonQuery[$GROUP]);
        group && sql.push(group);
    }
    if(jsonQuery[$SORT])
    {
        let group = buildSort(table.columns,jsonQuery[$SORT]);
        group && sql.push(group);
    }
    sql.push(`LIMIT ${limit}`);
    sql.push(`OFFSET ${offset}`);
    let selectSQL = sql.join(" ");
    $logger.info(`SELECT TSQL => ${selectSQL}`)
    return {
        SQL:selectSQL,
        parameters,
        limit,
        offset,
    }
}
function buildQuery(columnList,jsonQuery) {
    let output = [];
    let fullQuery = false;
    for(let name in jsonQuery){
        if(name.startsWith("$")) continue;
        if(name=="*" && jsonQuery[name]==true)
        {
            output.push(name);
            fullQuery = true;
            continue;
        }
        let column = columnList[name];
        if(column && jsonQuery[name]==true)
        {
            !fullQuery &&  output.push(name);
            continue;
        }
        output.push( `${buildFunction(columnList,jsonQuery[name])} AS ${name}`);
    }
    return output.join(",");
}
function buildFunction(columnList,funQuery) {
    let fun = $myUtil.getFirstKey(funQuery);
    if($ARITHMETIC_FUNCTIONS[fun])
    {
        let funArray = funQuery[fun];
        let funFields = [];
        funArray.forEach( ele=>{
            let funValue = buildFunctionValue(columnList,ele);
            funValue && funFields.push(funValue);
        });
        return `( ${funFields.join(" " +$ARITHMETIC_FUNCTIONS[fun] + " ")} )`;
    }
    if($AGGREGATE_FUNCTIONS[fun]){
        let ele = funQuery[fun];
        let funValue = buildFunctionValue(columnList,ele);
        return `${$AGGREGATE_FUNCTIONS[fun]}( ${funValue} )`;
    }
}
function buildFunctionValue(columnList,ele) {
    if($util.isObject(ele))
    {
        return buildFunction(columnList,ele);
    }
    if($util.isString(ele))
    {
        return columnList[ele] && ele;
    }
    if($util.isNumber(ele))
    {
        return ele;
    }
    throw new Error("Does not support this function value");
}
function buildSort(columnList,sortQuery) {
    let output = [];
    for(let key in sortQuery)
    {
        columnList[key] && output.push(`${key} ${sortQuery[key]=="DESC"?"DESC":"ASC" }`);
    }
    return `ORDER BY ${output.join(",")}`;
}
function buildGroup(columnList,groupQuery) {
    let output = [];
    groupQuery.forEach(function (column) {
        columnList[column] && output.push(column);
    });
    return `GROUP BY ${output.join(",")}`;
}
function addParameter(parameters,name,value) {
    let index = 1;
    while(parameters[name])
    {
        name = name + (index++)
    }
    parameters[name] = value;
    return name;
}
//endregion

//region DELETE
function buildDelete(table,jsonQuery) {
    jsonQuery  = jsonQuery || {};
    let sql = [];
    let parameters = {};
    sql.push("DELETE");
    sql.push("FROM");
    sql.push(`${table.schema}.${table.name}`);
    if(jsonQuery)
    {
        let where = buildWhere(table.columns,jsonQuery,parameters);
        if(!where || where.length == 0)
            throw new Error("We does not support none condition deletion");
        where && sql.push(`WHERE ${where}`);
    }
    else
    {
        throw new Error("We does not support none condition deletion");
    }
    let deleteSQL = sql.join(" ");
    $logger.info(`DELETE TSQL => ${deleteSQL}`)
    return {
        SQL:deleteSQL,
        parameters
    }
}
//endregion

//region UPDATE
function buildUpdate(table,jsonQuery) {
    jsonQuery  = jsonQuery || {};
    let sql = [];
    let set = [];
    let parameters = {};
    sql.push("UPDATE");
    sql.push(`${table.schema}.${table.name}`);
    sql.push("SET");
    for(let name in jsonQuery) {
        let column = table.columns[name];
        if(column)
        {
            let value = jsonQuery[name];
            let parameterName = addParameter(parameters,name,value);
            set.push(buildCompare(column,parameterName,"="))
        }
    }
    if(set.length==0) throw new Error("Missing set");
    sql.push(set.join(","));
    if(jsonQuery[$WHERE])
    {
        let where = buildWhere(table.columns,jsonQuery[$WHERE],parameters);
        if(!where || where.length == 0)
            throw new Error("We does not support none condition updating");
        where && sql.push(`WHERE ${where}`);
    }
    else
    {
        throw new Error("We does not support none condition updating");
    }
    let deleteSQL = sql.join(" ");
    $logger.info(`UPDATE TSQL => ${deleteSQL}`)
    return {
        SQL:deleteSQL,
        parameters
    }
}
//endregion

module.exports =
{
    buildSelect,
    buildDelete,
    buildUpdate,
    buildWhere
};
