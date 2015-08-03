'use strict';

import {expect} from 'chai';
import sinon from 'sinon';
import core from 'manganese';

import * as install from '../lib/install';
import {mockArgs} from './utils';

describe('install', function() {
    describe('parseArgs', function() {
        let coreStub;
        let errorContent, resultContent;

        beforeEach(function() {
            coreStub = sinon.stub(core.installer, 'install', function(args, cb) {
                return cb(errorContent, resultContent);
            });
            errorContent = null;
            resultContent = 'some-result';
        });

        afterEach(function() {
            core.installer.install.restore();
        });

        it('should return a Promise', function() {
            const args = mockArgs('some-plugin some-other-plugin');
            expect(install.parseArgs(args).then).to.be.a('function');
        });

        it('should call manganese.installer.install', function(done) {
            const args = mockArgs('some-plugin some-other-plugin');
            install.parseArgs(args)
            .then(function() {
                expect(coreStub.callCount).to.equal(1);
                done();
            })
            .catch(done);
        });

        it('should resolve to the result of manganese.installer.install', function(done) {
            const args = mockArgs('some-plugin some-other-plugin');
            install.parseArgs(args)
            .then(function(result) {
                expect(result).to.equal('some-result');
                done();
            })
            .catch(done);
        });

        it('should reject when manganese.installer.install fails', function(done) {
            errorContent = new Error('some-error');
            const args = mockArgs('some-plugin some-other-plugin');
            install.parseArgs(args)
            .catch(function(error) {
                expect(error.message).to.equal(errorContent.message);
                done();
            })
            .catch(done);
        });
    });
});