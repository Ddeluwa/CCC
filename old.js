app.get('/treetalker/:ttcloud', function (req, res) {
    //res.render('./table.html');
  
  
    fs.readFile('c0200173.txt', 'utf8', function (err, data) {
  
      var lineSplit = data.split('\r\n');
      var endData = lineSplit[lineSplit.length - 2].split(';');
  
      var recordNumber = endData[1];
      var dataType = endData[2];
      var timeStamp = endData[3] - 32400;
  
      var nowTime = new Date(timeStamp * 1000);
  
      if (dataType === "4D" || dataType === "49") {
  
        var TTID = endData[0];
  
        if (dataType === "4D") {
          //520C0877;9;4D;1624971601;33458;33278;70881;47062;17;2;254;-3895;0;343;0;-1355;0;33393;30544;0;65344
          var Tref_before = endData[4];
          var Theat_before = endData[5];
  
          var growth = endData[6];
          var adc_bandgap = endData[7];
          var numOfBits = endData[8];
          var airHumidity = endData[9];
          var airTemperature = endData[10];
          var g_z_mean = endData[11];
          var g_y_mean = endData[13];
          var g_x_mean = endData[15];
  
          var Tref_after = endData[17];
          var Theat_after = endData[18];
  
          var StWC = endData[19];
          var adc_batterybat = endData[20];
  
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
  
          var dataforSend = {
            SerialNumber: TTID,
            RecordNumber: recordNumber,
            DataType: dataType,
            Timestamp: nowTime.toString(),
            Before_Tref: convert_Tref_before,
            Before_Theat: convert_Theat_before,
            After_Tref: convert_Tref_after,
            After_Theat: convert_Theat_after,
            GrowthRate: convert_GrowthRate,
            BattVoltage: convert_BatteryVoltage,
            AirHumid: convert_AirHumidity,
            AirTemp: convert_AirTemperature,
            Stability: treeStability,
            Stem: StemWaterContent
          };
  
        } else if (dataType === "49") {
          //520C0877;1C;49;1624982400;3761;2477;3157;3964;5147;5326;7516;6165;5501;5655;6487;5746;50;3
  
          // Near Infrared
          var AS7263_610 = -312.45 + (1.6699 * endData[4]);
          var AS7263_680 = -561.56 + (1.5199 * endData[5]);
          var AS7263_730 = -1511.2 + (1.6209 * endData[6]);
          var AS7263_760 = -1012.5 + (1.4549 * endData[7]);
          var AS7263_810 = 91.58 + (0.8414 * endData[8]);
          var AS7263_860 = 334.88 + (0.531 * endData[9]);
  
          // Visible Light Spectrum
          var AS7262_450 = -212.62 + (0.4562 * endData[10]);
          var AS7262_500 = -232.13 + (0.6257 * endData[11]);
          var AS7262_550 = -842.1 + (1.0546 * endData[12]);
          var AS7262_570 = -666.72 + (1.0462 * endData[13]);
          var AS7262_600 = -328.08 + (0.8654 * endData[14]);
          var AS7262_650 = 202.77 + (0.7829 * endData[15]);
  
          var dataforSend = {
            SerialNumber: TTID,
            RecordNumber: recordNumber,
            DataType: dataType,
            Timestamp: nowTime.toString(),
            NI610: AS7263_610,
            NI680: AS7263_680,
            NI730: AS7263_730,
            NI760: AS7263_760,
            NI810: AS7263_810,
            NI860: AS7263_860,
            VLS450: AS7262_450,
            VLS500: AS7262_500,
            VLS550: AS7262_550,
            VLS570: AS7262_570,
            VLS600: AS7262_600,
            VLS650: AS7262_650
          };
        }
  
      } else if (dataType === "4B" || dataType === "4C") {
        var TTCloudID = endData[0];
        if (dataType === "4B") {
          var batteryLevel = endData[10]; //mV
          var firmwareVersion = endData[11];
  
          var dataforSend = {
            SerialNumber: TTCloudID,
            RecordNumber: recordNumber,
            DataType: dataType,
            Timestamp: nowTime.toString(),
            BatteryLevel: batteryLevel,
            FirmwareVersion: firmwareVersion
          };
  
        } else if (dataType === "4C") {
          var RSSI_Strength_TT_First = endData[6];
          var RSSI_Strength_TT_Second = endData[7];
          var dataforSend = {
            SerialNumber: TTCloudID,
            RecordNumber: recordNumber,
            DataType: dataType,
            Timestamp: nowTime.toString(),
            RSSI_first: RSSI_Strength_TT_First,
            RSSI_second: RSSI_Strength_TT_Second
          };
        }
      } else {
        return 1;
      }
  
      if (err) {
        console.log(err);
        throw err;
      }
      res.render('table', dataforSend);
    });
  
  });

  /*
app.get('/testDB', function(req, res){
  const connection = mysql.createConnection({
    user: "root",
    password: "innonet160905",
    database: "treetalker_db"
  });

  connection.connect();
  connection.query("SELECT * FROM user", function(err, rows, fields){
    if(!err){
      console.log(rows);
      console.log(fields);
      res.send(JSON.stringify(rows));
    } else {
      console.log("query error : " + err);
      res.send(err)
    }
  });
  connection.end();
});
*/


/*app.get('/testTCP', function(req, res){
  console.log(req.query);
  fs.appendFile('TEST_TVWS_wireless_packet_loss_econbiz.txt', req.query.data + '\n', function (error){
    if(error) throw error;
  });
  res.send('Connection success');
});*/


/*app.get('/ttCloudData', function(req, res){
	
  var getInfo = req.query;
  var serialNumber = req.query.sn;

  console.log(getInfo);

  filename = serialNumber + ".txt";
  fs.appendFile(filename, getInfo.data, function (error){
    if(error) throw error;
  })
  res.send('good');
});*/