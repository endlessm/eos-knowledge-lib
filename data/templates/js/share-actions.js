
/* Every element with a share-actions class exists will be populated with the
 * contents of #default-share-actions
 */
function share_actions_init () {
    let share_actions = $(".share-actions");

    if (share_actions.length) {
        share_actions.append($("#default-share-actions > *"));
    }
    else {
        $("#default-share-actions").css ("visibility", "visible");
    }
}
