'use strict';

import {expect} from 'chai';
import sinon from 'sinon';
import core from 'manganese';

import * as install from '../lib/install';

describe('install', function() {
    describe('installCore', function() {
        let coreStub;
        let plugins, errorContent, resultContent;

        beforeEach(function() {
            coreStub = sinon.stub(core.installer, 'install', function(args, cb) {
                return cb(errorContent, resultContent);
            });
            plugins = ['some-plugin', 'some-other-plugin'];
            errorContent = null;
            resultContent = 'some-result';
        });

        afterEach(function() {
            core.installer.install.restore();
        });

        it('should return a Promise', function() {
            expect(install.installCore(plugins).then).to.be.a('function');
        });

        it('should call manganese.installer.install', function(done) {
            install.installCore(plugins)
            .then(function() {
                expect(coreStub.callCount).to.equal(1);
                // expect(result).to.deep.equal(['some-plugin', 'some-other-plugin']);
                done();
            })
            .catch(done);
        });

        it('should resolve the installed plugins', function(done) {
            install.installCore(plugins)
            .then(function(result) {
                expect(result).to.deep.equal(['some-plugin', 'some-other-plugin']);
                done();
            })
            .catch(done);
        });

        it('should reject when manganese.installer.install fails', function(done) {
            errorContent = new Error('some-error');
            install.installCore(plugins)
            .catch(function(error) {
                expect(error.message).to.equal(errorContent.message);
                done();
            })
            .catch(done);
        });
    });

    describe('parseArgs', function () {
        let installCoreStub;
        let args;

        beforeEach(function() {
            args = ['some-plugin ', 'some-other-plugin'];

            installCoreStub = sinon.stub(install, 'installCore');
            installCoreStub.resolves(args);
        });

        afterEach(function() {
            install.installCore.restore();
        });

        it('should return a Promise', function() {
            expect(install.parseArgs(args).then).to.be.a('function');
        });

        it('should call install.installCore', function(done) {
            install.parseArgs(args)
            .then(function() {
                expect(installCoreStub.callCount).to.equal(1);
                expect(installCoreStub.getCall(0).args[0]).to.equal(args);
                done();
            })
            .catch(done);
        });

        it('should reject when install.installCore fails', function(done) {
            const expectedError = new Error('some error with installCore');
            installCoreStub.onFirstCall().rejects(expectedError);
            install.parseArgs(args)
            .catch(function(error) {
                expect(error.message).to.equal(expectedError.message);
                done();
            })
            .catch(done);
        });
    });
});