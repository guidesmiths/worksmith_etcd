var worksmith = require('worksmith')
var createClient = require('../')('createClient')
var assert = require('assert')
var Etcd = require('node-etcd')

describe('createClient', function() {

    it('should error when no etcd client is available in the default location', function(done) {
        var workflow = worksmith({
            task: createClient,
            hosts: ['localhost:4001'],
            resultTo: 'etcd'
        })

        var title = this.title
        var context = {}

        workflow(context, function(err) {
            assert.ifError(err)
            assert.ok(context.etcd)
            context.etcd.set('test', title, { ttl: 1 }, done)
        })
    })
})