var citationRequiredElements = document.querySelectorAll("sup > i > a");
for (var i = 0; i < citationRequiredElements.length; i++)
{
	if (citationRequiredElements[i].parentNode.parentNode.innerHTML[0] === "[")
		citationRequiredElements[i].parentNode.parentNode.style.display = "none";
}

[].forEach.call(document.querySelectorAll('.mw-editsection'), function(elem) { elem.style.display = 'none'; });
