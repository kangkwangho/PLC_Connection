//http://192.168.x.99:3013 내 컴퓨터 휴대폰으로 들어가는 ip 주소

const ModbusRTU = require('modbus-serial');
const express = require('express');
const bodyParser = require('body-parser');
const { EventEmitter } = require('events');
const eventEmitter = new EventEmitter();
const app = express();
const port = 3013;
app.use(express.json());
app.locals.pretty = true;
app.set('view engine', 'pug');
app.set('views', './src/pug');
app.use(express.static('./public'));
app.use(bodyParser.json());

//modbus connect
let current_status = {};
const modbusClient = new ModbusRTU();
function connect_PLC(value1, value2) {
  modbusClient.connectTCP(`${value1}`, { port: value2 }, err => {
    if (err) {
      console.log(err);
      console.log('---------------------------');
      console.log('연결 시도된 IP   :' + value1);
      console.log('연결 시도된 PORT :' + value2);
      console.log('---------------------------');
      current_status = {
        "current": false,
        "comment": `에러코드: ${err}`
      }
    } else {
      console.log('---------------------------');
      console.log('****PLC가 연결되었습니다****');
      console.log('연결 된 IP   :' + value1);
      console.log('연결 된 PORT :' + value2);
      console.log('---------------------------');
      current_status = {
        "current": true,
        "comment": `연결에 성공하였습니다. 연결 ip : ${value1}  연결 port : ${value2}`,
        "ip": value1,
        "port": value2
      };
    }
  });
}

app.post("/connect", (req, res) => {
  let { ip_value, port_value } = req.body;
  connect_PLC(ip_value, port_value);
  res.json(current_status);
});

app.get('/', (req, res) => {
  res.render('PLC');
});

//writeRegister
app.post('/writeRegister', (req, res) => {
  const { offset, data } = req.body;
  console.log("---writeRegister-------")
  console.log(offset, data);
  console.log("---writeRegister end---")
  //writeRegister
  modbusClient.writeRegister(offset, data, (err) => {
    if (err) {
      console.log("writeRegister 에러: " + err.message);
      //res.status(500).json({ error: 'PLC error' });
      res.json({
        "status": "err",
        "err": err.message
      });

    } else {
      console.log('PLC data:', data);
      res.json({
        "status": "success",
        "offset": offset,
        "data": data
      });
    }
  });
});

//writeCoil
app.post('/writeCoil', (req, res) => {
  const { data, offset } = req.body;
  console.log("---writeCoil-------")
  console.log(offset, data);
  console.log("---writeCoil end---")

  modbusClient.writeCoil(offset, data, (err) => {
    if (err) {
      console.log("writeRegister 에러: " + err.message);

      //res.status(500).json({ error: 'PLC error' });
      res.json({
        "status": "err",
        "err": err.message
      });

    } else {
      console.log('PLC data:', data);
      res.json({
        "status": "success",
        "offset": offset,
        "data": data
      });
    }

  });
});

let isDataListenerAdded = false;

// 웹 서버가 데이터를 주기적으로 요청하는 타이머 설정 (예: 5초마다)
setInterval(() => {
  eventEmitter.emit('dataRequest');
}, 3000);

app.post('/startReceivingData', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  let { receivingAddress, receivingLength } = req.body;
  console.log("receivingAddress: " + receivingAddress);
  console.log("receivingLength: " + receivingLength);

  if (!isDataListenerAdded) {
    isDataListenerAdded = true;

    // 데이터 요청 이벤트 리스너를 추가
    eventEmitter.on('dataRequest', () => {
      modbusClient.readHoldingRegisters(receivingAddress, receivingLength)
        .then((data) => {
          console.log('data', data);
          const temp_JSON = {
            "success": true,
            "data": {
              "result": data
            },
            "error": null
          };
          //'data'이름의 이벤트 리스너 매개변수값 temp_JSON을 넣고 실행 됨
          eventEmitter.emit('data', temp_JSON);
        })
        .catch((err) => {
          console.error("ERROR");
        });
    });
  }
});

//이벤트 리스너 등록
eventEmitter.on('data', (data) => {
  res.json(data);
})


//사용할 값 적어서 넣어주기
//나중에 수정 가능하게 바꾸기
//startBtn
app.post('/stopBtn', (req, res) => {
  modbusClient.writeRegister(1, 2, (err) => {
    if (err) {
    } else {
    }
  });
});
//stopBtn
modbusClient.writeRegister(1, 2, (err) => {
  if (err) {
  } else {
  }
});
//emergency Stop
modbusClient.writeRegister(1, 2, (err) => {
  if (err) {
  } else {
  }
});

app.listen(port, () => {
  console.log(`${port} START!!`);
});