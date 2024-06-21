const express = require('express');
const router = express.Router();
const {
  addCerita,
  addFavorite,
  getFavoriteCerita,
  getAllCerita,
  getAllCeritaFilter,
  addHistory,
  getHistory,
  getCeritaById,
  deleteFavorite,
} = require('../controllers/cerita.js');
const { UserMiddleware, guestMiddleware } = require('../middleware/middlware.js');

router.get('/getCerita/:ceritaId', guestMiddleware, getCeritaById);
router.get('/getAllCerita', guestMiddleware, getAllCerita);
router.get('/getAllCeritaFilter', guestMiddleware, getAllCeritaFilter);
router.get('/getHistory', UserMiddleware, getHistory);

router.post('/addCerita', UserMiddleware, addCerita);
router.post('/addFavorite', UserMiddleware, addFavorite);
router.post('/getFavoriteCerita', UserMiddleware, getFavoriteCerita);

router.post('/addHistory', UserMiddleware, addHistory);

router.delete('/deleteFavorite', UserMiddleware, deleteFavorite);
module.exports = router;
