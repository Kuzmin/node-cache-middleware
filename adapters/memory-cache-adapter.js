
const memoryCache = require('memory-cache');
const Promise = require('bluebird');

/*
 * Adapters allow you to use different backends for the Cache, we default to
 * using the npm package `memory-cache`
 *
 * Everything is wrapped in a Promise so that async backends can be easily
 * supported.
 */
function MemoryCacheAdapter() {

}

MemoryCacheAdapter.prototype.get = key => Promise.resolve(cache.get(key));

MemoryCacheAdapter.prototype.set = ({ key, data, durationMilliseconds }) => {
    return Promise.resolve(cache.put(key, data, durationMilliseconds));
}

MemoryCacheAdapter.prototype.invalidate = key => Promise.resolve(cache.del(key));

MemoryCacheAdapter.prototype.clear = () => Promise.resolve(cache.clear());


module.exports = MemoryCacheAdapter;