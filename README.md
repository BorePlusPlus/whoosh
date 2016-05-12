# Whoosh

Whoosh is an ultra thin wrapper for [SFTPStream](https://github.com/mscdex/ssh2-streams/blob/master/SFTPStream.md). It's so thin that there's not much point using it unless you want to stream in memory content to/from an SFTP server.

## Usage

### Connecting
```js
Whoosh.connect({
    hostname: 'sftp.example.com',
    port: 22,
    username: 'fred',
    password: 'secret'
}, function(err, whoosh) {
    // Do stuff with whoosh
})
```
See the [ssh2 client docs](https://github.com/mscdex/ssh2#client-methods) for a full list of connection parameters

### What can I do with whoosh?

#### isConnected (sync)
```js
Whoosh.connect(config, function(err, whoosh) {
    if (err) return bail(err)
    assert.ok(whoosh.isConnected())
    whoosh.disconnect(function() {
        assert.ok(!whoosh.isConnected())
    )}
})
```

#### isConnected (async)
```js
Whoosh.connect(config, function(err, whoosh) {
    if (err) return bail(err)
    whoosh.isConnected(function(err, connected) {
        assert.ok(connected)
        whoosh.disconnect(function() {
            whoosh.isConnected(function(err, connected) {
                assert.ok(!connected)
            })
        })
    )}
})
```
#### getContent
Streams the contents of a remote file to a variable
```js
Whoosh.connect(config, function(err, whoosh) {
    if (err) return bail(err)
    whoosh.getContent('some/remote/file', options, function(err, content, stats) {
        whoosh.disconnect(function() {
            if (err) return bail(err)
            console.log('Downloaded ' + stats.bytes + ' bytes in ' + stats.duration + 'ms')
        )}
    })
})
```
The options parameter is is optional. When specified it is passed straight through to [SFTPStream's](https://github.com/mscdex/ssh2-streams/blob/master/SFTPStream.md) ```createReadStream``` method.

#### putContent
Streams the contents of a variable to a remote file
```js
var content = 'my content'
Whoosh.connect(config, function(err, whoosh) {
    if (err) return bail(err)
    whoosh.putContent(content, 'some/remote/file', options, function(err, stats) {
        whoosh.disconnect(function() {
            if (err) return bail(err)
            console.log('Uploaded ' + stats.bytes + ' bytes in ' + stats.duration + 'ms')
        })
    })
})
```
The options parameter is is optional. When specified it is passed straight through to [SFTPStream's](https://github.com/mscdex/ssh2-streams/blob/master/SFTPStream.md) ```createWriteStream``` method.

#### exists
Reports on whether a remote file exists
```js
Whoosh.connect(config, function(err, whoosh) {
    if (err) return bail(err)
    whoosh.exists('some/remote/file', function(err, exists) {
        whoosh.disconnect(function() {
            if (err) return bail(err)
            console.log(exists ? 'File exists' : 'File does not exist')
        )}
    })
})
```
#### Everything else

The ```whoosh``` object is just a decorated instance of [SFTPStream](https://github.com/mscdex/ssh2-streams/blob/master/SFTPStream.md) so all the other SFTP methods are available. e.g.
```js
Whoosh.connect(config, function(err, whoosh) {
    if (err) return bail(err)
    whoosh.unlink('some/remote/file', function(err) {
        whoosh.disconnect(function() {
            if (err) return bail(err)
            console.log('Deleted some/remote/file')
        })
    })
})
```



