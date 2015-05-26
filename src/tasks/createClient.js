var Etcd = require('node-etcd')
var debug = require('debug')('worksmith:tasks:etcd:createClient')

module.exports = function(definition) {
    return function(context) {

        execute.inject = ["hosts"]
        function execute(hosts, done) {
            var etcd = new Etcd(hosts)
            done(null, etcd)
        }
        return execute;
    }
}