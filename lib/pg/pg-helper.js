/**
 * Module Name:
 * Project Name: LinkFuture.NodeJS
 * Created by Cyokin on 3/4/2017
 */

const $pgp = require('pg-promise')();
//https://github.com/vitaly-t/pg-promise
const $logger = require('./../utility/logger');
const $fs = require('fs');
const $path = require('path');
const $allTables = $fs.readFileSync($path.join(__dirname, '../sql/find-tables.sql')).toString();
const $allColumns = $fs.readFileSync($path.join(__dirname, '../sql/find-columns.sql')).toString();
const $json2Sql = require('./json-sql');
let $connectionCache = {};
module.exports = function (conn) {
    let $db;
    if(!$connectionCache[conn])
    {
        $db = $connectionCache[conn] = {conn:$pgp(conn),schema:null};
    }
    $db = $connectionCache[conn];

    //region get schema
    function getTables() {
        $logger.info("getTables");
        return $db.conn.query($allTables)
    }
    async function getSchema() {
        if($db.schema) {
            return $db.schema;
        }
        else
        {
            let columns = await $db.conn.query($allColumns);
            let output = {};
            for(let columnIndex in columns)
            {
                let column = columns[columnIndex];
                if(!output[column.table_name]){
                    output[column.table_name] = {
                        columns:{},
                        schema:column.table_schema,
                        name:column.table_name,
                        primary_key:[]
                    }
                    $logger.info(`read table ${column.table_name} schema success`);
                }
                let table = output[column.table_name];
                column.type =getColumnType(column);
                table.columns[column.column_name] = column;
                column.is_primary_key && table.primary_key.push(column.column_name);
            }
            $logger.info(`read ${Object.keys(output).length} table schema success`);
            $db.schema = output;
            return $db.schema;
        }
    }
    //endregion

    function getColumnType(column) {
        if(column.udt_name.startsWith("_"))
        {
            return column.udt_name.substring(1) + "[]";
        }
        else
        {
            return column.udt_name
        }
    }

    async function query(schema,tableName,jsonQuery) {
        if (schema[tableName]) {
            const select = $json2Sql.buildSelect($db.schema[tableName], jsonQuery);
            let result = await $db.conn.query(select.SQL, select.parameters);
            let output = {
                pager: {
                    limit: select.limit,
                    offset: select.offset,
                    total: 0
                },
            };
            result.forEach(function (item) {
                output.pager.total = parseInt(item["__pg_total_count"]);
                delete item["__pg_total_count"];
            });
            output.data = output.pager.total > 0 ? result : null;
            $logger.info(`select ${tableName} found ${output.pager.total} rows`);
            return output;
        }
        else {
            throw new Error(`specific table ${tableName} does not exist`);
        }
    }

    //region select
    async function select(tableName,jsonQuery){
        const schema = await getSchema();
        return query(schema,tableName,jsonQuery);
    }
    async function selectById(tableName,id) {
        const schema = await getSchema();
        if (schema[tableName]) {
            //find id column name
            let table = schema[tableName];
            if(table.primary_key.length ==0)
            {
                throw new Error(`specific table ${tableName} does not have primary key`);
            }
            else {
                let jsonQuery = {"$where":{}};
                jsonQuery["$where"][table.primary_key[0]]=id;
                return select(tableName,jsonQuery);
            }
        }

    }
    //endregion

    return {
        $db,
        $pgp,
        select,
        selectById,
        getSchema
    }
};