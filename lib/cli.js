'use strict';

import yargs from 'yargs';
import {download} from './download';

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

	const command = subCommands[subCommand];

	if (!command) {
		const error = new Error(`${subCommand} is not a manganese command. See \'manganese --help\'`);
		exports.printError(error);
		return Promise.reject(error);
	}

	return command(args, options)
	.catch(function(error) {
		exports.printError(error);
		throw error;
	});
}
