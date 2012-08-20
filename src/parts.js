eclipse.parts = function() {
    return  [
        {name: "ion cannon", damage: 1, energy: -1},
        {name: "plasma cannon", damage: 2, energy: -2},
        {name: "anti-matter cannon", damage: 4, energy: -4},
        {name: "ion turret", damage: [1,1], energy: -1},
        {name: "plasma missile", damage: [2,2], missile: true},
        {name: "ion missile", damage: [1,1,1], missile: true, discovery: true},
        {name: "electron computer", attack: 1},
        {name: "positron computer", attack: 2, energy: -1, initiative: 1},
        {name: "gluon computer", attack: 3, energy: -2, initiative: 2},
        {name: "axion computer", attack: 3, discovery: true},
        {name: "nuclear drive", energy: -1, initiative: 1},
        {name: "fusion drive", initiative: 2, move: 3, energy: -2},
        {name: "tachyon drive", initiative: 3, move: 3, energy: -3},
        {name: "conformal drive", initiative: 2, move: 4, energy: -2, discovery: true},
        {name: "gauss shield", shield: 1},
        {name: "phase shield", shield: 2, energy: -1},
        {name: "flux shield", shield: 3, energy: -2},
        {name: "nuclear source", energy: 3},
        {name: "fusion source", energy: 6},
        {name: "tachyon source", energy: 9},
        {name: "hypergrid source", energy: 11, discovery: true},
        {name: "hull", hitPoints: 1},
        {name: "improved hull", hitPoints: 2},
        {name: "shard hull", hitPoints: 3}
    ];
};
