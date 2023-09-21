const express = require('express');
const app = express();
const Modbus = require('modbus-serial');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.locals.pretty = true;
app.set('view engine', 'pug');
app.set('views', './src/pug');
app.use(express.static('./public'));

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));

const PLC_IP_ADDRESS = '192.168.0.89';
const PLC_PORT = 502;

app.get('/', (req, res) => {
  res.render('PLC');
});

app.post('/sendDataToPLC', (req, res) => {
  const dataToSend = req.body.data;

  const client = new Modbus();
  client.connectTCP(PLC_IP_ADDRESS, { port: PLC_PORT }, () => {
    console.log('PLC CONNECT!.');
    client.writeRegisters(4, [dataToSend], (err, response) => {
      if (err) {
        console.error('PLC ERROR:', err.message);
        res.status(500).send('PLC communication error.');
      } else {
        console.log('Data sent to PLC:', dataToSend);
        res.send('Data sent to PLC: ' + dataToSend);
      }
      client.close();
    });
  });

  client.on('error', (err) => {
    console.error('PLC ERROR:', err.message);
    res.status(500).send('PLC communication error.');
    client.close();
  });
});

app.listen(3002, () => {
  console.log('3002 PORT START!');
});
