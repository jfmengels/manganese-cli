'use strict';

import yargs from 'yargs';
import {download} from './download';

function reject(message) {
	const error = new Error(message);
	exports.printError(error);
	return Promise.reject(error);
}

export function printError(error) {
	console.error(`\n  ${error}\n`);
}

export const subCommands = {
	download
};

export function dispatch(argv) {
	const options = yargs(argv).argv;
	const [,, subCommand, ...args] = options._;
	delete options._;
	delete options.$0;
	if (!subCommand) {
		return reject('no manganese command is specified. See \'manganese --help\'');
	}
	const command = subCommands[subCommand];

	if (!command) {
		return reject(`${subCommand} is not a manganese command. See \'manganese --help\'`);
	}

	return command(args, options)
	.catch(function(error) {
		exports.printError(error);
		throw error;
	});
}
