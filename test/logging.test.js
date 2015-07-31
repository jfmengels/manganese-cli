'use strict';

import sinon from 'sinon';
import {expect} from 'chai';

import * as logging from '../lib/logging';

describe('logging', function() {
    describe('log', function() {
        let consoleLogStub;
        let options, message, level;

        beforeEach(function() {
             consoleLogStub = sinon.stub(console, 'log');
             options = {
                verbose: 'all'
            };
            message = 'some-message';
        });

        afterEach(function() {
            console.log.restore();
        });

        it('should log a message if level is greater than or equal than the verbose level in the options', function() {
            options.verbose = 3;
            level = 2;
            logging.log(options, {message, level});
            expect(consoleLogStub.callCount).to.equal(1);
            expect(consoleLogStub.getCall(0).args).to.deep.equal([message]);
        });

        it('should not log a message if level is greater than or equal than the verbose level in the options', function() {
            options.verbose = 1;
            level = 2;
            logging.log(options, {message, level});
            expect(consoleLogStub.callCount).to.equal(0);
        });

        it('should understand verbose names for the options', function() {
            // Should not log
            level = 2;
            options.verbose = 'none';
            logging.log(options, {message, level});
            expect(consoleLogStub.callCount).to.equal(0);

            // Should log
            options.verbose = 'all';
            logging.log(options, {message, level});
            expect(consoleLogStub.callCount).to.equal(1);
        });

        it('should understand verbose names for the message level', function() {
            options.verbose = 'normal';

            // Should not log
            level = 'debug';
            logging.log(options, {message, level});
            expect(consoleLogStub.callCount).to.equal(0);

            // Should log
            level = 'error';
            logging.log(options, {message, level});
            expect(consoleLogStub.callCount).to.equal(1);
        });

        it('should have verbose level "normal" as default', function() {
            options.verbose = undefined;

            // Should not log
            level = logging.verboseLevels.normal + 1;
            logging.log(options, {message, level});
            expect(consoleLogStub.callCount).to.equal(0);

            // Should log
            level = logging.verboseLevels.normal;
            logging.log(options, {message, level});
            expect(consoleLogStub.callCount).to.equal(1);
        });
    });


    describe('logError', function() {
        let consoleErrorStub;
        let options, message;

        beforeEach(function() {
             consoleErrorStub = sinon.stub(console, 'error');
             options = {
                verbose: 'all'
            };
            message = 'some-message';
        });

        afterEach(function() {
            console.error.restore();
        });

        it('should log a message if verbose level is greater than error level', function() {
            options.verbose = logging.verboseLevels.error + 1;
            logging.logError(options, {message});
            expect(consoleErrorStub.callCount).to.equal(1);
            expect(consoleErrorStub.getCall(0).args).to.deep.equal([message]);
        });

        it('should log a message if verbose level is equal to error level', function() {
            options.verbose = logging.verboseLevels.error;
            logging.logError(options, {message});
            expect(consoleErrorStub.callCount).to.equal(1);
            expect(consoleErrorStub.getCall(0).args).to.deep.equal([message]);
        });

        it('should not log a message if verbose level is less than error level', function() {
            options.verbose = logging.verboseLevels.error - 1;
            logging.logError(options, {message});
            expect(consoleErrorStub.callCount).to.equal(0);
        });

        it('should understand verbose names', function() {
            // Should not log
            options.verbose = 'none';
            logging.logError(options, {message});
            expect(consoleErrorStub.callCount).to.equal(0);

            // Should log
            options.verbose = 'all';
            logging.logError(options, {message});
            expect(consoleErrorStub.callCount).to.equal(1);
        });

        it('should log a message by default if verbose level is not set', function() {
            options.verbose = undefined;
            logging.logError(options, {message});
            expect(consoleErrorStub.callCount).to.equal(1);
        });
    });
});
