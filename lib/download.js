'use strict';

import core from 'manganese';
import ranger from 'number-ranger';

import * as logging from './logging';

export function parseArgs(args, options={}) {
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
    const boundProgressCb = exports.printProgress.bind(exports, options);
    return exports.downloadAsync(jobs, options, boundProgressCb);
}

export function printProgress(options, error, type, job) {
    const jobDescription = `${job.name} ${job.chapter}`;
    if (error) {
        const message = `error when downloading ${jobDescription}: ${error.message || error}`;
        return logging.logError(options, {message});
    }
    if (type === 'start' || type === 'end') {
        const message = `${type}ed download of ${jobDescription}`;
        return logging.log(options, {message, level: 'normal'});
    }
}

export function downloadAsync(jobs, options, progressCb=()=>{}) {
    return new Promise(function(resolve, reject) {
        core.downloader.download(jobs, options, function(error, result) {
            if (error) {
                return reject(error);
            }
            return resolve(result);
        }, progressCb);
    });
}
