function hide_caption (img) {
    thumb = img.parentNode.parentNode.parentNode;
    img.style.display = 'none';
    if (thumb.classList.contains('thumb')) {
        thumb.style.display = 'none';
    }
}

// This code will hide images which return a 404 error
$('img').each(function(){
    $(this).error(function(){
        $(this).hide();
        hide_caption($(this)[0]);
    });
});

// This code does the same thing, by first setting the onerror code,
// and then resetting the src attribute so that the onerror
// signal fires. For some reason, each of these snippets does not
// work by itself but together they seem to work. Eventually
// what we want to do is set the onerror attribute at database
// build time

var images = document.getElementsByTagName('img');

for(var i = 0; i < images.length; i++){
    var image = images[i];
    var src = image.getAttribute("src");
    image.onerror = "hide_caption(this)";
    image.setAttribute("src", src);
}
