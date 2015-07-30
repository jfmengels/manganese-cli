'use strict';

import core from 'manganese';
import ranger from 'number-ranger';

export function download(args, options={}) {
    if (!args || !args.length) {
        return Promise.reject(new Error('no series was specified'));
    }
    if (!options.plugin) {
        return Promise.reject(new Error('no plugin was specified'));
    }
    const jobs = [];
    var series, chapters;
    while (args.length) {
        [series, chapters, ...args] = args;
        if (!chapters) {
            return Promise.reject(new Error(`no chapters were specified for "${series}"`));
        }
        jobs.push({
            series,
            chapters: ranger.parse(chapters),
            plugin: options.plugin
        });
    }

    if (options.name) {
        if (jobs.length !== 1) {
            return Promise.reject(new Error('"name" can not be specified when targetting multiple series'));
        }
        jobs[0].name = options.name;
    }
    return exports.downloadAsync(jobs, options, console.log.bind(console));
}

export function downloadAsync(jobs, options, progressCb) {
    return new Promise(function(resolve, reject) {
        core.downloader.download(jobs, options, function(error, result) {
            if (error) {
                return reject(error);
            }
            return resolve(result);
        }, progressCb);
    });
}
