'use strict';

import core from 'manganese';

export function parseArgs(args) {
	return new Promise(function(resolve, reject) {
		core.installer.install(args, function(error, result) {
			if (error) {
				return reject(error);
			}
			return resolve(result);
		});
	});
}
