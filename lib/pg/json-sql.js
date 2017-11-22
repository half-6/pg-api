/* eslint-disable no-unused-expressions,max-statements,max-params,max-depth,BadExpressionStatementJS,JSUnfilteredForInLoop */
'use strict';
/**
 * Module Name: json-sql
 * Project Name: LinkFuture.pg-api
 * Created by Cyokin on 3/4/2017
 */
const $util = require('util');
const $myUtil = require('./../utility/util');
const $logger = require('./../utility/logger');

const $OR = '$or';
const $WHERE = '$where';
const $SORT = '$sort';
const $LIMIT = '$limit';
const $OFFSET = '$offset';
const $GROUP = '$group';
const $DISTINCT = '$distinct';

const $COMPARE_FUNCTIONS = {
  $gt: '>',
  $gte: '>=',
  $lt: '<',
  $lte: '<=',
  $ne: '!=',
  $eq: '=',
  $like: 'LIKE',
  $ilike: 'ILIKE',
  $similar: 'SIMILAR TO',
  $contain: '@>'
};
const $LOGIC_FUNCTIONS = {
  $any: 'ANY',
  $between: 'BETWEEN',
  $in: 'IN'
};
const $ARITHMETIC_FUNCTIONS = {
  $multiply: '*',
  $divide: '/',
  $plus: '+',
  $minus: '-',
  $module: '%'
};
const $AGGREGATE_FUNCTIONS = {
  $sum: 'sum',
  $count: 'count',
  $min: 'min',
  $max: 'max',
  $avg: 'avg'
};

const $WHERE_FUNCTIONS = Object.assign(
  {},
  $COMPARE_FUNCTIONS,
  $LOGIC_FUNCTIONS
);

//region WHERE
function buildWhereEx(columnList, jsonWhere, where, parameters) {
  for (const name in jsonWhere) {
    const column = columnList[name];
    if (column) {
      const value = jsonWhere[name];
      //it is column
      if ($util.isObject(value) && !$util.isArray(value)) {
        //let fun = $myUtil.getFirstKey(value);
        for (const fun in value) {
          if ($WHERE_FUNCTIONS[fun]) {
            if ($COMPARE_FUNCTIONS[fun]) {
              const parameterName = addParameter(
                parameters,
                column,
                value[fun]
              );
              where.push(
                buildCompare(column, parameterName, $COMPARE_FUNCTIONS[fun])
              );
              continue;
            }
            if ($LOGIC_FUNCTIONS[fun]) {
              where.push(buildLogic(column, parameters, name, fun, value));
              continue;
            }
          }
          $logger.info(`Specific function ${fun} doesn't support`);
        }
      } else {
        //normal case
        // eslint-disable-next-line no-lonely-if
        if (value) {
          const parameterName = addParameter(parameters, column, value);
          where.push(buildCompare(column, parameterName, '='));
        } else {
          where.push(`${name} is null`);
        }
      }
    } else if ($myUtil.equalsIgnoreCase(name, $OR)) {
      const orArray = jsonWhere[name];
      const orOutput = [];
      for (const orIndex in orArray) {
        const orWhere = buildWhere(columnList, orArray[orIndex], parameters);
        orWhere && orOutput.push(`( ${orWhere})`);
      }
      where.push(`( ${orOutput.join(' OR ')})`);
    }
  }
}
function buildWhere(columnList, jsonWhere, parameters) {
  const where = [];
  buildWhereEx(columnList, jsonWhere, where, parameters);
  return where.join(' AND ');
}
function buildCompare(column, parameterName, operator) {
  switch (column.type) {
    case 'chkpass':
      return `${column.column_name} ${operator} ${parameterName}`;
    default:
      return `${column.column_name} ${operator} ${parameterName}::${
        column.type
      }`;
  }
}

