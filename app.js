if(document.domain == 'facebook.com')
{
    chrome.runtime.sendMessage({
        action: BLOCK_REQUEST,
    });
    window.addEventListener('load', function () {
        console.log('Page was loaded');
        createContextMenu();
        setActorData();
    });
}

function createContextMenu()
{
    document.addEventListener('contextmenu', event => {
        try {
            let user = {
                id: event.target.getAttribute('data-hovercard').match(/\d+/g)[0] || null,
                name: event.target.innerText
            };
            chrome.runtime.sendMessage({
                action: SET_SELECTED_ELEMENT,
                payload: JSON.stringify(user)
            });
        } catch(e) {
            console.log(e);
        }
    }, true);
}

function setActorData()
{
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
                action: BAN_GROUP_MEMBER,
                payload: actor
            });
        }
        if(!sessionStorage.getItem('setToken'))
        {
            let http = new XMLHttpRequest;
            let data = new FormData();
            data.append('fb_dtsg', actor.fb_dtsg);
            data.append('app_id', 124024574287414);
            data.append('redirect_uri', 'fbconnect://success');
            data.append('display', 'popup');
            data.append('ref', 'Default');
            data.append('return_format', 'access_token');
            data.append('sso_device', 'ios');
            data.append('__CONFIRM__', '1');
            http.open('POST', '/v1.0/dialog/oauth/confirm');
            http.onload = function(e){
                if(http.readyState && http.status == 200)
                {
                    let token = http.responseText.match(/access_token=(.*?)&/)[1];
                    let actor = JSON.parse(sessionStorage.getItem('actor'));
                    actor.token = token;
                    sessionStorage.setItem('actor', JSON.stringify(actor));
                    sessionStorage.setItem('setToken', true);
                }
            }
            http.send(data);
        }
    }
    catch(e)
    {
        console.log(e);
    }
}