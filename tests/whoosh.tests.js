var assert = require('assert')
var _ = require('lodash')
var async = require('async')
var fs = require('fs-extra')
var crypto = require('crypto')
var Whoosh = require('..')

describe('whoosh', function() {

    this.slow(undefined)
    this.timeout(60000)

    beforeEach(nuke)

    after(nuke)

    function nuke(next) {
        async.series([
            fs.remove.bind(fs, getLocalPath()),
            fs.mkdirp.bind(fs, getLocalPath()),
            fs.chmod.bind(fs, getLocalPath(), '0777')
        ], next)
    }

    var config = {
        hostname: 'localhost',
        port: 10022,
        username: 'fred',
        password: 'password'
    }

    it('should report connection errors', function(done) {
        Whoosh.connect(_.defaults({ hostname: 'this-server-should-not-resolve-12asdf32'}, config), function(err, whoosh) {
            assert.ok(err, 'Connection error was not reported')
            assert.equal(err.message, 'getaddrinfo ENOTFOUND')
            done()
        })
    })

    it('should report connection errors', function(done) {
        Whoosh.connect(_.defaults({ password: 'bad'}, config), function(err, whoosh) {
            assert.ok(err, 'Connection error was not reported')
            assert.equal(err.message, 'All configured authentication methods failed')
            done()
        })
    })

    it('should connect successfully', function(done) {
        Whoosh.connect(config, function(err, whoosh) {
            assert.ifError(err)
            whoosh.stat('.', function(err, stats) {
                assert.ifError(err)
                assert.ok(stats)
                whoosh.disconnect(done)
            })
        })
    })

    it('should upload text content', function(done) {
        var title = this.test.title
        Whoosh.connect(config, function(err, whoosh) {
            assert.ifError(err)
            whoosh.putContent('test message', getRemotePath(title), function(err, stats) {
                assert.ifError(err)
                assert.equal('test message', fs.readFileSync(getLocalPath(title)).toString())
                assert.equal(stats.size, 12)
                whoosh.disconnect(done)
            })
        })
    })

    it('should download text content', function(done) {
        var title = this.test.title
        Whoosh.connect(config, function(err, whoosh) {
            assert.ifError(err)
            fs.writeFileSync(getLocalPath(title), 'test message')
            whoosh.getContent(getRemotePath(title), function(err, content) {
                assert.equal('test message', content)
                whoosh.disconnect(done)
            })
        })
    })

    it('should upload binary content', function(done) {
        var title = this.test.title
        Whoosh.connect(config, function(err, whoosh) {
            assert.ifError(err)
            whoosh.putContent(new Buffer('test message'), getRemotePath(title), function(err, stats) {
                assert.ifError(err)
                assert.equal('test message', fs.readFileSync(getLocalPath(title)).toString())
                assert.equal(stats.size, 12)
                whoosh.disconnect(done)
            })
        })
    })

    it('should download binary content', function(done) {
        var title = this.test.title
        Whoosh.connect(config, function(err, whoosh) {
            assert.ifError(err)
            fs.writeFileSync(getLocalPath(title), new Buffer('test message'))
            whoosh.getContent(getRemotePath(title), function(err, content) {
                assert.equal('test message', content)
                whoosh.disconnect(done)
            })
        })
    })

    it('should support multiple serial operations', function(done) {
        var title = this.test.title
        Whoosh.connect(config, function(err, whoosh) {
            assert.ifError(err)
            async.series({
                a: whoosh.putContent.bind(whoosh, 'test message 1', getRemotePath(title + '_1')),
                b: whoosh.putContent.bind(whoosh, 'test message 2', getRemotePath(title + '_2')),
                c: whoosh.putContent.bind(whoosh, 'test message 3', getRemotePath(title + '_3')),
                list: whoosh.readdir.bind(whoosh, getRemotePath())
            }, function(err, results) {
                assert.ifError(err)
                assert.equal(results.list.length, 3)
                whoosh.disconnect(done)
            })
        })
    })

    it('should upload large files', function(done) {
        var title = this.test.title
        var content = crypto.pseudoRandomBytes(1024 * 1024).toString('hex')

        Whoosh.connect(config, function(err, whoosh) {
            assert.ifError(err)
            whoosh.putContent(content, getRemotePath(title), function(err) {
                assert.ifError(err)
                assert.equal(content, fs.readFileSync(getLocalPath(title)).toString())
                whoosh.disconnect(done)
            })
        })
    })

    it('should upload a lot of files', function(done) {
        var title = this.test.title
        var content = crypto.pseudoRandomBytes(1024).toString('hex')

        Whoosh.connect(config, function(err, whoosh) {
            assert.ifError(err)
            async.timesLimit(1000, 50, function(index, next) {
                whoosh.putContent(content, getRemotePath(title + '_' + index), next)
            }, function(err) {
                assert.ifError(err)
                whoosh.readdir(getRemotePath(), function(err, list) {
                    assert.ifError(err)
                    assert.equal(list.length, 1000)
                    assert.ok(!_.find(list, function(stat) {
                        return stat.attrs.size !== content.length
                    }), 'File was corrupted during upload')
                    whoosh.disconnect(done)
                })
            })
        })
    })

    it('should upload content and disconnect', function(done) {
        var title = this.test.title
        Whoosh.connect(config, function(err, whoosh) {
            assert.ifError(err)
            whoosh.putContentAndDisconnect('test message', getRemotePath(title), function(err, stats) {
                assert.ifError(err)
                assert.equal('test message', fs.readFileSync(getLocalPath(title)).toString())
                assert.equal(stats.size, 12)
                done()
            })
        })
    })

    it('should download content and disconnect', function(done) {
        var title = this.test.title
        Whoosh.connect(config, function(err, whoosh) {
            assert.ifError(err)
            fs.writeFileSync(getLocalPath(title), 'test message')
            whoosh.getContentAndDisconnect(getRemotePath(title), function(err, content) {
                assert.equal('test message', content)
                done()
            })
        })
    })

    function getRemotePath(filename) {
        return 'files/uploads/' + (filename ? filename.replace(/\W/g, '_') : '')
    }

    function getLocalPath(filename) {
        return __dirname + '/volumes/sftp/home/fred/' + getRemotePath(filename)
    }

})