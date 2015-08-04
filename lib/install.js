'use strict';

import core from 'manganese';

import * as config from './config';

export function installCore(plugins) {
    return new Promise(function(resolve, reject) {
        core.installer.install(plugins, function(error) {
            if (error) {
                return reject(error);
            }
            return resolve(plugins);
        });
    });
}

export function parseArgs(args) {
    return exports.installCore(args);
}
