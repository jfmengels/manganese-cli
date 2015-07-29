# Manganese-cli
[![NPM version](http://img.shields.io/npm/v/manganese-cli.svg?style=flat)](https://www.npmjs.com/package/manganese-cli)
[![Build Status](https://travis-ci.org/jfmengels/manganese-cli.png)](https://travis-ci.org/jfmengels/manganese-cli)
[![Dependencies Status](http://img.shields.io/david/jfmengels/manganese-cli.svg?style=flat)](https://david-dm.org/jfmengels/manganese-cli#info=dependencies)
[![devDependencies Status](http://img.shields.io/david/dev/jfmengels/manganese-cli.svg?style=flat)](https://david-dm.org/jfmengels/manganese-cli#info=devDependencies)

Command-line tool to download and organize manga on your computers using popular websites crawling.

Uses the [manganese](https://github.com/jfmengels/manganese) package for the core functionalities. Originally based on the [starkana-manga-crawler](https://github.com/jfmengels/starkana-manga-crawler) project, but this time, with support for multiple websites through a plugin system.

# install and setup

Using [npm](http://npmjs.org):

```
npm install manganese-cli -g
```

You then need to install a plugin. The plugin is responsible of the actual downloading work.

```
# This is just one plugin, more will come soon!
manganese install mangatown-manganese
```

You can find all available plugins by using
```
manganese find-plugin # don't freak out if it's slow, it's normal
# and then do
manganese install <that-plugin-that-you-like>
```

Should you want to remove one that you don't like (you can also simply not use it):
```
manganese remove <that-plugin-that-you-hate>
```

You can use `manganese` to control your library from the command line!
For now, you can only download things, but more functionalities will be coming soon, such as keeping a list of manga that you like and download all the new releases.

# downloading

Once you have a plugin installed, you can start downloading chapters using
```
manganese download|dl <plugin> <series> <chapter(s)> [options] 
// Examples
// Naruto chapter 1
manganese download manganese-plugin-example Naruto 1
// One Piece chapters 1 to 10 (1 and 10 included)
manganese dl manganese-plugin-example "One Piece" 1:10
// All Bleach chapters starting from chapter 600 onward (600 included)
manganese dl manganese-plugin-example Bleach 600:$
// Change the name of the series if you wish using -n
manganese dl manganese-plugin-example "The Breaker: New Waves" -n TBNW 1 
```
See [number-ranger](https://github.com/jfmengels/number-ranger) for how to format your chapter range queries.

# Subscription

You can subscribe to series, and then request to download all the new chapters for the series you're subscribed to.

## Subscribing

```
manganese subscribe|sub -p <plugin> [options] <series>
// Examples
// Subscribe to One Piece and Bleach
manganese subscribe -p manganese-plugin-example "One Piece" Bleach
// You can change the name of the series, but then only for one series
manganese sub -p manganese-plugin-example "The Breaker: New Waves" -n TBNW

// Unsubscribe using -u
manganese sub -u Bleach
```

## Updating

Now you can get the latest chapters for all your subscriptions using only one command.

```
// Update all series
manganese update|up
// Update only some series
manganese update|up "One Piece" Bleach
```

This will only download those that you don't have yet, meaning starting from (but not included) the latest chapter you currently possess.
How does manganese know how far along in the series you are? It will use both of the following techniques:
* It will simply look at your manga folder(s), and figure out what the latest chapter is by looking at each folder's name and chapter number
* The subscription file stored on your computer that registers all your subscriptions also stores your progress. Everytime you download chapters for one of your subscriptions (through `download` or `update`), this file will be updated. Tip: This file could be shared on Dropbox for example so that you can syncronize multiple computers. If wanted, you can disable updating your subscriptions by using `--nocache`.
