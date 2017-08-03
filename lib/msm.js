"use strict";
// region - Imports
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
exports.IResponse = http_1.ServerResponse;
const _ = require("lodash");
const url = require("url");
const logger_1 = require("./logger");
const server_1 = require("./server");
const utils_1 = require("./utils");
const requireNew = require('require-uncached');
// endregion
// region - Main exports
class MSM {
    constructor(options) {
        this.apiPrefixes = ['/api/'];
        this.apiDir = 'stubapi';
        this.nonChar = '-';
        this.lowerCase = false;
        this.ping = 0;
        this.preserveQuery = false;
        this.logLevel = 'NONE';
        this.logger = null;
        this.server = null;
        if (options != null) {
            if (!_.isEmpty(options.apiPrefixes)) {
                this.apiPrefixes = options.apiPrefixes;
            }
            if (_.isString(options.apiDir)) {
                this.apiDir = options.apiDir;
            }
            if (_.isString(options.nonChar)) {
                this.nonChar = options.nonChar;
            }
            if (_.isBoolean(options.lowerCase)) {
                this.lowerCase = options.lowerCase;
            }
            if (_.isFinite(options.ping)) {
                this.ping = options.ping;
            }
            if (_.isBoolean(options.preserveQuery)) {
                this.preserveQuery = options.preserveQuery;
            }
            if (_.isString(options.logLevel)) {
                this.logLevel = options.logLevel;
            }
        }
        this.logger = new logger_1.default(this.logLevel);
        this.server = new server_1.default(this);
    }
    middleware(req, res, next) {
        if (_.every(this.apiPrefixes, (prefix) => req.url.indexOf(prefix) !== 0)) {
            next();
            return;
        }
        this.server.logCall(req.method.toLocaleLowerCase(), url.parse(req.url, true), req.body != null ? req.body : void 0);
        const modulePath = utils_1.composeModulePath(req, this);
        const handler = utils_1.loadModule(modulePath, this.server.overrides, this.logger);
        setTimeout(() => {
            handler(req, res, next);
        }, this.ping);
    }
}
exports.default = MSM;
// endregion
//# sourceMappingURL=msm.js.map