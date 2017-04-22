function unfold_current_page(base_name) {
	var this_panel = $('#site-navigation .panel-collapse[data-nav-ref="' + base_name + '"]');
	var this_panel_body = $('#site-navigation .sidenav-ref[data-nav-ref="' + base_name + '"]');
	var panels_to_unfold = $(this_panel).parents("#site-navigation .panel-collapse");
	panels_to_unfold.addClass("panel-body-current").parent().addClass('sidenav-panel-current');
	this_panel.addClass("panel-body-current").parent().addClass('sidenav-panel-current');

	if (utils.hd_context.gi_language != undefined)
		$(this_panel_body).attr("href", utils.hd_context.gi_language + "/" +  utils.hd_context.hd_basename + "#");
	else
		$(this_panel_body).attr("href", utils.hd_context.hd_basename + "#");

	panels_to_unfold.collapse("show");
	this_panel.collapse("show");

	return this_panel;
}

function sitemap_downloaded_cb(html_sitemap) {
	var sidenav = $('#sidenav');
	$("#sidenav").html(html_sitemap);
	var wrapper = $("#sitenav-wrapper");
	var this_panel = unfold_current_page(utils.hd_context.extension + "-" + utils.hd_context.project_name + "-" + utils.hd_context.hd_basename);
	wrapper.mCustomScrollbar({ "scrollInertia": 0, "theme": "minimal" });

	if ($(this_panel).length) {
		wrapper.mCustomScrollbar("scrollTo", this_panel.offset().top - wrapper.offset().top - $('#topnav').height() + 8);
	}
}

$(document).ready(function() {
	$('a').click(function(e) {
		scroll_if_anchor ($(this).attr("href"));
		e.stopPropagation();
	});

	setupFilters();

	$("#toc-wrapper").mCustomScrollbar({ "scrollInertia": 0, "theme": "dark" });

	$('#offcanvasleft').click(function() {
		$('#sidenav').toggleClass('oc-collapsed');
		$('#content-column').toggleClass("col-sm-12 col-sm-6 col-xs-12 col-xs-6");
		$('#footer-left-column').toggleClass("hidden-xs col-xs-6 hidden-sm col-sm-6");
		$('#footer-content-column').toggleClass("col-xs-12 col-xs-6 col-sm-12 col-sm-6");
		$('#offcanvasleft-chevron').toggleClass("glyphicon-chevron-left glyphicon-chevron-right");
	});
});
