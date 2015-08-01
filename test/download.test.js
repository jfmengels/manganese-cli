'use strict';

/*eslint no-unused-expressions:0*/
// --> allows expressions like: "expect(...).to.exist;"

import sinon from 'sinon';
import {expect} from 'chai';
import ranger from 'number-ranger';
import core from 'manganese';

import * as download from '../lib/download';

import {mockArgs} from './utils';
import * as logging from '../lib/logging';

describe('download', function() {
    describe('parseArgs', function() {
        let callCoreStub, rangerParseStub, printProgressStub;
        let options;

        beforeEach(function() {
            callCoreStub = sinon.stub(download, 'callCore').resolves();
            rangerParseStub = sinon.stub(ranger, 'parse');
            rangerParseStub.withArgs('120').returns([{
                start: 120
            }]);
            rangerParseStub.withArgs('100:140').returns([{
                start: 100,
                end: 140
            }]);
            printProgressStub = sinon.stub(download, 'printProgress');
            options = {
                plugin: 'some-plugin'
            };
        });

        afterEach(function() {
            download.callCore.restore();
            download.printProgress.restore();
            ranger.parse.restore();
        });

        it('should reject when args is empty', function(done) {
            const args = [];
            download.parseArgs(args, options)
            .catch(function(error) {
                expect(error.message).to.equal('no series was specified');
                expect(callCoreStub.callCount).to.equal(0);
                done();
            })
            .catch(done);
        });

        it('should reject when options.plugin is not defined', function(done) {
            const args = mockArgs('series1 120');
            download.parseArgs(args, {})
            .catch(function(error) {
                expect(error.message).to.equal('no plugin was specified');
                expect(callCoreStub.callCount).to.equal(0);
                done();
            })
            .catch(done);
        });

        it('should reject but not crash when options is not defined', function(done) {
            const args = mockArgs('series1 120');
            download.parseArgs(args)
            .catch(function(error) {
                expect(error.message).to.equal('no plugin was specified');
                expect(callCoreStub.callCount).to.equal(0);
                done();
            })
            .catch(done);
        });

        it('should reject when callCore fails', function(done) {
            const args = mockArgs('series1 120');
            const expectedError = new Error('some error with callCore');
            download.callCore.restore();
            callCoreStub = sinon.stub(download, 'callCore').rejects(expectedError);

            download.parseArgs(args, options)
            .catch(function(error) {
                expect(callCoreStub.callCount).to.equal(1);
                expect(error.message).to.deep.equal(expectedError.message);
                done();
            })
            .catch(done);
        });

        it('should call callCore with a job and parsed chapter range', function(done) {
            const args = mockArgs('series1 120 series2 100:140');
            download.parseArgs(args, options)
            .then(function() {
                expect(callCoreStub.callCount).to.equal(1);
                const calledArgs = callCoreStub.getCall(0).args;
                expect(calledArgs[0]).to.deep.equal([{
                    plugin: 'some-plugin',
                    series: 'series1',
                    chapters: [{
                        start: 120
                    }]
                }, {
                    plugin: 'some-plugin',
                    series: 'series2',
                    chapters: [{
                        start: 100,
                        end: 140
                    }]
                }]);
                expect(calledArgs[1]).to.deep.equal(options);
                done();
            })
            .catch(done);
        });

        it('should call callCore with a job and parsed chapter range', function(done) {
            const args = mockArgs('series1 120 series2 100:140');
            download.parseArgs(args, options)
            .then(function() {
                expect(callCoreStub.callCount).to.equal(1);
                const calledArgs = callCoreStub.getCall(0).args;
                expect(calledArgs[0]).to.deep.equal([{
                    plugin: 'some-plugin',
                    series: 'series1',
                    chapters: [{
                        start: 120
                    }]
                }, {
                    plugin: 'some-plugin',
                    series: 'series2',
                    chapters: [{
                        start: 100,
                        end: 140
                    }]
                }]);
                expect(calledArgs[1]).to.deep.equal(options);
                done();
            })
            .catch(done);
        });

        it('should call callCore with download.printProgress, bound with the options', function(done) {
            const args = mockArgs('series1 120 series2 100:140');
            download.parseArgs(args, options)
            .then(function() {
                expect(callCoreStub.callCount).to.equal(1);
                const printProgress = callCoreStub.getCall(0).args[2];
                expect(printProgress).to.exist;

                // Check if it was bound to the options
                expect(printProgressStub.callCount).to.equal(0);
                expect(printProgress).to.exist;
                printProgress();
                expect(printProgressStub.callCount).to.equal(1);
                expect(printProgressStub.getCall(0).args[0]).to.deep.equal(options);
                done();
            })
            .catch(done);
        });

        it('should have field "name" set when options.name is defined', function(done) {
            const args = mockArgs('series1 120');
            options.name = 'some-name';
            download.parseArgs(args, options)
            .then(function() {
                const calledArgs = callCoreStub.getCall(0).args;
                expect(calledArgs[0][0].name).to.equal('some-name');
                done();
            })
            .catch(done);
        });

        it('should reject when options.name is defined and multiple series are requested', function(done) {
            const args = mockArgs('series1 120 series2 100:140');
            options.name = 'some-name';
            download.parseArgs(args, options)
            .catch(function(error) {
                expect(error.message).to.equal('"name" can not be specified when targetting multiple series');
                expect(callCoreStub.callCount).to.equal(0);
                done();
            })
            .catch(done);
        });

        it('should reject when it\'s not possible to form series-chapters pairs', function(done) {
            const args = mockArgs('series1 120 series2');
            download.parseArgs(args, options)
            .catch(function(error) {
                expect(error.message).to.equal('no chapters were specified for "series2"');
                expect(callCoreStub.callCount).to.equal(0);
                done();
            })
            .catch(done);
        });
    });

    describe('printProgress', function() {
        let logStub, logErrorStub;
        let options, job;

        beforeEach(function() {
             logStub = sinon.stub(logging, 'log');
             logErrorStub = sinon.stub(logging, 'logError');
             options = {
                verbose: 'normal'
             };
             job = {
                name: 'some-name',
                chapter: '123'
             };
        });

        afterEach(function() {
            logging.log.restore();
            logging.logError.restore();
        });

        it('should log an error message when given an error (Error)', function() {
            var expectedError = new Error('some error sent to printProgress');
            download.printProgress(options, expectedError, 'error', job);
            expect(logStub.callCount).to.equal(0);
            expect(logErrorStub.callCount).to.equal(1);

            const args = logErrorStub.getCall(0).args;
            expect(args[0]).to.deep.equal(options);
            expect(args[1].message).to.equal('error when downloading some-name 123: ' + expectedError.message);
        });

        it('should log an error message when given an error (string)', function() {
            var expectedError = 'some error sent to printProgress';
            download.printProgress(options, expectedError, 'error', job);
            expect(logStub.callCount).to.equal(0);
            expect(logErrorStub.callCount).to.equal(1);

            const args = logErrorStub.getCall(0).args;
            expect(args[0]).to.deep.equal(options);
            expect(args[1].message).to.equal('error when downloading some-name 123: ' + expectedError);
        });

        it('should log when a job starts', function() {
            download.printProgress(options, null, 'start', job);
            expect(logErrorStub.callCount).to.equal(0);
            expect(logStub.callCount).to.equal(1);

            const args = logStub.getCall(0).args;
            expect(args[0]).to.deep.equal(options);
            expect(args[1].level).to.equal('normal');
            expect(args[1].message).to.equal('started download of some-name 123');
        });

        it('should log when a job ends', function() {
            download.printProgress(options, null, 'end', job);
            expect(logErrorStub.callCount).to.equal(0);
            expect(logStub.callCount).to.equal(1);

            const args = logStub.getCall(0).args;
            expect(args[0]).to.deep.equal(options);
            expect(args[1].level).to.equal('normal');
            expect(args[1].message).to.equal('ended download of some-name 123');
        });

        it('should not log anything when the type is unknown', function() {
            download.printProgress(options, null, 'some-unknown-type', job);
            expect(logErrorStub.callCount).to.equal(0);
            expect(logStub.callCount).to.equal(0);
        });
    });

    describe('callCore', function() {
        let coreStub, progressStub;
        let options, jobs, errorContent, resultContent;

        beforeEach(function() {
            coreStub = sinon.stub(core.downloader, 'download', function(a, b, cb) {
                return cb(errorContent, resultContent);
            });
            progressStub = sinon.stub();
            options = {
                verbose: 'normal'
            };
            jobs = [{
                name: 'some-name',
                chapter: '123'
            }];
            errorContent = null;
            resultContent = 'some-result';
        });

        afterEach(function() {
            core.downloader.download.restore();
        });

        it('should return a Promise', function() {
            const call = download.callCore(jobs, options, progressStub);
            expect(call.then).to.be.a('function');
        });

        it('should call manganese.downloader.download', function(done) {
            download.callCore(jobs, options, progressStub)
            .then(function() {
                expect(coreStub.callCount).to.equal(1);
                const args = coreStub.getCall(0).args;
                expect(args[0]).to.equal(jobs);
                expect(args[1]).to.equal(options);
                expect(args[3]).to.equal(progressStub);
                done();
            })
            .catch(done);
        });

        it('should reject when manganese.downloader.download fails', function(done) {
            errorContent = new Error('some error with download');
            download.callCore(jobs, options, progressStub)
            .catch(function(error) {
                expect(error.message).to.equal(errorContent.message);
                done();
            })
            .catch(done);
        });

        it('should resolve to the result of manganese.downloader.download', function(done) {
            download.callCore(jobs, options, progressStub)
            .then(function(result) {
                expect(result).to.equal('some-result');
                done();
            })
            .catch(done);
        });

        it('should have a default progress callback', function(done) {
            download.callCore(jobs, options)
            .then(function() {
                expect(coreStub.callCount).to.equal(1);
                const progressCb = coreStub.getCall(0).args[3];
                expect(progressCb).to.be.a('function');
                done();
            })
            .catch(done);
        });
    });
});
