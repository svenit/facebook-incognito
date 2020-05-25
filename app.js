if(document.domain == 'facebook.com')
{
    chrome.runtime.sendMessage({
        action: 'BLOCK_REQUEST',
    });

    document.addEventListener('contextmenu', event => {
        try {
            let user = {
                id: event.target.getAttribute('data-hovercard').match(/\d+/g)[0] || null,
                name: event.target.innerText
            };
            chrome.runtime.sendMessage({
                action: 'SET_SELECTED_ELEMENT',
                payload: JSON.stringify(user)
            });
        } catch(e) {
            console.log(e);
        }
    }, true);

    try
    {
        if(!sessionStorage.getItem('actor'))
        {
            let actor = {
                fb_dtsg: document.querySelector("[name='fb_dtsg']").value,
                id: document.querySelectorAll('[data-nav-item-id]')[0].dataset.navItemId
            };
            sessionStorage.setItem('actor', JSON.stringify(actor));
            console.log('Actor session was set');
        }
        let actor = JSON.parse(sessionStorage.getItem('actor'));
        if(actor.fb_dtsg != "undefined" && typeof(actor.fb_dtsg) != "undefined" && actor.id != "undefined")
        {
            chrome.runtime.sendMessage({
                action: 'BAN_GROUP_MEMBER',
                payload: actor
            });
        }
    }
    catch(e)
    {
        console.log(e);
    }
}


