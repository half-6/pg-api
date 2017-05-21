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
const $DISTINCT = "$distinct";
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
                            let parameterName = addParameter(parameters,column,value[fun]);
                            where.push(buildCompare(column,parameterName,$COMPARE_FUNCTIONS[fun]));
                            continue;
                        }
                        if($LOGIC_FUNCTIONS[fun])
                        {
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
                    let parameterName = addParameter(parameters,column,value);
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
    return `${column.column_name} ${operator} ${parameterName}::${column.type}`;
}
function buildLogic(column,parameters,name,fun,value) {
    let operator = $LOGIC_FUNCTIONS[fun];
    switch (operator){
        case $LOGIC_FUNCTIONS.$in:
        case $LOGIC_FUNCTIONS.$any:
            let parameterName = addParameter(parameters,column,value[fun]);
            return `${column.column_name} = ANY(${parameterName})`;
        case $LOGIC_FUNCTIONS.$between:
            let parameterName1 = addParameter(parameters,column,value[fun][0]);
            let parameterName2 = addParameter(parameters,column,value[fun][1]);
            return `${column.column_name} BETWEEN ${parameterName1}::${column.type} AND ${parameterName2}::${column.type}`;
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
        table,
    }
}
function buildQuery(columnList,jsonQuery) {
    let output = [];
    //distinct case
    let distinctQuery = jsonQuery[$DISTINCT];
    if(distinctQuery)
    {
        for(let i in distinctQuery)
        {
            let name = distinctQuery[i];
            let column = columnList[name];
            if(column)
            {
                output.push(name);
                continue;
            }
            let fieldName = $myUtil.getFirstKey(name)
            let funQuery =buildFunction(columnList,name[fieldName]);
            if(funQuery)
            {
                output.push( `${funQuery} AS ${fieldName}`);
            }
        }
        return "DISTINCT " + output.join(",");
    }
    else
    {
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
                !fullQuery && output.push(name);
                continue;
            }
            let funQuery =buildFunction(columnList,jsonQuery[name]);
            if(funQuery)
            {
                output.push( `${funQuery} AS ${name}`);
            }
        }
        return output.join(",");
    }
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
        return funFields.length>0?`( ${funFields.join(" " +$ARITHMETIC_FUNCTIONS[fun] + " ")} )`:null;
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
    for(let columnName in sortQuery)
    {
        columnList[columnName] && output.push(`${columnName} ${sortQuery[columnName]=="DESC"?"DESC":"ASC" }`);
    }
    if(output.length==0) return undefined;
    return `ORDER BY ${output.join(",")}`;
}
function buildGroup(columnList,groupQuery) {
    let output = [];
    groupQuery.forEach(function (columnName) {
        columnList[columnName] && output.push(columnName);
    });
    if(output.length==0) return undefined;
    return `GROUP BY ${output.join(",")}`;
}

function validateColumn(columnList,columnName) {
    let column = columnList[columnName];
    if(column) return column;
    throw new Error(`Invalid column ${columnName}`);
}

function addParameter(parameters,column,value) {
    //composite
    if(column.columns && column.isComposite)
    {
        return JSON2Struct(parameters,column,value);
    }
    else
    {
        let index = 1;
        let name = column.column_name;
        while(parameters[name])
        {
            name = name + (index++)
        }
        parameters[name] = buildValue(column,value);
        return `\$[${name}]`;
    }
}
function buildValue(column,value) {
    switch (column.type)
    {
        case "bit":
            let bit = value.toString();
            return (bit.equalsIgnoreCase("true") || bit.equalsIgnoreCase("1") || bit.equalsIgnoreCase("t"))?1:0;
    }
    return value;
}
function JSON2Struct(parameters,column,json) {
    let output = [];
    for(let name in column.columns)
    {
        let columnValue = json[name];
        let subColumn = column.columns[name];
        let parameterName = addParameter(parameters,subColumn,columnValue);
        output.push(`${parameterName}::${subColumn.type}`)
    }
    return "(" + output.join(",") + ")";
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
        parameters,
        table
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
            let parameterName = addParameter(parameters,column,value);
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
        parameters,
        table
    }
}
//endregion

//region INSERT
function buildInsert(table,jsonQuery) {
    jsonQuery  = jsonQuery || [];
    if(!$util.isArray(jsonQuery)) jsonQuery = [jsonQuery];
    let sql = [];

    let parameters = {};
    let insertColumns = [];
    sql.push("INSERT INTO ");
    sql.push(`${table.schema}.${table.name}`);

    //find all columns need to insert
    jsonQuery.forEach( rows=>{
        for(let columnName in rows)
        {
            let column = table.columns[columnName];
            if(column)
            {
                if (insertColumns.indexOf(columnName)<0)insertColumns.push(columnName);
            }
            else
            {
                throw new Error(`Specific column ${columnName} does not exist`);
            }
        }
    });
    if(insertColumns.length ==0)
    {
        throw new Error("None of columns are valid");
    }
    sql.push("(");
    sql.push(insertColumns.join(","));
    sql.push(")");
    sql.push("VALUES");
    //build values
    let insertList = [];
    jsonQuery.forEach( item=>{
        let valueColumns = [];
        insertColumns.forEach( columnName=>{
            if(item[columnName])
            {
                let column = table.columns[columnName];
                let parameterName = addParameter(parameters,column,item[columnName]);
                valueColumns.push(`${parameterName}::${column.type}`)
            }
            else {
                valueColumns.push("DEFAULT");
            }
        });
        insertList.push("(" + valueColumns.join(",") + ")")
    });
    sql.push(insertList.join(","));
    sql.push("RETURNING");
    sql.push(table.primary_key);
    let insertSQL = sql.join(" ");
    $logger.info(`INSERT TSQL => ${insertSQL}`);
    return {
        SQL:insertSQL,
        parameters,
        table
    }
}
//endregion

function build(action,table,jsonQuery) {
    switch (action.toLowerCase()){
        case "select": return buildSelect(table,jsonQuery);
        case "delete": return buildDelete(table,jsonQuery);
        case "insert": return buildInsert(table,jsonQuery);
        case "update": return buildUpdate(table,jsonQuery);
        default:
            throw new Error(`specific ${action} doesn't support`);
    }
}

module.exports =
{
    buildInsert,
    buildSelect,
    buildDelete,
    buildUpdate,
    build,
    buildWhere
};
