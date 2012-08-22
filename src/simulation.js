Eclipse.Simulator = {};
(function (sim) {

    var rand = (function() {
        var twister = new MersenneTwister();
        return function() {
            return Math.ceil(twister.random() * 6);
        }
    })();

    function hasViableShips(shipsOfClass, isMissileRound) {
        return shipsOfClass.some(function (shipOfClass) {
            return shipOfClass.get("isAlive") &&
                (isMissileRound ? shipOfClass.get("hasMissiles") : shipOfClass.get("hasBeamWeapons"));
        });
    }

    function minimumKillingSet(ship, attackBonus, normalDice, sureHitterDice) {
        // Calculate 'minimum cover' for the ship hull using dice
    }

    function willHit(die, attackBonus, targetShip) {
        var roll = die.roll;
        switch (roll) {
            case 1: return false;
            case 6: return true;
            default: return (roll + attackBonus - targetShip.get("totalShieldBonus")) >= 6;
        }
    }

    function killShip(ship, attackBonus, normalDice, sureHitterDice) {
        var requiredDamage = ship.get("totalHull") - ship.get("damage") + 1;
        var killed = false;
        if (requiredDamage > 0) {
            normalDice = normalDice.slice();
            sureHitterDice = sureHitterDice.slice();
        } else { killed = true; }
        return {killed: killed, normalDice: normalDice, sureHitterDice: sureHitterDice};
    }

    function killShips(shipList, attackBonus, normalDice, sureHitterDice) {

    }

    function distributeDamage(shipsByClass, dice, attackBonus, isMissileRound) {
        var shipsBySize = shipsByClass.map(function(hsh) { return {name: hsh.name, ships: hsh.ships}});
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
        var sortedShips = [];
        shipsBySize.forEach(function(shipClass) {
            shipClass.ships.forEach(function(ship) {
                if (ship.get("isAlive")) { sortedShips.push(ship); }
            });
        });

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

        function getInitiative(shipClass) {
            return shipClass ? shipClass.get("firstObject.totalInitiative") : Infinity;
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
            console.log("Destroyed ships for" + side + ": " + shipList.map(function(ship){ return ship.get("name"); }).join(", "));
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

                var initiativeDiff = shipA.get("totalInitiative") - shipB.get("totalInitiative");
                if (initiativeDiff === 0) {
                    initiativeDiff = shipA.slots - shipB.slots;
                }
                return initiativeDiff;
            });

            return grouped_ships;
        }

        var defender = copyGroupAndSort(defenderShips);
        var attacker = copyGroupAndSort(attackerShips);
        Eclipse.log("Missile round!");

        var roundNumber = 1;
        while((someOneCanAttack(defender) || someOneCanAttack(attacker)) && roundNumber < 5) {
            Eclipse.log("Normal round " + roundNumber++);
            var res = sim.simulateTurn(defender, attacker);
            defender = res.alive[0]; attacker = res.alive[1];
            reportDestroyed(res.dead[0], "defender");
            reportDestroyed(res.dead[1], "attacker");
        }
        var winner = "neither";
        if (defender.get("length") > 0 && attacker.get("length") === 0) { winner = "defender"; }
        if (attacker.get("length") > 0 && defender.get("length") === 0) { winner = "attacker"; }

        return {winner: winner, defender: defender, attacker: attacker};
    };
})(Eclipse.Simulator);
