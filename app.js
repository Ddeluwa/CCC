var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var bodyParser = require('body-parser');
var mysql = require('mysql');
var fs = require('fs');
var session = require('express-session');
var crpyto = require('crypto');
var MySQLStore = require('express-mysql-session')(session);
var ExcelJS = require('exceljs');

// express setting
var app = express();

// view engine setup
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '/public')));

//HTML Render
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
//app.engine('html', require('ejs').renderFile);

// Session
app.use(session({
  secret: 'innonet!@#$%^&*ASDF',
  resave: false,
  saveUninitialized: true,
  store: new MySQLStore({
    host: 'localhost',
    port: 23306,
    user: 'ttdb',
    password: 'innonet160905',
    database: 'treetalker_db'
  })
}));

//body-Parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// mysql connection
const connection = mysql.createConnection({
  user: "ttdb",
  password: "innonet160905",
  port: 23306,
  database: "treetalker_db"
});



/*app.get('/testTCP', function (req, res) {
  console.log(req.query);
  fs.appendFile('TEST_TVWS_wireless_packet_loss_econbiz_210727.txt', req.query.data + '\n', function (error) {
    if (error) throw error;
  });
  res.send('Connection success');
});*/

//RESTful API 
app.get('/', function (req, res) {
  var agent = req.header('User-Agent');

  
  if (agent.toLowerCase().match(/python-requests/)) {
    console.log('Connection OK');
    res.send('Data Connection Success');
  } else {
    console.log("Browser : Chrome");
    req.session.is_TTcloud = false;
    req.session.is_TTplus = false;
    req.session.currentTTplusSN = undefined;
    req.session.currentTTCloudSN = undefined;
    res.redirect('/index');
  }
});

app.get('/index', function (req, res) {
  console.log('Index page');
  var userLoginId = req.session.userid;
  
  if (req.session.is_logined == true) {
    connection.query('SELECT dv_sn FROM user LEFT JOIN device ON device.user_no = user.user_no WHERE user.user_id=? AND device.dv_type="TTCloud"',
      [userLoginId], function (err, rows) {
        if (err) throw err;
        var TTCloudSN = [];
        for (var i = 0; i < rows.length; i++){
          TTCloudSN[i] = rows[i].dv_sn;
        }

        connection.query('SELECT dv_sn, dv_con FROM user LEFT JOIN device ON device.user_no = user.user_no WHERE user.user_id=? AND dv_type="TT+"',
          [userLoginId], function (err, data) {
            if (err) throw err;
            var TT_plusSN = [];
            for (var i = 0; i < data.length; i++) {
              TT_plusSN[i] = {
                sn:data[i].dv_sn,
                con:data[i].dv_con
              };
            }
            
            console.log("is_TTcloud : " + req.session.is_TTcloud);
            console.log("is_TTplus : " + req.session.is_TTplus);
            console.log("TTplus : " + req.session.currentTTplusSN);
            console.log("TTCloud : "+req.session.currentTTCloudSN);

            if (req.session.is_TTcloud == true && req.session.is_TTplus == false) {
              req.session.is_TTplus = false;
              res.render('main', {
                is_logined: req.session.is_logined,
                id: userLoginId,
                name: req.session.name,
                TTCloudSN: TTCloudSN,
                TTplusSN: TT_plusSN,
                currentTTCloudSN: req.session.currentTTCloudSN,
                is_TTCloud : req.session.is_TTcloud,
                is_TTplus: req.session.is_TTplus,
                TTCloudData: req.session.TTCloudData
              });

            } else if (req.session.is_TTplus == true && req.session.is_TTcloud == false) {
              req.session.is_TTcloud == false;
              var currentTTplusSerialNumber = req.session.currentTTplusSN;
              for (var i = 0; i < data.length; i++){
                if (TT_plusSN[i].sn === currentTTplusSerialNumber)
                var currentTTCloudSerialNumber = TT_plusSN[i].con;
              }
              res.render('main', {
                is_logined: req.session.is_logined,
                id: userLoginId,
                name: req.session.name,
                TTCloudSN: TTCloudSN,
                TTplusSN: TT_plusSN,
                currentTTCloudSN: currentTTCloudSerialNumber,
                currentTTplusSN: currentTTplusSerialNumber,
                is_TTCloud : req.session.is_TTcloud,
                is_TTplus : req.session.is_TTplus,
                TTplusData: req.session.TTplusData
              });

            }else {
              req.session.is_TTcloud = false;
              req.session.is_TTplus = false;
              res.render('main', {
                is_logined: req.session.is_logined,
                id: userLoginId,
                name: req.session.name,
                TTCloudSN: TTCloudSN,
                TTplusSN: TT_plusSN,
                is_TTCloud: req.session.is_TTcloud,
                is_TTplus: req.session.is_TTplus
              });
            }
          });
      });
  } else {
    res.render('index', {
      is_logined: false
    });
  }
});

