function scroll_if_anchor(href) {
	var fromTop = parseInt($('body').css('padding-top'));
	href = typeof(href) == "string" ? href : $(this).attr("href");

	if (href == undefined)
		return;

	var dest = utils.parseUri(href);

	if (utils.uri_is_in_this_page(href)) {
		href = "#" + dest.fragment;
	}

	if(href.indexOf("#") == 0) {
		var $target = $(href.replace( /(:|\.|\[|\]|,)/g, "\\$1"));

		if($target.length) {
			$('html, body').animate({ scrollTop: $target.offset().top - fromTop });
			if(history && "pushState" in history) {
				history.pushState({}, document.title, window.location.pathname + href);
				return false;
			}
		}
	}
}    

scroll_if_anchor(window.location.hash);

$("body").on("click", "a[href]", scroll_if_anchor);

