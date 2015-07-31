'use strict';

export const verboseLevels = {
    none: 1,
    mute: 1,
    error: 2,
    normal: 3,
    debug: 4,
    all: 5
};

function getLevel(level) {
	if (typeof level === 'number') {
		return level;
	}
	return verboseLevels[level];
}

export function log(options, {message, level}) {
	if (getLevel(options.verbose || 'normal') >= getLevel(level)) {
		console.log(message);
	}
}

export function logError(options, {message}) {
	if (getLevel(options.verbose || 'normal') >= verboseLevels.error) {
		console.error(message);
	}
}
