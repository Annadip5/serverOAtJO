const { Server, Room } = require('colyseus');
const { MyRoomState, Player } = require('./schema/myRoomState.ts')
//import { State, Player } from './schema/myRoomState';

class MyRoom extends Room {
    constructor() {
        super();
        this.players = {};
        this.readyPlayers = new Set();
        this.initialPositions = [];
        this.scoreBlue = 0;
        this.scoreRed = 0;
        this.eliminatedPlayers = [];


    }
    getRemainingPlayer() {
        for (const [sessionId, player] of this.state.players.entries()) {
            if (!this.eliminatedPlayers.includes(sessionId)) {
                return sessionId;
            }
        }
        return null;
    }
    onCreate(options) {
        console.log("My room created!", options);
        this.setState(new MyRoomState)
        this.setInitialPositions(options.name)

        this.onMessage("updateMovement", (client, data) => {
            //console.log("update move received -> ", client.sessionId);
            const player = this.state.players.get(client.sessionId);

            if (player) {
                player.x = data.position._x;
                player.y = data.position._y;
                player.z = data.position._z;
                player.veloX = data.velocity._x;
                player.veloY = data.velocity._y;
                player.veloZ = data.velocity._z;
                player.quaterX = data.rotation._x;
                player.quaterY = data.rotation._y;
                player.quaterZ = data.rotation._z;
                player.quaterW = data.rotation._w;

                this.broadcast("updatePlayerMove", { sessionId: client.sessionId, position: data.position, velocity: data.velocity, rotation: data.rotation }, { except: client.sessionId });



            }

        });
        this.onMessage("collision", (client, data) => {
            console.log("collision detected -> ");
            const colliderPlayer = this.state.players.get(client.sessionId);
            const collidedPlayer = this.state.players.get(data.collision);
            colliderPlayer.isCollider = true;
            collidedPlayer.isCollided = true;
            //this.broadcast("updatePlayerCollision",)

            console.log("between ", client.sessionId, " and ", data.collision);

        });


        this.onMessage("playerReady", (client, data) => {
            this.readyPlayers.add(client.sessionId);
            console.log("ready : ", client.sessionId)

            if (this.readyPlayers.size === this.state.players.size && this.readyPlayers.size >= 1) {
                this.broadcast("allPlayersReady", { message: "Tous les joueurs sont prêts!" });
            }
        });
        this.onMessage("sendChrono", (client, data) => {
            console.log(client.sessionId, " chrono : ", data.chrono);
            const player = this.state.players.get(client.sessionId);

            if (player) {
                player.finishChrono = data.chrono;
            }
            let allChronosSent = true;
            for (const player of this.state.players.values()) {
                if (player.finishChrono === 0) {
                    allChronosSent = false;
                    break;
                }
            }

            if (allChronosSent) {
                const sortedPlayers = Array.from(this.state.players.values()).sort((a, b) => a.finishChrono - b.finishChrono);
                const chronoArray = sortedPlayers.map(player => ({ sessionId: player.sessionId, pseudo: player.pseudo, idFlag: player.idCountryFlag, finishChrono: player.finishChrono }));
                this.broadcast("finalResults", chronoArray);
            }

        });
        this.onMessage("scoreBlueIncr", (client, data) => {
            this.scoreBlue += 1;
            console.log(this.scoreBlue);
            this.broadcast("blueGoal", this.scoreBlue);
        });
        this.onMessage("scoreRedIncr", (client, data) => {
            this.scoreRed += 1;
            console.log(this.scoreRed);
            this.broadcast("redGoal", this.scoreRed);

        });
        this.onMessage("BUTR", (client, data) => {
            this.broadcast("BUTBroadcastR");
        })
        this.onMessage("BUTB", (client, data) => {

            this.broadcast("BUTBroadcastB");
        })
        this.onMessage("RESPAWN", (client, data) => {

            this.broadcast("respawnServer");
        })
        this.onMessage("elimination", (client, data) => {
            const player = this.state.players.get(client.sessionId);

            if (player && this.state.players.size >= 2) {
                this.eliminatedPlayers.push(player.sessionId);
                console.log(`Player ${client.sessionId} eliminated and added to the eliminated players list.`);
                console.log(this.eliminatedPlayers.length, this.state.players.size - 1)
                if (this.eliminatedPlayers.length == this.state.players.size - 1) {
                    const winnerSessionId = this.getRemainingPlayer();
                    console.log(winnerSessionId)
                    console.log(this.eliminatedPlayers)
                    this.eliminatedPlayers.push(winnerSessionId)
                    console.log(this.eliminatedPlayers)
                    this.broadcast("finalResLutte", { tableau: this.eliminatedPlayers });



                }

            }
        });

    }

