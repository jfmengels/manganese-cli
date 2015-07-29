'use strict';

import core from 'manganese';

export function download(args, options={}) {
    if (!args || !args.length) {
        return Promise.reject(new Error('no series was specified'));
    }
    if (!options.plugin) {
        return Promise.reject(new Error('no plugin was specified'));
    }
    const jobs = [];
    while (args.length) {
        var [series, chapters, ...args] = args;
        if (!chapters) {
            return Promise.reject(new Error(`no chapters were specified for "${series}"`));
        }
        jobs.push({
            series,
            chapters,
            plugin: options.plugin
        });
    }

    if (options.name) {
        if (jobs.length !== 1) {
            return Promise.reject(new Error('"name" can not be specified when targetting multiple series'));
        }
        jobs[0].name = options.name;
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
