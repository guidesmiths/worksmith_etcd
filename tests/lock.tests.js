var worksmith = require('worksmith')
var lock = require('../')('lock')
var Etcd = require('node-etcd')
var format = require('util').format

describe('lock', function() {

    var etcd = new Etcd(['localhost:4001'])
    var assert = require('./assertions')(etcd)

    beforeEach(function(done) {
        assert.init('lock', done)
    })

    it('should error when no etcd client is available in the context', function(done) {
        var workflow = worksmith({
            task: lock
        })

        workflow({}, function(err) {
            assert.error(err, 'No etcd client specified or found in context', done)
        })
    })

    it('should error when no key is specified', function(done) {
        var workflow = worksmith({
            task: lock,
            etcd: {}
        })

        workflow({}, function(err) {
            assert.error(err, 'No key specified', done)
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
            assert.locked('lock/me', done)
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
                assert.error(err, 'Key already exists', done)
            })
        })
    })



    it('should default the lock value to a uuid', function(done) {

        var workflow = worksmith({
            task: lock,
            etcd: etcd,
            key: 'lock/me'
        })

        workflow({}, function(err) {
            assert.ifError(err)
            etcd.get('lock/me', function(err, result) {
                assert.ifError(err)
                assert.ok(result.node.value)
                assert.ok(/\w+-\w+-\w+-\w+-\w+/.test(result.node.value), format('%s failed to match expected pattern', result.node.value))
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

        workflow({}, function(err) {
            assert.ifError(err)
            assert.locked('lock/me', function() {
                setTimeout(function() {
                    assert.unlocked('lock/me', done)
                }, 2000)
            })
        })
    })

    it('should return the key and value', function(done) {

        var workflow = worksmith({
            task: lock,
            etcd: etcd,
            key: 'lock/me',
            value: 'foo',
            ttl: 1,
            resultTo: 'lock'
        })

        var ctx = {}

        workflow(ctx, function(err) {
            assert.ifError(err)
            assert.equal(ctx.lock.key, 'lock/me')
            assert.equal(ctx.lock.value, 'foo')
            assert.equal(ctx.lock.ttl, 1)
            done()
        })
    })


    it('should supress errors when the lock is already taken and errorOnExists is false', function(done) {

        var workflow = worksmith({
            task: lock,
            etcd: etcd,
            key: 'lock/me',
            errorOnExists: false,
            resultTo: 'lock'
        })

        var ctx = {}

        etcd.set('lock/me', this.title, function(err) {
            assert.ifError(err)
            workflow(ctx, function(err) {
                assert.ifError(err)
                assert.ok(!ctx.lock)
                done()
            })
        })
    })

})