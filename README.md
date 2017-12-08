# chatty

Very simple tech demo of a real-time translating chat application, using `kettle.server.ws`, the `translate` module and Yandex as the translation provider. More documentation to come!

No web UI yet, but can be tested using wscat:

- `wscat -c ws://localhost:8081/chatRoom/1/es`
- `wscat -c ws://localhost:8081/chatRoom/1/en`
- `wscat -c ws://localhost:8081/chatRoom/1/fr`
