var fluid = require("infusion");
var translate = require("translate");

translate.engine = "yandex";
translate.key = process.env.TRANSLATE_KEY;
// https://stackoverflow.com/questions/43024906/pass-node-env-variable-with-windows-powershell

require("kettle");
var sjrk = fluid.registerNamespace("sjrk")

fluid.defaults("sjrk.chatty.chatroomTracker", {
  gradeNames: "fluid.component",
  members: {
    rooms: {}
  }
});

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
                                    "route": "/chatRoom/:userId/:roomId/:lang"
                                }
                            }
                        }
                    },
                    chatroomTracker: {
                        type: "sjrk.chatty.chatroomTracker"
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
  var userId = request.req.params["userId"];
  var roomId = request.req.params["roomId"];
  var lang = request.req.params["lang"];
  console.log("New client connected: ", userId, roomId, lang);

  server.chatroomTracker.rooms[roomId] = server.chatroomTracker.rooms[roomId] ? server.chatroomTracker.rooms[roomId] : [];
  server.chatroomTracker.rooms[roomId].push({userId: userId, lang: lang, ws: ws})
};

sjrk.chatty.receiveMessage = function (request, message, server) {
    var roomId = request.req.params["roomId"];
    var messageLang = request.req.params["lang"];
    var userId = request.req.params["userId"];
    var message = JSON.stringify(message, null, 2);
    console.log("Chatroom " + roomId, "Received message " + message, "Lang: " + messageLang);
    var chatroom = server.chatroomTracker.rooms[roomId];
    fluid.each(chatroom, function (chatter) {
      var chatterLang = chatter.lang;
      sjrk.chatty.translateMessage(message, messageLang, chatterLang).then(function (translatedMessage) {
        // TODO: readyStates should be constants somewhere
        if (chatter.ws.readyState === 1) {
          var isOwnMessage = chatter.userId === userId;
          var finalMessage = fluid.stringTemplate("%userId sent %messageLang : %message / %chatterLang : %translatedMessage", {
            userId: userId,
            messageLang: messageLang,
            message: message,
            chatterLang: chatterLang,
            translatedMessage: translatedMessage
          });
          chatter.ws.send(finalMessage);
        }
      });
    });
};

sjrk.chatty.translateMessage = function (message, fromLang, toLang) {
  return translate(message, {from: fromLang, to: toLang});
}

// Construct the server using the above config
sjrk.chatty();
