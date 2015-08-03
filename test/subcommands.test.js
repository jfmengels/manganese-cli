'use strict';

import {expect} from 'chai';

import * as cli from '../lib/cli';
import * as download from '../lib/download';
import * as install from '../lib/install';
import * as config from '../lib/config';

describe('cli', function() {
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