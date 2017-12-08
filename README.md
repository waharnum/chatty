# chatty

Very simple tech demo of a real-time translating chat application, using `kettle.server.ws`, the `translate` module and Yandex as the translation provider. More documentation to come!

No web UI yet, but can be tested using wscat:

- `wscat --no-color -c ws://localhost:8081/chatRoom/alano/1/es`
- `wscat --no-color -c ws://localhost:8081/chatRoom/allen/1/en`
- `wscat --no-color -c ws://localhost:8081/chatRoom/alain/1/fr`
