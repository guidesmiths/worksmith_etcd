var debug = require('debug')('worksmith:tasks:etcd:lock')

module.exports = function(definition) {
    return function(context) {

        function execute(done) {
            var etcd = context.get(definition.etcd) || context.etcd
            var key = context.get(definition.key)
            var value = context.get(definition.value) || new Date().getTime()
            var ttl = context.get(definition.ttl)

            if (!etcd) return done(new Error('No etcd client found in context'))
            if (!key) return done(new Error('No key found in context'))

            debug('Setting key: %s to value: %s with ttl: %d', key, value, ttl)
            etcd.set(key, value, { prevExist: false, ttl: ttl }, function(err) {
                done(err, value)
            })
        }
        return execute;
    }
}