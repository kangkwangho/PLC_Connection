let express = require('express');
let app = express();
const net = require('net');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.locals.pretty = true;
app.set('view engine', 'pug');
app.set('views','./src/pug');
app.use(express.static('./public'));

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));

const PLC_IP_ADDRESS = 'PLC_IP_ADDRESS';
const PLC_PORT = 'PORT';

app.get('/', (req, res) => {
    res.render('PLC');
});

app.post('/sendDataToPLC', (req, res) => {
  const dataToSend = req.body.data;
  const client = new net.Socket();
  client.connect(PLC_PORT, PLC_IP_ADDRESS, () => {
    console.log('PLC CONNECT!.');
    client.write(dataToSend);
  });

  client.on('data', (data) => {
    console.log('PLC DATA:', data.toString());

    res.send(data.toString()); 
    client.destroy(); 
  });

  client.on('close', () => {
    console.log('PLC CLOSE!.');
  });
});

app.listen(4001, () => {
    console.log('4001 PORT START!');
});