function buildLogic(column, parameters, name, fun, value) {
  const operator = $LOGIC_FUNCTIONS[fun];
  switch (operator) {
    case $LOGIC_FUNCTIONS.$in:
    case $LOGIC_FUNCTIONS.$any:
      const parameterName = addParameter(parameters, column, value[fun]);
      return `${column.column_name} = ANY(${parameterName})`;
    case $LOGIC_FUNCTIONS.$between:
      const parameterName1 = addParameter(parameters, column, value[fun][0]);
      const parameterName2 = addParameter(parameters, column, value[fun][1]);
      return `${column.column_name} BETWEEN ${parameterName1}::${
        column.type
      } AND ${parameterName2}::${column.type}`;
  }
  throw new Error(`specific function ${fun} not support yet`);
}
//endregion

//region SELECT
function buildSelect(table, jsonQuery) {
  jsonQuery = jsonQuery || {};
  const sql = [];
  const countSQL = [];
  const parameters = {};
  const limit =
    jsonQuery[$LIMIT] &&
    jsonQuery[$LIMIT] <= table.settings.max_limit &&
    jsonQuery[$LIMIT] > 0
      ? jsonQuery[$LIMIT]
      : table.settings.limit;

  const offset = jsonQuery[$OFFSET] || 0;
  sql.push('SELECT');
  countSQL.push('SELECT');
  countSQL.push('COUNT(1)');
  sql.push(buildQuery(table.columns, jsonQuery) || '*');
  sql.push('FROM');
  countSQL.push('FROM');
  sql.push(`${table.schema}.${table.name}`);
  countSQL.push(`${table.schema}.${table.name}`);
  if (jsonQuery[$WHERE]) {
    const where = buildWhere(table.columns, jsonQuery[$WHERE], parameters);
    where && sql.push(`WHERE ${where}`);
    where && countSQL.push(`WHERE ${where}`);
  }
  if (jsonQuery[$GROUP]) {
    const group = buildGroup(table.columns, jsonQuery[$GROUP]);
    group && sql.push(group);
    group && countSQL.push(group);
  }
  if (jsonQuery[$SORT]) {
    const group = buildSort(table.columns, jsonQuery[$SORT]);
    group && sql.push(group);
  }
  sql.push(`LIMIT ${limit}`);
  sql.push(`OFFSET ${offset}`);
  const selectQuery = sql.join(' ');
  const countQuery = countSQL.join(' ');
  $logger.info(`SELECT TSQL => ${selectQuery}`);
  $logger.info(`COUNT TSQL => ${countQuery}`);
  return {
    SQL: selectQuery,
    countSQL: countQuery,
    parameters,
    limit,
    offset,
    table
  };
}
function buildQuery(columnList, jsonQuery) {
  const output = [];
  //distinct case
  const distinctQuery = jsonQuery[$DISTINCT];
  if (distinctQuery) {
    for (const i in distinctQuery) {
      const name = distinctQuery[i];
      const column = columnList[name];
      if (column) {
        output.push(name);
        continue;
      }
      const fieldName = $myUtil.getFirstKey(name);
      const funQuery = buildFunction(columnList, name[fieldName]);
      if (funQuery) {
        output.push(`${funQuery} AS ${fieldName}`);
      }
    }
    return `DISTINCT ${output.join(',')}`;
  } else {
    let fullQuery = false;
    for (const name in jsonQuery) {
      if (name.startsWith('$')) continue;
      if (name === '*' && jsonQuery[name] === true) {
        output.push(name);
        fullQuery = true;
        continue;
      }
      const column = columnList[name];
      if (column && jsonQuery[name] === true) {
        !fullQuery && output.push(name);
        continue;
      }
      const funQuery = buildFunction(columnList, jsonQuery[name]);
      if (funQuery) {
        output.push(`${funQuery} AS ${name}`);
      }
    }
    return output.join(',');
  }
}
function buildFunction(columnList, funQuery) {
  const fun = $myUtil.getFirstKey(funQuery);
  if ($ARITHMETIC_FUNCTIONS[fun]) {
    const funArray = funQuery[fun];
    const funFields = [];
    funArray.forEach(ele => {
      const funValue = buildFunctionValue(columnList, ele);
      funValue && funFields.push(funValue);
    });
    return funFields.length > 0
      ? `( ${funFields.join(` ${$ARITHMETIC_FUNCTIONS[fun]} `)} )`
      : null;
  }
  if ($AGGREGATE_FUNCTIONS[fun]) {
    const ele = funQuery[fun];
    const funValue = buildFunctionValue(columnList, ele);
    return `${$AGGREGATE_FUNCTIONS[fun]}( ${funValue} )`;
  }
}
function buildFunctionValue(columnList, ele) {
  if ($util.isObject(ele)) {
    return buildFunction(columnList, ele);
  }
  if ($util.isString(ele)) {
    return columnList[ele] && ele;
  }
  if ($util.isNumber(ele)) {
    return ele;
  }
  throw new Error('Does not support this function value');
}
function buildSort(columnList, sortQuery) {
  const output = [];
  for (const columnName in sortQuery) {
    columnList[columnName] &&
      output.push(
        `${columnName} ${sortQuery[columnName] === 'DESC' ? 'DESC' : 'ASC'}`
      );
  }
  if (output.length === 0) return undefined;
  return `ORDER BY ${output.join(',')}`;
}
function buildGroup(columnList, groupQuery) {
  const output = [];
  groupQuery.forEach(columnName => {
    columnList[columnName] && output.push(columnName);
  });
  if (output.length === 0) return undefined;
  return `GROUP BY ${output.join(',')}`;
}

