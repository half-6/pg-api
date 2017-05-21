/**
 * Module Name:
 * Project Name: LinkFuture.NodeJS
 * Created by Cyokin on 3/4/2017
 */

const $pgp = require('pg-promise')();
const $logger = require('./../utility/logger');
const $fs = require('fs');
const $path = require('path');
const $allColumns = $fs.readFileSync($path.join(__dirname, '../sql/find-table-views-columns.sql')).toString();
const $allCompositeColumns = $fs.readFileSync($path.join(__dirname, '../sql/find-composite-columns.sql')).toString();
const $allEnumColumns = $fs.readFileSync($path.join(__dirname, '../sql/find-enum-columns.sql')).toString();
const $json2Sql = require('./json-sql');
let $connectionCache = {};
module.exports = function (meta) {
    let $db;
    if(!$connectionCache[meta.connection])
    {
        $db = $connectionCache[meta.connection] = {conn:$pgp(meta.connection),schema:{tables:null,composites:null,enums:null}};
    }
    $db = $connectionCache[meta.connection];
    let tableAction = {
        "select":"select",
        "delete":"delete"
        ,"insert":"insert"
        ,"update":"update"
    };
    let columnAction={
        "select":"select",
        "where":"where"
        ,"insert":"insert"
        ,"update":"update"
    }

    //region get schema
    async function getSchema() {
        if($db.schema.tables) {
            return $db.schema;
        }
        else
        {
            //composite
            //TODO:nest composite doesn't support
            let compositeColumns = await $db.conn.query($allCompositeColumns);
            let compositeList = {};
            for(let columnIndex in compositeColumns)
            {
                let column = compositeColumns[columnIndex];
                if(!compositeList[column.udt_name]){
                    compositeList[column.udt_name] = {
                        columns:{},
                        schema:column.udt_schema,
                        name:column.udt_name
                    };
                    $logger.info(`read composite ${column.udt_name} schema success`);
                }
                let composite = compositeList[column.udt_name];
                composite.columns[column.column_name] = column;
            }
            $logger.info(`read ${Object.keys(compositeList).length} composite type schema success`);
            $db.schema.composites = compositeList;

            //enum
            let enumColumns = await $db.conn.query($allEnumColumns);
            let enumList = {};
            for(let columnIndex in enumColumns)
            {
                let column = enumColumns[columnIndex];
                if(!enumList[column.enum_type]){
                    enumList[column.enum_type] = {
                        columns:[],
                        schema:null,
                        name:column.enum_type
                    };
                    $logger.info(`read composite ${column.udt_name} schema success`);
                }
                let enum_item = enumList[column.enum_type];
                enum_item.columns.push(column.enum_label)
            }
            $logger.info(`read ${Object.keys(enumList).length} enum type schema success`);
            $db.schema.enums = enumList;

            //table and view schema
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
                table.columns[column.column_name] = column;
                if(column.data_type =="USER-DEFINED" && $db.schema.composites[column.type])
                {
                    column.isComposite = true;
                    column.columns = $db.schema.composites[column.type].columns;
                }
                column.is_primary_key && table.primary_key.push(column.column_name);
            }
            $logger.info(`read ${Object.keys(output).length} table schema success`);
            $db.schema.tables = output;

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
        if (schema.tables[tableName]) {
            return schema.tables[tableName];
        }
        throw new Error(`specific table ${tableName} does not exist`);
    }
    function checkTableAccess(tableName,action) {
        if(meta.tables && meta.tables[tableName])
        {
            let actions = meta.tables[tableName];
            if(actions[action]==false)
            {
                throw new Error(`access denied for table ${tableName}`);
            }
        }
        return true;
    }
    function checkColumnAccess(tableName,columnName,columnAction) {
        if(meta.tables && meta.tables[tableName])
        {
            let actions = meta.tables[tableName];
            if(actions["columns"] && actions["columns"][columnName] && actions["columns"][columnName][columnAction]==false)
            {
                throw new Error(`access denied for column ${tableName}.${columnName}`);
            }
        }
        return true;
    }
    //endregion

    //region select
    async function select(tableName,jsonQuery){
        const builder = await verifyAndBuild(tableAction.select,tableName,jsonQuery);
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
        output.data = result && result.length > 0 ? result : null;
        $logger.info(`select ${tableName} found ${output.pager.total} rows`);
        after({action:"select",builder,jsonQuery},output);
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
        const builder = await verifyAndBuild(tableAction.delete,tableName,jsonQuery);
        let result = await $db.conn.result(builder.SQL, builder.parameters);
        $logger.info(`delete ${result.rowCount} rows from ${tableName}`);
        after({action:"delete",builder,jsonQuery},result);
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
        const builder = await verifyAndBuild(tableAction.update,tableName,jsonQuery);
        let result = await $db.conn.result(builder.SQL, builder.parameters);
        $logger.info(`Updated ${result.rowCount} rows from ${tableName}`);
        after({action:"update",builder,jsonQuery},result);
        return result.rowCount;
    }
    //endregion

    //region insert
    async function insert(tableName,jsonQuery){
        const builder = await verifyAndBuild(tableAction.insert,tableName,jsonQuery);
        let result = await $db.conn.query(builder.SQL, builder.parameters);
        $logger.info(`Insert ${result.length} rows from ${tableName}`);
        after({action:"insert",builder,jsonQuery},result);
        return result;
    }
    //endregion

    async function verifyAndBuild(action,tableName,jsonQuery) {
        const table = await getTable(tableName);
        checkTableAccess(tableName,action);
        const builder = $json2Sql.build(action,table, jsonQuery);
        before({action:action,table,builder,jsonQuery});
        return builder;
    }

    //region events
    function before(action) {
        if(meta.events && meta.events.before)
        {
            meta.events.before(action);
        }
    }
    function after(action,result) {
        if(meta.events && meta.events.after)
        {
            meta.events.after(action,result);
        }
    }
    //endregion

    async function custom(tableName,jsonQuery){
        let customAction = meta.custom[tableName];
        let builder = {
            SQL:customAction["query"],
            parameters:jsonQuery,
            table:{
                tableName:tableName
            }
        };
        const variableEX = /\${([\w]+)}/g;
        let result = await $db.conn.tx(t=>{
            let list = [];
            builder.SQL.forEach(q=>{
                //append null value to missed param
                //TODO:Default may better than null value?
                let matches;
                while ((matches = variableEX.exec(q)) != null) {
                    let param = matches[1];
                    if(!jsonQuery[param])
                    {
                        $logger.info(`found missed parameter ${param},assigned null`);
                        jsonQuery[param] = null;
                    }
                }
                if(q.trim().toLowerCase().match("(select|insert).*"))
                {
                    list.push(t.query(q,jsonQuery))
                }
                else
                {
                    list.push(t.result(q,jsonQuery))
                }
            });
            return t.batch(list);
        });
        let output = {};
        output.data = result && result.length > 0 ? result : null;
        $logger.info(`custom action ${tableName} found ${result.length} rows`);
        after({action:"custom",builder,jsonQuery},output);
        return output;
    }

    return {
        $db,
        $pgp,
        select,
        selectById,
        delete:del,
        deleteById,
        update,
        insert,
        custom,
        getSchema
    }
};