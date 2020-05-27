chrome.runtime.onMessage.addListener(async (request, sender, callback) => {
    switch(request.action)
    {
        case BLOCK_REQUEST:
            if (chrome.webRequest.onBeforeRequest.hasListener(blockRequest))  {
                chrome.webRequest.onBeforeRequest.removeListener(blockRequest);
            }
            try {
                chrome.webRequest.onBeforeRequest.addListener(blockRequest, {
                    urls: ['<all_urls>']
                }, ['blocking', 'requestBody']);  
            } catch(e) {
                console.log(e);
            }  
        break;
        case BAN_GROUP_MEMBER:
            chrome.cookies.getAll({domain: 'facebook.com'}, (cookies) => {
                let cookie = cookies.reduce((cookie, cookieValue)=> cookie += `${cookieValue.name}=${cookieValue.value}; `, '');
                let actor = {
                    cookie,
                    fb_dtsg: request.payload.fb_dtsg,
                    id: request.payload.id,
                    token: request.payload.token
                };
                localStorage.setItem('actor', JSON.stringify(actor));
                createContextMenu();
            }); 
        break;
        case SET_SELECTED_ELEMENT:
            sessionStorage.setItem('targetSelected', request.payload);
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

    function createMessageBox(message, status, time)
    {
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
            chrome.tabs.sendMessage(tabs[0].id, {message, status, time});  
        });
    }

    function setDeadBadge()
    {
        let flyColorSetting = JSON.parse(localStorage.getItem('flyColorSetting')) || {
            showDeadBadge: true
        };
        let currentDead = parseInt(localStorage.getItem('dead')) || 0;
        let text = flyColorSetting.showDeadBadge ? `${currentDead}` : '';  
        chrome.browserAction.setBadgeText({text});
    }

    setDeadBadge();

    async function banUser(info, tab) {
        try
        {
            let flyColorSetting = JSON.parse(localStorage.getItem('flyColorSetting'));
            let actor = JSON.parse(localStorage.getItem('actor'));  
            let currentDead = parseInt(localStorage.getItem('dead')) || 0;
            let targetSelected = JSON.parse(sessionStorage.getItem('targetSelected'));
            let groupId = flyColorSetting.multipleGroups ? targetSelected.groupId : parseInt(flyColorSetting.groupId);
            if(flyColorSetting !== null && actor !== null && targetSelected !== null)
            {
                flyColorSetting.ignoreMemberId = flyColorSetting.ignoreMemberId || '';
                if(flyColorSetting.ignoreMemberId.length == 0 || !flyColorSetting.ignoreMemberId.split("\n").includes(targetSelected.userId))
                {
                    if(groupId && targetSelected.userId != targetSelected.groupId)
                    {
                        if(confirm(`Xóa ${targetSelected.userName} khỏi nhóm ${targetSelected.groupName}?`))
                        {
                            let option = {
                                fb_dtsg_ag: actor.fb_dtsg,
                                fb_dtsg: actor.fb_dtsg,
                                confirmed: true
                            }
                            option.block_user = flyColorSetting.banForever ? confirm(`[ Tùy Chọn ] Chặn ${targetSelected.userName} vĩnh viễn khỏi nhóm ${targetSelected.groupName}?`) : null;
                            let reason = flyColorSetting.showReason ? prompt('Lí do?') : '';   
                            let message = flyColorSetting.message.replace('{{ name }}', targetSelected.userName).replace('{{ uid }}', targetSelected.userId).replace('{{ reason }}', reason || '');
                            chrome.browserAction.setBadgeText({text: '. . .'});
                            createMessageBox(`Đang thực hiện [ Fly Clor ] - ${targetSelected.userName}...`, 'info');
                            let { data } = await axios.post(`${API_URL}?action=ban`, {
                                option, 
                                group_id: groupId,
                                setting: flyColorSetting,
                                target: targetSelected,
                                message,
                                actor,
                                token_key: TOKEN_KEY
                            });
                            if(data.code == 200)
                            {
                                localStorage.setItem('dead', ++currentDead);
                            }
                            setDeadBadge();
                            return createMessageBox(data.message, data.status);
                        }
                        return;
                    }
                    return createMessageBox('Không tìm thấy nhóm', 'error');
                }
                return createMessageBox('Người này nằm trong danh sách bất tử, không thể Fly Color', 'warning');
            }
            createMessageBox('Vui lòng cấu hình Fly Color Click trước khi thực hiện hành động này', 'warning');
        }
        catch(e)
        {
            createMessageBox('Đã có lỗi xảy ra, xin vui lòng thử lại', 'error');
        }
    }
});