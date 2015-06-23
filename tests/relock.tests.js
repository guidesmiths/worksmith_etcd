var worksmith = require('worksmith')
var lock = require('../')('lock')
var relock = require('../')('relock')
var Etcd = require('node-etcd')
var format = require('util').format

describe('relock', function() {

    this.slow(undefined)

    var etcd = new Etcd(['localhost:4001'])
    var assert = require('./assertions')(etcd)

    beforeEach(function(done) {
        assert.init('lock', done)
    })

    it('should error when no etcd client is available in the context', function(done) {
        var workflow = worksmith({
            task: relock
        })

        workflow({}, function(err) {
            assert.error(err, 'No etcd client specified or found in context', done)
        })
    })

    it('should error when no lock is specified', function(done) {
        var workflow = worksmith({
            task: relock,
            etcd: {}
        })

        workflow({}, function(err) {
            assert.error(err, 'No lock specified', done)
        })
    })

    it('should error when the lock has a different value', function(done) {

        var workflow = worksmith({
            task: relock,
            etcd: etcd,
            lock: { key: 'lock/me', value: 'wrong' }
        })

        etcd.set('lock/me', this.title, function(err) {
            assert.ifError(err)
            workflow({}, function(err) {
                assert.error(err, 'Compare failed', done)
            })
        })
    })

    it('should relock an existing lock (which is kind of pointless without a ttl)', function(done) {

        var workflow = worksmith({
            task: 'sequence',
            items: [
                {
                    task: lock,
                    etcd: etcd,
                    key: 'lock/me',
                    resultTo: 'lock1'
                },
                {
                    task: relock,
                    etcd: etcd,
                    lock: '@lock1',
                    resultTo: 'lock2'
                }
            ]
        })

        workflow({}, function(err, result, context) {
            assert.ifError(err)
            assert.equal(context.lock2.key, 'lock/me')
            assert.locked('lock/me', done)
        })
    })

    it('should update the existing locks ttl with the original tll', function(done) {

        this.timeout(5000)

        var workflow = worksmith({
            task: 'sequence',
            items: [
                {
                    task: lock,
                    etcd: etcd,
                    key: 'lock/me',
                    ttl: 2,
                    resultTo: 'lock1'
                },
                {
                    task: 'delay',
                    duration: 1000
                },
                {
                    task: relock,
                    etcd: etcd,
                    lock: '@lock1',
                    resultTo: 'lock2'
                }
            ]
        })

        workflow({}, function(err, result, context) {
            assert.ifError(err)
            assert.equal(context.lock2.ttl, 2)
            assert.locked('lock/me', function() {
                setTimeout(function() {
                    assert.locked('lock/me', function() {})
                }, 1500)
                setTimeout(function() {
                    assert.unlocked('lock/me', done)
                }, 2500)
            })
        })
    })

    it('should extend the existing locks ttl by the specified amount', function(done) {

        this.timeout(5000)

        var workflow = worksmith({
            task: 'sequence',
            items: [
                {
                    task: lock,
                    etcd: etcd,
                    key: 'lock/me',
                    ttl: 2,
                    resultTo: 'lock1'
                },
                {
                    task: 'delay',
                    duration: 1000
                },
                {
                    task: relock,
                    etcd: etcd,
                    lock: '@lock1',
                    ttl: 3,
                    resultTo: 'lock2'
                }
            ]
        })

        workflow({}, function(err, result, context) {
            assert.ifError(err)
            assert.equal(context.lock2.ttl, 3)
            assert.locked('lock/me', function() {
                setTimeout(function() {
                    assert.locked('lock/me', done)
                }, 2500)
                setTimeout(function() {
                    assert.unlocked('lock/me', done)
                }, 3500)
            })
        })
    })
})