app.get('/download', async function (req, res){
  // current time
  var today = new Date();
  var year = today.getFullYear();
  var month = today.getMonth() + 1;
  var date = today.getDate();

  var currentDate = "";
  if (month < 10){
    currentDate = currentDate + year + "0" + month;
  } else {
    currentDate = currentDate + year + month;
  }

  if (date < 10) {
    currentDate = currentDate + "0" + date;
  } else {
    currentDate = currentDate + date;
  }

  //Excel worksheet
  const workbook = new ExcelJS.Workbook();
  

  if (req.session.is_TTcloud == true && req.session.is_TTplus == false){
    const worksheet = workbook.addWorksheet(req.session.currentTTCloudSN);
    const filename = currentDate + "_" + req.session.currentTTCloudSN + ".xlsx";    
    
    var TTCloudDataSet = req.session.TTCloudData;

    worksheet.columns = [
      { header : "No", key: "no", width: 10 },
      { header : "Timestamp", key: "timestamp", width: 45 },
      { header : "RSSI No.1", key: "RSSI_first", width: 15},
      { header : "RSSI No.2", key: "RSSI_second", width: 15},
      { header : "Battery Voltage", key: "battVol", width: 30},
      { header : "Firmware Version", key: "firmware", width: 25},
    ];
    
    for (var i = 0; i < TTCloudDataSet.length; i++){
      worksheet.addRow({
        no: i, 
        timestamp: TTCloudDataSet[i].dt_time,
        RSSI_first: TTCloudDataSet[i].dt_RSSI_first,
        RSSI_second: TTCloudDataSet[i].dt_RSSI_second,
        battVol: TTCloudDataSet[i].dt_battery_level,
        firmware: TTCloudDataSet[i].dt_firmware_version
      });

      
    }
    await workbook.xlsx.writeFile(filename).then(function(){
      console.log("success");
    });
    const filepath = __dirname + '/' + filename;
    res.set({
      'Location': "/index",
    });
    //res.charset = 'UTF-8';
    res.download(filepath);
    
  }else{
    const worksheet = workbook.addWorksheet(req.session.currentTTplusSN);
    const filename = currentDate + req.session.currentTTplusSN + ".xlsx";
    
  }

});


app.get('/index/:TTCloud', function (req, res) {
  var TTCloudSerialNumber = req.params.TTCloud;

  
  connection.query('SELECT 4c.dv_sn, 4c.dt_time, dt_RSSI_first, dt_RSSI_second, dt_battery_level, dt_firmware_version FROM datatype_4C 4c JOIN datatype_4B 4b ON 4c.dt_time = 4b.dt_time WHERE 4c.dv_sn=?'
    , [TTCloudSerialNumber], function (err, rows) {
      if (err) throw err;

      req.session.currentTTCloudSN = TTCloudSerialNumber;
      req.session.currentTTplusSN = undefined;
      req.session.TTCloudData = rows;
      req.session.is_TTcloud = true;
      req.session.is_TTplus = false;
      
      res.redirect('/index');
    }
  );
});


app.get('/index/:TTCloud/:TTplus', function (req, res) {
  var queryString = 'SELECT '
                    +'4D.dv_sn, 4D.dt_time, 4D.dt_Tref_before, 4D.dt_Theat_before, 4D.dt_Tref_after, 4D.dt_Theat_after, 4D.dt_growth_rate, 4D.dt_battery_vol, 4D.dt_air_humidity, 4D.dt_air_temp, 4D.dt_stability, 4D.dt_stem, '
                    +'d49.dt_NI_610, d49.dt_NI_680, d49.dt_NI_730, d49.dt_NI_760, d49.dt_NI_810, d49.dt_NI_860, d49.dt_VLS_450, d49.dt_VLS_500, d49.dt_VLS_550, d49.dt_VLS_570, d49.dt_VLS_600, d49.dt_VLS_650 '
                    +'FROM datatype_4D 4D LEFT JOIN datatype_49 d49 ON 4D.dv_sn = d49.dv_sn AND 4D.dt_time = d49.dt_time WHERE 4D.dv_sn = ? ORDER BY 4D.dt_time';
  connection.query(queryString, [req.params.TTplus], function(err, rows){
    if (err) throw err;

    req.session.currentTTCloud = req.params.TTCloud;
    req.session.currentTTplusSN = req.params.TTplus;
    req.session.TTplusData = rows;
    req.session.is_TTplus = true;
    req.session.is_TTcloud = false;
    res.redirect('/index');
  });

  
});

//Register page
app.get('/register', function (req, res) {
  console.log('Register page');
  res.render('register');
});

