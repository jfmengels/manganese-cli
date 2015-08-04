'use strict';

/*eslint no-unused-expressions:0*/

import fs from 'fs';
import osenv from 'osenv';

import {expect} from 'chai';
import sinon from 'sinon';

import * as config from '../lib/config';
import * as logging from '../lib/logging';

import {mockArgs} from './utils';

describe('config', function() {
    describe('getDefaultConfig', function() {
        let fsStub, locationStub, logStub, logErrorStub;
        let errorContent, baseResultContent, resultContent, options;

        beforeEach(function() {
            locationStub = sinon.stub(config, 'location').returns('/some/path/.manganese-cli/config.json');
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
            config.location.restore();
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
                expect(locationStub.callCount).to.equal(1);
                expect(fsStub.callCount).to.equal(1);
                expect(fsStub.getCall(0).args[0]).to.equal('/some/path/.manganese-cli/config.json');
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

    describe('parseArgs', function() {
        let updateDefaultConfigStub, locationStub, consoleLogStub;
        let options, args;

        beforeEach(function() {
            updateDefaultConfigStub = sinon.stub(config, 'updateDefaultConfig');
            updateDefaultConfigStub.resolves('some update result');
            locationStub = sinon.stub(config, 'location').returns('some location result');
            consoleLogStub = sinon.stub(console, 'log');
            options = {};
            args = [];
        });

        afterEach(function() {
            config.updateDefaultConfig.restore();
            config.location.restore();
            console.log.restore();
        });

        it('should return a Promise', function() {
            expect(config.parseArgs(args, options).then).to.be.a('function');
        });

        it('should return a Promise if options.location is true', function() {
            options.location = true;
            expect(config.parseArgs(args, options).then).to.be.a('function');
        });

        it('should call config.location if options.location is true', function(done) {
            options.location = true;
            config.parseArgs(args, options)
            .then(function(result) {
                expect(updateDefaultConfigStub.callCount).to.equal(0);
                expect(locationStub.callCount).to.equal(1);
                expect(locationStub.getCall(0).args).to.be.an('array').of.length(0);
                expect(result).to.equal('some location result');
                expect(consoleLogStub.callCount).to.equal(1);
                expect(consoleLogStub.getCall(0).args[0]).to.equal(result);
                done();
            })
            .catch(done);
        });

        it('should call config.updateDefaultConfig if options.location is not true', function(done) {
            config.parseArgs(args, options)
            .then(function(result) {
                expect(consoleLogStub.callCount).to.equal(0);
                expect(locationStub.callCount).to.equal(0);
                expect(updateDefaultConfigStub.callCount).to.equal(1);
                expect(updateDefaultConfigStub.getCall(0).args).to.deep.equal([args, options]);
                expect(result).to.equal('some update result');
                done();
            })
            .catch(done);
        });

        it('should reject if config.updateDefaultConfig if fails', function(done) {
            const expectedError = new Error('some update result');
            updateDefaultConfigStub.onFirstCall().rejects(expectedError);
            config.parseArgs(args, options)
            .catch(function(error) {
                expect(error.message).to.equal(expectedError.message);
                expect(consoleLogStub.callCount).to.equal(0);
                expect(locationStub.callCount).to.equal(0);
                expect(updateDefaultConfigStub.callCount).to.equal(1);
                expect(updateDefaultConfigStub.getCall(0).args).to.deep.equal([args, options]);
                done();
            })
            .catch(done);
        });
    });

    describe('location', function() {
        let osenvStub;

        beforeEach(function() {
            osenvStub = sinon.stub(osenv, 'home').returns('/some/path');
        });

        afterEach(function() {
            osenv.home.restore();
        });

        it('should resolve to the configuration file location', function(done) {
            const expectedLocation = '/some/path/.manganese-cli/config.json';
            expect(config.location()).to.equal(expectedLocation);
            expect(osenvStub.callCount).to.equal(1);
            done();
        });
    });

    describe('updateDefaultConfig', function() {
        let configSaveStub, getDefaultConfigStub;
        let options, configSaveStubError;

        beforeEach(function() {
            configSaveStub = sinon.stub(config, 'save', function(data) {
                if (configSaveStubError) {
                    return Promise.reject(configSaveStubError);
                }
                return Promise.resolve(data);
            });
            getDefaultConfigStub = sinon.stub(config, 'getDefaultConfig');
            getDefaultConfigStub.resolves({
                key: 'value'
            });
            options = {};
            configSaveStubError = null;
        });

        afterEach(function() {
            config.save.restore();
            config.getDefaultConfig.restore();
        });

        it('should return a Promise', function() {
            const args = mockArgs('someKey=someValue');
            expect(config.updateDefaultConfig(args, options).then).to.be.a('function');
        });

        it('should reject if args is empty', function(done) {
            const args = [];
            config.updateDefaultConfig(args, options)
            .catch(function(error) {
                expect(error.message).to.equal(
                    'expected at least one config key-value pair like key=value');
                expect(configSaveStub.callCount).to.equal(0);
                done();
            })
            .catch(done);
        });

        it('should reject if args can not be parsed as key value pairs (a=)', function(done) {
            const args = mockArgs('someKey=');
            config.updateDefaultConfig(args, options)
            .catch(function(error) {
                expect(error.message).to.equal('expected key-value pairs like key=value');
                expect(configSaveStub.callCount).to.equal(0);
                done();
            })
            .catch(done);
        });

        it('should reject if args can not be parsed as key value pairs (a b)', function(done) {
            const args = mockArgs('someKey someValue');
            config.updateDefaultConfig(args, options)
            .catch(function(error) {
                expect(error.message).to.equal('expected key-value pairs like key=value');
                expect(configSaveStub.callCount).to.equal(0);
                done();
            })
            .catch(done);
        });

        it('should reject if args can not be parsed as key value pairs (=b)', function(done) {
            const args = mockArgs('=someValue');
            config.updateDefaultConfig(args, options)
            .catch(function(error) {
                expect(error.message).to.equal('expected key-value pairs like key=value');
                expect(configSaveStub.callCount).to.equal(0);
                done();
            })
            .catch(done);
        });

        it('should get default config', function(done) {
            const args = mockArgs('someKey=someValue');
            config.updateDefaultConfig(args, options)
            .then(function() {
                expect(getDefaultConfigStub.callCount).to.equal(1);
                done();
            })
            .catch(done);
        });

        it('should reject if reading configuration file fails', function(done) {
            const args = mockArgs('someKey=someValue');
            const expectedError = new Error('some error on file read');
            getDefaultConfigStub.onFirstCall().rejects(expectedError);

            config.updateDefaultConfig(args, options)
            .catch(function(error) {
                expect(getDefaultConfigStub.callCount).to.equal(1);
                expect(configSaveStub.callCount).to.equal(0);
                expect(error.message).to.equal(expectedError.message);
                done();
            })
            .catch(done);
        });

        it('should save merged config to configuration file', function(done) {
            const args = mockArgs('someKey=someValue');
            config.updateDefaultConfig(args, options)
            .then(function() {
                expect(configSaveStub.callCount).to.equal(1);
                expect(configSaveStub.getCall(0).args[0]).to.deep.equal({
                    key: 'value',
                    someKey: 'someValue'
                });
                done();
            })
            .catch(done);
        });

        it('should reject if saving configuration file fails', function(done) {
            const args = mockArgs('someKey=someValue');
            configSaveStubError = new Error('some error on file save');
            config.updateDefaultConfig(args, options)
            .catch(function(error) {
                expect(configSaveStub.callCount).to.equal(1);
                expect(error.message).to.equal(configSaveStubError.message);
                done();
            })
            .catch(done);
        });

        it('should resolve merged config', function(done) {
            const args = mockArgs('someKey=someValue');
            config.updateDefaultConfig(args, options)
            .then(function(result) {
                expect(result).to.deep.equal({
                    key: 'value',
                    someKey: 'someValue'
                });
                done();
            })
            .catch(done);
        });

        it('should have new keys override old keys', function(done) {
            const args = mockArgs('key=other-value');
            config.updateDefaultConfig(args, options)
            .then(function(result) {
                expect(result).to.deep.equal({
                    key: 'other-value'
                });
                done();
            })
            .catch(done);
        });

        it('should handle arrays', function(done) {
            const args = mockArgs('key=[value1,value2]');
            config.updateDefaultConfig(args, options)
            .then(function(result) {
                expect(result).to.deep.equal({
                    key: ['value1', 'value2']
                });
                done();
            })
            .catch(done);
        });

        it('should remove values from default config if value is "default"', function(done) {
            const args = mockArgs('key=default someKey=default');
            config.updateDefaultConfig(args, options)
            .then(function(result) {
                expect(result).to.deep.equal({});
                done();
            })
            .catch(done);
        });

        it('should remove values from default config if value is "auto"', function(done) {
            const args = mockArgs('key=auto someKey=auto');
            config.updateDefaultConfig(args, options)
            .then(function(result) {
                expect(result).to.deep.equal({});
                done();
            })
            .catch(done);
        });
    });

    describe('save', function() {
        let fsWriteStub, locationStub;
        let options;

        beforeEach(function() {
            fsWriteStub = sinon.stub(fs, 'writeFile');
            fsWriteStub.yields();

            locationStub = sinon.stub(config, 'location');
            locationStub.returns('/some/path/.manganese-cli/config.json');

            options = {};
        });

        afterEach(function() {
            fs.writeFile.restore();
            config.location.restore();
        });

        it('should return a Promise', function() {
            expect(config.save(options).then).to.be.a('function');
        });

        it('should write config to configuration file', function(done) {
            config.save(options)
            .then(function() {
                expect(fsWriteStub.callCount).to.equal(1);
                const fsWriteArgs = fsWriteStub.getCall(0).args;
                expect(locationStub.callCount).to.equal(1);
                expect(fsWriteArgs[0]).to.equal('/some/path/.manganese-cli/config.json');
                expect(fsWriteArgs[1]).to.deep.equal(JSON.stringify(options, null, 4));
                done();
            })
            .catch(done);
        });

        it('should reject if writing to configuration file fails', function(done) {
            const expectedError = new Error('some error on file write');
            fsWriteStub.onFirstCall().yields(expectedError);

            config.save(options)
            .catch(function(error) {
                expect(fsWriteStub.callCount).to.equal(1);
                expect(error.message).to.equal(expectedError.message);
                done();
            })
            .catch(done);
        });

        it('should resolve to the config file', function(done) {
            config.save(options)
            .then(function(result) {
                expect(result).to.deep.equal(options);
                done();
            })
            .catch(done);
        });
    });

    describe('addPlugins', function() {
        let configSaveStub, getDefaultConfigStub;
        let plugins, options, getDefaultConfigContent, configSaveStubError;

        beforeEach(function() {
            plugins = ['some-plugin', 'some-other-plugin'];
            options = {};
            configSaveStubError = null;
            getDefaultConfigContent = {
                key: 'value',
                installedPlugins: ['some-existing-plugin']
            };

            configSaveStub = sinon.stub(config, 'save', function(data) {
                if (configSaveStubError) {
                    return Promise.reject(configSaveStubError);
                }
                return Promise.resolve(data);
            });

            getDefaultConfigStub = sinon.stub(config, 'getDefaultConfig');
            getDefaultConfigStub.resolves(getDefaultConfigContent);
        });

        afterEach(function() {
            config.save.restore();
            config.getDefaultConfig.restore();
        });

        it('should return a Promise', function() {
            expect(config.addPlugins(plugins, options).then).to.be.a('function');
        });

        it('should get default config', function(done) {
            config.addPlugins(plugins, options)
            .then(function() {
                expect(getDefaultConfigStub.callCount).to.equal(1);
                const args = getDefaultConfigStub.getCall(0).args;
                expect(args).to.have.length(1);
                expect(args[0]).to.deep.equal(options);
                done();
            })
            .catch(done);
        });

        it('should reject if getting default config fails', function(done) {
            const expectedError = new Error('some error with getting default config');
            getDefaultConfigStub.onFirstCall().rejects(expectedError);

            config.addPlugins(plugins, options)
            .catch(function(error) {
                expect(getDefaultConfigStub.callCount).to.equal(1);
                expect(error.message).to.equal(expectedError.message);
                done();
            })
            .catch(done);
        });

        it('should save config with added plugins', function(done) {
            config.addPlugins(plugins, options)
            .then(function() {
                const expectedPlugins = ['some-existing-plugin', 'some-plugin', 'some-other-plugin'];
                expect(configSaveStub.callCount).to.equal(1);
                const args = configSaveStub.getCall(0).args;
                expect(args).to.have.length(1);
                expect(args[0].installedPlugins.sort()).to.deep.equal(expectedPlugins.sort());
                done();
            })
            .catch(done);
        });

        it('should not have modified anything except the installedPlugins field', function(done) {
            config.addPlugins(plugins, options)
            .then(function() {
                getDefaultConfigContent.installedPlugins = ['some-existing-plugin', 'some-plugin', 'some-other-plugin'];
                const savedConfig = configSaveStub.getCall(0).args[0];
                expect(savedConfig).to.deep.equal(getDefaultConfigContent);
                done();
            })
            .catch(done);
        });

        it('should add installedPlugins field is it does not yet exist', function(done) {
            delete getDefaultConfigContent.installedPlugins;
            config.addPlugins(plugins, getDefaultConfigContent)
            .then(function() {
                const expectedPlugins = ['some-plugin', 'some-other-plugin'];
                const savedConfig = configSaveStub.getCall(0).args[0];
                expect(savedConfig.installedPlugins.sort()).to.deep.equal(expectedPlugins.sort());
                done();
            })
            .catch(done);
        });

        it('should not have duplicate plugins', function(done) {
            plugins.push('some-existing-plugin');
            config.addPlugins(plugins, options)
            .then(function() {
                const expectedPlugins = ['some-existing-plugin', 'some-plugin', 'some-other-plugin'];
                const savedConfig = configSaveStub.getCall(0).args[0];
                expect(savedConfig.installedPlugins.sort()).to.deep.equal(expectedPlugins.sort());
                done();
            })
            .catch(done);
        });

        it('should reject if saving config fails', function(done) {
            configSaveStubError = new Error('some error with saving config');

            config.addPlugins(plugins, options)
            .catch(function(error) {
                expect(configSaveStub.callCount).to.equal(1);
                expect(error.message).to.equal(configSaveStubError.message);
                done();
            })
            .catch(done);
        });

        it('should resolve to the updated default config', function(done) {
            config.addPlugins(plugins, options)
            .then(function(result) {
                getDefaultConfigContent.installedPlugins = ['some-existing-plugin', 'some-plugin', 'some-other-plugin'];
                expect(result).to.deep.equal(getDefaultConfigContent);
                done();
            })
            .catch(done);
        });
    });
});