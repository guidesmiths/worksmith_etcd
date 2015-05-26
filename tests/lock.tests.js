var worksmith = require('worksmith')
var lock = require('../')('lock')
var assert = require('assert')
var Etcd = require('node-etcd')

describe('lock', function() {

    var etcd = new Etcd(['localhost:4001'])

    beforeEach(function(done) {
        etcd.rmdir('lock/', { recursive: true }, function() {
            etcd.mkdir('lock', done)
        })
    })

    it('should error when no etcd client is available in the default location', function(done) {
        var workflow = worksmith({
            task: lock
        })

        workflow({}, function(err) {
            assert.ok(err)
            assert.equal(err.message, 'No etcd client found in context')
            done()
        })
    })

    it('should error when no key is available', function(done) {
        var workflow = worksmith({
            task: lock,
            etcd: {}
        })

        workflow({}, function(err) {
            assert.ok(err)
            assert.equal(err.message, 'No key found in context')
            done()
        })
    })

    it('should aquire the lock when available', function(done) {

        var workflow = worksmith({
            task: lock,
            etcd: etcd,
            key: 'lock/me'
        })

        workflow({}, function(err) {
            assert.ifError(err)
            etcd.get('lock/me', function(err, value) {
                assert.ifError(err)
                assert.ok(value)
                done()
            })
        })
    })

    it('should error when the lock is already taken', function(done) {

        var workflow = worksmith({
            task: lock,
            etcd: etcd,
            key: 'lock/me'
        })

        etcd.set('lock/me', this.title, function(err) {
            assert.ifError(err)
            workflow({}, function(err) {
                assert.ok(err)
                assert.equal(err.message, 'Key already exists')
                done()
            })
        })
    })

    it('should default the lock value to the current time in millis', function(done) {

        var workflow = worksmith({
            task: lock,
            etcd: etcd,
            key: 'lock/me'
        })

        var before = new Date().getTime()

        workflow({}, function(err) {
            assert.ifError(err)
            etcd.get('lock/me', function(err, result) {
                assert.ifError(err)
                assert.ok(result.node.value)
                assert.ok(result.node.value >= before)
                assert.ok(result.node.value <= before + 1000)
                done()
            })
        })
    })

    it('should use the given lock value when specified', function(done) {

        var workflow = worksmith({
            task: lock,
            etcd: etcd,
            key: 'lock/me',
            value: 'foo'
        })

        var before = new Date().getTime()

        workflow({}, function(err) {
            assert.ifError(err)
            etcd.get('lock/me', function(err, result) {
                assert.ifError(err)
                assert.equal(result.node.value, 'foo')
                done()
            })
        })
    })

    it('should use expire the lock after the specified ttl', function(done) {

        this.timeout(5000)
        this.slow(undefined)

        var workflow = worksmith({
            task: lock,
            etcd: etcd,
            key: 'lock/me',
            ttl: 1
        })

        var before = new Date().getTime()

        workflow({}, function(err) {
            assert.ifError(err)
            etcd.get('lock/me', function(err, result) {
                assert.ifError(err)
                setTimeout(function() {
                    etcd.get('lock/me', function(err, result) {
                        console.log(result)
                        assert.ok(err)
                        done()
                    })
                }, 2000)
            })
        })
    })

})