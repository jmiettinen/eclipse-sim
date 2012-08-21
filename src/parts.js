Eclipse.parts = (function() {
    return {
        "ion cannon": {damage: 1, energy: -1},
        "plasma cannon": {damage: 2, energy: -2},
        "anti-matter cannon": {damage: 4, energy: -4},
        "ion turret": {damage: [1,1], energy: -1},
        "plasma missile": {damage: [2,2], missile: true},
        "ion missile": {damage: [1,1,1], missile: true, discovery: true},
        "electron computer": {attack: 1},
        "positron computer": {attack: 2, energy: -1, initiative: 1},
        "gluon computer": {attack: 3, energy: -2, initiative: 2},
        "axion computer": {attack: 3, discovery: true},
        "nuclear drive": {initiative: 1, move: 1, energy: -1},
        "fusion drive": {initiative: 2, move: 2, energy: -2},
        "tachyon drive": {initiative: 3, move: 3, energy: -3},
        "conformal drive": {initiative: 2, move: 4, energy: -2, discovery: true},
        "gauss shield": {shield: 1},
        "phase shield": {shield: 2, energy: -1},
        "flux shield": {shield: 3, energy: -2},
        "nuclear source": {energy: 3},
        "fusion source": {energy: 6},
        "tachyon source": {energy: 9},
        "hypergrid source": {energy: 11, discovery: true},
        "hull": {hitPoints: 1},
        "improved hull": {hitPoints: 2},
        "shard hull": {hitPoints: 3}
    };
})();
