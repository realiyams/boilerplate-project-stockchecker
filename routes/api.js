const fetch = require('node-fetch')
const mongoose = require('mongoose')
const Schema = mongoose.Schema
const Model = mongoose.model
'use strict';

const getPrice = (stockName, likes, res) => {

  if (typeof stockName === 'string')
    fetch('https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/' + stockName + '/quote')
    .then(response => response.json())
    .then(json => {
      return res.json({
        stockData: {
          stock: stockName,
          price: (json.latestPrice) ? json.latestPrice : 0,
          likes: likes
        }
      })
    })
  else {
    fetch('https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/' + stockName[0] + '/quote')
    .then(response => response.json())
    .then(firstStock => {
      const stock1 = firstStock

      fetch('https://stock-price-checker-proxy.freecodecamp.rocks/v1/stock/' + stockName[1] + '/quote')
      .then(response => response.json())
      .then(secondStock => {
        const stock2 = secondStock
        const rel_likes1 = likes[0] - likes[1]
        const rel_likes2 = likes[1] - likes[0]
        
        const arrStock1 = {
          stock: stockName[0],
          price: (firstStock.latestPrice) ? firstStock.latestPrice : 0,
          rel_likes: rel_likes1
        }

        const arrStock2 = {
          stock: stockName[1],
          price: (secondStock.latestPrice) ? secondStock.latestPrice : 0,
          rel_likes: rel_likes2
        }

        return res.json({
          stockData: [
            arrStock1,
            arrStock2
          ]
        })
      })
    })
  }
}

const insertStock = (stock, stockSymbol, like, ip) => {
  const newStock = new stock({
    name: stockSymbol,
    likes: (like === 'true' ? 1 : 0),
    ips: (like === 'true' ? [ip] : [])
  })

  newStock.save()
}

const updateStock = (stock, stockSymbol, like, ip) => {
  stock.findOne(
    {name: stockSymbol},
    (err, found) => {
      if (!err && found)
        if (like === 'true' && !found.ips.includes(ip)){
          found.likes += 1
          found.ips.push(ip)
          found.save()
        }
      else if (!found) 
        insertStock(stock, stockSymbol, like, ip)
    }
  )
}

module.exports = function (app) {

  const connect = mongoose.connect(process.env.DB, {useNewUrlParser: true, useUnifiedTopology: true})

  const stockSchema = new Schema({
    name: {type: String, required: true},
    likes: {type: Number, default: 0},
    ips: [String]
  })

  const stock = Model('Stock', stockSchema)

  app.route('/api/stock-prices')
    .get(function (req, res){
      const stockSymbol = req.query.stock
      const { like } = req.query
      const { ip } = req
      
      if (typeof stockSymbol === 'string'){
        stock.findOne(
          {name: stockSymbol},
          (err, found) => {
            if (!err && found)
              if (like === 'true' && !found.ips.includes(ip)){
                found.likes += 1
                found.ips.push(ip)

                found.save((err, saved) => {
                  if (!err && saved)
                    getPrice(saved.name, saved.likes, res)
                })
              } else getPrice(found.name, found.likes, res)

            if (!found) {
              const newStock = new stock({
                name: stockSymbol,
                likes: (like === 'true' ? 1 : 0),
                ips: (like === 'true' ? [ip] : [])
              })

              newStock.save((err, saved) => {
                if (!err && saved)
                  getPrice(saved.name, saved.likes, res)
              })
            }
          }
        )
      } else {
        stock.find({name: {$in: stockSymbol}}, (err, found) => {
          if (!err && found) {
            if (0 != found.length <= 2) {
              found.forEach(element => {
                updateStock(stock, element.name, like, ip)
              })
            }

            if (found.length === 0){
              stockSymbol.forEach(element => {
                insertStock(stock, element, like, ip)
              })
            }
          }
        })

        stock.find({name: {$in: stockSymbol}}, (err, found) => {
          if (!err && found) {
            const arrLikes = [
              (found[0]) ? found[0].likes : 0, 
              (found[1]) ? found[1].likes : 0
            ]
            getPrice(stockSymbol, arrLikes, res)
          }
        })
      }


    });
    
};
