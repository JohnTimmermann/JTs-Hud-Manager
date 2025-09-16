import { Request, Response } from "express";
import { maybeRecordGSIPacket } from "./testGSI.js";
import { CSGOGSI, CSGORaw, Score } from "csgogsi";
import { io } from "../sockets/sockets.js";
import { selectAllSteamids } from "../coaches/coaches.data.js";
import { selectCurrent, update } from "../matches/matches.data.js";
import { gsiStatusMonitor } from "./gsiStatus.js";

export const GSI = new CSGOGSI();
// let last: CSGO;
// let matchEnded = false;
GSI.regulationMR = 12;
GSI.overtimeMR = 3;

export const readGameData = async (req: Request, res: Response) => {
  const data: CSGORaw = req.body;

  // Record packet for GSI status monitoring
  gsiStatusMonitor.recordPacket();
  maybeRecordGSIPacket(data);

  const coaches = await selectAllSteamids();
  fixGSIData(data, coaches);
  GSI.digest(data);
  io.emit("update", data);
  res.sendStatus(200);
};

const fixGSIData = (data: CSGORaw, coaches: string[]) => {
  if (data.player) {
    data.player.observer_slot =
      data.player.observer_slot !== undefined && data.player.observer_slot === 9
        ? 0
        : (data.player.observer_slot || 0) + 1;
  }

  if (data.allplayers) {
    Object.entries(data.allplayers).forEach(([id, player]) => {
      if (player && !coaches.includes(id)) {
        player.observer_slot =
          player.observer_slot === 9 ? 0 : (player.observer_slot || 0) + 1;
      } else {
        if (data.allplayers) {
          delete data.allplayers[id];
        }
      }
    });
  }
};

// Use GSI instead of other functions possibly

GSI.on("intermissionEnd", async () => {
  const match = (await selectCurrent()) as Match;
  if (!match) return;

  const map = GSI.current?.map;
  if (!map || !map.team_ct || !map.team_t) return;

  const ct = map.team_ct.score || 0;
  const t = map.team_t.score || 0;
  const total = ct + t;

  // Determine whether this intermission is a side-switching halftime
  const regulationHalftime = total === GSI.regulationMR;
  const regulationEndTotal = GSI.regulationMR * 2; // e.g., 24

  let shouldSwitch = false;
  if (regulationHalftime) {
    shouldSwitch = true;
  } else if (total > regulationEndTotal) {
    const otRoundsPlayed = total - regulationEndTotal;
    const otBlock = GSI.overtimeMR * 2;
    if (otRoundsPlayed % otBlock === GSI.overtimeMR) {
      shouldSwitch = true;
    }
  }

  if (!shouldSwitch) {
    return;
  }

  const { vetos } = match;
  const updatedVetos = vetos.map((veto) =>
    veto.mapName === map.name
      ? { ...veto, reverseSide: !veto.reverseSide }
      : veto,
  );
  match.vetos = updatedVetos;
  await update(match);
  io.emit("match", true);
});


GSI.on("matchEnd", async (score: Score) => {
  const match = (await selectCurrent()) as Match;
  if (!match) return;
  const mapName = score.map.name.substring(score.map.name.lastIndexOf("/") + 1);
  if (match) {
    const { vetos } = match;
    const isReversed = vetos.filter(
      (veto) => veto.mapName === mapName && veto.reverseSide,
    )[0];
    vetos.map((veto) => {
      if (
        veto.mapName !== mapName ||
        !score.map.team_ct.id ||
        !score.map.team_t.id
      ) {
        return veto;
      }
      veto.winner =
        score.map.team_ct.score > score.map.team_t.score
          ? score.map.team_ct.id
          : score.map.team_t.id;
      if (isReversed) {
        veto.winner =
          score.map.team_ct.score > score.map.team_t.score
            ? score.map.team_t.id
            : score.map.team_ct.id;
      }

      veto.mapEnd = true;
      veto.score = {
        [score.map.team_ct.id]: score.map.team_ct.score,
        [score.map.team_t.id]: score.map.team_t.score,
      };
      return veto;
    });
    if (match.left.id === score.winner.id) {
      if (isReversed) {
        match.right.wins++;
      } else {
        match.left.wins++;
      }
    } else if (match.right.id === score.winner.id) {
      if (isReversed) {
        match.left.wins++;
      } else {
        match.right.wins++;
      }
    }
    match.vetos = vetos;
    await update(match);
    io.emit("match", true);
  }
});

// GSI.on("roundEnd", async (score): Score => {
//   const match = (await selectCurrent()) as Match;
// });