app.post('/register', function (req, res) {
  console.log('Registering...');
  var id = req.body.id;
  var pw = req.body.pw;
  var name = req.body.name;
  var email = req.body.email;
  var phone = req.body.phone;

  connection.query('SELECT * FROM user where user_id=?', [id], function (err, data) {
    console.log(data);
    if (data.length == 0) {

      connection.query('INSERT INTO user(user_id, user_pw, user_name, user_email, user_pnum) VALUES(?,?,?,?,?)', [
        id, pw, name, email, phone
      ], function (err, data) {
        if (err) throw err;
        else {
          console.log('Register Success');
          res.redirect('/');
        }
      });

    } else {
      console.log('Register fail');
      res.send('<script>alert("회원가입 실패, 담당자 문의 요망"); window.location.href = "/login";</script>');
    }
  });
});

//Login action
app.get('/login', function (req, res) {
  res.redirect('/index');
});


app.post('/login', function (req, res) {
  var id = req.body.id;
  var pw = req.body.pw;

  connection.query('SELECT * FROM user WHERE user_id=?', [id], function (err, data) {
    if (err) throw err;

    if (id == data[0].user_id && pw == data[0].user_pw) {
      console.log('Login success');

      //session add
      req.session.is_logined = true;
      req.session.name = data[0].user_name;
      req.session.userid = data[0].user_id;
      req.session.pw = data[0].user_pw;
      req.session.save(function () {
        res.redirect('/index');
        /*res.render('main', {
          name : data[0].user_name,
          id : data[0].user_id,
          email : data[0].user_email,
          phone : data[0].user_pnum,
          is_logined : true
        });*/
      });
    } else {
      console.log(data[0]);
      console.log('Login fail');
      res.redirect('/index');
    }
  });
});


  




//Logout action
app.get('/logout', function (req, res) {
  console.log('Logout success');
  req.session.destroy(function (err) {
    if (err) throw err;
    console.log('Session destroy');
  });
  res.redirect('/');
});


