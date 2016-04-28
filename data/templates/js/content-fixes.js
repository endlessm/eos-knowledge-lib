// Copyright (C) 2016 Endless Mobile, Inc.

var citationRequiredElements = document.querySelectorAll("sup > i > a");
for (var i = 0; i < citationRequiredElements.length; i++)
{
	if (citationRequiredElements[i].parentNode.parentNode.innerHTML[0] === "[")
		citationRequiredElements[i].parentNode.parentNode.style.display = "none";
}
