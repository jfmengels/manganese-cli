'use strict';

import sinon from 'sinon';
import {expect} from 'chai';

import * as download from '../lib/download';

import {mockArgs} from './utils';

describe('download', function() {
    var downloadAsyncStub;
    var options;

    beforeEach(function() {
        downloadAsyncStub = sinon.stub(download, 'downloadAsync').resolves();
        options = {
            plugin: 'some-plugin'
        };
    });

    afterEach(function() {
        download.downloadAsync.restore();
    });

    it('should reject when args is empty', function(done) {
        const args = [];
        download.download(args, options)
        .catch(function(error) {
            expect(error.message).to.equal('no series was specified');
            expect(downloadAsyncStub.callCount).to.equal(0);
            done();
        })
        .catch(done);
    });

    it('should reject when options.plugin is not defined', function(done) {
        const args = mockArgs('series1 120');
        download.download(args, {})
        .catch(function(error) {
            expect(error.message).to.equal('no plugin was specified');
            expect(downloadAsyncStub.callCount).to.equal(0);
            done();
        })
        .catch(done);
    });

    it('should reject but not crash when options is not defined', function(done) {
        const args = mockArgs('series1 120');
        download.download(args)
        .catch(function(error) {
            expect(error.message).to.equal('no plugin was specified');
            expect(downloadAsyncStub.callCount).to.equal(0);
            done();
        })
        .catch(done);
    });

    it('should reject when downloadAsync fails', function(done) {
        const args = mockArgs('series1 120');
        const expectedError = new Error('some error with downloadAsync');
        download.downloadAsync.restore();
        downloadAsyncStub = sinon.stub(download, 'downloadAsync').rejects(expectedError);

        download.download(args, options)
        .catch(function(error) {
            expect(downloadAsyncStub.callCount).to.equal(1);
            expect(error.message).to.deep.equal(expectedError.message);
            done();
        })
        .catch(done);
    });

    it('should call downloadAsync with a job and parsed chapter range', function(done) {
        const args = mockArgs('series1 120 series2 100:140');
        download.download(args, options)
        .then(function() {
            expect(downloadAsyncStub.callCount).to.equal(1);
            const calledArgs = downloadAsyncStub.getCall(0).args;
            expect(calledArgs[0]).to.deep.equal([{
                plugin: 'some-plugin',
                series: 'series1',
                chapters: '120'
            }, {
                plugin: 'some-plugin',
                series: 'series2',
                chapters: '100:140'
            }]);
            expect(calledArgs[1]).to.deep.equal(options);
            done();
        })
        .catch(done);
    });

    it('should have field "name" set when options.name is defined', function(done) {
        const args = mockArgs('series1 120');
        options.name = 'some-name';
        download.download(args, options)
        .then(function() {
            const calledArgs = downloadAsyncStub.getCall(0).args;
            expect(calledArgs[0][0].name).to.equal('some-name');
            done();
        })
        .catch(done);
    });

    it('should reject when options.name is defined and multiple series are requested', function(done) {
        const args = mockArgs('series1 120 series2 100:140');
        options.name = 'some-name';
        download.download(args, options)
        .catch(function(error) {
            expect(error.message).to.equal('"name" can not be specified when targetting multiple series');
            expect(downloadAsyncStub.callCount).to.equal(0);
            done();
        })
        .catch(done);
    });

    it('should reject when it\'s not possible to form series-chapters pairs', function(done) {
        const args = mockArgs('series1 120 series2');
        download.download(args, options)
        .catch(function(error) {
            expect(error.message).to.equal('no chapters were specified for "series2"');
            expect(downloadAsyncStub.callCount).to.equal(0);
            done();
        })
        .catch(done);
    });
});
