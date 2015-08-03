'use strict';

import sinon from 'sinon';
import {expect} from 'chai';
import 'sinon-as-promised';

import * as cli from '../lib/cli';
import * as config from '../lib/config';
import * as download from '../lib/download';
import * as install from '../lib/install';
import {mockArgsForDispatch} from './utils';

describe('cli', function() {

    describe('dispatch', function() {
        let downloadStub, printErrorStub, configStub;
        let configContent;

        beforeEach(function() {
            downloadStub = sinon.stub(cli.subCommands.download, 'parseArgs').resolves();
            printErrorStub = sinon.stub(cli, 'printError');
            configStub = sinon.stub(config, 'getDefaultConfig', function() {
                return Promise.resolve(configContent);
            });
            configContent = {
                'some-config-key': 'some-config-value'
            };
        });

        afterEach(function() {
            cli.subCommands.download.parseArgs.restore();
            cli.printError.restore();
            config.getDefaultConfig.restore();
        });

        it('should print an error when no sub-command is specified', function (done) {
            const args = mockArgsForDispatch();
            let expectedError = 'no manganese command is specified. See \'manganese --help\'';
            cli.dispatch(args)
            .catch(function(error) {
                expect(error.message).to.equal(expectedError);
                expect(printErrorStub.callCount).to.equal(1);
                expect(printErrorStub.getCall(0).args[0].message).to.equal(expectedError);
                done();
            })
            .catch(done);
        });

        it('should print an error when the sub-command does not exist', function (done) {
            const args = mockArgsForDispatch('unknown-command with some arguments');
            const expectedError = 'unknown-command is not a manganese command. See \'manganese --help\'';
            cli.dispatch(args)
            .catch(function(error) {
                expect(error.message).to.equal(expectedError);
                expect(printErrorStub.callCount).to.equal(1);
                expect(printErrorStub.getCall(0).args[0].message).to.equal(expectedError);
                done();
            })
            .catch(done);
        });

        it('should dispatch to existing subcommand', function(done) {
            const args = mockArgsForDispatch('download series1 --plugin some-plugin');
            cli.dispatch(args)
            .then(function() {
                const calledArgs = downloadStub.getCall(0).args;
                expect(calledArgs[0]).to.deep.equal(['series1']);
                expect(calledArgs[1].plugin).to.equal('some-plugin');
                done();
            })
            .catch(done);
        });

        it('should not interpret numbers', function(done) {
            const args = mockArgsForDispatch('download series1 120');
            cli.dispatch(args)
            .then(function() {
                const calledArgs = downloadStub.getCall(0).args;
                expect(calledArgs[0]).to.deep.equal(['series1', '120']);
                done();
            })
            .catch(done);
        });

        it('should have default values for the config', function(done) {
            const args = mockArgsForDispatch('download series1 120');
            cli.dispatch(args)
            .then(function() {
                const options = downloadStub.getCall(0).args[1];
                expect(options.destFolder).to.match(/manga$/i);
                done();
            })
            .catch(done);
        });

        it('should have aliases for the config', function(done) {
            const args = mockArgsForDispatch('download series1 120 -n name1 -p plugin1');
            cli.dispatch(args)
            .then(function() {
                const options = downloadStub.getCall(0).args[1];
                expect(options.name).to.equal('name1');
                expect(options.plugin).to.equal('plugin1');
                done();
            })
            .catch(done);
        });

        it('should add options from the configuration file', function(done) {
            const args = mockArgsForDispatch('download series1 120');
            cli.dispatch(args)
            .then(function() {
                expect(configStub.callCount).to.equal(1);
                expect(configStub.getCall(0).args).to.be.an('array').of.length(1);
                expect(configStub.getCall(0).args[0]).to.deep.equal({});
                const options = downloadStub.getCall(0).args[1];
                expect(options['some-config-key']).to.equal('some-config-value');
                done();
            })
            .catch(done);
        });

        it('should have configuration file override default values', function(done) {
            configContent.destFolder = '/some/config/path';
            const args = mockArgsForDispatch('download series1 120');
            cli.dispatch(args)
            .then(function() {
                const options = downloadStub.getCall(0).args[1];
                expect(options.destFolder).to.equal('/some/config/path');
                done();
            })
            .catch(done);
        });

        it('should print error when subCommand fails', function(done) {
            const args = mockArgsForDispatch('download series1 120 --plugin some-plugin');
            const expectedError = new Error('some error');

            cli.subCommands.download.parseArgs.restore();
            downloadStub = sinon.stub(cli.subCommands.download, 'parseArgs');
            downloadStub.rejects(expectedError);

            cli.dispatch(args)
            .catch(function(error) {
                expect(error).to.equal(expectedError);
                expect(printErrorStub.callCount).to.equal(1);
                expect(printErrorStub.getCall(0).args[0].message).to.equal(expectedError.message);
                done();
            })
            .catch(done);
        });
    });

    describe('printError', function() {
        let consoleErrorStub;

        beforeEach(function() {
            consoleErrorStub = sinon.stub(console, 'error');
        });

        afterEach(function() {
            consoleErrorStub.restore();
        });

        it('should format errors', function() {
            const expectedError = 'some error for printError';
            cli.printError(new Error(expectedError));
            expect(consoleErrorStub.callCount).to.equal(1);
            expect(consoleErrorStub.getCall(0).args[0]).to.contain(expectedError);
        });
    });

    describe('subcommands', function() {
        it('should have subcommand download', function() {
            expect(cli.subCommands.download).to.equal(download);
        });

        it('should have subcommand install', function() {
            expect(cli.subCommands.install).to.equal(install);
        });

        it('should have subcommand config', function() {
            expect(cli.subCommands.config).to.equal(config);
        });
    });
});