module.exports = function(etcd, _assert) {

    var assert = _assert || require('assert')

    assert.init = function(dir, next) {
        etcd.rmdir(dir + '/', { recursive: true }, function() {
            etcd.mkdir(dir, next)
        })
    }

    assert.locked = function(key, next) {
        etcd.get(key, function(err, result) {
            assert.ifError(err)
            assert.ok(result)
            next()
        })
    }

    assert.unlocked = function(key, next) {
        etcd.get(key, function(err, result) {
            assert.error(err, 'Key not found')
            next()
        })
    }

    assert.error = function(err, message, next) {
        assert.ok(err)
        assert.equal(err.message, message)
        next && next()
    }

    return assert
}