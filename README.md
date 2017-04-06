# RedisScan

Recursively scans the keyspace of a Redis 2.8+ instance using SCAN, HSCAN, ZSCAN, & SSCAN as well as Lists.

Fairly safe in a production environment as it does **NOT** use KEYS * to iterate.

Optionally pass a redis pattern to filter from.

## Install
`npm install redisscan`

## Example 

```javascript
var redisScan = require('redisscan');
var redis     = require('redis').createClient();


redisScan({
    redis: redis,
    pattern: 'awesome:key:prefix:*',
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

### redisScan(parameters):

* `redis`: **required** `node-redis` client instance 
* `pattern`: **optional** wildcard key pattern to match, e.g: `some:key:pattern:*` [docs](https://redis.io/commands/scan#the-match-option)
* `keys_only`: **optional** boolean -- returns nothing but keys, no types,lengths,values etc. (defaults to `false`)
* `count_amt`: **optional** positive/non-zero integer -- redis hint for work done per SCAN operation (defaults to 10) [docs](https://redis.io/commands/scan#the-count-option)
* `each_callback`: **required** `function (type, key, subkey, length, value, next)`  This is called for every string, and every subkey/value in a container when not using `keys_only`, so outer keys may show up multiple times.
    * `type` may be `"string"`, `"hash"`, `"set"`, `"zset"`, `"list"`
    * `key` is the redis key
    * `subkey` may be `null` or populated with a hash key
    * `length` is the length of a set or list
    * `value` is the value of the key or subkey when appropriate
    * `next()` should be called as a function with no arguments if successful or an `Error` object if not.
* `done_callback`: **optional** function called when scanning completes with one argument, and `Error` object if an error ws raised

## Note/Warning

If values are changing, there is no guarantee on value integrity. This is not atomic.
I recommend using a lock pattern with this function.



License MIT (c) 2014 Nathanael C. Fritz
