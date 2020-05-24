if(document.domain == 'facebook.com')
{
    chrome.runtime.sendMessage({
        action: 'BLOCK_REQUEST',
    });

    document.addEventListener('contextmenu', event => {
        try {
            let userId = event.target.getAttribute('data-hovercard').match(/\d+/g)[0] || null;
            chrome.runtime.sendMessage({
                action: 'SET_SELECTED_ELEMENT',
                payload: userId
            });
        } catch(e) {
            console.log(e);
        }
    }, true);

    let fb_dtsg = document.querySelector("[name='fb_dtsg']");
    if(fb_dtsg != "undefined" && typeof(fb_dtsg) != "undefined")
    {
        chrome.runtime.sendMessage({
            action: 'BAN_GROUP_MEMBER',
            payload: fb_dtsg.value
        });
    }
}


