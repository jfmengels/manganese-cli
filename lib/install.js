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
    if (!args || !args.length) {
        return Promise.reject(new Error('no plugins were specified'));
    }
    return exports.installCore(args)
    .then(function(plugins) {
        return config.addPlugins(plugins);
    });
}
