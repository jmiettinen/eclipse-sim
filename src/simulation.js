Eclipse.Simulator = {};
(function (sim) {

    var KILL_SCORES = {dreadnought: 700, cruiser: 450, interceptor: 250, starbase: 400};
    var DAMAGE_SCORES = {dreadnought: 8, cruiser: 8, interceptor: 8, starbase: 8};
    var callCount = 0;
    var maxScore = 0;
    var UNUSED_DIE = -1;
    var MISS_DIE = -2;

    var rand = (function() {
        var twister = new MersenneTwister();
        return function() {
            return Math.ceil(twister.random() * 6);
        }
    })();

    function getInitiative(shipsOfAClass) {
        return shipsOfAClass && shipsOfAClass.length > 0 ? shipsOfAClass.get("firstObject.totalInitiative") : 9999; // Inf could cause problems.
    }

    function hasViableShips(shipsOfClass, isMissileRound) {
        return shipsOfClass.some(function (shipOfClass) {
            return shipOfClass.get("isAlive") &&
                (isMissileRound ? shipOfClass.get("hasMissiles") : shipOfClass.get("hasBeamWeapons"));
        });
    }

    function calculateScoring(targetShips, damagePerShip, hullPerShip) {
        // We intentionally include all the damage done to the ship, not just the damage done on this round.
        var damage;
        var sum = 0;
        for (i = 0; i < targetShips.length; i++) {
            damage = damagePerShip[i];
            if (damage === 0) { continue; }
            if (damage <= hullPerShip[i]) {
                sum += DAMAGE_SCORES[targetShips[i].get("name")] * damage;
            } else {
                sum += KILL_SCORES[targetShips[i].get("name")];
            }
        }
        return sum;
    }

    var retValObject = {score: 0, diceHits: []};

    function recurseDistributeDamageToShips(targetShips, dice, diceHits, damagePerShip, hullPerShip, scoreToHitPerShip, bestScore) {
        if ((++callCount & 1023) === 0) { Eclipse.log("" + callCount + " calls"); }
        var isRoot = true;
        var diceLen = diceHits.length;
        var shipsLen = targetShips.length;
        var i, j, ship;
        var leafScoreObj = retValObject;
        var tmp;
        for (i = 0; i < diceLen; i++) {
            if (diceHits[i] == UNUSED_DIE) {
                isRoot = false;
                var roll = dice[i].roll;
                var damage = dice[i].damage;
                for (j = 0; j < shipsLen; j++) {
                    if (roll >= scoreToHitPerShip[j] && damagePerShip[i] <=  hullPerShip[i]) {
                        damagePerShip[j] += damage;
                        diceHits[i] = j;
                        leafScoreObj = recurseDistributeDamageToShips(targetShips, dice, diceHits, damagePerShip, hullPerShip, scoreToHitPerShip, bestScore);
                        if (leafScoreObj !== null) {
                            tmp = {};
                            bestScore = tmp.score = leafScoreObj.score;
                            tmp.diceHits = leafScoreObj.diceHits;
                            leafScoreObj = tmp;
                        }
                        // After recursing, return stuff to as they were.
                        diceHits[i] = UNUSED_DIE;
                        damagePerShip[j] -= damage;
                        break;
                    }
                }
                // There's some strange interplay going on here!
                if (j == shipsLen) { diceHits[i] = MISS_DIE; }
            }
        }
        if (isRoot) {
            var score = calculateScoring(targetShips, damagePerShip, hullPerShip);
            if (score > bestScore) {
                retValObject.score = score;
                retValObject.diceHits = diceHits.slice();
                return retValObject;
            } else {
                return null;
            }
        } else {
            return leafScoreObj;
        }
    }

    function distributeDamageToShips(targetShips, attackBonus, dice) {
        var diceHits = new Array(dice.length);
        var i, ship;
        for (i = 0; i < diceHits.length; i++) { diceHits[i] = UNUSED_DIE; }
        var toHitPerShip = new Array(targetShips.length);
        var damagePerShip = new Array(targetShips.length);
        var hullPerShip = new Array(targetShips.length);
        for (i = 0; i < targetShips.length; i++) {
            ship = targetShips[i];
            toHitPerShip[i] = Math.max(2, Math.min(6, 6 - (attackBonus - ship.get("totalShieldBonus"))));
            damagePerShip[i] = ship.get("damage");
            hullPerShip[i] = ship.get("totalHull");
        }
        var bestScoreObj = recurseDistributeDamageToShips(targetShips, dice, diceHits, damagePerShip, hullPerShip, toHitPerShip, 0);
        return bestScoreObj == null ? [] : bestScoreObj.diceHits;
    }

    function pruneDice(dice, shipsByClass, attackBonus) {
        var minimumHitter = 6;
        shipsByClass.forEach(function(shipClass) {
            if (shipClass.ships.length > 0) {
                var ship = shipClass.ships.get("firstObject");
                var willHit = Math.min(6, 6 - (attackBonus - ship.get("totalShieldBonus")));
                if (willHit < minimumHitter) { minimumHitter = willHit; }
            }
        });
        var prunedDice = [];
        dice.forEach(function(die) { if (die.roll >= minimumHitter) { prunedDice.push(die); }});
        return prunedDice;
    }

    function distributeDamage(targetShipsByClass, dice, attackBonus, isMissileRound) {
        var shipsBySize = targetShipsByClass.map(function(hsh) { return {name: hsh.name, ships: hsh.ships}});
        shipsBySize.sort(function(a, b) {
            var shipA = a.ships.get("firstObject");
            var shipB = b.ships.get("firstObject");
            return shipB.get("slots") - shipA.get("slots"); // Largest first
        });

        var sureHitters = [];
        var sureMissers = [];
        var others = [];
        dice.forEach(function(die) {
            switch (die.roll) {
                case 1: sureMissers.push(die); break;
                case 6: sureHitters.push(die); break;
                default: others.push(die); break;
            }
        });
        var sortedTargetShips = [];
        shipsBySize.forEach(function(shipClass) {
            shipClass.ships.forEach(function(ship) {
                if (ship.get("isAlive")) { sortedTargetShips.push(ship); }
            });
        });
        others = pruneDice(others, targetShipsByClass, attackBonus);
        sureHitters = pruneDice(sureHitters, targetShipsByClass, attackBonus);
        var allPossiblyHittingDice = others.concat(sureHitters);
        var normalDiceLen = others.length;
        var sureDiceLen = sureHitters.length;
        callCount = 0;
        maxScore = sortedTargetShips.reduce(function(total, ship) { return total + KILL_SCORES[ship.get("name")]; }, 0);
        var distribution = distributeDamageToShips(sortedTargetShips, attackBonus, allPossiblyHittingDice);
        Eclipse.log("Total " + callCount + " calls to distributeDamageToShips(...)");
        for (var i = 0; i < distribution.length; i++) {
            var ix = distribution[i];
            if (ix >= 0) {
                var ship = sortedTargetShips[ix];
                ship.set("damage", ship.get("damage") + allPossiblyHittingDice[i].damage);
                Eclipse.log("Ship %@ now has %@ hits (%@ hull)".fmt(ship.get("name"), ship.get("damage"), ship.get("totalHull")));
            }
        }
        // Destroy maximum number of ships, starting from the largest one and working down as long as there are ships
        // to kill. The rest of the dice are used to inflict maximum damage, prioritizing largest ships.
        // Now, how to inflict maximum damage and what that is?
    }

    function removeDeadShips(shipsByClass, deadShipArray) {
        shipsByClass.forEach(function(shipClass) {
            var aliveShips = [];
            shipClass.ships.forEach(function(ship) {
                if (!ship.get("isAlive")) { deadShipArray.push(ship); }
                else { aliveShips.push(ship); }
            });
            shipClass.ships = aliveShips;
        });
        return deadShipArray;
    }

    function diceToString(dice) {
        var tmp = [];
        dice.forEach(function(die) {tmp.push("%@:%@".fmt(die.roll, die.damage));});
        return tmp.join(", ");
    }

    sim.simulateTurn = function (defender, attacker, isMissileRound) {

        function attackWith(shootingShips, receivingEnd, isMissileRound, side) {
            if (shootingShips === null) { return; }
            if (!receivingEnd.some(function(shipClass) { return shipClass.ships.length > 0; })) { return; }
            if (hasViableShips(shootingShips, isMissileRound)) {
                var damage = shootingShips.map(function(ship) {
                    return attack(ship, isMissileRound);
                }).reduce(function(total, val) { return total.concat(val); }, []);
                damage.sort(function(a, b) {
                    var diff = a.roll - b.roll;
                    return diff === 0 ? a.damage - b.damage : diff;
                });
                Eclipse.log("%@ %@%@ rolls %@".fmt(side, shootingShips.get("firstObject.name"),(shootingShips.get("length") > 1 ? "s" : ""), diceToString(damage)));
                distributeDamage(receivingEnd, damage, shootingShips.get("firstObject.totalAttackBonus"), isMissileRound);
            }
        }

        var defenderShipsThatDied = [];
        var attackerShipsThatDied = [];

        var id = 0, ia = 0, ix = 0;
        var len = defender.get("length") + attacker.get("length");
        while (ix < len) {
            var defenderShips = id < defender.get("length") ? defender[id].ships : null;
            var attackerShips = ia < attacker.get("length") ? attacker[ia].ships : null;
            if (getInitiative(defenderShips) <= getInitiative(attackerShips)) {
                attackWith(defenderShips, attacker, isMissileRound, "defender");
                id++;
            } else {
                attackWith(attackerShips, defender, isMissileRound, "attacker");
                ia++;
            }
            ix++;
            removeDeadShips(defender, defenderShipsThatDied);
            removeDeadShips(attacker, attackerShipsThatDied);
        }

        return {alive: [defender, attacker], dead: [defenderShipsThatDied, attackerShipsThatDied]};
    };

    function reportDestroyed(shipList, side) {
        if (shipList && shipList.get("length") > 0) {
            console.log("Destroyed ships for " + side + ": " + shipList.map(function(ship){ return ship.get("name"); }).join(", "));
        }
    }

    function attack(ship, isMissileRound) {
        if (!ship.get("isAlive")) { return []; }
        var weapons;
        if (isMissileRound) {
            weapons = ship.get("weapons").filter(function(part) { return !!part.missile; });
        } else {
            weapons = ship.get("weapons").filter(function(part) { return !part.missile; });
        }
        if (weapons.get("length") == 0) { return []; }
        var rolls =  [];
        weapons.forEach(function(weapon) {
            if (typeof weapon.damage === "number") {
                rolls.push({roll: rand(), damage: weapon.damage});
            } else {
                weapon.damage.forEach(function(damage) {
                    rolls.push({roll: rand(), damage: damage});
                })
            }
        });
        return rolls;
    }

    sim.simulateFight = function (defenderShips, attackerShips) {

        function someOneCanAttack(shipsByClass) {
            return shipsByClass.some(function (shipClass) {
                return shipClass.ships.some(function (ship) {
                    return ship.get("isAlive") && ship.get("hasBeamWeapons");
                });
            });
        }

        function fleetSize(shipsByClass) {
            return shipsByClass.reduce(function(total, shipClass) {
                return total + shipClass.ships.length;
            }, 0);
        }

        function copyGroupAndSort(ships) {
            var grouped = {};
            ships.forEach(function (ship) {
                var name = ship.get("name");
                var arr = grouped.hasOwnProperty(name) ? grouped[name] : grouped[name] = [];
                arr.push(ship.copy());
            });
            var grouped_ships = [];
            for (var key in grouped) {
                if (grouped.hasOwnProperty(key)) {
                    grouped_ships.push({name:key, ships:grouped[key]});
                }
            }

            grouped_ships.sort(function (a, b) {
                var shipA = a.ships.get("firstObject");
                var shipB = b.ships.get("firstObject");

                if (typeof shipA === "undefined") {
                    if (typeof shipB === "undefined") { return 0; }
                    return 1;
                } else if (typeof shipB === "undefined") {
                    return -1;
                }

                var initiativeDiff = getInitiative(a) - getInitiative(b);
                if (initiativeDiff === 0) {
                    initiativeDiff = shipA.get("slots") - shipB.get("slots");
                }
                return initiativeDiff;
            });

            return grouped_ships;
        }

        var defender = copyGroupAndSort(defenderShips);
        var attacker = copyGroupAndSort(attackerShips);
        Eclipse.log("Missile round!");

        var roundNumber = 1;
        while((someOneCanAttack(defender) || someOneCanAttack(attacker)) && (fleetSize(defender) > 0 && fleetSize(attacker) > 0) && roundNumber < 30) {
            Eclipse.log("Normal round " + roundNumber);
            var res = sim.simulateTurn(defender, attacker, roundNumber++ == 1);
            defender = res.alive[0]; attacker = res.alive[1];
            reportDestroyed(res.dead[0], "defender");
            reportDestroyed(res.dead[1], "attacker");
        }
        var winner = "neither";
        if (fleetSize(defender) > 0 && fleetSize(attacker) === 0) { winner = "defender"; }
        if (fleetSize(attacker) > 0 && fleetSize(defender) === 0) { winner = "attacker"; }

        return {winner: winner, defender: defender, attacker: attacker};
    };
})(Eclipse.Simulator);
