/* Add nav_content element if is does not exists */
function nav_content_init () {
    if ($("#nav_content.GtkWidget").length === 0)
        $("body").append('<canvas class="GtkWidget" style="width: 100%;" id="nav_content"></canvas>');
}