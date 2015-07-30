'use strict';

import sinon from 'sinon';
import chai from 'chai';
import sinonChai from 'sinon-chai';
import 'sinon-as-promised';
chai.use(sinonChai);
const expect = chai.expect;

import * as cli from '../lib/cli';
import {mockArgsForDispatch} from './utils';

describe('cli', function() {

    describe('dispatch', function() {
        var downloadStub, printErrorStub;

        beforeEach(function() {
            downloadStub = sinon.stub(cli.subCommands, 'download').resolves();
            printErrorStub = sinon.stub(cli, 'printError');
        });

        afterEach(function() {
            cli.subCommands.download.restore();
            cli.printError.restore();
        });

        it('should print an error when no sub-command is specified', function (done) {
            const args = mockArgsForDispatch();
            var expectedError = 'no manganese command is specified. See \'manganese --help\'';
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
            var expectedError = 'unknown-command is not a manganese command. See \'manganese --help\'';
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
            cli.dispatch(args).then(function() {
                var calledArgs = downloadStub.getCall(0).args;
                expect(calledArgs[0]).to.deep.equal(['series1']);
                expect(calledArgs[1].plugin).to.equal('some-plugin');
                done();
            })
            .catch(done);
        });

        it('should not interpret numbers', function(done) {
            const args = mockArgsForDispatch('download series1 120');
            cli.dispatch(args).then(function() {
                var calledArgs = downloadStub.getCall(0).args;
                expect(calledArgs[0]).to.deep.equal(['series1', '120']);
                done();
            })
            .catch(done);
        });


        it('should have default values for the config', function(done) {
            const args = mockArgsForDispatch('download series1 120');
            cli.dispatch(args).then(function() {
                var options = downloadStub.getCall(0).args[1];
                expect(options.destFolder).to.be.a('string');
                done();
            })
            .catch(done);
        });

        it('should have aliases for the config', function(done) {
            const args = mockArgsForDispatch('download series1 120 -n name1 -p plugin1');
            cli.dispatch(args).then(function() {
                var options = downloadStub.getCall(0).args[1];
                expect(options.name).to.equal('name1');
                expect(options.plugin).to.equal('plugin1');
                done();
            })
            .catch(done);
        });

        it('should print error when subCommand fails', function(done) {
            const args = mockArgsForDispatch('download series1 120 --plugin some-plugin');
            const expectedError = new Error('some error');

            cli.subCommands.download.restore();
            downloadStub = sinon.stub(cli.subCommands, 'download');
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
        var consoleErrorStub;

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
});