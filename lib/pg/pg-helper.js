/**
 * Module Name:
 * Project Name: LinkFuture.NodeJS
 * Created by Cyokin on 3/4/2017
 */

const $pgp = require('pg-promise')();
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
    function getPrimaryKey(table) {
        if(table.primary_key.length ==0)
        {
            throw new Error(`specific table ${table.name} does not have primary key`);
        }
        return table.primary_key[0];
    }
    async function getTable(tableName) {
        const schema = await getSchema();
        if (schema[tableName]) {
            return schema[tableName];
        }
        throw new Error(`specific table ${tableName} does not exist`);
    }
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
    //endregion

    //region select
    async function select(tableName,jsonQuery){
        const table = await getTable(tableName);
        const builder = $json2Sql.buildSelect(table, jsonQuery);
        let result = await $db.conn.query(builder.SQL, builder.parameters);
        let output = {
            pager: {
                limit: builder.limit,
                offset: builder.offset,
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
    async function selectById(tableName,id) {
        const table = await getTable(tableName);
        const primaryKey = getPrimaryKey(table);
        let jsonQuery = {"$where":{}};
        jsonQuery["$where"][primaryKey]=id;
        return select(tableName,jsonQuery);
    }
    //endregion

    //region delete
    async function del(tableName,jsonQuery){
        const table = await getTable(tableName);
        const builder = $json2Sql.buildDelete(table, jsonQuery);
        let result = await $db.conn.result(builder.SQL, builder.parameters);
        $logger.info(`Deleted ${result.rowCount} rows from ${tableName}`);
        return result.rowCount;
    }
    async function deleteById(tableName,id){
        const table = await getTable(tableName);
        const primaryKey = getPrimaryKey(table);
        let jsonQuery = {};
        jsonQuery[primaryKey]=id;
        return del(tableName,jsonQuery);
    }
    //endregion

    //region update
    async function update(tableName,jsonQuery){
        const table = await getTable(tableName);
        const builder = $json2Sql.buildUpdate(table, jsonQuery);
        let result = await $db.conn.result(builder.SQL, builder.parameters);
        $logger.info(`Updated ${result.rowCount} rows from ${tableName}`);
        return result.rowCount;
    }
    //endregion

    //region insert
    async function insert(tableName,jsonQuery){
        const table = await getTable(tableName);
        const builder = $json2Sql.buildInsert(table, jsonQuery);
        let result = await $db.conn.query(builder.SQL, builder.parameters);
        $logger.info(`Insert ${result.length} rows from ${tableName}`);
        return result;
    }
    //endregion

    return {
        $db,
        $pgp,
        select,
        selectById,
        delete:del,
        deleteById,
        update,
        insert,
        getSchema
    }
};