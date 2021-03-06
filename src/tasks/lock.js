var debug = require('debug')('worksmith:tasks:etcd:lock')
var uuid = require('node-uuid').v4

module.exports = function(definition) {
    return function(context) {

        execute.inject = ['etcd', 'key', 'value', 'ttl', 'errorOnExists']

        function execute(etcd, key, value, ttl, errorOnExists, done) {
            etcd = etcd || context.etcd
            value = value || uuid()
            errorOnExists = errorOnExists !== undefined ? errorOnExists : true

            if (!etcd) return done(new Error('No etcd client specified or found in context'))
            if (!key) return done(new Error('No key specified'))

            debug('Setting key: %s to value: %s with ttl: %d', key, value, ttl)
            etcd.set(key, value, { prevExist: false, ttl: ttl }, function(err) {
                if (err && err.errorCode === 105 && !errorOnExists) return done()
                if (err) return done(err)
                done(null, { key: key, value: value, ttl: ttl })
            })
        }
        return execute
    }
}