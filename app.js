const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http:localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//API 1
//Returns a list of all the players in the player table

const convertDBServerAPI1 = (objectItem) => {
  return {
    playerId: objectItem.player_id,
    playerName: objectItem.player_name,
  };
};

app.get("/players/", async (request, response) => {
  const getAllPlayerQuery = `select * from player_details`;
  const getAllPlayersQueryResponse = await db.all(getAllPlayerQuery);
  response.send(
    getAllPlayersQueryResponse.map((eachPlayer) =>
      convertDBServerAPI1(eachPlayer)
    )
  );
});

//API 2
// Returns a specific player based on the player ID
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerByIdQuery = `select * from player_details where player_id = ${playerId}`;
  const getPlayerByIdQueryResponse = await db.get(getPlayerByIdQuery);
  response.send(convertDBServerAPI1(getPlayerByIdQueryResponse));
});

//API 3
// Updates the details of a specific player based on the player ID
app.put("/players/:playerId/", (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerByIdQuery = `update player_details set player_name = '${playerName}' where player_id = ${playerId}`;
  const updatePlayerByIdQueryResponse = db.run(updatePlayerByIdQuery);
  response.send("Player Details Updated");
});

//API 4
//Returns the match details of a specific match
const convertDBServerAPI4 = (objectItem) => {
  return {
    matchId: objectItem.match_id,
    match: objectItem.match,
    year: objectItem.year,
  };
};

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchesByIdQuery = `select * from match_details where match_id = ${matchId}`;
  const getMatchesByIdQueryResponse = await db.get(getMatchesByIdQuery);
  response.send(convertDBServerAPI4(getMatchesByIdQueryResponse));
});

// API 5
// Returns a list of all the matches of a player
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getMatchesOfPlayerQuery = `select match_id from player_match_score where player_id = ${playerId}`;
  const getMatchesOfPlayerQueryResponse = await db.all(getMatchesOfPlayerQuery);

  //get player ids array
  const matchIdArray = getMatchesOfPlayerQueryResponse.map((eachMatch) => {
    return eachMatch.match_id;
  });

  //console.log(`${matchIdArray}`);
  const getMatchDetailsQuery = `select *from match_details where match_id in (${matchIdArray})`;
  const getMatchDetailsQueryResponse = await db.all(getMatchDetailsQuery);
  response.send(
    getMatchDetailsQueryResponse.map((eachMach) =>
      convertDBServerAPI4(eachMach)
    )
  );
});

//API 6
// Returns a list of players of a specific match
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayersQuery = `
    select
     *
    from player_match_score
    NATURAL JOIN player_details
     where
      match_id = ${matchId}`;
  const getMatchPlayersQueryResponse = await db.all(getMatchPlayersQuery);
  response.send(
    getMatchPlayersQueryResponse.map((eachPlayer) =>
      convertDBServerAPI1(eachPlayer)
    )
  );
});

//API 7
//Returns the statistics of the total score, fours, sixes of a specific player based on the player ID

const convertDBAndServerAPI7 = (playerName, objectItem) => {
  return {
    playerId: objectItem.player_id,
    playerName: playerName,
    totalScore: objectItem.totalScore,
    totalFours: objectItem.totalFours,
    totalSixes: objectItem.totalSixes,
  };
};

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerNameQuery = `select player_name from player_details where player_id = ${playerId};`;
  const getPlayerName = await db.get(getPlayerNameQuery);
  const getPlayerStatsQuery = `select player_id,
  sum(score) as totalScore, sum(fours) as totalFours , sum(sixes) as totalSixes from 
  player_match_score where player_id = ${playerId};`;
  const getPlayerStats = await db.get(getPlayerStatsQuery);
  response.send(
    convertDBAndServerAPI7(getPlayerName.player_name, getPlayerStats)
  );
});

module.exports = app;
