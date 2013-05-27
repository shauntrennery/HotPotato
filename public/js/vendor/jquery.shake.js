(function($) {
  $.fn.shake = function(options) {
    var settings = {
      'shakes': 2,
      'distance': 10,
      'duration': 400,
      'scrollOffset': 0
    };

    if (options) {
      $.extend(settings, options);
    }

    var pos;
    return this.each(function() {
      $this = $(this);
      pos = $this.css('position');
      if (!pos || pos === 'static') {
        $this.css('position', 'relative');
      }

      // ensure in view
      $('html, body').animate({
        scrollTop: 0
      }, 100, function() {
        for (var x = 1; x <= settings.shakes; x++) {
          $this
            .animate({ left: settings.distance * -1 }, (settings.duration / settings.shakes) / 4)
            .animate({ left: settings.distance }, (settings.duration / settings.shakes) / 2)
            .animate({ left: 0 }, (settings.duration / settings.shakes) / 4);
        }
      });
    });
  };
}(jQuery));