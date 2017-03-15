function add_section_headings_class() {
	var headings = $("h1");

	if (headings.length < 2)
		headings = $("h2:not(.symbol_section)");

	headings.addClass("section_headings");
}

$(document).ready(function() {
	add_section_headings_class();
});
