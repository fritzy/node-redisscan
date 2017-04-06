# RedisScan

Recursively scans the keyspace of a Redis 2.8+ instance using SCAN, HSCAN, ZSCAN, & SSCAN as well as Lists.

Fairly safe in a production environment as it does **NOT** use KEYS * to iterate.

Optionally pass a redis pattern to filter from.

`scanRedis(args)`

### args (simple object):

* `redis`: `node-redis` instance (required)
* `pattern`: optional wildcard key pattern to match, e.g: `some:key:pattern:*` [redis MATCH docs](https://redis.io/commands/scan#the-match-option)
* `keys_only`: optional boolean -- returns nothing but keys, no types,lengths,values etc. (defaults to `false`)
* `each_callback`: function (type, key, subkey, length, value, finish\_callback)
    type may be string, hash, set, zset, list
    call finish\_callback when done
* `done_callback`: called when done scanning

`each_callback` is called for every string, and every subkey/value in a container when not using `keys_only`, so container keys may be called multiple times.

Example: 

```javascript
var redisScan = require('redisscan');
var redis     = require('redis').createClient();


redisScan({
    redis: redis,
    keys_only: false,
    each_callback: function (type, key, subkey, length, value, cb) {
        console.log(type, key, subkey, length, value);
        cb();
    },
    done_callback: function (err) {
        console.log("-=-=-=-=-=--=-=-=-");
        redis.quit();
    }
});
```
## Note/Warning

If values are changing, there is no guarantee on value integrity. This is not atomic.
I recommend using a lock pattern with this function.

## Install
`npm install redisscan`

License MIT (c) 2014 Nathanael C. Fritz
