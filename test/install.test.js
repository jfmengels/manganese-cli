'use strict';

import {expect} from 'chai';
import sinon from 'sinon';
import core from 'manganese';

import * as install from '../lib/install';
import * as config from '../lib/config';

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
                expect(coreStub.getCall(0).args[0]).to.deep.equal(plugins);
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

    describe('list', function() {
        let findPluginsStub;

        beforeEach(function() {
            findPluginsStub = sinon.stub(core.installer, 'findPlugins');
            findPluginsStub.yields(null, ['some-plugin', 'some-other-plugin']);
        });

        afterEach(function() {
            core.installer.findPlugins.restore();
        });

        it('should return a Promise', function() {
            expect(install.list().then).to.be.a('function');
        });

        it('should call manganese.installer.findPlugins', function(done) {
            install.list()
            .then(function() {
                expect(findPluginsStub.callCount).to.equal(1);
                expect(findPluginsStub.getCall(0).args).to.have.length(1);
                done();
            })
            .catch(done);
        });

        it('should resolve to the list of found plugins', function(done) {
            install.list()
            .then(function(result) {
                expect(result).to.deep.equal(['some-plugin', 'some-other-plugin']);
                done();
            })
            .catch(done);
        });

        it('should reject when manganese.installer.findPlugins fails', function(done) {
            const expectedError = new Error('some-error with findPlugins');
            findPluginsStub.onFirstCall().yields(expectedError);
            install.list()
            .catch(function(error) {
                expect(error.message).to.equal(expectedError.message);
                done();
            })
            .catch(done);
        });
    });

    describe('parseArgs', function () {
        let installCoreStub, listStub, configAddPluginsStub;
        let args, options;

        beforeEach(function() {
            args = ['some-plugin ', 'some-other-plugin'];
            options = {
                verbose: 'normal'
            };

            installCoreStub = sinon.stub(install, 'installCore');
            installCoreStub.resolves(args);

            listStub = sinon.stub(install, 'list');
            listStub.resolves(args);

            configAddPluginsStub = sinon.stub(config, 'addPlugins');
            configAddPluginsStub.resolves();
        });

        afterEach(function() {
            install.installCore.restore();
            install.list.restore();
            config.addPlugins.restore();
        });

        describe('with options.list', function() {
            beforeEach(function() {
                options.list = true;
            });

            it('should return a Promise', function() {
                expect(install.parseArgs(args, options).then).to.be.a('function');
            });

            it('should call install.list', function(done) {
                install.parseArgs(args, options)
                .then(function() {
                    expect(listStub.callCount).to.equal(1);
                    expect(listStub.getCall(0).args[0]).to.equal(options);
                    done();
                })
                .catch(done);
            });

            it('should reject when install.list fails', function(done) {
                const expectedError = new Error('some error with list');
                listStub.onFirstCall().rejects(expectedError);
                install.parseArgs(args, options)
                .catch(function(error) {
                    expect(error.message).to.equal(expectedError.message);
                    done();
                })
                .catch(done);
            });

        });

        describe('without options.list', function() {
            beforeEach(function() {
                delete options.list;
            });

            it('should return a Promise', function() {
                expect(install.parseArgs(args, options).then).to.be.a('function');
            });

            it('should reject when there args is not defined', function(done) {
                install.parseArgs(null, options)
                .catch(function(error) {
                    expect(error.message).to.equal('no plugins were specified');
                    done();
                })
                .catch(done);
            });

            it('should reject when there args is an empty array', function(done) {
                install.parseArgs([], options)
                .catch(function(error) {
                    expect(error.message).to.equal('no plugins were specified');
                    done();
                })
                .catch(done);
            });

            it('should call install.installCore', function(done) {
                install.parseArgs(args, options)
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
                install.parseArgs(args, options)
                .catch(function(error) {
                    expect(error.message).to.equal(expectedError.message);
                    done();
                })
                .catch(done);
            });

            it('should save the newly installed plugins in the default config', function(done) {
                install.parseArgs(args, options)
                .then(function() {
                    expect(configAddPluginsStub.callCount).to.equal(1);
                    const addPluginsArgs = configAddPluginsStub.getCall(0).args;
                    expect(addPluginsArgs).to.have.length(1);
                    expect(addPluginsArgs[0]).to.deep.equal(args);
                    done();
                })
                .catch(done);
            });
        });
    });
});