# ethtaint

Taint tracking for Ethereum.

Simple web interface:

![](https://raw.githubusercontent.com/wiki/jestcrows/ethtaint/image/WebInterface3.png)

Command line interface:

```bash
$ node bin/ethtaint.js 0xF5C62a46838D1e2Aa104Ef4a7e1A05f72bd58DE3 15900000

$ cat trace/0xf5c62a46838d1e2aa104ef4a7e1a05f72bd58de3-15900000/tainted
$ cat trace/0xf5c62a46838d1e2aa104ef4a7e1a05f72bd58de3-15900000/traced
```

## Usage

Install [NodeJS](https://nodejs.org/en/) version 8.2.1.  

Clone the repository:  
`git clone https://github.com/jestcrows/ethtaint.git`  
`cd ethtaint`  

Install node modules:  
`npm install`  

Provide your [Etherscan API key](https://etherscan.io/apis) in a new local configuration file `config/local.json`:  
```json
{
  "Etherscan": {
    "apiKey": "YOURAPIKEY"
  }
}
```

Start a trace. Specify a source address and taint starting block. Start block defaults to 0:  
`node bin/ethtaint.js 0xF5C62a46838D1e2Aa104Ef4a7e1A05f72bd58DE3 15900000`

Status and results will output to the command line. A list of identified tainted addresses will be written to `trace/SOURCEADDRESS-STARTBLOCK`. Tracing will continue until all existing chain data has been exhausted. A full trace can take a long time.

To use the web interface start the web server with `node web/server.js`. Open the interface in your browser at `http://localhost:7403/`.

You can resume a past trace any time from either interface. Simply start a trace with the same source address and start block. Existing information will be read from the save of past traces. The new trace will continue where the past traces left off.

## Development

Targets these development ideals:

* Well commented.
* Clear [modular architecture](https://github.com/jestcrows/ethtaint/wiki/Architecture).
* Core [data specification](https://github.com/jestcrows/ethtaint/wiki/Data-Specification).
* [Unit tests](https://github.com/jestcrows/ethtaint/tree/master/test).
* Generated [API documentation](https://jestcrows.github.io/ethtaint/).

## Unlicense

ethtaint is [public domain](https://choosealicense.com/licenses/unlicense/).