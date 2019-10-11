//const { ThaiCardReader, EVENTS, MODE } = require('@privageapp/thai-national-id-reader');
const { ThaiCardReader, EVENTS, MODE } = require("./lib/index");
const BASE_URL = "http://192.168.1.2:3000";
const io = require("socket.io-client");
const socket = io(BASE_URL);
const KIOSK_ID = "1";

const reader = new ThaiCardReader();
reader.readMode = MODE.PERSONAL_PHOTO;
reader.autoRecreate = true;
reader.startListener();

reader.on(EVENTS.DEVICE_CONNECTED, () => {
  console.log("DEVICE_CONNECTED");
  socket.emit(EVENTS.DEVICE_CONNECTED, { kioskId: KIOSK_ID });
});

reader.on(EVENTS.CARD_INSERTED, () => {
  console.log("CARD_INSERTED");
  socket.emit(EVENTS.CARD_INSERTED, { kioskId: KIOSK_ID });
});

reader.on(EVENTS.READING_START, () => {
  console.log("READING_START");
  socket.emit(EVENTS.READING_START, { kioskId: KIOSK_ID });
});

reader.on(EVENTS.READING_PROGRESS, progress => {
  console.log(progress);
});

reader.on(EVENTS.READING_COMPLETE, profile => {
  // console.log(profile);
  socket.emit(EVENTS.READING_COMPLETE, {
    kioskId: KIOSK_ID,
    card_info: profile
  });
});

reader.on(EVENTS.READING_FAIL, () => {
  socket.emit("READING_FAIL", { kioskId: KIOSK_ID });
});

reader.on(EVENTS.CARD_REMOVED, () => {
  socket.emit(EVENTS.CARD_REMOVED, { kioskId: KIOSK_ID });
});

reader.on(EVENTS.DEVICE_DISCONNECTED, () => {
  socket.emit(EVENTS.DEVICE_DISCONNECTED, { kioskId: KIOSK_ID });
});

process.on("uncaughtException", function(err) {
  console.log("Caught exception: ", err);
});
