'use strict';

import core from 'manganese';

export function download(args, options) {
    if (!args || !args.length) {
        return Promise.reject(new Error('no series was specified'));
    }

    const jobs = [];
    while (args.length) {
        var [series, chapters, ...args] = args;
        jobs.push({series, chapters});
    }

    return exports.downloadAsync(jobs, options);
}

export function downloadAsync(jobs, options, progressCb) {
    return new Promise(function(resolve, reject) {
        core.downloader.download(jobs, options, function(error, result) {
            error ? reject(error) : resolve(result);
        }, progressCb);
    });
}
