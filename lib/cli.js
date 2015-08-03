'use strict';

import path from 'path';

import osenv from 'osenv';
import yargs from 'yargs';

import * as download from './download';
import * as install from './install';
import * as config from './config';

export function printError(error) {
    console.error(`\n  ${error}\n`);
}

export const subCommands = {
    download,
    install,
    config
};

function processArgs(argv) {
    return config.getDefaultConfig({})
    .then(function(defaultConfig) {
        return yargs(argv)
            .string('_')
            .boolean('location')
            .alias('p', 'plugin')
            .alias('n', 'name')
            .default('destFolder', path.resolve(osenv.home(), 'manga'))
            .default(defaultConfig)
            .argv;
    });
}

export function dispatch(argv) {
    return processArgs(argv)
    .then(function(options) {
        const [,, subCommand, ...args] = options._;
        delete options._;
        delete options.$0;

        if (!subCommand) {
            throw new Error('no manganese command is specified. See \'manganese --help\'');
        }
        const command = subCommands[subCommand];

        if (!command) {
            throw new Error(`${subCommand} is not a manganese command. See \'manganese --help\'`);
        }
        return command.parseArgs(args, options);
    })
    .catch(function(error) {
        exports.printError(error);
        throw error;
    });
}
