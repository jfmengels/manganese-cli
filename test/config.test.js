'use strict';

/*eslint no-unused-expressions:0*/

import fs from 'fs';
import osenv from 'osenv';

import {expect} from 'chai';
import sinon from 'sinon';

import * as config from '../lib/config';
import * as logging from '../lib/logging';

describe('config', function() {
    describe('getDefaultConfig', function() {
        let fsStub, osenvStub, logStub, logErrorStub;
        let errorContent, baseResultContent, resultContent, options;

		beforeEach(function() {
            osenvStub = sinon.stub(osenv, 'home').returns('/some/path');
            fsStub = sinon.stub(fs, 'readFile', function(file, cb) {
                return cb(errorContent, resultContent);
            });
            logStub = sinon.stub(logging, 'log').returns();
            logErrorStub = sinon.stub(logging, 'logError').returns();
            errorContent = null;
            baseResultContent = {
                plugin: 'some-plugin'
            };
            resultContent = JSON.stringify(baseResultContent);
            options = {
                verbose: 'debug'
            };
		});

		afterEach(function() {
			osenv.home.restore();
            fs.readFile.restore();
            logging.log.restore();
            logging.logError.restore();
		});

		it('should return a Promise', function() {
            expect(config.getDefaultConfig(options).then).to.be.a('function');
		});

        it('should call fs.readFile', function(done) {
            config.getDefaultConfig(options)
            .then(function() {
                expect(osenvStub.callCount).to.equal(1);
                expect(fsStub.callCount).to.equal(1);
                expect(fsStub.getCall(0).args[0]).to.equal('/some/path/.manganese/config.json');
                done();
            })
            .catch(done);
        });

        it('should resolve to an object corresponding to the parsed content', function(done) {
            config.getDefaultConfig(options)
            .then(function(result) {
                expect(result).to.deep.equal(baseResultContent);
                done();
            })
            .catch(done);
        });

        it('should return an empty object when config file does not exist', function(done) {
            errorContent = new Error('some error with file read');
            errorContent.code = 'ENOENT';
            config.getDefaultConfig(options)
            .then(function(result) {
                expect(result).to.deep.equal({});
                expect(logErrorStub.callCount).to.equal(0);
                done();
            })
            .catch(done);
        });

        it('should return an empty object when file read fails', function(done) {
            errorContent = new Error('some error with file read');
            config.getDefaultConfig(options)
            .then(function(result) {
                expect(result).to.deep.equal({});
                expect(logErrorStub.callCount).to.equal(1);
                const args = logErrorStub.getCall(0).args;
                expect(args[0]).to.deep.equal(options);
                expect(args[1].message).to.deep.equal(errorContent.message);
                done();
            })
            .catch(done);
        });

        it('should return an empty object when config parsing fails', function(done) {
            resultContent = 'some unparsable content';
            config.getDefaultConfig(options)
            .then(function(result) {
                expect(result).to.deep.equal({});
                expect(logErrorStub.callCount).to.equal(1);
                const argsLogError = logErrorStub.getCall(0).args;
                expect(argsLogError[0]).to.deep.equal(options);
                expect(argsLogError[1].message).to.deep.equal('could not parse config');

                const argsLog = logStub.getCall(0).args;
                expect(argsLog[0]).to.deep.equal(options);
                expect(argsLog[1].level).to.equal('debug');
                expect(argsLog[1].message).to.equal(resultContent);
                done();
            })
            .catch(done);
        });
    });
});