# SAFEX 1 CLICK MINIG APP

Official repository for SAFEX 1 click cpu mining app.

## Releases

You can download the latest release from (https://github.com/safex/safex_miner/releases)

## Development

#### Backend:

To start project backend

#### MacOS

```
$ npm install
$ ./node_modules/.bin/electron-rebuild
$ npm run dev
```

#### Windows

Run Command Prompt as Administrator
```
$ npm install --global --production windows-build-tools
$ npm install
$ npm run dev
```

## Build:

Run

```
npm run make-all-installers
```

to make all installers. This will work only on Mac because of Mac.

You can also run

```
npm run make-win-installer
npm run make-mac-installer
npm run make-linux-installer
```
separately.

For linux builds, you will need to have `rpmbuild` available on system (`apt-get install rpm`).

## License

MIT License

Copyright (c) 2018 Safex Developers

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
