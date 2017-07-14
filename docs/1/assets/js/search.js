var search = search || {};

search.expected_tokens = [];
search.matched_urls = {}

function escapeRegExp(string) {
	return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

function ellipsize_fragment (fragment, terms, size_goal) {
	var words_remaining = 0;
	var sentences = fragment.replace(/(\.+|\:|\!|\?)(\"*|\'*|\)*|}*|]*)(\s|\n|\r|\r\n)/gm, "$1$2|").split("|");

	if (sentences === null) {
		return fragment;
	}

	for (var i = 0; i < sentences.length; i++) {
		words_remaining += (sentences[i].match(/\S+/g) || []).length;
	}

	if (words_remaining < size_goal) {
		return fragment;
	}

	escaped_terms = [];
	for (var i = 0; i < terms.length; i++) {
		if (terms[i].length > 3)
			escaped_terms.push (escapeRegExp(terms[i]));
	}

	var regex = new RegExp(escaped_terms.join('|'), "gi");
	var nmatches = (fragment.match(regex) || []).length;

	var matches_goal = Math.min(nmatches, size_goal / 20);
	var words_per_match = size_goal / matches_goal;
	var max_lookback = words_per_match / 2;
	var result = '';
	var passthrough = 0;
	var words_included = 0;
	var matches_found = 0;
	var position = 0;
	var last_word_included = 0;

	for (var i = 0; i < sentences.length; i++) {
		var sentence = sentences[i];
		var words = sentence.match(/\S+/g);
		for (var j = 0; j < words.length; j++) {
			var word = words[j];
			var is_match = false;

			for (var k = 0; k < escaped_terms.length; k++) {
				if (word.toLowerCase().indexOf(escaped_terms[k]) != -1) {
					is_match = true;
					break;
				}
			}

			if (is_match) {
				matches_found += 1;
			}

			if (passthrough > 0) {
				result += word + ' ';
				words_included += 1;
				passthrough -= 1;
				last_word_included = position;
			} else if (is_match) {
				var start_index = j - max_lookback;
				start_index = Math.max(0, start_index);
				if (j - start_index >= position - last_word_included) {
					start_index = Math.max (0, j - (position - last_word_included));
				} else {
					result += '... ';
				}

				var k = start_index;

				for (var k = start_index; k < j; k++) {
					result += words[k] + ' ';
					words_included += 1;
				}

				result += word + ' ';
				words_included += 1;
				last_word_included = position;

				passthrough = max_lookback;
			}

			if (matches_found === matches_goal) {
				passthrough = size_goal - words_included;
			}

			if (words_included >= size_goal) {
				result += '...';
				/* Break awaaaaay !!! */
				j = words.length;
				i = sentences.length;
				break;
			}

			words_remaining -= 1;
			if (words_remaining > passthrough &&
					words_remaining + words_included <= size_goal) {
				if (passthrough == 0) {
					result += '... ';
				}
				passthrough += words_remaining;
			}
			position += 1;
		}
	}

	return result;
}

function do_search(trie, query) {
	var results = [];
	var words = query.split(/\s+/);

	for (var i = 0; i < words.length; i++) {
		var word = words[i];
		var node = trie.lookup_node(word);

		if (node && node.is_final) {
			results.push (node.get_word());
		}
	}

	search.expected_tokens = results;
	search.matched_urls = {}
}

function display_fragment_for_url(data) {
	var selector = '#' + CSS.escape(data.url) + '-fragment';
	var token = $("#sidenav-lookup-field").val();

	var fragment_div = $(selector);

	if (fragment_div.length == 0) {
		return;
	}

	var html = $.parseHTML(data.fragment);

	var compact = $(html).text().match(/\S+/g).join(' ');

	compact = $.parseHTML('<p>' +
			ellipsize_fragment(compact, search.expected_tokens, 40) +
			'</p>');

	fragment_div.html($(compact).wrapInTag({tag: 'strong', words: search.expected_tokens}));
}

function fragment_downloaded_cb(data) {
	display_fragment_for_url(data);
}

function display_fragments_for_urls(fragments, token) {
	var token = token;

	for (var i = 0; i < fragments.length; i++) {
		var src = "assets/js/search/hotdoc_fragments/" +
			escape(fragments[i].replace('#', '-')) + ".fragment";
		inject_script(src);
	}
}


function display_urls_for_token(data) {
	var token_results_div = $("#actual_search_results");

	if (token_results_div.length == 0) {
		return;
	}

	var urls = data.urls;
	var meat = "<h5>Search results for " + search.expected_tokens.join(" ") + "</h5>";
	var url;
	var final_urls = [];
	for (var i = 0; i < urls.length; i++) {
		url = utils.hd_context.hd_root + urls[i];
		if (url === null) {
			continue;
		}

		var final_url = urls[i];

		if (search.matched_urls[final_url])
			search.matched_urls[final_url].push (data.token);
		else
			search.matched_urls[final_url] = [data.token];

		if (search.matched_urls[final_url].length == search.expected_tokens.length) {
			meat += '<div class="search_result">';
			meat += '<a href="' + url + '">' + url + '</a>';
			meat += '<div id="' + final_url + '-fragment"></div>';
			meat += '</div>';
			final_urls.push(final_url);
		}
	}

	token_results_div.html(meat);

	display_fragments_for_urls(final_urls, data.token);
}

function urls_downloaded_cb(data) {
	display_urls_for_token(data);
}

function display_urls_for_tokens() {
	for (var i = 0; i < search.expected_tokens.length; i++) {
		var words = search.expected_tokens[i].split(/\s+/);
		for (var j = 0; j < words.length; j++) {
			var src = "assets/js/search/" + words[j];
			inject_script(src);
		}
	}
}

function prepare_results_view () {
	var results_div = $("#search_results");

	results_div.on("click", "a[href]", clearSearch);
	$('#main').hide();
	results_div.show();

	var skeleton = "<h3>Search results</h3>";
	var token = null;

	skeleton += '<div id="actual_search_results"></div>';
	results_div.html(skeleton);
}

function debounce (func, threshold, execAsap) {

	var timeout;

	return function debounced () {
		var obj = this, args = arguments;
		function delayed () {
			if (!execAsap)
				func.apply(obj, args);
			timeout = null;
		};

		if (timeout)
			clearTimeout(timeout);
		else if (execAsap)
			func.apply(obj, args);

		timeout = setTimeout(delayed, threshold || 100);
	};

}

function getSortedKeys(obj) {
	var keys = []; for(var key in obj) keys.push(key);
	return keys.sort(function(a,b){return obj[a]-obj[b]});
}

function search_source (query, sync_results) {
	var results = [];
	var words = query.split(/\s+/);
	var word;

	if (words.length == 0) {
		return;
	}

	word = words.pop();

	if (word.length < 3) {
		return;
	}

	var completions = this.source.search_trie.lookup_submatches(word, 5);

	results = completions.map(function (completion) {
		return words.concat(completion.get_word()).join(" ");
	});

	if (results.length == 0) {
		var corrections = this.source.search_trie.search(word, 2);
		var sorted_keys = getSortedKeys(corrections);

		for (idx in sorted_keys) {
			var proposal = words.concat(sorted_keys[idx]).join(" ");
			results.push(proposal);
		}
	}

	sync_results(results);
};

function clearSearch() {
	var search_results = $('#search_results');
	search_results.html('');
	search_results.hide();
	$('#main').show();
}

function setupSearchXHR() {
	var req = new XMLHttpRequest();
	req.open("GET", "dumped.trie", true);
	req.overrideMimeType('text\/plain; charset=x-user-defined');

	var here = dirname(window.location.href);

	req.onload = function (event) {
		var trie = new Trie(req.responseText);
		var search_input = $('#sidenav-lookup-field');

		search_input.val("");

		search_input.removeAttr('disabled');
		search_input.attr('placeholder', 'Search');

		search_source.search_trie = trie;

		search_input.typeahead({
			minLength: 4
		},
		{
			name: 'search-trie',
			source: search_source,
			local: trie,
		});

		var refresher = debounce(display_urls_for_tokens, 500);

		search_input.on('input keyup typeahead:select', function () {
			var query = $(this).val();
			if (query.length == 0) {
				clearSearch()
			} else {
				do_search(trie, query);
				prepare_results_view();
				refresher();
			}
		});
	};

	req.send(null);
}

function setupSearchInject() {
	var head = document.getElementsByTagName('head')[0];
	var script = document.createElement('script');
	script.type = 'text/javascript';
	script.src = "assets/js/trie_index.js";

	script.onload = function () {
		var trie = new Trie(trie_data, true);
		var search_input = $('#sidenav-lookup-field');

		search_input.val("");

		search_input.removeAttr('disabled');
		search_input.attr('placeholder', 'Search');

		search_source.search_trie = trie;

		search_input.typeahead({
			minLength: 4
		},
		{
			name: 'search-trie',
			source: search_source,
			local: trie,
		});

		var refresher = display_urls_for_tokens;

		search_input.on('input keyup typeahead:select', function () {
			var query = $(this).val();
			if (query.length == 0) {
				clearSearch();
			} else {
				do_search(trie, query);
				prepare_results_view();
				refresher();
			}
		});
	};

	head.appendChild(script);
}

$(document).ready(function() {
	if (location.protocol === 'file:') {
		/* Works even with chrome */
		setupSearchInject();
	} else {
		/* size of initial download divided by two */
		setupSearchXHR();
	}
});
