//********************COCONUTT CHATBOT: COCOBOT**************************
//Servidor Express
var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
//Conversation de WATSON
var ConversationV1 = require('watson-developer-cloud/conversation/v1');

var contexts = [];

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const server = app.listen(process.env.PORT || 5000, () => {
  console.log('Servidor express escuchando por el puerto %d en el modo %s', server.address().port, app.settings.env);
});

// Validación con facebook
app.get('/', function (req, res) {  
    if (req.query['hub.verify_token'] === process.env.VERIFY_TOKEN) {
        res.send(req.query['hub.challenge']);
    } else {
        res.send('Invalid verify token');
    }
});

//Mensajes Recibidos
app.post('/', (req, res) => {
  console.log(req.body);
  if (req.body.object === 'page') {
    req.body.entry.forEach((entry) => {
      entry.messaging.forEach((event) => {
        //Si existe un mensaje
        if (event.message && event.message.text) {
          sendMessage(event);
        }
      });
    });
    res.status(200).end();
  }
});

//Enviando el mensaje
function sendMessage(event) {
  var user = event.sender.id;
  var text = event.message.text;

  //Guardando el contexto de la conversación
  var context = null;

  //Variables de contexto
  //context.flag_film = 0;
  //context.saber_mas =  0;
  //context.tolerance = 0;
  //context.flag_music = 0;
  //context.about_music = 'on';
  //context.counter_bad_options = 0;
  
  var index = 0;
  var contextIndex = 0;

  contexts.forEach(function(value) {
    if (value.from == user){
      console.log(value.context)
      context = value.context;
      contextIndex = index;
    }
    index = index + 1;
  });

  //Mensaje recibido
  console.log('Mensaje recibido de ' + user + ' diciendo que: ' + text)

  //Credenciales de WATSON
  var conversation = new ConversationV1({
    username: process.env.USER_WATSON,
    password: process.env.PASS_WATSON,
    version_date: ConversationV1.VERSION_DATE_2016_09_20
  });

  //Sobre el contexto
  console.log(JSON.stringify(context));

  //Se envía a WATSON el mensaje del usuario
  conversation.message({
    input: {text: text},
    workspace_id: process.env.WORKSPACE_ID,
    context: context
  },  function(err, response){
      if (err){
        console.error(err);
      } else{
        console.log(response.output.text[0]);
        if (context == null){
          contexts.push({'from': user, 'context': response.context});
        } else{
          contexts[contextIndex].context = response.context;
          console.log("---------------")
          console.log(contexts[contextIndex].context)
          console.log("---------------")
        }

        //Verificación de que se ha cumplido cierta intención
        var intent = response.intents[0].intent;
        console.log(intent);
        if (intent == "done"){
          contexts.splice(contextIndex,1);
        }

        //Envío a API de facebook del mensaje
        request({
          url: 'https://graph.facebook.com/v2.6/me/messages',
          qs: {access_token: process.env.PAGE_ACCESS_TOKEN},
          method: 'POST',
          json: {
            recipient: {id: user},
            message: {text: response.output.text[0]}
          }
        }, function (error, response) {
          if (error) {
            console.log('Error sending message: ', error);
          } else if (response.body.error) {
            console.log('Error: ', response.body.error);
          }
        });
      }
  }); 
}