    onJoin(client, options) {
        console.log("Client joined!", client.sessionId);
        //const queryString = options.query || "";

        //const urlParams = new URLSearchParams(queryString);

        const pseudo = options.pseudo;   //urlParams.get('pseudo');
        const type = options.type;      //urlParams.get('type');
        const indice = options.indice;  //parseInt(urlParams.get('indice'));

        const player = new Player(client.sessionId);
        const playerIndex = this.state.players.size;
        console.log(playerIndex)
        if (playerIndex < 6) {
            const initialPosition = this.initialPositions[playerIndex];
            player.x = initialPosition.x;
            player.y = initialPosition.y;
            player.z = initialPosition.z;
            player.pseudo = pseudo;
            player.idCountryFlag = indice;
            player.type = type;
            if (playerIndex % 2 == 0) {
                player.color = "blue"
            }
            else {
                player.color = "red"
            }


            this.state.players.set(client.sessionId, player);

            console.log("new player =>", player.toJSON());

        }
        else {
            console.log("Vous ne pouvez plus entrer");
        }

    }
    onUpdate() { }


    onLeave(client) {
        console.log("Client left!", client.sessionId);
        const playerId = client.sessionId;
        const player = this.state.players.get(playerId);
        // Supprimer le joueur de la scène
        if (player) {
            this.broadcast("removePlayer", { sessionId: playerId });
            delete this.players[playerId];
        }
        this.state.players.delete(playerId);
    }

    onDispose() {
        console.log("Room disposed!");
    }
    setInitialPositions(data) {

        switch (data) {
            case "race_room":
                this.initialPositions = [
                    { x: -5, y: 10, z: 20.8 },
                    { x: -5, y: 10, z: 22.6 },
                    { x: -5, y: 10, z: 24.4 },
                    { x: -5, y: 10, z: 26.2 },
                    { x: -5, y: 10, z: 28 },
                    { x: -5, y: 10, z: 29.8 }
                ];
                break;
            case "football_room":
                this.initialPositions = [
                    { x: -20, y: 2, z: -30 },
                    { x: -14, y: 2, z: -10 },
                    { x: -18, y: 2, z: -28 },
                    { x: -15, y: 2, z: -11 },
                    { x: -16, y: 2, z: -25 },
                    { x: -13, y: 2, z: -12 }
                ];
                break;
            case "combat_room":
                this.initialPositions = [
                    { x: -3, y: 10, z: 0 },
                    { x: -2, y: 10, z: -2 },
                    { x: 0, y: 10, z: -4 },
                    { x: 2, y: 10, z: 2 },
                    { x: 5, y: 10, z: 0 },
                    { x: 3, y: 10, z: -4 }
                ];
                break;
            default:
                console.error("Invalid game type");
                break;
        }
    }
}

const server = new Server();
server.define('race_room', MyRoom).enableRealtimeListing(); // Salle pour le jeu de course
server.define('combat_room', MyRoom).enableRealtimeListing(); // Salle pour le jeu de combat
server.define('football_room', MyRoom).enableRealtimeListing(); // Salle pour le jeu de football
server.listen(2567);
console.log("Server started on port 2567");
