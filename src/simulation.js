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

    function minimumKillingSet(ship, dice) {
        // Calculate 'minimum cover' for the ship hull using dice
    }

    function distributeDamage(shipsByClass, dice, attackBonus, isMissileRound) {
        var shipsBySize = shipsByClass.map(function(hsh) { return {name: hsh.name, ships: hsh.ships}});
        shipsBySize.sort(function(a, b) {
            var shipA = a.ships.get("firstObject");
            var shipB = b.ships.get("firstObject");
            return shipB.get("slots") - shipA.get("slots"); // Largest first
        });
        shipsBySize.forEach(function(shipClass) {

        });
        var filteredDice = dice.filter(function(die) { return die.roll > 1; });

        // Now, how to inflict maximum damage and what that is?
    }

    sim.simulateTurn = function (defender, attacker, isMissileRound) {

        function attackWith(shootingShips, receivingEnd, isMissileRound) {
            if (hasViableShips(shootingShips, isMissileRound)) {
                var damage = shootingShips.map(function(ship) {
                    return attack(ship, isMissileRound);
                }).reduce(function(total, val) { return total.concat(val); }, []);
                distributeDamage(receivingEnd, damage, shootingShips.get("firstObject.totalAttackBonus"), isMissileRound);
            }
        }

        function getInitiative(shipClass) {
            return shipClass ? shipClass.get("firstObject.totalInitiative") : Infinity;
        }

        var id = 0, ia = 0, ix = 0;
        var len = defender.get("length") + attacker.get("length");
        while (ix < len) {
            var defenderShips = id < defender.get("length") ? defender[id].ships : null;
            var attackerShips = ia < attacker.get("length") ? attacker[ia].ships : null;
            if (getInitiative(defenderShips) <= getInitiative(attackerShips)) {
                attackWith(defenderShips, attacker, isMissileRound);
                id++;
            } else {
                attackWith(attackerShips, defender, isMissileRound);
                ia++;
            }
            ix++;
        }

        return {alive: [defender, attacker], dead: [[], []]};
    };

    function reportDestroyed(shipList, side) {
        if (shipList && shipList.get("length") > 0) {
            console.log("Destroyed ships for" + ship + ": " + shipList.map(function(ship){ return ship.get("name"); }).join(", "));
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
        console.log("Missile round!");

        var roundNumber = 1;
        while((someOneCanAttack(defender) || someOneCanAttack(attacker)) && roundNumber < 5) {
            console.log("Normal round " + roundNumber++);
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
