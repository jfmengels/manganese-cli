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
            p: 'some-plugin'
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
                series: 'series1',
                chapters: '120'
            }, {
                series: 'series2',
                chapters: '100:140'
            }]);
            expect(calledArgs[1]).to.deep.equal(options);
            done();
        })
        .catch(done);
    });
});
