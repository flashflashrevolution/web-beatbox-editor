/**
 * Defines constants on variable objects
 *
 * @param {String} name
 * @param {Mixed} value
 */

var SWFTags = {};
var SWFActionTags = {};
var SWFTypeTags = {};
var SWFOtherTags = {};

function define(name, value) {
  Object.defineProperty(SWFTags, name, {
    value       : value,
    enumerable  : true
  });
}

function defineAction(name, value) {
  Object.defineProperty(SWFActionTags, name, {
    value       : value,
    enumerable  : true
  });
}
function defineType(name, value) {
  Object.defineProperty(SWFTypeTags, name, {
    value       : value,
    enumerable  : true
  });
}
function defineOther(name, value) {
  Object.defineProperty(SWFOtherTags, name, {
    value       : value,
    enumerable  : true
  });
}

/* SWF Tags Type */
define('END', 0);
define('SHOWFRAME', 1);
define('DOACTION', 12);
define('DEFINESOUND', 14);
define('STREAMHEAD', 18);
define('STREAMBLOCK', 19);
define('STREAMHEAD2', 45);
define('FILEATTRIBUTES', 69);

defineAction('END', 0x00);
defineAction('CONSTANTPOOL', 0x88);
defineAction('PUSH', 0x96);
defineAction('POP', 0x17);
defineAction('DUPLICATE', 0x4C);
defineAction('STORE_REGISTER', 0x87);
defineAction('GET_VARIABLE', 0x1C);
defineAction('SET_VARIABLE', 0x1D);
defineAction('INIT_ARRAY', 0x42);
defineAction('GET_MEMBER', 0x4E);
defineAction('SET_MEMBER', 0x4F);

defineType('STRING_LITERAL', 0);
defineType('FLOAT_LITERAL', 1);
defineType('NULL', 2);
defineType('UNDEFINED', 3);
defineType('REGISTER', 4);
defineType('BOOLEAN', 5);
defineType('DOUBLE', 6);
defineType('INTEGER', 7);
defineType('CONSTANT8', 8);
defineType('CONSTANT16', 9);

defineOther('CODEC_MP3', 2);