const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
  test('Viewing one stock', done => {
    chai.request(server)
    .get('/api/stock-prices')
    .query({stock: 'GOOG'})
    .end((err, res) => {
      assert.equal(res.body.stockData.stock, 'GOOG')
      assert.isNotNull(res.body.stockData.price)
      assert.isNotNull(res.body.stockData.likes)
      done()
    })
  })

  test('Viewing one stock and liking it', done => {
    chai.request(server)
    .get('/api/stock-prices')
    .query({stock: 'MSFT', like: 'true'})
    .end((err, res) => {
      assert.equal(res.body.stockData.stock, 'MSFT')
      assert.equal(res.body.stockData.likes, 1)
      done()
    })
  })

  test('Viewing the same stock and liking it again', done => {
    chai.request(server)
    .get('/api/stock-prices')
    .query({stock: 'MSFT', like: 'true'})
    .end((err, res) => {
      assert.equal(res.body.stockData.stock, 'MSFT')
      assert.equal(res.body.stockData.likes, 1)
      done()
    })
  })

  test('Viewing two stocks', done => {
    chai.request(server)
    .get('/api/stock-prices')
    .query({stock: ['GOOG', 'MSFT']})
    .end((err, res) => {
      
      let stockData = res.body.stockData
      
      assert.isArray(stockData)

      if(stockData[0].stock === 'GOOG'){
        assert.equal(stockData[0].stock, 'GOOG')
        assert.equal(stockData[0].rel_likes, -1)
        assert.equal(stockData[1].stock, 'MSFT')
        assert.equal(stockData[1].rel_likes, 1)
      }else{
        assert.equal(stockData[1].stock, 'MSFT')
        assert.equal(stockData[1].rel_likes, 1)
        assert.equal(stockData[0].stock, 'GOOG')
        assert.equal(stockData[0].rel_likes, -1)
      }
      done()
    })
  })

  test('Viewing two stocks and liking them', done => {
    chai.request(server)
    .get('/api/stock-prices')
    .query({stock: ['aapl', 'amzn'], like: 'true'})
    .end((err, res) => {
      
      let stockData = res.body.stockData
      
      assert.isArray(stockData)

      if(stockData[0].stock === 'aapl'){
        assert.equal(stockData[0].stock, 'aapl')
        assert.equal(stockData[0].rel_likes, 0)
        assert.equal(stockData[1].stock, 'amzn')
        assert.equal(stockData[1].rel_likes, 0)
      }else{
        assert.equal(stockData[1].stock, 'amzn')
        assert.equal(stockData[1].rel_likes, 0)
        assert.equal(stockData[0].stock, 'aapl')
        assert.equal(stockData[0].rel_likes, 0)
      }
      done()
    })
  })
});
