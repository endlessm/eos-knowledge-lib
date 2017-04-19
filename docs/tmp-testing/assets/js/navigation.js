var hd_navigation = hd_navigation || {};

hd_navigation.panel_template = [
	'<div class="sidenav-panel-body {{panel_class}}">',
	'<div class="panel-heading">',
	'<h4 class="panel-title" data-toc-skip>',
	'<a class="sidenav-ref" href="{{{url}}}"',
	' data-extension="{{extension}}">',
	'{{title}}</a>',
	'{{{panel_unfold}}}',
	'</h4></div>',
	'<div id="{{name}}-children" class="panel-collapse collapse"',
	'data-nav-ref="{{extension}}-{{{node_project}}}-{{{node_url}}}">',
	'{{#subpages}}',
	'{{{.}}}',
	'{{/subpages}}',
	'</div></div>'
].join('\n');

hd_navigation.panel_unfold_template = [
	'<a class="sidenav-toggle" data-toggle="collapse" data-parent="{{parent_name}}" ',
	'data-target="#{{name}}-children" aria-expanded="false">',
	'<i class="glyphicon glyphicon-chevron-right pull-right"></i>',
	'<i class="glyphicon glyphicon-chevron-down pull-right"></i>',
	'</a>',
].join('\n');

function unfold_current_page(base_name) {
	var panel = $('.panel-collapse[data-nav-ref="' + base_name + '"]');

	if (panel.length) {
		var elem = panel;
		var sidenav_klass = 'sidenav-panel-even';
		if (panel.parent().hasClass('sidenav-panel-even')) {
			sidenav_klass = 'sidenav-panel-odd';
		}

		while (elem.length) {
			if (elem.hasClass('collapse')) {
				$.support.transition = false;
				elem.collapse(false);
				$.support.transition = true;
			}
			elem = elem.parent();
		}
		var wrapper = $("#sitenav-wrapper");
		wrapper.mCustomScrollbar("scrollTo", panel.offset().top - wrapper.offset().top - 36);
	}
}

function list_subpages(subpages) {
	var table;
	var subpages_section;

	if (subpages.length == 0)
		return;

	subpages_section = $("#subpages");
	subpages_section.append('<h3 data-toc-skip>Subpages</h3>');

	table = '<table><tbody>';
	for (var i = 0; i < subpages.length; i++) {
		var node = subpages[i];

		table += '<tr>';
		table += '<td><a href="' + node.url + '">' + node.title + '</a></td>';
		if (node.short_description != null)
			table += '<td>' + node.short_description + '</td>';
		else
			table += '<td>No summary available</td>';
		table += '</tr>';
	}
	table += '</tbody></table>';

	subpages_section.append(table);
}

hd_navigation.url_for_node = (function(node) {
	var url = utils.hd_context.hd_root;

    if (node.in_toplevel == false)
        url += node.project_name + '/';

	if (node.extension == 'gi-extension') {
		if (utils.hd_context.gi_language === undefined) {
			url += 'c';
		} else {
			url += utils.hd_context.gi_language;
		}
		url += '/';
	}

	url += node.url;
	return url;
});

function sitemap_downloaded_cb(sitemap_json) {
	var sitemap = JSON.parse(sitemap_json);
	var level = 0;
	var parent_name = 'main';
	var subpages = [];
	var home_url = undefined;

	function fill_sidenav(node) {
		var panel_class;
		var name = parent_name + '-' + level;
		var url = hd_navigation.url_for_node(node);

		if (home_url === undefined)
			home_url = url;

		if (level % 2 == 0)
			panel_class = "sidenav-panel-odd";
		else
			panel_class = "sidenav-panel-even";

		if (node.subpages.length)
			var panel_unfold = Mustache.to_html(
					hd_navigation.panel_unfold_template,
					{
						'parent_name': parent_name,
						'name': name,
					});
		else
			var panel_unfold = '';

		if (node.url == utils.hd_context.hd_basename && node.project_name == utils.hd_context.project_name) {
			if (node.render_subpages)
				subpages = node.subpages;
		}

		parent_name = name;
		level += 1;
		var rendered_subpages = [];
		for (var i = 0; i < node.subpages.length; i++) {
			rendered_subpages.push(fill_sidenav(node.subpages[i]));
		}
		level -= 1;

		var res = Mustache.to_html(
				hd_navigation.panel_template,
				{
					'panel_class': panel_class,
					'url': url,
					'extension': node.extension,
					'title': node.title,
					'panel_unfold': panel_unfold,
					'name': name,
					'node_project': node.project_name,
					'node_url': node.url,
					'subpages': rendered_subpages,
				});

		node.url = url;

		return res;
	}

	var sidenav = fill_sidenav(sitemap);

	$("#site-navigation").html(sidenav);

	unfold_current_page(utils.hd_context.extension + "-" + utils.hd_context.project_name + "-" + utils.hd_context.hd_basename);

	$("#home-link").attr("href", home_url);

	list_subpages(subpages);

	/* Defined in tag_filtering.js */
	setupFilters();
}

$(document).ready(function() {
	inject_script("assets/js/sitemap.js");
	$("#sitenav-wrapper").mCustomScrollbar({ "scrollInertia": 0 });
});
