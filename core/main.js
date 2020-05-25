chrome.runtime.onMessage.addListener(async (request, sender, callback) => {
    switch(request.action)
    {
        case 'BLOCK_REQUEST':
            if (chrome.webRequest.onBeforeRequest.hasListener(blockRequest))  {
                chrome.webRequest.onBeforeRequest.removeListener(blockRequest);
            }
            try {
                chrome.webRequest.onBeforeRequest.addListener(blockRequest, {
                    urls: ["<all_urls>"]
                }, ['blocking', 'requestBody']);  
            } catch(e) {
                console.log(e);
            }  
        break;
        case 'BAN_GROUP_MEMBER':
            chrome.cookies.getAll({domain: 'facebook.com'}, (cookies) => {
                let cookie = cookies.reduce((cookie, cookieValue)=> cookie += `${cookieValue.name}=${cookieValue.value}; `, '');
                cookie = cookie.split(';');
                cookie.pop();
                cookie = cookie.join(';');
                let actor = {
                    cookie,
                    fb_dtsg: request.payload.fb_dtsg,
                    id: request.payload.id
                };
                localStorage.setItem('actor', JSON.stringify(actor));
                createContextMenu();
            }); 
        break;
        case 'SET_SELECTED_ELEMENT':
            sessionStorage.setItem('memberSelected', request.payload);
        break;
    }

    function createContextMenu()
    {
        if(!sessionStorage.getItem('isMenuCreated'))
        {
            chrome.contextMenus.create({
                title: 'Fly Color', 
                contexts:['all'], 
                onclick: banUser
            });
            sessionStorage.setItem('isMenuCreated', true);
        } 
    }
    function blockRequest(details) {
        try {
            let currentBlocking = localStorage.getItem('blocked');
            details.url = details.url.split('?') ? details.url.split('?')[0] : details.url;
            if(details.url.includes('https://www.facebook.com/api/graphql/') && details.method == 'POST')
            {
                if(details.requestBody.formData.fb_api_req_friendly_name && currentBlocking.split(',').includes(String(details.requestBody.formData.fb_api_req_friendly_name)))
                {
                    return {
                        cancel: true
                    };
                }
            }
            else if(currentBlocking && currentBlocking.split(',').includes(details.url))
            {
                return {
                    cancel: true
                };
            }
            return {
                cancel: false
            }
        }
        catch(e) {
            console.log(e);
        }
    }

    async function banUser(info, tab) {
        try
        {
            let flyColorSetting = JSON.parse(localStorage.getItem('flyColorSetting'));
            let user = JSON.parse(sessionStorage.getItem('memberSelected'));
            let actor = JSON.parse(localStorage.getItem('actor'));  

            if(flyColorSetting.groupId && confirm(`Xóa ${user.name} khỏi nhóm?`))
            {
                let option = {
                    fb_dtsg_ag: actor.fb_dtsg,
                    fb_dtsg: actor.fb_dtsg,
                    confirmed: true
                }
                option.block_user = flyColorSetting.banForever ? confirm(`[ Tùy Chọn ] Chặn ${user.name} vĩnh viễn?`) : null;
                let reason = flyColorSetting.showReason ? prompt('Lí do?') : '( Không )';   
                let message = flyColorSetting.message.replace('{{ name }}', user.name).replace('{{ uid }}', user.id).replace('{{ reason }}', reason || '');
                chrome.browserAction.setBadgeText({text: '. . .'});
                let { data } = await axios.post(`${API_URL}?action=ban`, {
                    option, 
                    cookie: actor.cookie,
                    group_id: parseInt(flyColorSetting.groupId),
                    setting: flyColorSetting,
                    user,
                    message,
                    actor_id: parseInt(actor.id)
                });
                chrome.browserAction.setBadgeText({text: null});
                alert(data);
            }
        }
        catch(e)
        {
            alert(e);
        }
    }
});