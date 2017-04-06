var async = require('async');
var redis, pattern, keys_only, count_amt, each_callback;

module.exports = function (args) {
    redis            = args.redis;
    pattern          = args.pattern || pattern;
    keys_only        = args.keys_only;
    count_amt        = args.count_amt;
    each_callback    = args.each_callback;

    genericScan(args.cmd, args.key, args.done_callback);
};

var genericScan = function(cmd, key, callback) {

    cmd      = cmd || 'SCAN';
    key      = key || null;
    callback = callback || function(){};

    var iter = '0';
    async.doWhilst(
        function (acb) {
            //scan with the current iterator, matching the given pattern
            var args = [iter];
            if (cmd === 'SCAN') {
                if (pattern) {
                    args = args.concat(['MATCH', pattern]);
                }
                if (count_amt){
                    args = args.concat(['COUNT', count_amt]);
                }
            } else {
                args = [key].concat(args);
            }
            redis.send_command(cmd, args, function (err, result) {

                var idx = 0;
                var keys;
                if (err) {
                    acb(err);
                } else {
                    //update the iterator
                    iter = result[0];
                    //each key, limit to 5 pending callbacks at a time
                    if (['SCAN', 'SSCAN'].indexOf(cmd) !== -1) {

                        async.eachSeries(result[1], function (subkey, next) {
                            if (keys_only){
                                each_callback(null, subkey, null, null, null, next);
                            } else if (cmd === 'SCAN') {
                                redis.type(subkey, function (err, sresult) {
                                    var value;
                                    if (err) {
                                        next(err);
                                    } else {
                                        if (sresult === 'string') {
                                            redis.get(subkey, function (err, value) {
                                                if (err) {
                                                    next(err);
                                                } else {
                                                    each_callback('string', subkey, null, null, value, next);
                                                }
                                            });
                                        } else if (sresult === 'hash') {
                                            genericScan('HSCAN', subkey, next);
                                        } else if (sresult === 'set') {
                                            genericScan('SSCAN', subkey, next);
                                        } else if (sresult === 'zset') {
                                            genericScan('ZSCAN', subkey, next);
                                        } else if (sresult === 'list') {
                                            //each_callback('list', subkey, null, null, next);
                                            redis.llen(subkey, function (err, length) {
                                                var idx = 0;
                                                length = parseInt(length);
                                                if (err) {
                                                    next(err);
                                                } else {
                                                    async.doWhilst(
                                                        function (wcb) {
                                                            redis.lindex(subkey, idx, function (err, value) {
                                                                each_callback('list', subkey, idx, length, value, wcb);
                                                            });
                                                        },
                                                        function () { idx++; return idx < length; },
                                                        function (err) {
                                                            next(err);
                                                        }
                                                    );
                                                }
                                            });
                                    }
                                    }
                                });
                            } else if (cmd === 'SSCAN') {
                                each_callback('set', key, idx, null, subkey, next);
                            }
                            idx++;
                        },
                        function (err) {
                            //done with this scan iterator; on to the next
                            acb(err);
                        });
                    } else {
                        var idx2 = 0;
                        async.doWhilst(
                            function (ecb) {
                                var subkey = result[1][idx2];
                                var value = result[1][idx2+1];
                                if (cmd === 'HSCAN') {
                                    each_callback('hash', key, subkey, null, value, ecb);
                                } else if (cmd === 'ZSCAN') {
                                    each_callback('zset', key, value, null, subkey, ecb);
                                }
                            },
                            function () {idx2 += 2; return idx2 < result[1].length;},
                            function (err) {
                                acb(err);
                            }
                        );
                    }
                }
            });
        },
        //test to see if iterator is done
        function () { return iter != '0'; },
        //done
        function (err) {
            callback(err);
            // done_callback(err);
        }
    );
};



