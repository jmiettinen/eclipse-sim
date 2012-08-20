window.eclipse = Ember.Application.create({

    ready: function() {
        this._super();
        Ember.Enumerable.mixin({
            sum: function(startValue) {
                var sum = typeof startValue == "undefined" ? 0 : startValue;
                this.forEach(function(item) {
                    sum = sum + item;
                });
                return sum;
            }
        });
    }

});
