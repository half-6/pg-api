/* eslint-disable global-require */
'use strict';
/**
 * Module Name:pg-api
 * Project Name: LinkFuture.NodeJS
 * Created by Cyokin on 2/20/2017
 */

const $express = require('express');
const $router = new $express.Router();
const $logger = require('./../utility/logger');
module.exports = meta => {
  let $pgHelper;
  init();
  //region wrapper output message
  function buildSuccess(res) {
    return body => {
      const response = typeof body === 'string' ? JSON.parse(body) : body;
      const output = {
        meta: {
          status: res.statusCode,
          timestamp: new Date()
            .toISOString()
            .split('T')
            .join(' '),
          message: 'success'
        },
        response
      };
      res.json(output);
    };
  }
  function nextHandler(err, req, res, next) {
    if (err) {
      $logger.info(err);
      res.status(400);
      res.err = err;
      const output = {
        meta: {
          status: res.statusCode,
          timestamp: new Date()
            .toISOString()
            .split('T')
            .join(' '),
          message: res.err.message
        },
        response: null
      };
      res.json(output);
    }
  }
  //endregion

  //region build Query
  function parseQuery(query) {
    if (query.$q) {
      return JSON.parse(query.$q);
    } else {
      const jsonQuery = { $where: {} };
      for (const key in query) {
        const queryValue = queryValueParse(query[key]);
        if (key.startsWith('$')) {
          jsonQuery[key] = queryValue;
        } else {
          jsonQuery.$where[key] = queryValue;
        }
      }
      return jsonQuery;
    }
  }
  function parseQueryNoWhere(query) {
    if (query.$q) {
      return JSON.parse(query.$q);
    } else {
      const jsonQuery = {};
      for (const key in query) {
        const queryValue = queryValueParse(query[key]);
        jsonQuery[key] = queryValue;
      }
      return jsonQuery;
    }
  }
  function queryValueParse(input) {
    try {
      return JSON.parse(input);
    } catch (e) {
      return input;
    }
  }
  function hasCompositeAccess(compositeName) {
    return !(
      meta &&
      meta.composites &&
      meta.composites[compositeName] === false
    );
  }
  function hasEnumAccess(enumName) {
    return !(meta && meta.enums && meta.enums[enumName] === false);
  }
  function build() {
    $router.get(
      '/composite/:compositeName',
      (req, res, next) => {
        $pgHelper
          .getSchema()
          .then(result => {
            const composites = result.composites;
            if (
              composites[req.params.compositeName] &&
              hasCompositeAccess(req.params.compositeName)
            ) {
              buildSuccess(res)(composites[req.params.compositeName]);
            } else {
              throw new Error(
                `Specific composite ${req.params.compositeName} not found`
              );
            }
          })
          .catch(next);
      },
      nextHandler
    );
    $router.get(
      '/enum/:enumName',
      (req, res, next) => {
        $pgHelper
          .getSchema()
          .then(result => {
            const enums = result.enums;
            if (
              enums[req.params.enumName] &&
              hasEnumAccess(req.params.enumName)
            ) {
              buildSuccess(res)(enums[req.params.enumName]);
            } else {
              throw new Error(`Specific enum ${req.params.enumName} not found`);
            }
          })
          .catch(next);
      },
      nextHandler
    );
    $router.all(
      '/func/:funcName',
      (req, res, next) => {
        $pgHelper
          .func(
            req.params.funcName,
            req.query.$params ||
              (Object.keys(req.query).length > 0 ? req.query : req.body)
          )
          .then(buildSuccess(res))
          .catch(next);
      },
      nextHandler
    );
    $router.all(
      '/:table',
      (req, res, next) => {
        let action;
        //custom query
        if (meta.custom && meta.custom[req.params.table]) {
          const customAction = meta.custom[req.params.table];
          if (
            customAction.method
              .map(c => {
                return c.toLowerCase();
              })
              .indexOf(req.method.toLowerCase()) < 0
          ) {
            throw new Error('Specific HTTP Method does not support yet');
          }
          const jsonObj =
            Object.keys(req.query).length > 0 ? req.query : req.body;
          action = $pgHelper.custom(
            req.params.table,
            parseQueryNoWhere(jsonObj)
          );
        } else {
          switch (req.method) {
            case 'GET':
              action = $pgHelper.select(
                req.params.table,
                parseQuery(req.query)
              );
              break;
            case 'DELETE':
              action = $pgHelper.delete(
                req.params.table,
                parseQueryNoWhere(req.query)
              );
              break;
            case 'PATCH':
              if (!req.body) throw new Error('Invalid json query');
              action = $pgHelper.update(req.params.table, req.body);
              break;
            case 'POST':
              if (!req.body) throw new Error('Invalid json query');
              action = $pgHelper.insert(req.params.table, req.body);
              break;
            default:
              throw new Error('Specific HTTP Method does not support yet');
          }
        }
        action.then(buildSuccess(res)).catch(next);
      },
      nextHandler
    );
    $router.all(
      '/:table/:id',
      (req, res, next) => {
        let action;
        switch (req.method) {
          case 'GET':
            action = $pgHelper.selectById(req.params.table, req.params.id);
            break;
          case 'DELETE':
            action = $pgHelper.deleteById(req.params.table, req.params.id);
            break;
          case 'PUT':
            if (!req.body) throw new Error('Invalid json query');
            action = $pgHelper.upsert(
              req.params.table,
              req.body,
              req.params.id
            );
            break;
          default:
            throw new Error('Specific HTTP Method not support yet');
        }
        action.then(buildSuccess(res)).catch(next);
      },
      nextHandler
    );
  }
  //endregion

  function init() {
    $pgHelper = require('./pg-helper')(meta);
    build();
  }

  return $router;
};
