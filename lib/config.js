'use strict';

import fs from 'fs';
import osenv from 'osenv';
import * as logging from './logging';

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

function parseArgsAsKeys(args) {
    return new Promise(function(resolve) {
        if (!args.length) {
            throw new Error('expected at least one config key-value pair like key=value');
        }
        const newKeys = {};
        args.forEach(function(arg) {
            let [key, value] = arg.split('=');
            if (!key || !value) {
                throw new Error('expected key-value pairs like key=value');
            }
            if (value[0] === '[' && value[value.length - 1] === ']') {
                value = value.slice(1, value.length - 1).split(',');
            }
            newKeys[key] = value;
        });
        return resolve(newKeys);
    });
}

export function updateDefaultConfig(args, options) {
    return Promise.all([
        parseArgsAsKeys(args),
        exports.getDefaultConfig(options)
    ])
    .then(function([newKeys, defaultConfig]) {
        // Merging config with new keys
        const config = Object.assign(defaultConfig, newKeys);
        // Removing keys where value is 'default' or 'auto'
        Object.keys(config).forEach(function(key) {
            if (config[key] === 'default' || config[key] === 'auto') {
                delete config[key];
            }
        });
        return exports.save(config);
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

export function save(config) {
    return new Promise(function(resolve, reject) {
        fs.writeFile(exports.location(), JSON.stringify(config, null, 4), function(error) {
            if (error) {
                return reject(error);
            }
            return resolve(config);
        });
    });
}

export function addPlugins(plugins, options) {
    return exports.getDefaultConfig(options)
    .then(function(defaultConfig) {
    	const installedPlugins = (defaultConfig.installedPlugins || []);
        const newPlugins = plugins.filter(function(plugin) {
            return installedPlugins.indexOf(plugin) === -1;
        });
        defaultConfig.installedPlugins = installedPlugins.concat(newPlugins);
        return exports.save(defaultConfig);
    });
}