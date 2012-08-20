eclipse.simulateTurn = function(defender, attacker, isMissileRound) {

    function hasViableShips(ships, ix, isMissileRound) {
        return ships[ix].some(function(shipOfClass) {
            return shipOfClass.get("isAlive") &&
                (isMissileRound ? shipOfClass.get("hasMissiles") : shipOfClass.get("hasBeamWeapons"));
        });
    }

    var id = 0, ia = 0, ix = 0;
    var len = defender.get("length") + attacker.get("length");
    while (ix < len) {
        if (hasViableShips(defender, id, isMissileRound)) {

        }
        ix++;
    }

    return [defender, attacker];
};

eclipse.simulateFight = function(defenderShips, attackerShips) {

    var status = "continue";

    function battleCanContinue(defender, attacker) {

    }

    function copyGroupAndSort(ships) {
        var grouped = {};
        ships.forEach(function(ship) {
            var name = ship.get("name");
            var arr = grouped.hasOwnProperty(name) ? grouped[name] : grouped[name] = [];
            arr.push(ship.copy());
        });
        var grouped_ships = [];
        for (var key in grouped) {
            if (grouped.hasOwnProperty(key)) {
                grouped_ships.push({name: key, ships: grouped[key]});
            }
        }

        grouped_ships.sort(function(a, b) {
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

};
