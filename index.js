var fluid = require("infusion");
var translate = require("translate");

translate.engine = "yandex";
translate.key = process.env.TRANSLATE_KEY;

require("kettle");
var sjrk = fluid.registerNamespace("sjrk")

fluid.defaults("sjrk.chatty", {
    gradeNames: "fluid.component",
    components: {
        server: {
            type: "kettle.server",
            options: {
                gradeNames: ["kettle.server.ws"],
                wsServerOptions: {
                  "clientTracking": true
                },
                port: 8081,
                components: {
                    app: {
                        type: "kettle.app",
                        options: {
                            requestHandlers: {
                                webSocketsHandler: {
                                    "type": "sjrk.chatty.handler",
                                    "route": "/chatRoom/:roomId/:lang"
                                }
                            }
                        }
                    },
                    chatroomTracker: {
                        type: "fluid.component",
                        options: {
                          members: {
                            rooms: {}
                          }
                        }
                    }
                }
            }
        }
    }
});

fluid.defaults("sjrk.chatty.handler", {
    gradeNames: "kettle.request.ws",
    listeners: {
        onReceiveMessage: {
          funcName: "sjrk.chatty.receiveMessage",
          args: ["{arguments}.0", "{arguments}.1", "{server}"]
        },
        onBindWs: {
          funcName: "sjrk.chatty.registerClient",
          args:  ["{arguments}.0", "{arguments}.1", "{server}"]
        }
    }
});

// TODO: how do we clean up clients as they disconnect?
sjrk.chatty.registerClient = function (request, ws, server) {
  var roomId = request.req.params["roomId"];
  var lang = request.req.params["lang"];
  console.log("New client connected: ", roomId, lang);

  server.chatroomTracker.rooms[roomId] = server.chatroomTracker.rooms[roomId] ? server.chatroomTracker.rooms[roomId] : [];
  server.chatroomTracker.rooms[roomId].push({lang: lang, ws: ws})
  console.log(server.chatroomTracker.rooms[roomId]);
};

sjrk.chatty.receiveMessage = function (request, message, server) {
    var roomId = request.req.params["roomId"];
    var messageLang = request.req.params["lang"];
    var message = JSON.stringify(message, null, 2);
    console.log("Chatroom " + roomId, "Received message " + message, "Lang: " + messageLang);
    var chatroom = server.chatroomTracker.rooms[roomId];
    fluid.each(chatroom, function (chatter) {
      var chatterLang = chatter.lang;
      sjrk.chatty.translateMessage(message, messageLang, chatterLang).then(function (translatedMessage) {
        // TODO: readyStates should be constants somewhere
        if (chatter.ws.readyState === 1) {
          chatter.ws.send(translatedMessage);
        }
      });
    });
};

sjrk.chatty.translateMessage = function (message, fromLang, toLang) {
  return translate(message, {from: fromLang, to: toLang});
}

// Construct the server using the above config
sjrk.chatty();