// function validateColumn(columnList, columnName) {
//   const column = columnList[columnName];
//   if (column) return column;
//   throw new Error(`Invalid column ${columnName}`);
// }

function addParameter(parameters, column, value) {
  //composite
  if (value && column.columns && column.isComposite) {
    return buildStructValue(parameters, column, value);
  } else {
    let index = 1;
    let name = column.column_name;
    while (parameters[name]) {
      name += index++;
    }
    parameters[name] = buildValue(column, value);
    return `\$[${name}]`;
  }
}
function buildValue(column, value) {
  if ($util.isNullOrUndefined(value)) {
    return value;
  }
  switch (column.type) {
    case 'bit':
      const bit = value.toString().toLowerCase();
      return bit === 'true' || bit === '1' || bit === 't' ? 1 : 0;
    case 'json':
    case 'jsonb':
      return typeof value === 'object' ? JSON.stringify(value) : value;
  }
  return value;
}
function buildStructValue(parameters, column, json) {
  const output = [];
  for (const name in column.columns) {
    const columnValue = json[name];
    const subColumn = column.columns[name];
    const parameterName = addParameter(parameters, subColumn, columnValue);
    output.push(`${parameterName}::${subColumn.type}`);
  }
  return `(${output.join(',')})`;
}
//endregion

//region DELETE
function buildDelete(table, jsonQuery) {
  jsonQuery = jsonQuery || {};
  const sql = [];
  const parameters = {};
  sql.push('DELETE');
  sql.push('FROM');
  sql.push(`${table.schema}.${table.name}`);
  if (jsonQuery) {
    const where = buildWhere(table.columns, jsonQuery, parameters);
    if (!where || where.length === 0)
      throw new Error('We does not support none condition deletion');
    where && sql.push(`WHERE ${where}`);
  } else {
    throw new Error('We does not support none condition deletion');
  }
  const deleteSQL = sql.join(' ');
  $logger.info(`DELETE TSQL => ${deleteSQL}`);
  return {
    SQL: deleteSQL,
    parameters,
    table
  };
}
//endregion

