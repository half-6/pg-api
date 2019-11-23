'use strict';
/**
 * Module Name:pg-api
 * Project Name: LinkFuture.NodeJS
 * Created by Cyokin on 2/20/2017
 */

module.exports = meta => {
  // eslint-disable-next-line global-require
  const $helper = require('./pg-helper')(meta);

  /**
   * build repositories
   * @returns general repositories for that DB
   */
  async function build() {
    const output = { tables: {}, composites: {}, enums: {} };
    const schema = await $helper.getSchema();
    Object.keys(schema.tables).map(tableName => {
      // noinspection JSUnusedGlobalSymbols
      output.tables[tableName] = {
        select: jsonQuery => {
          return $helper.select(tableName, jsonQuery);
        },
        selectOne: jsonQuery => {
          return $helper.selectOne(tableName, jsonQuery);
        },
        selectById: id => {
          return $helper.selectById(tableName, id);
        },
        delete: jsonQuery => {
          return $helper.delete(tableName, jsonQuery);
        },
        deleteById: id => {
          return $helper.deleteById(tableName, id);
        },
        update: jsonQuery => {
          return $helper.update(tableName, jsonQuery);
        },
        insert: jsonQuery => {
          return $helper.insert(tableName, jsonQuery);
        },
        upsert: (jsonQuery, conflict) => {
          return $helper.upsert(tableName, jsonQuery, conflict);
        },
        custom: jsonQuery => {
          return $helper.custom(tableName, jsonQuery);
        }
      };
    });
    output.composites = schema.composites;
    output.enums = schema.enums;
    return output;
  }
  return {
    build
  };
};
