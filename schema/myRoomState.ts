const { Schema, MapSchema, type } = require("@colyseus/schema");

class Player extends Schema {

    constructor(sessionId) {
        super();
        this.sessionId = sessionId;
        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.veloX = 0;
        this.veloY = 0;
        this.veloZ = 0;
        this.quaterX = 0;
        this.quaterY = 0;
        this.quaterZ = 0;
        this.quaterW = 0;

        this.pseudo = "";
        this.idCountryFlag = 0;
        this.inputMap = {};
        this.actions = {};

        this.isCollided = false;
        this.isCollider = false;
        this.finishChrono = 0;

        this.color = "";

    }
}
type("string")(Player.prototype, "sessionId");
type("number")(Player.prototype, "x");
type("number")(Player.prototype, "y");
type("number")(Player.prototype, "z");
type("string")(Player.prototype, "pseudo");
type("number")(Player.prototype, "idCountryFlag");
type("boolean")(Player.prototype, "isCollided");
type("boolean")(Player.prototype, "isCollider");
type("string")(Player.prototype, "color");


class MyRoomState extends Schema {
    constructor() {
        super();
        this.players = new MapSchema();
    }
}

type({ map: Player })(MyRoomState.prototype, "players");

module.exports = { Player, MyRoomState };
