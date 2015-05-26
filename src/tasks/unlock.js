var debug = require('debug')('worksmith:tasks:etcd:unlock')

module.exports = function(definition) {
    return function(context) {

        function execute(done) {
            var etcd = context.get(definition.etcd) || context.etcd
            var key = context.get(definition.key)
            var value = context.get(definition.value)

            if (!etcd) return done(new Error('No etcd client found in context'))
            if (!key) return done(new Error('No key found in context'))

            debug('Deleting key: %s with value: %s', key, value ? value : '<anything>')
            etcd.del(key, { prevValue: value }, function(err) {
                if (err && err.errorCode === 100) return done()
                done(err)
            })
        }
        return execute;
    }
}