app.get('/ttCloudData', function (req, res) {
  var tempData = req.query.data;
  var serialNumber = req.query.sn;

  var data = tempData.split(';');

  console.log(data);

  var recordNumber = data[1];
  var dataType = data[2];
  var timeStamp = data[3] - 32400;

  var nowTime = new Date(timeStamp * 1000);

  //같은 디바이스가 있는지 확인
  connection.query('SELECT * FROM device where dv_sn=?', [data[0]], function (err, rows) {
    if (rows.length === 0) {
      if (data[0] !== serialNumber.toUpperCase()) {
        // 디바이스 정보 저장
        connection.query('INSERT INTO device (dv_sn, dv_type, user_num, dv_con) VALUES (?,?,?,?)', [data[0], 'TT+', 1, serialNumber], function (err, result_device) {
          if (err) throw err;
          else {
            console.log('DATA SAVE');
            res.send('good');
          }
        });
      } else if (data[0] === serialNumber.toUpperCase()) {
        //user_num은 임시로 1번
        connection.query('INSERT INTO device (dv_sn, dv_type, user_num, dv_con) VALUES (?,?,?,?)', [data[0], 'TTCloud', 1, serialNumber], function (err, result_device) {
          if (err) throw err;
          else {
            console.log('DATA SAVE');
            res.send('good');
          }
        });
      }
    } else {
      if (dataType === '49') {
        //520C0877;1C;49;1624982400;3761;2477;3157;3964;5147;5326;7516;6165;5501;5655;6487;5746;50;
    
        // Near Infrared
        var AS7263_610 = -312.45 + (1.6699 * data[4]);
        var AS7263_680 = -561.56 + (1.5199 * data[5]);
        var AS7263_730 = -1511.2 + (1.6209 * data[6]);
        var AS7263_760 = -1012.5 + (1.4549 * data[7]);
        var AS7263_810 = 91.58 + (0.8414 * data[8]);
        var AS7263_860 = 334.88 + (0.531 * data[9]);
    
        // Visible Light Spectrum
        var AS7262_450 = -212.62 + (0.4562 * data[10]);
        var AS7262_500 = -232.13 + (0.6257 * data[11]);
        var AS7262_550 = -842.1 + (1.0546 * data[12]);
        var AS7262_570 = -666.72 + (1.0462 * data[13]);
        var AS7262_600 = -328.08 + (0.8654 * data[14]);
        var AS7262_650 = 202.77 + (0.7829 * data[15]);
    
        connection.query('INSERT INTO datatype_49 (dv_sn, dt_rcnum, dt_time, dt_NI_610, dt_NI_680, dt_NI_730, dt_NI_760, dt_NI_810, dt_NI_860, dt_VLS_450, dt_VLS_500, dt_VLS_550, dt_VLS_570, dt_VLS_600, dt_VLS_650) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
          [
            data[0], recordNumber, nowTime, AS7263_610, AS7263_680, AS7263_730, AS7263_760, AS7263_810, AS7263_860, AS7262_450, AS7262_500, AS7262_550, AS7262_570, AS7262_600, AS7262_650
          ], function (err, result_data) {
            if (err) throw err;
            console.log('DATATYPE 49 SAVED');
            res.send('DATATYPE 49 SAVED');
          });
    
      } else if (dataType === '4D') {
        //520C0877;9;4D;1624971601;33458;33278;70881;47062;17;2;254;-3895;0;343;0;-1355;0;33393;30544;0;65344
        var Tref_before = data[4];
        var Theat_before = data[5];
    
        var growth = data[6];
        var adc_bandgap = data[7];
        var airHumidity = data[9];
        var airTemperature = data[10];
        var g_z_mean = data[11];
        var g_y_mean = data[13];
        var g_x_mean = data[15];
    
        var Tref_after = data[17];
        var Theat_after = data[18];
    
        var StWC = data[19];
        var adc_batterybat = data[20];
    
        // Temperature Before
        var convert_Tref_before = 127.6 - 0.006045 * Tref_before + 0.000000126 * Math.pow(Tref_before, 2) - 0.00000000000115 * Math.pow(Tref_before, 3);
        var convert_Theat_before = 127.6 - 0.006045 * Theat_before + 0.000000126 * Math.pow(Theat_before, 2) - 0.00000000000115 * Math.pow(Theat_before, 3);
    
        // Temperature After
        var convert_Tref_after = 127.6 - 0.006045 * Tref_after + 0.000000126 * Math.pow(Tref_after, 2) - 0.00000000000115 * Math.pow(Tref_after, 3);
        var convert_Theat_after = 127.6 - 0.006045 * Theat_after + 0.000000126 * Math.pow(Theat_after, 2) - 0.00000000000115 * Math.pow(Theat_after, 3);
    
        //Growth Rate
        var convert_GrowthRate = (0.000000008 * Math.pow(growth, 2)) - (0.0016 * growth) + 89.032;
    
        // Battery Voltage
        var convert_BatteryVoltage = 2 * 1100 * (adc_batterybat / adc_bandgap);
    
        // Air condition
        var convert_AirHumidity = airHumidity;
        var convert_AirTemperature = airTemperature / 10;
    
        // Tree Stability
        var treeStability = 1 / Math.tan((Math.sqrt(Math.pow(g_x_mean, 2) + Math.pow(g_y_mean, 2))) / g_z_mean);
    
        // Stem water content
        var StemWaterContent = -0.0036 * (StWC - (-74.15 * convert_Tref_before + StWC)) + 42;
    
        connection.query('INSERT INTO datatype_4D (dv_sn, dt_rcnum, dt_time, dt_Tref_before, dt_Theat_before, dt_Tref_after, dt_Theat_after, dt_growth_rate, dt_battery_vol, dt_air_humidity, dt_air_temp, dt_stability, dt_stem) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
          [
            data[0], recordNumber, nowTime, convert_Tref_before, convert_Theat_before, convert_Tref_after, convert_Theat_after, convert_GrowthRate, convert_BatteryVoltage, convert_AirHumidity, convert_AirTemperature, treeStability, StemWaterContent
          ], function (err, result_data) {
            if (err) throw err;
            console.log('DATATYPE 4D SAVED');
            res.send('DATATYPE 4D SAVED');
          }
        );
      } else if (data[2] === '4B') {
        //C0200173;3B2;4B;1626181200;945;0;0;0;0;0;4062;rel.5.1h
        var batteryLevel = data[10]; //mV
        var firmwareVersion = data[11];
        connection.query('INSERT INTO datatype_4B (dv_sn, dt_rcnum, dt_time, dt_battery_level, dt_firmware_version) VALUES (?,?,?,?,?)',
          [
            data[0], recordNumber, nowTime, batteryLevel, firmwareVersion
          ], function (err, result_data) {
            if (err) throw err;
            console.log('DATATYPE 4B SAVED');
            res.send('DATATYPE 4B SAVED');
          });
      } else if (data[2] === '4C') {
        //C0200173;3B1;4C;1626177600;0;0;-137;-137;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0;0
        var RSSI_Strength_TT_First = data[6];
        var RSSI_Strength_TT_Second = data[7];
        connection.query('INSERT INTO datatype_4C (dv_sn, dt_rcnum, dt_time, dt_RSSI_first, dt_RSSI_second) VALUES (?,?,?,?,?)',
          [
            data[0], recordNumber, nowTime, RSSI_Strength_TT_First, RSSI_Strength_TT_Second
          ], function (err, result_data) {
            if (err) throw err;
            console.log('DATATYPE 4C SAVED');
            res.send('DATATYPE 4C SAVED');
          });
      }
    }
  });
});

/*app.get('/treetalker/', function(req, res){
  console.log('c0200173');
});*/



// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));

});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.send(err.message);
});


module.exports = app;
