var marquee = document.createElement('marquee');
var STALLMAN = document.createElement('h1');
STALLMAN.innerText = "LADIES AND GENTLEMEN, RICHARD STAAAAAALLMAN";
marquee.appendChild(STALLMAN);
var body = document.getElementsByTagName("body")[0];
body.insertBefore(marquee, body.firstChild);
