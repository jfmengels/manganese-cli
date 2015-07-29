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
            const args = mockArgsForDispatch('download series1 120 -p some-plugin');
            cli.dispatch(args).then(function() {
                expect(downloadStub).to.be.calledWith(
                    ['series1', 120], {
                        p: 'some-plugin'
                    }
                );
                done();
            })
            .catch(done);
        });

        it('should print error when subCommand fails', function(done) {
            const args = mockArgsForDispatch('download series1 120 -p some-plugin');
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