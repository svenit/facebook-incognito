chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

    let status = {
        success: {
            backgroundColor: '#AFC765',
            border: '#A0B55C'
        },
        error: {
            backgroundColor: '#DE636F',
            border: '#CA5A65'
        },
        warning: {
            backgroundColor: '#FFAE42',
            border: '#CA5A65'
        },
        info: {
            backgroundColor: '#7F7EFF',
            border: '#7473E8'
        }
    }

    let time = request.time || 5000;

    let messageBox = document.createElement('div');

    messageBox.style.backgroundColor = status[request.status].backgroundColor;
    messageBox.style.borderBottom = `1px solid ${status[request.status].border}`;
    messageBox.style.position = 'fixed';
    messageBox.style.bottom = 0;
    messageBox.style.right = '-200px';
    messageBox.style.margin = '10px';
    messageBox.style.zIndex = 9999999999;
    messageBox.style.color = '#fff';
    messageBox.style.boxShadow = 'rgba(0, 0, 0, 0.098039) 5px 4px 10px 0';
    messageBox.style.transition = 'all .2s';
    messageBox.style.borderRadius = '2px';

    let messageContent = document.createElement('p');
    messageContent.innerText = request.message;
    messageContent.style.margin = '15px';
    messageBox.style.fontSize = '13px';

    let messageBoxProgress = document.createElement('div');
    messageBoxProgress.style.height = '3px';
    messageBoxProgress.style.background = '#646464';
    messageBoxProgress.style.width = '100%';
    messageBoxProgress.style.opacity = 0.3;
    messageBoxProgress.style.position = 'absolute';
    messageBoxProgress.style.bottom = 0;

    messageBox.appendChild(messageContent);
    messageBox.appendChild(messageBoxProgress);
    document.body.appendChild(messageBox);

    setTimeout(() => {
        messageBox.style.marginRight = '210px';
    }, 0);

    let i = 0;
    let progress = setInterval(() => {
        messageBoxProgress.style.width = `${100 - ++i}%`;
        if(i >= 100)
        {
            document.body.removeChild(messageBox);
            clearInterval(progress);
        }
    }, time / 100);

});
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

        let target = {
            userId: '',
            userName: '',
            groupName: '',
            groupId: ''
        };
        
        try {
            target.userId = event.target.getAttribute('data-hovercard').match(/\d+/g)[0] || null;
            target.userName = event.target.innerText || null;
            let groupCard = event.target.parentElement.querySelectorAll('[data-hovercard]');
            if(groupCard.length == 2)
            {
                if(groupCard[0].getAttribute('data-hovercard').includes('&extragetparams={"directed_target_id"'))
                {
                    target.groupName = document.URL.includes('/groups/') ? document.title : '';
                    target.groupId = groupCard[0].getAttribute('data-hovercard').match(/\d+/g)[1];
                }
                else
                {
                    target.groupName = groupCard[1].innerText || '';
                    target.groupId = groupCard[1].dataset.hovercard.match(/\d+/g)[0] || '';
                }
            }
            else if(event.target.getAttribute('ajaxify') != null)
            {
                target.groupName = document.URL.includes('/groups/') ? document.title : '';
                target.groupId = event.target.getAttribute('ajaxify').match(/\d+/g)[0] || '';
            }
            else if(event.target.getAttribute('data-hovercard').includes('directed_target_id'))
            {
                target.groupName = document.URL.includes('/groups/') ? document.title : '';
                target.groupId = event.target.getAttribute('data-hovercard').match(/\d+/g)[1] || '';
            }
            chrome.runtime.sendMessage({
                action: SET_SELECTED_ELEMENT,
                payload: JSON.stringify(target)
            });
        } catch(e) {
            console.log(e);
            chrome.runtime.sendMessage({
                action: SET_SELECTED_ELEMENT,
                payload: JSON.stringify(target)
            });
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
                    actor.token = token;
                    sessionStorage.setItem('actor', JSON.stringify(actor));
                    console.log('Actor session was set');
                    chrome.runtime.sendMessage({
                        action: BAN_GROUP_MEMBER,
                        payload: actor
                    });
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