var worksmith = require('worksmith')
var unlock = require('../')('unlock')
var assert = require('assert')
var Etcd = require('node-etcd')

describe('unlock', function() {

    var etcd = new Etcd(['localhost:4001'])

    beforeEach(function(done) {
        etcd.rmdir('unlock/', { recursive: true }, function() {
            etcd.mkdir('unlock', done)
        })
    })

    it('should error when no etcd client is available in the default location', function(done) {
        var workflow = worksmith({
            task: unlock
        })

        workflow({}, function(err) {
            assert.ok(err)
            assert.equal(err.message, 'No etcd client found in context')
            done()
        })
    })

    it('should error when no key is available', function(done) {
        var workflow = worksmith({
            task: unlock,
            etcd: {}
        })

        workflow({}, function(err) {
            assert.ok(err)
            assert.equal(err.message, 'No key found in context')
            done()
        })
    })

    it('should release the lock when taken', function(done) {

        var workflow = worksmith({
            task: unlock,
            etcd: etcd,
            key: 'unlock/me'
        })

        etcd.set('unlock/me', this.title, function(err) {
            assert.ifError(err)
            workflow({}, function(err) {
                assert.ifError(err)
                etcd.get('unlock/me', function(err, result) {
                    assert.ok(err)
                    assert.equal(err.message, 'Key not found')
                    done()
                })
            })
        })
    })

    it('should tollerate releasing a non existent lock', function(done) {

        var workflow = worksmith({
            task: unlock,
            etcd: etcd,
            key: 'unlock/me'
        })

        workflow({}, function(err) {
            assert.ifError(err)
            etcd.get('unlock/me', function(err, result) {
                assert.ok(err)
                assert.equal(err.message, 'Key not found')
                done()
            })
        })
    })

    it('should error when asked to unlock a lock with the wrong value', function(done) {

        var workflow = worksmith({
            task: unlock,
            etcd: etcd,
            key: 'unlock/me',
            value: 'wrong'
        })

        etcd.set('unlock/me', this.title, function(err) {
            assert.ifError(err)
            workflow({}, function(err) {
                assert.ok(err)
                assert.equal(err.message, 'Compare failed')
                etcd.get('unlock/me', function(err, result) {
                    assert.ifError(err)
                    done()
                })
            })
        })
    })
})