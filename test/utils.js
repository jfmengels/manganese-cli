'use strict';

export function mockArgsForDispatch(args = '') {
    return ['node', 'some/path/manganese', ...args.split(' ')];
}

export function mockArgs(args = '') {
    return args.split(' ');
}
