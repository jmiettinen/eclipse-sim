Eclipse = Ember.Application.create({

    init: function() {
        Ember.Enumerable.reopen({
            sum: function(initialValue) {
                return this.reduce(function(prev, item) {
                    return prev + item;
                }, typeof initialValue === "undefined" ? 0 : initialValue);
            }
        });
    },

    ready: function() {
        this._super();
    }
});

Eclipse.log = function() {
    if (Eclipse.DEBUG && console && console.log) {
        console.log.apply(console, arguments);
    }
};
Eclipse.DEBUG = true;
