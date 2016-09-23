
const express = require('express');
const cacheMiddleware = require('../');

const app = express();

app.use(cacheMiddleware({
  durationMilliseconds: 10 * 1000,
}));

let count = 0;
app.get('/counter', (req, res, next) => {
  count += 1;

  res.send({ count });
});

let slowCount = 0;
app.get('/slow_counter', (req, res, next) => {
  slowCount += 1;

  setTimeout(() => {
    res.send({ count: slowCount });
  }, 100);
});

const supertest = require('supertest-as-promised');
const expect = require('chai').expect;
const range = require('lodash/range');

const Promise = require('bluebird');

describe('caching middleware', () => {
  const agent = supertest(app);

  it('handles parallell requests properly', done => {
    const promises = range(10).map(() => agent.get('/slow_counter').expect(200));

    Promise.all(promises).then(results => {
      console.log('All requests received');
      results.forEach(res => expect(res.body.count).to.equal(1));
    }).then(done)
      .catch(done);
  });

  it('handles sequential requests properly', done => {
    agent.get('/counter')
      .then(result => {
        expect(result.body.count).to.equal(1);

        return agent.get('/counter');
      }).then(result => {
        expect(result.body.count).to.equal(1);
      }).then(done, done);
  });
});