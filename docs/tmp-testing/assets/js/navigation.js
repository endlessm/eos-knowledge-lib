function unfold_current_page(base_name) {
	var this_panel = $('#site-navigation .panel-collapse[data-nav-ref="' + base_name + '"]');
	var this_panel_body = $('#site-navigation .sidenav-ref[data-nav-ref="' + base_name + '"]');
	var panels_to_unfold = $(this_panel).parents("#site-navigation .panel-collapse");
	panels_to_unfold.addClass("panel-body-current").parent().addClass('sidenav-panel-current');
	this_panel.addClass("panel-body-current").parent().addClass('sidenav-panel-current');

	var panels = $('#site-navigation .panel-collapse:not(.panel-body-current)');

	$(this_panel_body).attr("href", "#");

	panels.collapse("hide");

	return this_panel;
}

$(document).ready(function() {
	var wrapper = $("#sitenav-wrapper");
	var this_panel = unfold_current_page(utils.hd_context.extension + "-" + utils.hd_context.project_name + "-" + utils.hd_context.hd_basename);

	$('a').click(function(e) {
		scroll_if_anchor ($(this).attr("href"));
		e.stopPropagation();
	});

	setupFilters();

	wrapper.mCustomScrollbar({ "scrollInertia": 0, "theme": "minimal" });
	wrapper.mCustomScrollbar("scrollTo", this_panel.offset().top - wrapper.offset().top - $('#topnav').height() + 8);

	$("#toc-wrapper").mCustomScrollbar({ "scrollInertia": 0, "theme": "dark" });
	$('#offcanvasleft').click(function() {
		$('#sidenav').toggleClass('oc-collapsed');
		$('#content-column').toggleClass("col-sm-12 col-sm-6 col-xs-12 col-xs-6");
		$('#footer-left-column').toggleClass("hidden-xs col-xs-6 hidden-sm col-sm-6");
		$('#footer-content-column').toggleClass("col-xs-12 col-xs-6 col-sm-12 col-sm-6");
		$('#offcanvasleft-chevron').toggleClass("glyphicon-chevron-left glyphicon-chevron-right");
	});
});
