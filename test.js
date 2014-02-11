var redisScan   = require('./index.js');
var redis       = require('redis').createClient();

redisScan({
    redis: redis,
    each_callback: function (type, key, subkey, value, cb) {
        console.log(type, key, subkey, value);
        cb();
    },
    done_callback: function (err) {
        console.log("-=-=-=-=-=--=-=-=-");
        redis.quit();
    }
});
