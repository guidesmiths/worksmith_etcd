# worksmith_etcd

Etcd activities for [worksmith](http://npmjs.com/package/worksmith)

This package contains the following activities/tasks:

name | description
--- | ---
[createClient](#createClient-activity) | Creates an etcd client
[lock](#lock-activity) | Creates a distributed lock using etcd
[unlock](#unlock-activity) | Releases a distributed lock created with the lock activity

### createClient activity
Creates an etcd client
##### params
name | type | description
--- | --- | ---
hosts | array | Array of hosts

##### example

```javascript
var worksmith = require('worksmith')
worksmith.use('etcd', require('worksmith_etcd'))
var workflow = worksmith({task:"sequence", items : [{
    task:'etcd/createClient',
    hosts: ['localhost:4001']
    resultTo: 'etcd'
}])
```

### lock activity
Creates a distributed lock using etcd
##### params
name | type | description
--- | --- | ---
etcd | etcd client | The etcd client (if not specified expected to be in the context 'etcd' property)
key | string | The etcd key to be used in the lock
value | string | Optional value for the lock (defaults to ```new Date().getTime()```)
ttl | integer | Optional time in secords before the lock automatically expires

##### example

```javascript
var worksmith = require('worksmith')
worksmith.use('etcd', require('worksmith_etcd'))
var workflow = worksmith({task:"sequence", items : [{
    task:'etcd/createClient',
    hosts: ['localhost:4001']
    resultTo: 'etcd'
}, {
    task:"etcd/lock",
    key:"record_12345"
    resultTo: "lock.value"
}])
```

### unlock activity
Releases a distributed lock created with the lock activity

##### params
name | type | description
--- | --- | ---
etcd | etcd client | The etcd client (if not specified expected to be in the context 'etcd' property)
key | string | The etcd key to be used in the lock
value | string | Optional value for the lock. If specified both the key and lock must match

##### example

```javascript
var worksmith = require('worksmith')
worksmith.use('etcd', require('worksmith_etcd'))
var workflow = worksmith({task:"sequence", items : [{
    task:'etcd/createClient',
    hosts: ['localhost:4001']
    resultTo: 'etcd'
}, {
    task:"etcd/unlock",
    key:"record_12345"
}])
```

### Running tests
You need an etcd server running on localhost:4001 for the tests to pass. If you have docker and docker-compose installed simply run ```docker-compose up``` in the route of this project, however watch out for [this bug](https://github.com/docker/compose/issues/919).

