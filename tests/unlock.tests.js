var worksmith = require('worksmith')
var unlock = require('../')('unlock')
var Etcd = require('node-etcd')

describe('unlock', function() {

    var etcd = new Etcd(['localhost:4001'])
    var assert = require('./assertions')(etcd)

    beforeEach(function(done) {
        assert.init('lock', done)
    })

    it('should error when no etcd client is available in the default location', function(done) {
        var workflow = worksmith({
            task: unlock
        })

        workflow({}, function(err) {
            assert.error(err, 'No etcd client found in context', done)
        })
    })

    it('should error when no key is available', function(done) {
        var workflow = worksmith({
            task: unlock,
            etcd: {}
        })

        workflow({}, function(err) {
            assert.error(err, 'No key found in context', done)
        })
    })

    it('should release the lock when taken', function(done) {

        var workflow = worksmith({
            task: unlock,
            etcd: etcd,
            key: 'lock/me'
        })

        etcd.set('lock/me', this.title, function(err) {
            assert.ifError(err)
            workflow({}, function(err) {
                assert.ifError(err)
                assert.unlocked('lock/me', done)
            })
        })
    })

    it('should tollerate releasing a non existent lock', function(done) {

        var workflow = worksmith({
            task: unlock,
            etcd: etcd,
            key: 'lock/me'
        })

        workflow({}, function(err) {
            assert.ifError(err)
            assert.unlocked('lock/me', done)
        })
    })

    it('should error when asked to unlock a lock with the wrong value', function(done) {

        var workflow = worksmith({
            task: unlock,
            etcd: etcd,
            key: 'lock/me',
            value: 'wrong'
        })

        etcd.set('lock/me', this.title, function(err) {
            assert.ifError(err)
            workflow({}, function(err) {
                assert.error(err, 'Compare failed', done)
            })
        })
    })
})