//region UPDATE
function buildUpdate(table, jsonQuery) {
  jsonQuery = jsonQuery || {};
  const sql = [];
  const set = [];
  const parameters = {};
  sql.push('UPDATE');
  sql.push(`${table.schema}.${table.name}`);
  sql.push('SET');
  for (const name in jsonQuery) {
    const column = table.columns[name];
    if (column) {
      const value = jsonQuery[name];
      const parameterName = addParameter(parameters, column, value);
      set.push(buildCompare(column, parameterName, '='));
    }
  }
  if (set.length === 0) throw new Error('Missing set');
  sql.push(set.join(','));
  if (jsonQuery[$WHERE]) {
    const where = buildWhere(table.columns, jsonQuery[$WHERE], parameters);
    if (!where || where.length === 0)
      throw new Error('We does not support none condition updating');
    where && sql.push(`WHERE ${where}`);
  } else {
    throw new Error('We does not support none condition updating');
  }
  const deleteSQL = sql.join(' ');
  $logger.info(`UPDATE TSQL => ${deleteSQL}`);
  return {
    SQL: deleteSQL,
    parameters,
    table
  };
}
//endregion

//region INSERT
function buildInsert(table, jsonQuery) {
  return buildUpsertSQL(table, jsonQuery);
}
function buildUpsertSQL(table, jsonQuery, conflictKey) {
  if (!$util.isArray(jsonQuery)) jsonQuery = [jsonQuery];
  const sql = [];

  const parameters = {};
  const insertColumns = [];
  sql.push('INSERT INTO');
  sql.push(`${table.schema}.${table.name}`);

  //find all columns need to insert
  jsonQuery.forEach(rows => {
    for (const columnName in rows) {
      const column = table.columns[columnName];
      if (column) {
        if (insertColumns.indexOf(columnName) < 0)
          insertColumns.push(columnName);
      } else {
        throw new Error(`Specific column ${columnName} does not exist`);
      }
    }
  });
  if (insertColumns.length === 0) {
    throw new Error('None of columns are valid');
  }
  sql.push('(');
  sql.push(insertColumns.join(','));
  sql.push(')');
  sql.push('VALUES');
  //build values
  const insertList = [];
  jsonQuery.forEach(item => {
    const valueColumns = [];
    insertColumns.forEach(columnName => {
      if (item[columnName]) {
        const column = table.columns[columnName];
        const parameterName = addParameter(
          parameters,
          column,
          item[columnName]
        );
        valueColumns.push(`${parameterName}::${column.type}`);
      } else {
        valueColumns.push('DEFAULT');
      }
    });
    insertList.push(`(${valueColumns.join(',')})`);
  });
  sql.push(insertList.join(','));
  if (conflictKey) {
    sql.push(`ON CONFLICT ON CONSTRAINT ${conflictKey}`);
    sql.push(`DO UPDATE SET`);
    const updateSql = [];
    insertColumns.forEach(column => {
      updateSql.push(`${column}=EXCLUDED.${column}`);
    });
    sql.push(updateSql.join(','));
  }
  sql.push('RETURNING');
  sql.push(table.primary_key);
  const insertSQL = sql.join(' ');
  $logger.info(`${conflictKey ? 'UPSERT' : 'INSERT'} TSQL => ${insertSQL}`);
  return {
    SQL: insertSQL,
    parameters,
    table
  };
}
function buildUpsert(table, jsonQuery) {
  return buildUpsertSQL(table, jsonQuery.$values, jsonQuery.$conflict);
}
//endregion

function build(action, table, jsonQuery) {
  switch (action.toLowerCase()) {
    case 'select':
      return buildSelect(table, jsonQuery);
    case 'delete':
      return buildDelete(table, jsonQuery);
    case 'insert':
      return buildInsert(table, jsonQuery);
    case 'update':
      return buildUpdate(table, jsonQuery);
    case 'upsert':
      return buildUpsert(table, jsonQuery);
    default:
      throw new Error(`specific ${action} doesn't support`);
  }
}

module.exports = {
  buildInsert,
  buildSelect,
  buildDelete,
  buildUpdate,
  buildUpsert,
  build,
  buildWhere
};
