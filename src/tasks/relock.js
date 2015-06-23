var debug = require('debug')('worksmith:tasks:etcd:relock')
var uuid = require('node-uuid').v4

module.exports = function(definition) {
    return function(context) {

        execute.inject = ['etcd', 'lock', 'ttl', 'errorOnExists']

        function execute(etcd, lock, ttl, errorOnExists, done) {
            etcd = etcd || context.etcd

            if (!etcd) return done(new Error('No etcd client specified or found in context'))
            if (!lock) return done(new Error('No lock specified'))

            ttl = ttl || lock.ttl

            debug('Setting key: %s to value: %s with ttl: %d', lock.key, lock.value, ttl)
            etcd.set(lock.key, lock.value, { prevValue: lock.value, ttl: ttl }, function(err) {
                if (err) return done(err)
                done(null, { key: lock.key, value: lock.value, ttl: ttl })
            })
        }
        return execute
    }
}