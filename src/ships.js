eclipse.Ship = Ember.Object.extend(Ember.Copyable, {
    cost: 0,
    initiative: 0,
    slots: 0,
    parts: [],
    name: "default",
    damage: 0,
    moving: true,
    innateEnergy: 0,

    copy: function(deep) {
        return eclipse.Ship.create({
            cost: this.get("cost"),
            initiative: this.get("initiative"),
            slots: this.get("slots"),
            parts: this.get("parts").copy(),
            name: this.get("name"),
            damage: this.get("damage"),
            moving: this.get("moving"),
            innateEnergy: this.get("innateEnergy")
        });
    },

    isValid: function() {
        var slots = this.get("slots");
        var parts = this.get("parts");
        var moving = this.get("moving");
        var valid = slots >= parts.get("length");
        if (valid) {
            var hasMotor = parts.some(function(part) {return !!part.move; });
            valid = moving ? hasMotor : !hasMotor;
        }
        if (valid) {
            valid = this.get("totalEnergy") >= 0;
        }
        return valid;
    }.property("slots", "parts", "moving"),

    totalAttackBonus: function() {
        return this.get("parts").map(function(part) {
            return part.hasOwnProperty("attack") ? part.attack : 0;
        });
    }.property("parts"),

    totalShieldBonus: function() {
        return this.get("parts").map(function(part) {
            return part.hasOwnProperty("shield") ? part.shield : 0;
        }).sum();
    }.property("parts"),

    totalEnergy: function() {
        var totalEnergy = this.get("energy") + this.get("parts").map(function(part) {
            return part.hasOwnProperty("energy") ? part.energy : 0;
        }).sum();
        return totalEnergy;
    }.property("parts", "energy"),

    totalInitiative: function() {
        var initiative = this.get("initiative");
        initiative += this.get("parts").map(function(part) {
            return part.hasOwnProperty("initiative") ? part.initiative : 0;
        }).sum();
        return initiative;
    }.property("initiative", "parts"),

    totalHull: function() {
        var totalHull = this.get("parts").map(function(part) {
            return part.hasOwnProperty("hitPoints") ? part.hitPoints : 0;
        }).sum();
        return totalHull;
    }.property("parts"),

    isAlive: function() {
        return this.get("damage") <= this.get("totalHull");
    }.property("damage", "totalHull"),

    hasMissiles: function() {
        return this.get("parts").some(function(part) { return part.missile; });
    }.property("parts"),

    hasBeamWeapons: function() {
        return this.get("parts").some(function(part) {
           return part.damage && !part.missile;
        });
    }.property("parts")
});

eclipse.ships = function(parts) {
    var ships = [
        {name: "interceptor", cost: 3, initiative: 2, slots: 4, moving: true, parts:
            ["ion cannon", "nuclear drive", "nuclear source"]},
        {name: "cruiser", cost: 5, initiative: 1, slots: 6, moving: true, parts:
            ["ion cannon", "hull", "electron computer", "nuclear drive", "nuclear source"]},
        {name: "dreadnought", cost: 8, slots: 8, moving: true, parts:
            ["ion cannon", "ion cannon", "hull", "hull", "electron computer", "nuclear drive", "nuclear source"]},
        {name: "starbase", cost: 3, slots: 5, initiative: 4, moving: false, innateEnergy: 3, parts:
            ["hull", "hull", "electron computer", "ion cannon"]}
    ].map(function(propertyHash) {
        return eclipse.Ship.create(propertyHash);
    });
    return ships;
};
