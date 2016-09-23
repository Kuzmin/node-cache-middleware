# node-cache-middleware

Express middleware to cache API routes

![Travis](https://travis-ci.org/Kuzmin/node-cache-middleware.svg)

## The basics

``` JavaScript
const cacheMiddleware = require('node-cache-middleware');

app.get(
    '/slow_endpoint',
    cacheMiddleware({
        durationMilliseconds: 30 * 1000,
    }),
    (req, res, next) => "..."
);
```

## Caching backends

This comes with a in-memory cache using the Node `memory-cache` package.
It does support writing your own adapter for memcached/redis or whatever else
floats your boat.

## Credits

Based on [kwhitley/apicache](https://github.com/kwhitley/apicache), and [addisonj/node-cacher](https://github.com/addisonj/node-cacher), but with some changes to better
handle the thundering herd problem.
