const express = require('express');
const controller = require('../controllers/usercontroller');
const authenticateToken = require('../middlewear/authenticateToken');
const router = express.Router();


router.post('/register',controller.register);
router.post('/login',controller.login);
// post all field data
router.post('/add',controller.datainsert);
// post city
router.post('/cityadd',controller.cityadd);
// post bank holiday
router.post('/bankholidayadd',controller.bankholidayadd);




// get all data
router.get('/all',authenticateToken,controller.all);
// get single date data
router.get('/singledata',authenticateToken,controller.date);
// get all holiday
router.get('/holiday',authenticateToken,controller.holiday);
// get all city
router.get('/city',authenticateToken,controller.city);
// get selected city sunrise and sunset time
router.get('/sunrise-sunset-moonrise',authenticateToken,controller.sunrise_sunset_moonrise);
// get all bank holiday
router.get('/bankholiday',authenticateToken,controller.bankholiday);
// get all festival
router.get('/festival',authenticateToken,controller.festival);
// get all katha
router.get('/katha',authenticateToken,controller.katha);
// get sunrise sunset and moonrise data about date
router.get('/timedate',authenticateToken,controller.timeDate);
// get all rashi
router.get('/rashi-options',authenticateToken,controller.rashi);
// get rashi letters
router.get('/getLetters',authenticateToken,controller.getLetters);
// get all nakshtra
router.get('/nakshtra',authenticateToken,controller.nakshtra);
// get all rutu
router.get('/rutu',authenticateToken,controller.rutu);
// get chogadhiya time
router.get('/choghadiya',authenticateToken,controller.choghadiya);
// get night choghadiya
router.get('/nightchoghadiya',authenticateToken,controller.nightchoghadiya);
// get nakshtra time
router.get('/nakshtratime',authenticateToken,controller.nakshtraTime);


// all data update
router.put('/allupdateData', controller.allUpdate);
// katha update
router.put('/kathaupdateData', controller.updateKatha);
// bank holiday update
router.put('/bankholidayUpdate', controller.updateBankholiday);



// delete all data row
router.delete('/alldelete',controller.alldelete);

module.exports = router;
