chrome.runtime.onMessage.addListener(async (request, sender, callback) => {
    function init()
    {
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
    if(request.domain == 'facebook.com')
    {
        init();
    }
});
