
const Promise = require('bluebird');

const MemoryCacheAdapter = require('./adapters/memory-cache-adapter');
const defaults = require('lodash/defaults');

/**
 * options.duration - cache duration in milliseconds
 */
const DEFAULT_OPTIONS = {
  durationMilliseconds: 10 * 1000,

  // Test function that returns true/false depending on if the request should
  // be cached or not, defaults to only caching GET requests
  testRequest: req => req.method === 'GET',

  // Cache key
  keyFunction: req => req.originalUrl || req.url,
};

const cache = new MemoryCacheAdapter();
const queue = {};

function sendCacheData(res, cacheData) {
  res.statusCode = cacheData.statusCode
  res.set(cacheData.headers);
  res.end(new Buffer(cacheData.content, "base64"))
}

function middleware(options) {
  if (!options) {
    options = {};
  }

  defaults(options, DEFAULT_OPTIONS);

  return (req, res, next) => {
    // TODO: respect cache invalidation headers?

    if (!options.testRequest(req)) {
      next();
      return;
    }

    const cacheKey = options.keyFunction(req);

    cache.get(cacheKey).then(data => {
      if (data) {
        sendCacheData(res, data);
        return;
      }

      if (queue[cacheKey]) {
        // if there's already a request executing, just add this to the queue
        // and wait for it to finish so that it can return all the responses
        queue[cacheKey].push(res);
        return;
      }

      queue[cacheKey] = [];

      // This callback will be triggered when the intercepted request has
      // completed its' request. It will store the intercepted data in the
      // cache, and write this response to all the queued requests waiting
      // for a response.
      function callback(err, cacheData) {
        cache.set({
          key: cacheKey,
          data: cacheData,
          durationMilliseconds: options.durationMilliseconds,
        });

        queue[cacheKey].forEach(res_ => sendCacheData(res_, cacheData));
        delete queue[cacheKey];
      };

      addInterceptor(res, callback);

      next();
      return;
    });
  };
}

/* adds a special property to `res` that keeps track of all the response data
   written */
function appendWrites(res, data) {
  if (!data) {
    return;
  }

  let buf = data;

  if (typeof data === "string") {
    buf = new Buffer(data);
  }

  if (res._responseBody) {
    res._responseBody = Buffer.concat([res._responseBody, buf]);
  } else {
    res._responseBody = buf;
  }
}

/* Intercepts the output from running this API call and stores it in the
   cache */
function addInterceptor(res, callback) {
  const originalEnd = res.end;

  res.end = function(data) {
    appendWrites(res, data);

    const cacheObject = {
      statusCode: res.statusCode,
      content: res._responseBody ? res._responseBody.toString("base64") : '',
      headers: res._headers
    };

    callback(null, cacheObject);

    return originalEnd.apply(res, arguments);
  }

  const originalWrite = res.write;
  res.write = function (data) {
    appendWrites(res, data);

    return originalWrite.apply(res, arguments);
  }
}

module.exports = middleware;