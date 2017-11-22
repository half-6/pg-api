'use strict';
/**
 * Module Name: utility
 * Project Name: LinkFuture.pg-api
 * Created by Cyokin on 4/10/2017
 */

function compareStrings(string1, string2, ignoreCase, useLocale) {
  if (ignoreCase) {
    if (useLocale) {
      string1 = string1.toLocaleLowerCase();
      string2 = string2.toLocaleLowerCase();
    } else {
      string1 = string1.toLowerCase();
      string2 = string2.toLowerCase();
    }
  }
  return string1 === string2;
}

function equalsIgnoreCase(string1, string2) {
  return compareStrings(string1, string2, true);
}

function getFirstKey(obj) {
  return Object.keys(obj)[0];
}

function getFirst(obj) {
  return obj[getFirstKey(obj)];
}

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function errorBack(name, done) {
  return function(err) {
    if (err) $logger.info(name, err);
    done();
  };
}

module.exports = {
  getFirstKey,
  equalsIgnoreCase,
  compareStrings,
  getFirst,
  deepClone,
  errorBack
};
