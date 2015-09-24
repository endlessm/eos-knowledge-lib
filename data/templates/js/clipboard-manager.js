/** clipboard_manager.js
 *  This utility handles the Copy/Paste behavior for the Knowledge Library.
 *
 *  By injecting this code into the articles, the user can select a block of text
 */
const FADE_DURATION = 200;

$(document).ready(function () {
    var mouse_is_down = false;
    var window_focus;
    $(window).focus(function() {
        window_focus = true;
    }).blur(function() {
        window_focus = false;
    });
    // Updates the copy button to appear at the beginning of the selection. If the
    // mouse is currently down we hide the copy button until the selection
    // drag is completed.
    var update_copy_button = function() {
        var selection = window.getSelection();
        if (selection.isCollapsed || mouse_is_down || !window_focus) {
            $('#copy-button').fadeOut(FADE_DURATION);
        } else {
            var range = selection.getRangeAt(0).cloneRange();
            range.collapse(true);
            var rect = range.getClientRects()[0];

            var top_position = Math.max(rect.top - $('#copy-button').outerHeight(true), 0) + $(window).scrollTop();
            var left_position =  Math.max(rect.left - $('#copy-button').outerWidth(true), 0) + $(window).scrollLeft();
            $('#copy-button').css({
                top: top_position,
                left: left_position,
            });
            $('#copy-button').fadeIn(FADE_DURATION);
        }
    };

    // Update copy button location on any selectionchange or mouseup.
    $(document).mousedown(function() {
        mouse_is_down = true;
    }).mouseup(function() {
        mouse_is_down = false;
        update_copy_button();
    }).on('selectionchange', function() {
        update_copy_button();
    });

    $('#copy-button').mousedown(function (event) {
        // Returning false prevents mousedown signal from propagating up the DOM tree.
        // This keeps us from losing our selection when clicking on the copy
        // button.
        return false;
    }).click(function () {
        document.execCommand('Copy');
        $('#copy-button').fadeOut(FADE_DURATION);
    });
});
