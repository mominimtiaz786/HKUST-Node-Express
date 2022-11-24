const express = require('express');
const bodyParser = require('body-parser');

const mongoose = require('mongoose');
const Favorites = require('../models/favorites');
const Dishes = require('../models/dishes');
var authenticate = require('../authenticate');
const cors = require('./cors');

const favoriteRouter = express.Router();

favoriteRouter.use(bodyParser.json());

favoriteRouter.route('/')
    .all(authenticate.verifyUser)
    .options(cors.corsWithOptions, (req, res) => {
        res.sendStatus(200);
    })
    .get(cors.cors, (req, res, next) => {
        Favorites.find({ user: req.user._id })
            .populate('dishesList')
            .populate('user')
            .then((favorites) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(favorites);
            }, (err) => next(err))
            .catch((err) => next(err));
    })
    .post(cors.corsWithOptions, 
        (req, res, next) => {
            Favorites.findOne({ user: req.user_id })
                .then((fvrt) => {
                    if (fvrt == null) {
                        Favorites.create({
                            user: req.user._id,
                            dishesList: []
                        })
                            .then((favorite) => {
                                fvrt = favorite;
                            }, err => next(err))
                    }
                    req.body.ForEach((dishId) => {
                        if (fvrt.dishesList.indexOf(dishId) == -1) {
                            fvrt.dishesList.push(dishId);
                        }
                    })
                    fvrt.save()
                        .then((favorite) => {
                            console.log('Favorites Added ', favorite);
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(favorite);
                        }, (err) => next(err))
                })
                .catch((err) => next(err));
        })
    .put(cors.corsWithOptions, 
        (req, res, next) => {
            res.statusCode = 403;
            res.end('PUT operation not supported on /dishes');
        })
    .delete(cors.corsWithOptions, 
        (req, res, next) => {
            Favorites.remove({ user: req.user._id })
                .then((resp) => {
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json(resp);
                }, (err) => next(err))
                .catch((err) => next(err));
        });

favoriteRouter.route('/:dishId')
    .all(authenticate.verifyUser)
    .options(cors.corsWithOptions, (req, res) => {
        res.sendStatus(200);
    })
    .get(cors.cors, (req, res, next) => {
        res.statusCode = 403;
        res.end('Get operation not supported on /favorites/' + req.params.dishId);
    })
    .post(cors.corsWithOptions, 
        (req, res, next) => {
            Favorites.findOne({ user: req.user_id })
                .then((favorite) => {
                    if (favorite == null) {
                        Favorites.create({ user: req.user_id, dishesList: [] })
                            .then((createdfvrt) => {
                                favorite = createdfvrt;
                            }, (err) => next(err));
                    }
                    Dishes.findById(req.params.dishId)
                        .then((reqDish) => {
                            favorite.dishesList.push(reqDish._id);
                            favorite.save()
                                .then((favorite) => {
                                    res.statusCode = 200;
                                    res.setHeader('Content-Type', 'application/json');
                                    res.json(favorite);
                                }, (err) => next(err));
                        }, (err) => next(err));
                }, (err) => next(err))
                .catch(err => next(err))
        })
    .put(cors.corsWithOptions, 
        (req, res, next) => {
            res.statusCode = 403;
            res.end('Put operation not supported on /dishes/' + req.params.dishId);
        })
    .delete(cors.corsWithOptions, 
        (req, res, next) => {
            Favorites.findOne({ user: req.user_id })
                .then((favorite) => {
                    favorite.dishesList.id(req.params.dishId).remove();
                    favorite.save()
                        .then((favorite) => {
                            res.statusCode = 200;
                            res.setHeader('Content-Type', 'application/json');
                            res.json(favorite);
                        }, (err) => next(err));
                })
        });



module.exports = favoriteRouter;