var debug = require('debug')('worksmith:tasks:etcd:unlock')

module.exports = function(definition) {
    return function(context) {

        execute.inject = ['etcd', 'key', 'value']

        function execute(etcd, key, value, done) {
            etcd = etcd || context.etcd

            if (!etcd) return done(new Error('No etcd client specified or found in context'))
            if (!key) return done(new Error('No key specified'))

            debug('Deleting key: %s with value: %s', key, value ? value : '<anything>')
            etcd.del(key, { prevValue: value }, function(err) {
                if (err && err.errorCode === 100) return done()
                done(err)
            })
        }
        return execute;
    }
}