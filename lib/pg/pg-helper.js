/* eslint-disable max-statements,no-unused-expressions */
'use strict';
/**
 * Module Name: pg-helper
 * Project Name: LinkFuture.pg-api
 * Created by Cyokin on 3/4/2017
 */

const $pgp = require('pg-promise')();
const $logger = require('./../utility/logger');
const $fs = require('fs');
const $path = require('path');
const $allColumns = $fs
  .readFileSync($path.join(__dirname, '../sql/find-table-views-columns.sql'))
  .toString();
const $allCompositeColumns = $fs
  .readFileSync($path.join(__dirname, '../sql/find-composite-columns.sql'))
  .toString();
const $allEnumColumns = $fs
  .readFileSync($path.join(__dirname, '../sql/find-enum-columns.sql'))
  .toString();
const $json2Sql = require('./json-sql');
const $connectionCache = {};
module.exports = function(meta) {
  let $db;
  if (!$connectionCache[meta.connection]) {
    $db = $connectionCache[meta.connection] = {
      conn: $pgp(meta.connection),
      connectionString: meta.connection,
      schema: {
        tables: null,
        composites: null,
        enums: null
      }
    };
  }
  $db = $connectionCache[meta.connection];
  const tableAction = {
    select: 'select',
    delete: 'delete',
    insert: 'insert',
    update: 'update',
    upsert: 'upsert'
  };
  // eslint-disable-next-line no-unused-vars
  const columnAction = {
    select: 'select',
    where: 'where',
    insert: 'insert',
    update: 'update'
  };

  //region get schema
  async function getSchema() {
    if ($db.schema.tables) {
      return $db.schema;
    } else {
      //composite
      //TODO:nest composite doesn't support
      $logger.info(`reading DB schema from connection ${$db.connectionString}`);
      const compositeColumns = await $db.conn.query($allCompositeColumns);
      const compositeList = {};
      for (const columnIndex in compositeColumns) {
        const column = compositeColumns[columnIndex];
        if (!compositeList[column.udt_name]) {
          compositeList[column.udt_name] = {
            columns: {},
            schema: column.udt_schema,
            name: column.udt_name
          };
          $logger.info(`read composite ${column.udt_name} schema success`);
        }
        const composite = compositeList[column.udt_name];
        composite.columns[column.column_name] = column;
      }
      $logger.info(
        `read ${
          Object.keys(compositeList).length
        } composite type schema success`
      );
      $db.schema.composites = compositeList;

      //enum
      const enumColumns = await $db.conn.query($allEnumColumns);
      const enumList = {};
      for (const columnIndex in enumColumns) {
        const column = enumColumns[columnIndex];
        if (!enumList[column.enum_type]) {
          enumList[column.enum_type] = {
            columns: [],
            schema: null,
            name: column.enum_type
          };
          $logger.info(`read enum ${column.enum_type} schema success`);
        }
        const enum_item = enumList[column.enum_type];
        enum_item.columns.push(column.enum_label);
      }
      $logger.info(
        `read ${Object.keys(enumList).length} enum type schema success`
      );
      $db.schema.enums = enumList;

      //table and view schema
      const columns = await $db.conn.query($allColumns);
      const output = {};
      for (const columnIndex in columns) {
        const column = columns[columnIndex];
        if (!output[column.table_name]) {
          output[column.table_name] = {
            columns: {},
            schema: column.table_schema,
            name: column.table_name,
            primary_key: []
          };
          $logger.info(
            `read ${column.table_type} ${column.table_name} schema success`
          );
        }
        const table = output[column.table_name];
        table.columns[column.column_name] = column;
        if (
          column.data_type === 'USER-DEFINED' &&
          $db.schema.composites[column.type]
        ) {
          column.isComposite = true;
          column.columns = $db.schema.composites[column.type].columns;
        }
        column.is_primary_key && table.primary_key.push(column.column_name);
      }
      $logger.info(`read ${Object.keys(output).length} table schema success`);
      for (const i in output) {
        const defaultSetting = { max_limit: 1000, limit: 10 };
        const tableName = output[i].name;
        if (meta.tables && meta.tables[tableName]) {
          output[i].settings = meta.tables[tableName];
        } else {
          output[i].settings = {};
        }
        output[i].settings = Object.assign(
          {},
          defaultSetting,
          output[i].settings
        );
      }
      $logger.info(`inject table settings success`);
      $db.schema.tables = output;
      return $db.schema;
    }
  }
  function getPrimaryKey(table) {
    if (table.primary_key.length === 0) {
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
  function checkTableAccess(tableName, action) {
    if (meta.tables && meta.tables[tableName]) {
      const actions = meta.tables[tableName];
      if (actions[action] === false) {
        throw new Error(`access denied for table ${tableName}`);
      }
    }
    return true;
  }
  // eslint-disable-next-line no-unused-vars
  function checkColumnAccess(tableName, columnName, action) {
    if (meta.tables && meta.tables[tableName]) {
      const actions = meta.tables[tableName];
      if (
        actions.columns &&
        actions.columns[columnName] &&
        actions.columns[columnName][action] === false
      ) {
        throw new Error(`access denied for column ${tableName}.${columnName}`);
      }
    }
    return true;
  }
  //endregion

  //region select
  async function select(tableName, jsonQuery) {
    const builder = await verifyAndBuild(
      tableAction.select,
      tableName,
      jsonQuery
    );
    const result = await $db.conn.tx(t => {
      return t.batch([
        t.query(builder.SQL, builder.parameters),
        t.one(builder.countSQL, builder.parameters)
      ]);
    });
    const output = {
      pager: {
        limit: builder.limit,
        offset: builder.offset,
        total: Number(result[1].count)
      }
    };
    output.data = result[0] && result[0].length > 0 ? result[0] : null;
    $logger.info(`select ${tableName} found ${output.pager.total} rows`);
    onComplete(
      { action: tableAction.select, tableName, builder, jsonQuery },
      output
    );
    return output;
  }
  async function selectById(tableName, id) {
    const table = await getTable(tableName);
    const primaryKey = getPrimaryKey(table);
    const jsonQuery = { $where: {} };
    jsonQuery.$where[primaryKey] = id;
    return select(tableName, jsonQuery);
  }
  async function selectOne(tableName, jsonQuery) {
    const result = await select(tableName, jsonQuery);
    return result && result.data && result.data.length > 0
      ? result.data[0]
      : null;
  }
  //endregion

  //region delete
  async function del(tableName, jsonQuery) {
    const builder = await verifyAndBuild(
      tableAction.delete,
      tableName,
      jsonQuery
    );
    const result = await $db.conn.result(builder.SQL, builder.parameters);
    $logger.info(`delete ${result.rowCount} rows from ${tableName}`);
    onComplete({ action: tableAction.delete, builder, jsonQuery }, result);
    return result.rowCount;
  }
  async function deleteById(tableName, id) {
    const table = await getTable(tableName);
    const primaryKey = getPrimaryKey(table);
    const jsonQuery = {};
    jsonQuery[primaryKey] = id;
    return del(tableName, jsonQuery);
  }
  //endregion

  //region update
  async function update(tableName, jsonQuery) {
    const builder = await verifyAndBuild(
      tableAction.update,
      tableName,
      jsonQuery
    );
    const result = await $db.conn.result(builder.SQL, builder.parameters);
    $logger.info(`Updated ${result.rowCount} rows from ${tableName}`);
    onComplete({ action: tableAction.update, builder, jsonQuery }, result);
    return result.rowCount;
  }
  //endregion

  //region insert
  async function insert(tableName, jsonQuery) {
    const builder = await verifyAndBuild(
      tableAction.insert,
      tableName,
      jsonQuery
    );
    const result = await $db.conn.query(builder.SQL, builder.parameters);
    $logger.info(`Insert ${result.length} rows from ${tableName}`);
    onComplete(
      { action: tableAction.insert, tableName, builder, jsonQuery },
      result
    );
    return result;
  }
  async function upsert(tableName, jsonQuery, conflict) {
    jsonQuery = { $values: jsonQuery, $conflict: conflict };
    const builder = await verifyAndBuild(
      tableAction.upsert,
      tableName,
      jsonQuery
    );
    const result = await $db.conn.query(builder.SQL, builder.parameters);
    $logger.info(`Upsert ${result.length} rows from ${tableName}`);
    onComplete(
      { action: tableAction.insert, tableName, builder, jsonQuery },
      result
    );
    return result;
  }
  //endregion

  async function verifyAndBuild(action, tableName, jsonQuery) {
    onRequest({ action, tableName, jsonQuery });
    const table = await getTable(tableName);
    checkTableAccess(tableName, action);
    onBuild({ action, tableName, table, jsonQuery });
    const builder = $json2Sql.build(action, table, jsonQuery);
    onQuery({ action, tableName, table, builder, jsonQuery });
    return builder;
  }

  //region events
  function onEvent(eventName, myArguments) {
    if (meta.events && meta.events[eventName]) {
      meta.events[eventName].apply(undefined, myArguments);
    }
  }
  function onRequest(action) {
    onEvent('onRequest', [action]);
    onEvent(`on_${action.tableName}_request`, [action]);
    onEvent(`on_${action.action}_${action.tableName}_request`, [action]);
  }
  function onBuild(action) {
    onEvent('onBuild', [action]);
    onEvent(`on_${action.tableName}_build`, [action]);
    onEvent(`on_${action.action}_${action.tableName}_build`, [action]);
  }
  function onQuery(action) {
    onEvent('onQuery', [action]);
    onEvent(`on_${action.tableName}_query`, [action]);
    onEvent(`on_${action.action}_${action.tableName}_query`, [action]);
  }
  function onComplete(action, result) {
    onEvent('onComplete', [action, result]);
    onEvent(`on_${action.tableName}_complete`, [action, result]);
    onEvent(`on_${action.action}_${action.tableName}_complete`, [
      action,
      result
    ]);
  }
  //endregion

  async function custom(tableName, jsonQuery) {
    const customAction = meta.custom[tableName];
    const builder = {
      SQL: customAction.query,
      parameters: jsonQuery,
      table: {
        tableName
      }
    };
    const variableEX = /\${([\w]+)}/g;
    const result = await $db.conn.tx(t => {
      const list = [];
      builder.SQL.forEach(q => {
        //append null value to missed param
        //TODO:Default may better than null value?
        let matches;
        while ((matches = variableEX.exec(q)) !== null) {
          const param = matches[1];
          if (!jsonQuery[param]) {
            $logger.info(`found missed parameter ${param},assigned null`);
            jsonQuery[param] = null;
          }
        }
        if (
          q
            .trim()
            .toLowerCase()
            .match('(select|insert).*')
        ) {
          list.push(t.query(q, jsonQuery));
        } else {
          list.push(t.result(q, jsonQuery));
        }
      });
      return t.batch(list);
    });
    const output = {};
    output.data = result && result.length > 0 ? result : null;
    $logger.info(`custom action ${tableName} found ${result.length} rows`);
    onComplete({ action: 'custom', builder, jsonQuery }, output);
    return output;
  }
  /*
        filter out useless property in the object which not belong to the table
     */
  async function columnFilter(tableName, rowObj) {
    const table = await getTable(tableName);
    const output = {};
    for (const columnName in rowObj) {
      const column = table.columns[columnName];
      if (column) {
        output[columnName] = rowObj[columnName];
      }
    }
    return output;
  }

  return {
    $db,
    $pgp,
    select,
    selectById,
    selectOne,
    delete: del,
    deleteById,
    update,
    insert,
    upsert,
    custom,
    getSchema,
    columnFilter
  };
};
