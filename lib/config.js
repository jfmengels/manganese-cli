'use strict';

import fs from 'fs';
import osenv from 'osenv';
import * as logging from './logging';

function writeFileAsync(path, data) {
    return new Promise(function(resolve, reject) {
        fs.writeFile(path, JSON.stringify(data, null, 4), function(error) {
            if (error) {
                return reject(error);
            }
            return resolve(data);
        });
    });
}

export function parseArgs(args, options) {
    if (options.location) {
        const configLocation = exports.location();
        console.log(configLocation);
        return Promise.resolve(configLocation);
    }
    return exports.updateDefaultConfig(args, options);
}

export function location() {
    return `${osenv.home()}/.manganese-cli/config.json`;
}

export function updateDefaultConfig(args, options) {
    if (!args.length) {
        return Promise.reject(new Error(
            'expected at least one config key-value pair like key=value'));
    }
    const newKeys = {};
    let error;
    args.forEach(function(arg) {
        let [key, value] = arg.split('=');
        if (!key || !value) {
            error = new Error('expected key-value pairs like key=value');
        } else {
            if (value[0] === '[' && value[value.length - 1] === ']') {
                value = value.slice(1, value.length - 1).split(',');
            }
            newKeys[key] = value;
        }
    });
    if (error) {
        return Promise.reject(error);
    }
    return exports.getDefaultConfig(options)
    .then(function(defaultConfig) {
        const data = Object.assign(defaultConfig, newKeys);
        return writeFileAsync(exports.location(), data);
    });
}

export function getDefaultConfig(options) {
    return new Promise(function(resolve) {
        fs.readFile(exports.location(), function(error, result) {
            if (error) {
                if (error.code !== 'ENOENT') { // File not found
                    logging.logError(options, error);
                }
                return resolve({});
            }
            let parsedRes = {};
            try {
                parsedRes = JSON.parse(result);
            }
            catch(parseError) {
                logging.logError(options, {
                    message: 'could not parse config'
                });
                logging.log(options, {
                    level: 'debug',
                    message: result
                });
            }
            return resolve(parsedRes);
        });
    });
}