// export const updateRound = async (game: CSGO) => {
//   const getWinType = (round_win: RoundOutcome) => {
//     switch (round_win) {
//       case "ct_win_defuse":
//         return "defuse";
//       case "ct_win_elimination":
//       case "t_win_elimination":
//         return "elimination";
//       case "ct_win_time":
//         return "time";
//       case "t_win_bomb":
//         return "bomb";
//       default:
//         return "time";
//     }
//   };
//   if (!game || !game.map || game.map.phase !== "live") return;

//   let round = game.map.round;

//   if (game.round && game.round.phase !== "over") {
//     round++;
//   }

//   const roundData: RoundData = {
//     round,
//     players: {},
//     winner: null,
//     win_type: null,
//   };

//   if (
//     game.round &&
//     game.round.win_team &&
//     game.map.round_wins &&
//     game.map.round_wins[round]
//   ) {
//     roundData.winner = game.round.win_team;
//     roundData.win_type = getWinType(game.map.round_wins[round]);
//   }
//   for (const player of game.players) {
//     roundData.players[player.steamid] = {
//       kills: player.state.round_kills,
//       killshs: player.state.round_killhs,
//       damage: player.state.round_totaldmg,
//     };
//   }

//   const match: Match | null = await selectCurrent();

//   if (!match) return;

//   const mapName = game.map.name.substring(game.map.name.lastIndexOf("/") + 1);
//   const veto = match.vetos.find(
//     (veto) => veto.mapName === mapName && !veto.mapEnd
//   );

//   if (!veto || veto.mapEnd) return;
//   if (
//     veto.rounds &&
//     veto.rounds[roundData.round - 1] &&
//     JSON.stringify(veto.rounds[roundData.round - 1]) ===
//       JSON.stringify(roundData)
//   )
//     return;

//   match.vetos = match.vetos.map((veto) => {
//     if (veto.mapName !== mapName) return veto;
//     if (!veto.rounds) veto.rounds = [];
//     veto.rounds[roundData.round - 1] = roundData;
//     veto.rounds = veto.rounds.splice(0, roundData.round);
//     return veto;
//   });

//   return update(match);
// };

// const onRoundEnd = async (score: Score) => {
//   if (score.loser && score.loser.logo) {
//     // @ts-ignore
//     delete score.loser.logo;
//   }
//   if (score.winner && score.winner.logo) {
//     // @ts-ignore
//     delete score.winner.logo;
//   }

//   const match: Match | null = await selectCurrent();
//   if (!match) return;
//   const { vetos } = match;
//   const mapName = score.map.name.substring(score.map.name.lastIndexOf("/") + 1);
//   vetos.map((veto) => {
//     if (
//       veto.mapName !== mapName ||
//       !score.map.team_ct.id ||
//       !score.map.team_t.id ||
//       veto.mapEnd
//     ) {
//       return veto;
//     }
//     if (!veto.score) {
//       veto.score = {};
//     }
//     veto.score[score.map.team_ct.id] = score.map.team_ct.score;
//     veto.score[score.map.team_t.id] = score.map.team_t.score;
//     if (veto.reverseSide) {
//       veto.score[score.map.team_t.id] = score.map.team_ct.score;
//       veto.score[score.map.team_ct.id] = score.map.team_t.score;
//     }
//     return veto;
//   });
//   match.vetos = vetos;
//   await update(match);

//   io.emit("match", true);
// };

// GSI.on("data", async (data: CSGO) => {
//   await updateRound(data);
//   let round: Score | undefined;

//   if (
//     (last?.map.team_ct.score !== data.map.team_ct.score) !==
//     (last?.map.team_t.score !== data.map.team_t.score)
//   ) {
//     if (last?.map.team_ct.score !== data.map.team_ct.score) {
//       round = {
//         winner: data.map.team_ct,
//         loser: data.map.team_t,
//         map: data.map,
//         mapEnd: false,
//       };
//     } else {
//       round = {
//         winner: data.map.team_t,
//         loser: data.map.team_ct,
//         map: data.map,
//         mapEnd: false,
//       };
//     }
//   }

//   if (round) {
//     await onRoundEnd(round);
//   }

//   if (data.map.phase === "gameover") {
//     const winner =
//       data.map.team_ct.score > data.map.team_t.score
//         ? data.map.team_ct
//         : data.map.team_t;
//     const loser =
//       data.map.team_ct.score > data.map.team_t.score
//         ? data.map.team_t
//         : data.map.team_ct;
//     const final = {
//       winner,
//       loser,
//       map: data.map,
//       mapEnd: true,
//     };
//     // await onMatchEnd(final);
//     matchEnded = true;
//   } else {
//     matchEnded = false;
//   }
//   if (GSI.last) {
//     last = GSI.last;
//   }
// });
