'use strict';

import fs from 'fs';
import osenv from 'osenv';
import * as logging from './logging';

export function getDefaultConfig(options) {
	return new Promise(function(resolve) {
		fs.readFile(`${osenv.home()}/.manganese/config.json`, function(error, result) {
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

getDefaultConfig();